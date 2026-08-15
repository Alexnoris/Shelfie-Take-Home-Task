const DJANGO_BOOKS_URL = 'http://127.0.0.1:8000/api/books/';

export async function GET() {
  const djangoResponse = await fetch(DJANGO_BOOKS_URL);
  const body = await djangoResponse.text();

  return new Response(body, {
    status: djangoResponse.status,
    headers: {
      'Content-Type': djangoResponse.headers.get('Content-Type') ?? 'application/json',
    },
  });
}
