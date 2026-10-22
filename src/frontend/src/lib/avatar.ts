const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Obtiene el origen de la API (sin /api) para resolver archivos estáticos subidos al backend.
 */
function getBackendOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

/**
 * Resuelve la URL del avatar de usuario:
 * - Si tiene foto personalizada física o remota, devuelve su URL correspondiente.
 * - Si no tiene foto, genera un avatar dinámico estilizado y sobrio mediante DiceBear (estilo 'notionists').
 */
export function getAvatarUrl(user?: { photo?: string | null; username?: string | null } | null): string {
  if (user?.photo && user.photo.trim().length > 0) {
    const photo = user.photo.trim();
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo;
    }
    const origin = getBackendOrigin();
    const cleanPath = photo.startsWith('/') ? photo : `/${photo}`;
    return `${origin}${cleanPath}`;
  }

  const seed = user?.username?.trim() || 'AyVino';
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1c1917,292524`;
}

