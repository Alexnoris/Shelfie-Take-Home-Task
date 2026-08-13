from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from thefuzz import fuzz
from .models import Book
from .serializers import BookSerializer

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