import { describe, it, expect } from 'vitest';
import {
  formatAlcohol,
  parseAlcohol,
  formatServingTemperature,
  parseServingTemperature,
  formatYear,
  parseYear,
} from '@/features/wines/utils/vintageFormatUtils';

describe('vintageFormatUtils', () => {
  describe('formatAlcohol y parseAlcohol', () => {
    it('formatea graduación alcohólica a formato editorial', () => {
      expect(formatAlcohol(14.5)).toBe('14.5% Vol.');
      expect(formatAlcohol(13)).toBe('13% Vol.');
      expect(formatAlcohol(null)).toBe('14.0% Vol.');
      expect(formatAlcohol(undefined)).toBe('14.0% Vol.');
    });

    it('parsea strings de alcohol extrayendo el número decimal', () => {
      expect(parseAlcohol('14.5% Vol.')).toBe(14.5);
      expect(parseAlcohol('13.8%')).toBe(13.8);
      expect(parseAlcohol('14,2% Vol.')).toBe(14.2);
      expect(parseAlcohol('15')).toBe(15);
      expect(parseAlcohol('')).toBeNull();
      expect(parseAlcohol('Invalido')).toBeNull();
    });
  });

  describe('formatServingTemperature y parseServingTemperature', () => {
    it('formatea temperatura de servicio a formato editorial', () => {
      expect(formatServingTemperature(16)).toBe('16°C');
      expect(formatServingTemperature(null)).toBe('16°C – 18°C');
    });

    it('parsea strings de temperatura extrayendo el entero', () => {
      expect(parseServingTemperature('16°C – 18°C')).toBe(16);
      expect(parseServingTemperature('17°C')).toBe(17);
      expect(parseServingTemperature('15')).toBe(15);
      expect(parseServingTemperature('')).toBeNull();
    });
  });

  describe('formatYear y parseYear', () => {
    it('formatea año a string', () => {
      expect(formatYear(2021)).toBe('2021');
    });

    it('parsea año validando 4 dígitos', () => {
      expect(parseYear('2022')).toBe(2022);
      expect(parseYear(2020)).toBe(2020);
      expect(parseYear('20')).toBeNull();
      expect(parseYear('abc')).toBeNull();
    });
  });
});
