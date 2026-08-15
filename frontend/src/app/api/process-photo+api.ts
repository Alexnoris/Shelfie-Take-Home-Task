const DJANGO_PROCESS_PHOTO_URL = 'http://127.0.0.1:8000/api/process-photo/';

export async function POST(request: Request) {
  const formData = await request.formData();

  const djangoResponse = await fetch(DJANGO_PROCESS_PHOTO_URL, {
    method: 'POST',
    body: formData,
  });

  const body = await djangoResponse.text();
  return new Response(body, {
    status: djangoResponse.status,
    headers: {
      'Content-Type': djangoResponse.headers.get('Content-Type') ?? 'application/json',
    },
  });
}
