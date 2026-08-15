const DJANGO_PROCESS_PHOTO_URL = 'http://127.0.0.1:8000/api/process-photo/';

export async function POST(request: Request) {
  const incoming = (await request.formData()) as unknown as globalThis.FormData;
  const image = incoming.get('image');

  if (!image || typeof image === 'string') {
    return Response.json({ error: 'No image provided.' }, { status: 400 });
  }

  const bytes = await image.arrayBuffer();
  const outbound = new FormData();
  const filename = image instanceof File && image.name ? image.name : 'shelf_photo.jpg';
  outbound.append('image', new Blob([bytes], { type: image.type || 'image/jpeg' }), filename);

  const djangoResponse = await fetch(DJANGO_PROCESS_PHOTO_URL, {
    method: 'POST',
    body: outbound,
  });

  const body = await djangoResponse.text();
  return new Response(body, {
    status: djangoResponse.status,
    headers: {
      'Content-Type': djangoResponse.headers.get('Content-Type') ?? 'application/json',
    },
  });
}
