const MAX_EDGE = 1920;

async function blobFromSource(image) {
  if (typeof Blob !== 'undefined' && image instanceof Blob) {
    return image;
  }

  if (typeof image === 'string') {
    const isBrowserUri =
      image.startsWith('blob:') || image.startsWith('http') || image.startsWith('data:');
    if (isBrowserUri) {
      const fileResponse = await fetch(image);
      return fileResponse.blob();
    }
  }

  return null;
}

async function toJpegFile(image) {
  const blob = await blobFromSource(image);
  if (!blob) {
    return null;
  }

  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return new File([blob], 'shelf_photo.jpg', { type: blob.type || 'image/jpeg' });
  }

  try {
    const bitmap = await createImageBitmap(blob);
    let width = bitmap.width;
    let height = bitmap.height;
    const longest = Math.max(width, height);
    if (longest > MAX_EDGE) {
      const scale = MAX_EDGE / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    if (typeof bitmap.close === 'function') {
      bitmap.close();
    }

    const jpegBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (encoded) => (encoded ? resolve(encoded) : reject(new Error('Could not encode JPEG'))),
        'image/jpeg',
        0.9
      );
    });

    return new File([jpegBlob], 'shelf_photo.jpg', { type: 'image/jpeg' });
  } catch (error) {
    console.warn('Could not convert image to JPEG, sending original file.', error);
    const name = image instanceof File && image.name ? image.name : 'shelf_photo.jpg';
    return new File([blob], name, { type: blob.type || 'image/jpeg' });
  }
}

async function appendImage(formData, image) {
  const jpegFile = await toJpegFile(image);
  if (jpegFile) {
    formData.append('image', jpegFile, jpegFile.name);
    return;
  }

  formData.append('image', {
    uri: image,
    name: 'shelf_photo.jpg',
    type: 'image/jpeg',
  });
}

export const fetchCatalog = async () => {
  const response = await fetch('/api/books');

  if (!response.ok) {
    throw new Error(`Server returned status: ${response.status}`);
  }

  return response.json();
};

export const processShelfPhoto = async (image) => {
  const formData = new FormData();
  await appendImage(formData, image);

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