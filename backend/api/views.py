import tempfile
import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from thefuzz import fuzz

from .models import Book
from .serializers import BookSerializer
from .vision_service import detect_book_spines
from .vlm_service import extract_text_from_spine

class BookMatchView(APIView):
    """
    Receives extracted text (title and optional author) from the vision model
    and returns a list of canonical books sorted by confidence score.
    """
    def post(self, request):
        detected_title = request.data.get('title', '')
        detected_author = request.data.get('author', '')

        if not detected_title and not detected_author:
            return Response(
                {'error': 'No text provided to match.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        books = Book.objects.all()
        matches = []

        for book in books:
            # 1. Compare titles (token_set_ratio is great for partial strings/substrings)
            title_score = 0
            if detected_title:
                title_score = fuzz.token_set_ratio(detected_title.lower(), book.title.lower())
                
                # Check against alternate titles if they exist
                if book.alternate_titles:
                    alt_score = fuzz.token_set_ratio(detected_title.lower(), book.alternate_titles.lower())
                    title_score = max(title_score, alt_score)

            # 2. Compare authors (handles formatting issues like "J.R.R. Tolkien" vs "Tolkien, J.R.R.")
            author_score = 0
            if detected_author and book.author:
                author_score = fuzz.token_set_ratio(detected_author.lower(), book.author.lower())

            # 3. Calculate final Confidence Score
            # If both are provided, we weight the title at 70% and author at 30%
            if detected_title and detected_author:
                confidence_score = (title_score * 0.7) + (author_score * 0.3)
            elif detected_title:
                confidence_score = title_score
            else:
                confidence_score = author_score

            # Only append if the score is somewhat decent (e.g., > 40%) to filter out noise
            if confidence_score > 40:
                matches.append({
                    'book': BookSerializer(book).data,
                    'confidence_score': round(confidence_score, 2)
                })

        # Sort matches by confidence score descending
        matches = sorted(matches, key=lambda x: x['confidence_score'], reverse=True)

        # Return the top 5 closest matches
        return Response({'matches': matches[:5]}, status=status.HTTP_200_OK)


class ProcessShelfPhotoView(APIView):
    """
    Main endpoint. Receives a photo of a bookshelf, detects spines locally,
    reads text via hosted VLM, and returns matches sorted by confidence.
    """
    parser_classes = [MultiPartParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {'error': 'No image provided.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Save the uploaded file temporarily to pass it to the local YOLO model
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_image:
            for chunk in image_file.chunks():
                temp_image.write(chunk)
            temp_image_path = temp_image.name

        try:
            # 2. Local Routing: Detect individual book spines (CPU Inference)
            cropped_spines = detect_book_spines(temp_image_path)
            
            if not cropped_spines:
                return Response(
                    {'message': 'No books detected in the image.', 'results': []},
                    status=status.HTTP_200_OK
                )

            final_results = []
            all_books = Book.objects.all()

            # 3. Process each detected spine
            for spine in cropped_spines:
                # Hosted Routing: Send cropped image to VLM
                extracted_data = extract_text_from_spine(spine)
                detected_title = extracted_data.get('title', '')
                detected_author = extracted_data.get('author', '')

                # Skip matching if VLM failed to read anything
                if not detected_title and not detected_author:
                    continue

                best_match = None
                highest_score = 0

                # 4. Fuzzy Matching Logic against the messy catalog
                for book in all_books:
                    title_score = 0
                    if detected_title:
                        title_score = fuzz.token_set_ratio(detected_title.lower(), book.title.lower())
                        if book.alternate_titles:
                            alt_score = fuzz.token_set_ratio(detected_title.lower(), book.alternate_titles.lower())
                            title_score = max(title_score, alt_score)

                    author_score = 0
                    if detected_author and book.author:
                        author_score = fuzz.token_set_ratio(detected_author.lower(), book.author.lower())

                    # Calculate weighted confidence score
                    if detected_title and detected_author:
                        score = (title_score * 0.7) + (author_score * 0.3)
                    else:
                        score = title_score if detected_title else author_score

                    if score > highest_score:
                        highest_score = score
                        best_match = book

                # Append the result if the score is somewhat reliable (> 40%)
                if best_match and highest_score > 40:
                    final_results.append({
                        'extracted_text': f"{detected_title} - {detected_author}",
                        'matched_book': BookSerializer(best_match).data,
                        'confidence_score': round(highest_score, 2)
                    })

            # Sort all detected books by confidence score descending
            final_results = sorted(final_results, key=lambda x: x['confidence_score'], reverse=True)

            return Response({'results': final_results}, status=status.HTTP_200_OK)

        finally:
            # Clean up the temporary file to prevent memory leaks
            if os.path.exists(temp_image_path):
                os.remove(temp_image_path)