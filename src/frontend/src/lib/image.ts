export type ImageVariant = 'avatar' | 'logo' | 'banner' | 'bottle';

export function imageUrl(
  imageId: string | null | undefined,
  variant?: ImageVariant,
): string | null {
  if (!imageId) return null;
  const base = `/api/images/${imageId}`;
  return variant ? `${base}?variant=${variant}` : base;
}

