import { describe, it, expect } from 'vitest';
import { imageUrl, WINE_IMAGE_VERSION } from '@/lib/image';

describe('imageUrl helper', () => {
  it('returns null if imageId is null, undefined, or empty string', () => {
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl('')).toBeNull();
    expect(imageUrl('   ')).toBeNull();
  });

  it('falls back to card variant when no variant is provided', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(imageUrl(id)).toBe(`/api/images/${id}?variant=card&v=${WINE_IMAGE_VERSION}`);
  });

  it('generates the exact delivery URL for wine variants (card, detail, thumb)', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(imageUrl(id, 'card')).toBe(`/api/images/${id}?variant=card&v=${WINE_IMAGE_VERSION}`);
    expect(imageUrl(id, 'detail')).toBe(`/api/images/${id}?variant=detail&v=${WINE_IMAGE_VERSION}`);
    expect(imageUrl(id, 'thumb')).toBe(`/api/images/${id}?variant=thumb&v=${WINE_IMAGE_VERSION}`);
  });

  it('falls back to card when unknown variant is passed and preserves bottle for out-of-scope compatibility', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(imageUrl(id, 'bottle')).toBe(`/api/images/${id}?variant=bottle&v=${WINE_IMAGE_VERSION}`);
    expect(imageUrl(id, 'unknown_variant' as unknown as Parameters<typeof imageUrl>[1])).toBe(`/api/images/${id}?variant=card&v=${WINE_IMAGE_VERSION}`);
  });

  it('preserves out-of-scope variants (avatar, logo, banner)', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(imageUrl(id, 'logo')).toBe(`/api/images/${id}?variant=logo`);
    expect(imageUrl(id, 'avatar')).toBe(`/api/images/${id}?variant=avatar`);
    expect(imageUrl(id, 'banner')).toBe(`/api/images/${id}?variant=banner`);
  });

  it('never outputs e_make_transparent or b_transparent in any generated URL', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    const variants: Array<Parameters<typeof imageUrl>[1] | 'unknown'> = ['card', 'detail', 'thumb', 'bottle', undefined, 'unknown'];
    for (const v of variants) {
      const url = imageUrl(id, v as unknown as Parameters<typeof imageUrl>[1])!;
      expect(url).not.toContain('e_make_transparent');
      expect(url).not.toContain('background_removal');
      expect(url).not.toContain('bgremoval');
      expect(url).not.toContain('b_transparent');
    }
  });
});
