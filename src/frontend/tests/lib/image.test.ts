import { describe, it, expect } from 'vitest';
import { imageUrl } from '@/lib/image';

describe('imageUrl helper', () => {
  it('returns null if imageId is null, undefined, or empty string', () => {
    expect(imageUrl(null)).toBeNull();
    expect(imageUrl(undefined)).toBeNull();
    expect(imageUrl('')).toBeNull();
  });

  it('returns /api/images/{id} without query parameter when no variant is provided', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(imageUrl(id)).toBe(`/api/images/${id}`);
  });

  it('returns /api/images/{id}?variant={variant} when variant is provided', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(imageUrl(id, 'logo')).toBe(`/api/images/${id}?variant=logo`);
    expect(imageUrl(id, 'avatar')).toBe(`/api/images/${id}?variant=avatar`);
    expect(imageUrl(id, 'banner')).toBe(`/api/images/${id}?variant=banner`);
    expect(imageUrl(id, 'bottle')).toBe(`/api/images/${id}?variant=bottle`);
  });
});
