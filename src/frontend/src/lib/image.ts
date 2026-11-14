export type ImageVariant = 'avatar' | 'logo' | 'banner' | 'bottle';

/**
 * Versión del algoritmo de transformación para botellas.
 * Subir este número fuerza a los navegadores a descartar la caché cuando cambian las transformaciones de entrega.
 */
export const BOTTLE_IMAGE_VERSION = 2;

export function imageUrl(
  imageId: string | null | undefined,
  variant?: ImageVariant,
): string | null {
  if (!imageId) return null;
  const base = `/api/images/${imageId}`;
  if (!variant) return base;
  if (variant === 'bottle') {
    return `${base}?variant=bottle&v=${BOTTLE_IMAGE_VERSION}`;
  }
  return `${base}?variant=${variant}`;
}

