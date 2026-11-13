/**
 * Achica una imagen en el navegador mediante HTMLCanvasElement a un máximo de `maxDimension`
 * píxeles manteniendo el aspect ratio original.
 */
export async function resizeImageToMax(
  file: File,
  maxDimension = 1200,
  quality = 0.85,
): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !window.Image) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    // Timeout de seguridad para entornos sin renderizado gráfico (ej. JSDOM/SSR)
    const fallbackTimer = setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignorar
      }
      resolve(file);
    }, 150);

    img.onload = () => {
      clearTimeout(fallbackTimer);
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}
