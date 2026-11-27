export type ImageVariant = 'avatar' | 'logo' | 'banner' | 'card' | 'detail' | 'thumb' | 'bottle';

/**
 * Versión de entrega para forzar invalidación de caché ante cambios de transformaciones.
 */
export const WINE_IMAGE_VERSION = 3;
export const BOTTLE_IMAGE_VERSION = WINE_IMAGE_VERSION;

/**
 * Variantes de vinos soportadas con proporción 4:5 y fondo blanco uniforme.
 */
export const WINE_VARIANTS: readonly ImageVariant[] = ['card', 'detail', 'thumb'] as const;

/**
 * Centraliza la construcción de URLs de entrega de imágenes.
 * - Una variante desconocida o ausente cae en 'card'.
 * - Un identificador vacío, null o undefined retorna null (disparando el fallback visual correspondiente).
 * - Las variantes fuera de alcance (avatar, logo, banner y bottle en áreas protegidas de bodega)
 *   conservan su compatibilidad según la regla 12.7.
 */
export function imageUrl(
  imageId: string | null | undefined,
  variant?: ImageVariant,
): string | null {
  if (!imageId || imageId.trim() === '') return null;
  const cleanId = imageId.trim();
  const base = `/api/images/${cleanId}`;

  // Si no se especifica variante, cae en 'card'
  if (!variant) {
    return `${base}?variant=card&v=${WINE_IMAGE_VERSION}`;
  }

  const normalized = variant.toLowerCase() as ImageVariant;
  if (normalized === 'avatar' || normalized === 'logo' || normalized === 'banner') {
    return `${base}?variant=${normalized}`;
  }

  if (normalized === 'bottle') {
    return `${base}?variant=bottle&v=${WINE_IMAGE_VERSION}`;
  }

  if (normalized === 'detail' || normalized === 'thumb' || normalized === 'card') {
    return `${base}?variant=${normalized}&v=${WINE_IMAGE_VERSION}`;
  }

  // Cualquier otra variante desconocida cae en 'card'
  return `${base}?variant=card&v=${WINE_IMAGE_VERSION}`;
}
