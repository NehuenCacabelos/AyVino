import { describe, it, expect } from 'vitest';
import { getTypeSensoryFallback, buildSensoryAttributes } from '@/features/wines/utils/sensoryUtils';
import type { VintageSensoryDto } from '@/features/wines/api/sensoryApi';

describe('sensoryUtils', () => {
  describe('getTypeSensoryFallback', () => {
    it('devuelve el perfil de Tinto (Red)', () => {
      const result = getTypeSensoryFallback('Red');
      const map = Object.fromEntries(result.map((a) => [a.key, a.value]));

      expect(map).toEqual({
        body: 4.7,
        tannins: 4.8,
        acidity: 4.3,
        fruit: 4.4,
        oak: 4.1,
        persistence: 4.9,
      });
    });

    it('devuelve el perfil de Blanco (White)', () => {
      const result = getTypeSensoryFallback('White');
      const map = Object.fromEntries(result.map((a) => [a.key, a.value]));

      expect(map).toEqual({
        body: 3.2,
        tannins: 1.2,
        acidity: 4.8,
        fruit: 4.6,
        oak: 3.5,
        persistence: 4.4,
      });
    });

    it('devuelve el perfil de Naranjo (Orange) idéntico a Blanco', () => {
      const orangeResult = getTypeSensoryFallback('Orange');
      const whiteResult = getTypeSensoryFallback('White');

      expect(orangeResult.map((a) => a.value)).toEqual(whiteResult.map((a) => a.value));
    });

    it('devuelve el perfil de Rosado (Rose)', () => {
      const result = getTypeSensoryFallback('Rose');
      const map = Object.fromEntries(result.map((a) => [a.key, a.value]));

      expect(map).toEqual({
        body: 2.8,
        tannins: 2.0,
        acidity: 4.6,
        fruit: 4.7,
        oak: 1.8,
        persistence: 3.9,
      });
    });

    it('devuelve el perfil de Espumoso (Sparkling)', () => {
      const result = getTypeSensoryFallback('Sparkling');
      const map = Object.fromEntries(result.map((a) => [a.key, a.value]));

      expect(map).toEqual({
        body: 3.0,
        tannins: 1.0,
        acidity: 4.5,
        fruit: 3.8,
        oak: 1.8,
        persistence: 4.2,
      });
    });

    it('devuelve todo en 0 cuando no hay tipo', () => {
      const result = getTypeSensoryFallback(null);
      expect(result.every((a) => a.value === 0)).toBe(true);
    });
  });

  describe('buildSensoryAttributes', () => {
    it('en lectura: usa el valor del servidor si Source != None, y si no usa el fallback por tipo', () => {
      const mockServer: VintageSensoryDto = {
        axes: [
          { key: 'body', value: 4.2, source: 'Winery', calculatedValue: 3.8 },
          { key: 'tannins', value: 3.5, source: 'Calculated', calculatedValue: 3.5 },
          { key: 'acidity', value: null, source: 'None', calculatedValue: null },
          { key: 'fruit', value: 4.0, source: 'Winery', calculatedValue: null },
          { key: 'oak', value: null, source: 'None', calculatedValue: null },
          { key: 'persistence', value: null, source: 'None', calculatedValue: null },
        ],
      };

      const attributes = buildSensoryAttributes({
        type: 'Red',
        server: mockServer,
        isEditingOrNew: false,
      });

      const map = Object.fromEntries(attributes.map((a) => [a.key, { value: a.value, source: a.source }]));

      // body -> del server (Winery)
      expect(map.body).toEqual({ value: 4.2, source: 'Winery' });
      // tannins -> del server (Calculated)
      expect(map.tannins).toEqual({ value: 3.5, source: 'Calculated' });
      // acidity -> None en server -> cae a fallback de Red (4.3)
      expect(map.acidity).toEqual({ value: 4.3, source: 'Fallback' });
      // fruit -> del server (Winery)
      expect(map.fruit).toEqual({ value: 4.0, source: 'Winery' });
      // oak -> None en server -> cae a fallback de Red (4.1)
      expect(map.oak).toEqual({ value: 4.1, source: 'Fallback' });
      // persistence -> None en server -> cae a fallback de Red (4.9)
      expect(map.persistence).toEqual({ value: 4.9, source: 'Fallback' });
    });

    it('en edición: prioridad 1 manual, prioridad 2 preview, prioridad 3 fallback por tipo', () => {
      const mockPreview: VintageSensoryDto = {
        axes: [
          { key: 'body', value: 3.8, source: 'Calculated', calculatedValue: 3.8 },
          { key: 'tannins', value: 3.6, source: 'Calculated', calculatedValue: 3.6 },
          { key: 'acidity', value: 3.2, source: 'Calculated', calculatedValue: 3.2 },
          { key: 'fruit', value: null, source: 'None', calculatedValue: null },
          { key: 'oak', value: null, source: 'None', calculatedValue: null },
          { key: 'persistence', value: null, source: 'None', calculatedValue: null },
        ],
      };

      // Manual sólo para body (4.9) y fruit (4.5)
      const manual = {
        body: 4.9,
        fruit: 4.5,
      };

      const attributes = buildSensoryAttributes({
        type: 'Red',
        manual,
        preview: mockPreview,
        isEditingOrNew: true,
      });

      const map = Object.fromEntries(attributes.map((a) => [a.key, { value: a.value, source: a.source, isManual: a.isManual }]));

      // body -> prioridad 1: manual (4.9)
      expect(map.body).toEqual({ value: 4.9, source: 'Winery', isManual: true });
      // tannins -> prioridad 2: preview (3.6)
      expect(map.tannins).toEqual({ value: 3.6, source: 'Calculated', isManual: false });
      // acidity -> prioridad 2: preview (3.2)
      expect(map.acidity).toEqual({ value: 3.2, source: 'Calculated', isManual: false });
      // fruit -> prioridad 1: manual (4.5)
      expect(map.fruit).toEqual({ value: 4.5, source: 'Winery', isManual: true });
      // oak -> prioridad 3: fallback Red (4.1)
      expect(map.oak).toEqual({ value: 4.1, source: 'Fallback', isManual: false });
      // persistence -> prioridad 3: fallback Red (4.9)
      expect(map.persistence).toEqual({ value: 4.9, source: 'Fallback', isManual: false });
    });
  });
});
