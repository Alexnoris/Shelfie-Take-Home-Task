import base64
import json
from io import BytesIO

import requests
from django.conf import settings

OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'


def _image_to_data_url(cropped_image):
    buffer = BytesIO()
    cropped_image.convert('RGB').save(buffer, format='JPEG', quality=90)
    encoded = base64.b64encode(buffer.getvalue()).decode('ascii')
    return f'data:image/jpeg;base64,{encoded}'


def _parse_vlm_json(result_text):
    result_text = (result_text or '').strip()
    if result_text.startswith('```'):
        result_text = result_text.strip('`')
        if result_text.lower().startswith('json'):
            result_text = result_text[4:]
        result_text = result_text.strip()
    data = json.loads(result_text)
    return {
        'title': data.get('title') or '',
        'author': data.get('author') or '',
    }


def extract_text_from_spine(cropped_image):
    """
    Sends the cropped PIL Image (spine) to OpenRouter's vision model
    and returns a parsed dictionary with 'title' and 'author'.
    """
    api_key = getattr(settings, 'OPENROUTER_API_KEY', '') or ''
    model_name = getattr(settings, 'OPENROUTER_MODEL', '') or 'openai/gpt-4o-mini'

    if not api_key:
        return {'title': '', 'author': '', 'error': 'OPENROUTER_API_KEY is missing.'}

    prompt = (
        "Read the text on this book spine. "
        "Return a JSON object with strictly two keys: 'title' and 'author'. "
        "If a field is illegible, leave its value empty."
    )

    payload = {
        'model': model_name,
        'temperature': 0.1,
        'messages': [
            {
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': prompt},
                    {
                        'type': 'image_url',
                        'image_url': {'url': _image_to_data_url(cropped_image)},
                    },
                ],
            }
        ],
        'response_format': {'type': 'json_object'},
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=60,
        )
        body = response.json()

        if response.status_code >= 400:
            error = body.get('error', body)
            return {'title': '', 'author': '', 'error': str(error)}

        result_text = body['choices'][0]['message']['content']
        return _parse_vlm_json(result_text)

    except Exception as e:
        print(f'VLM Error (OpenRouter): {e}')
        return {'title': '', 'author': '', 'error': str(e)}
