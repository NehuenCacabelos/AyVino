import { describe, it, expect } from 'vitest';
import { formatRating, normalizeRating } from '../../src/lib/formatRating';

describe('formatRating helper', () => {
  it('formatea números decimales con coma en formato es-AR', () => {
    expect(formatRating(4.3)).toBe('4,3');
    expect(formatRating(5)).toBe('5,0');
    expect(formatRating(1.0)).toBe('1,0');
    expect(formatRating(4.78)).toBe('4,8');
  });

  it('retorna fallback cuando el valor es nulo o indefinido', () => {
    expect(formatRating(null)).toBe('—');
    expect(formatRating(undefined)).toBe('—');
    expect(formatRating(NaN)).toBe('—');
    expect(formatRating(null, 'N/A')).toBe('N/A');
  });

  it('normaliza a 1 decimal sin errores de precisión de coma flotante', () => {
    expect(normalizeRating(4.3000000001)).toBe(4.3);
    expect(normalizeRating(4.76)).toBe(4.8);
    expect(normalizeRating(5)).toBe(5);
  });
});
