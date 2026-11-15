import { describe, it, expect } from 'vitest';
import {
  REAL_WINE_TYPES,
  REAL_WINE_TYPE_LABELS,
  MOCK_WINE_TYPE_LABELS,
  getRealWineTypeLabel,
  getMockWineTypeLabel,
  getWineTypeLabel,
} from '@/features/wines/utils/wineTypeUtils';

describe('wineTypeUtils', () => {
  it('contiene exactamente los 5 tipos de vino reales solicitados', () => {
    expect(REAL_WINE_TYPES).toHaveLength(5);
    expect(REAL_WINE_TYPES.map((t) => t.value)).toEqual([
      'Red',
      'White',
      'Rose',
      'Sparkling',
      'Orange',
    ]);
    expect(REAL_WINE_TYPES.map((t) => t.label)).toEqual([
      'Tinto',
      'Blanco',
      'Rosado',
      'Espumoso',
      'Naranjo',
    ]);
  });

  it('resuelve etiquetas reales correctamente', () => {
    expect(REAL_WINE_TYPE_LABELS.Red).toBe('Tinto');
    expect(getRealWineTypeLabel('Red')).toBe('Tinto');
    expect(getRealWineTypeLabel('White')).toBe('Blanco');
    expect(getRealWineTypeLabel('Rose')).toBe('Rosado');
    expect(getRealWineTypeLabel('Sparkling')).toBe('Espumoso');
    expect(getRealWineTypeLabel('Orange')).toBe('Naranjo');
    expect(getRealWineTypeLabel('Desconocido')).toBe('Desconocido');
  });

  it('resuelve etiquetas de maqueta con los nombres poéticos aprobados', () => {
    expect(MOCK_WINE_TYPE_LABELS.Red).toBe('Tinto Noble');
    expect(getMockWineTypeLabel('Red')).toBe('Tinto Noble');
    expect(getMockWineTypeLabel('White')).toBe('Blanco & Mineral');
    expect(getMockWineTypeLabel('Rose')).toBe('Rosado & Criolla');
    expect(getMockWineTypeLabel('Sparkling')).toBe('Espumoso Método Tradicional');
    expect(getMockWineTypeLabel('Orange')).toBe('Naranjo');
  });

  it('getWineTypeLabel conmuta entre real y maqueta según isRealWine', () => {
    expect(getWineTypeLabel('Red', true)).toBe('Tinto');
    expect(getWineTypeLabel('Red', false)).toBe('Tinto Noble');
  });
});
