import json
import google.generativeai as genai
from django.conf import settings

# Initialize the Gemini client.
api_key = getattr(settings, 'GEMINI_API_KEY', '')
genai.configure(api_key=api_key)

# Gemini-1.5-flash as it is the fastest multimodal model and ideal for this VLM task
model = genai.GenerativeModel('gemini-1.5-flash')

def extract_text_from_spine(cropped_image):
    """
    Sends the cropped PIL Image (spine) to the Hosted Vision-Language Model (Gemini)
    and returns a parsed dictionary with 'title' and 'author'.
    """
    prompt = (
        "Read the text on this book spine. "
        "Return a JSON object with strictly two keys: 'title' and 'author'. "
        "If a field is illegible, leave its value empty."
    )

    try:
        # Gemini's SDK natively accepts PIL Image objects, so no Base64 conversion is needed
        response = model.generate_content(
            [prompt, cropped_image],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        # Parse the JSON string returned by Gemini
        result_text = response.text
        return json.loads(result_text)
        
    except Exception as e:
        # Graceful failure: if the model times out or returns malformed data,
        # we return an empty dictionary instead of crashing the app.
        print(f"VLM Error (Gemini): {e}")
        return {"title": "", "author": ""}