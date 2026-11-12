import { describe, it, expect } from 'vitest';
import {
  createNewBlendRow,
  calculateTotalPercentage,
  validateGrapeBlend,
  type BlendRow,
} from '@/features/winery/utils/grapeBlendUtils';

describe('grapeBlendUtils', () => {
  it('la primera uva entra con 100% cuando la lista esta vacia', () => {
    const row = createNewBlendRow(1, 0);
    expect(row.grapeId).toBe(1);
    expect(row.percentage).toBe(100);
  });

  it('las siguientes uvas entran con 0 visible cuando la lista ya tiene elementos', () => {
    const secondRow = createNewBlendRow(2, 1);
    expect(secondRow.grapeId).toBe(2);
    expect(secondRow.percentage).toBe(0);

    const thirdRow = createNewBlendRow(3, 2);
    expect(thirdRow.grapeId).toBe(3);
    expect(thirdRow.percentage).toBe(0);
  });

  it('si se quitan uvas hasta vaciar la lista, la proxima uva vuelve a entrar con 100%', () => {
    let blend: BlendRow[] = [];

    // Se agrega primera uva (longitud 0)
    blend.push(createNewBlendRow(1, blend.length));
    expect(blend[0].percentage).toBe(100);

    // Se agrega segunda uva (longitud 1)
    blend.push(createNewBlendRow(2, blend.length));
    expect(blend[1].percentage).toBe(0);

    // Se eliminan todas
    blend = [];

    // La nueva primera uva entra con 100
    const nextFirst = createNewBlendRow(3, blend.length);
    expect(nextFirst.percentage).toBe(100);
  });

  it('calculateTotalPercentage suma correctamente los valores numericos e ignora vacios', () => {
    const blend: BlendRow[] = [
      { id: '1', grapeId: 1, percentage: 70 },
      { id: '2', grapeId: 2, percentage: 30 },
      { id: '3', grapeId: 3, percentage: '' },
    ];
    expect(calculateTotalPercentage(blend)).toBe(100);
  });

  it('validateGrapeBlend aprueba cuando la suma es 100% y todas las uvas son validas', () => {
    const blend: BlendRow[] = [
      { id: '1', grapeId: 1, percentage: 60 },
      { id: '2', grapeId: 2, percentage: 40 },
    ];
    const result = validateGrapeBlend(blend);
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeNull();
  });

  it('validateGrapeBlend rechaza si hay filas con 0% con el mensaje exacto requerido', () => {
    const blend: BlendRow[] = [
      { id: '1', grapeId: 1, percentage: 100 },
      { id: '2', grapeId: 2, percentage: 0 },
    ];
    const result = validateGrapeBlend(blend);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe(
      'Completá el porcentaje de cada uva y asegurate de que sumen 100%'
    );
  });

  it('validateGrapeBlend rechaza si la suma no es 100% con el mensaje exacto requerido', () => {
    const blend: BlendRow[] = [
      { id: '1', grapeId: 1, percentage: 50 },
      { id: '2', grapeId: 2, percentage: 40 },
    ];
    const result = validateGrapeBlend(blend);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe(
      'Completá el porcentaje de cada uva y asegurate de que sumen 100%'
    );
  });

  it('validateGrapeBlend rechaza si una cepa no fue seleccionada', () => {
    const blend: BlendRow[] = [
      { id: '1', grapeId: '', percentage: 100 },
    ];
    const result = validateGrapeBlend(blend);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Elegí la cepa para todas las filas del corte.');
  });
});
