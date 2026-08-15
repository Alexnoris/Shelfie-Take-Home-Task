async function appendImage(formData, imageUri) {
  const isBrowserUri =
    typeof imageUri === 'string' &&
    (imageUri.startsWith('blob:') || imageUri.startsWith('http') || imageUri.startsWith('data:'));

  if (isBrowserUri) {
    const fileResponse = await fetch(imageUri);
    const blob = await fileResponse.blob();
    formData.append('image', blob, 'shelf_photo.jpg');
    return;
  }

  formData.append('image', {
    uri: imageUri,
    name: 'shelf_photo.jpg',
    type: 'image/jpeg',
  });
}

export const processShelfPhoto = async (imageUri) => {
  const formData = new FormData();
  await appendImage(formData, imageUri);

  try {
    const response = await fetch('/api/process-photo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Connection Error:', error);
    throw error;
  }
};
