import { describe, it, expect } from 'vitest';
import { buildGrapeSlices, buildRegionRows } from '@/features/admin/utils/dashboardCharts';
import type { GrapesDistribution, RegionWineryCount } from '@/features/admin/types/adminStats';

describe('dashboardCharts - buildGrapeSlices', () => {
  it('devuelve lista vacía si no hay uvas o la suma de presencias es 0', () => {
    expect(buildGrapeSlices({ totalVintages: 0, grapes: [] })).toEqual([]);
    expect(
      buildGrapeSlices({
        totalVintages: 0,
        grapes: [{ grapeId: 1, name: 'Malbec', vintageCount: 0 }],
      }),
    ).toEqual([]);
  });

  it('con menos de 4 uvas calcula porcentajes y asigna colores en orden', () => {
    const distribution: GrapesDistribution = {
      totalVintages: 8,
      grapes: [
        { grapeId: 1, name: 'Malbec', vintageCount: 6 },
        { grapeId: 2, name: 'Cabernet Sauvignon', vintageCount: 4 },
      ],
    };

    const slices = buildGrapeSlices(distribution);

    expect(slices).toEqual([
      { label: 'Malbec', count: 6, percent: 60, color: '#fb7185' },
      { label: 'Cabernet Sauvignon', count: 4, percent: 40, color: '#fbbf24' },
    ]);
  });

  it('incluye todas las uvas cuando hay más de 4 sin agrupar en "Otras" y suma 100%', () => {
    const distribution: GrapesDistribution = {
      totalVintages: 15,
      grapes: [
        { grapeId: 1, name: 'Malbec', vintageCount: 10 },
        { grapeId: 2, name: 'Cabernet', vintageCount: 4 },
        { grapeId: 3, name: 'Bonarda', vintageCount: 2 },
        { grapeId: 4, name: 'Torrontés', vintageCount: 2 },
        { grapeId: 5, name: 'Syrah', vintageCount: 1 },
        { grapeId: 6, name: 'Pinot Noir', vintageCount: 1 },
      ],
    };

    const slices = buildGrapeSlices(distribution);

    expect(slices).toHaveLength(6);
    expect(slices.some((s) => s.label === 'Otras')).toBe(false);
    expect(slices[4]).toEqual({
      label: 'Syrah',
      count: 1,
      percent: 5,
      color: '#38bdf8',
    });
    expect(slices[5]).toEqual({
      label: 'Pinot Noir',
      count: 1,
      percent: 5,
      color: '#a78bfa',
    });
    expect(slices.reduce((sum, s) => sum + s.percent, 0)).toBe(100);
  });

  it('garantiza que los porcentajes sumen exactamente 100 usando resto mayor (tres partes iguales)', () => {
    const distribution: GrapesDistribution = {
      totalVintages: 3,
      grapes: [
        { grapeId: 1, name: 'Malbec', vintageCount: 1 },
        { grapeId: 2, name: 'Syrah', vintageCount: 1 },
        { grapeId: 3, name: 'Merlot', vintageCount: 1 },
      ],
    };

    const slices = buildGrapeSlices(distribution);

    expect(slices.map((s) => s.percent)).toEqual([34, 33, 33]);
    expect(slices.reduce((sum, s) => sum + s.percent, 0)).toBe(100);
  });
});

describe('dashboardCharts - buildRegionRows', () => {
  const sampleRegions: RegionWineryCount[] = [
    { stateId: 1, stateName: 'Mendoza', wineryCount: 10 },
    { stateId: 2, stateName: 'Salta', wineryCount: 4 },
    { stateId: 3, stateName: 'San Juan', wineryCount: 3 },
    { stateId: 4, stateName: 'Neuquén', wineryCount: 2 },
    { stateId: 5, stateName: 'Río Negro', wineryCount: 1 },
    { stateId: 6, stateName: 'Córdoba', wineryCount: 1 },
    { stateId: 7, stateName: 'Tucumán', wineryCount: 1 },
  ];

  it('con menos de 4 provincias retorna todas y restCount = 0', () => {
    const result = buildRegionRows(sampleRegions.slice(0, 3), 20);

    expect(result.restCount).toBe(0);
    expect(result.rows).toEqual([
      { stateId: 1, stateName: 'Mendoza', wineryCount: 10, percent: 50 },
      { stateId: 2, stateName: 'Salta', wineryCount: 4, percent: 20 },
      { stateId: 3, stateName: 'San Juan', wineryCount: 3, percent: 15 },
    ]);
  });

  it('con exactamente 4 provincias retorna las 4 y restCount = 0', () => {
    const result = buildRegionRows(sampleRegions.slice(0, 4), 20);

    expect(result.rows).toHaveLength(4);
    expect(result.restCount).toBe(0);
  });

  it('con más de 4 provincias limita a 4 por defecto y permite ampliar con limit', () => {
    const result = buildRegionRows(sampleRegions, 22);

    expect(result.rows).toHaveLength(4);
    expect(result.restCount).toBe(3);
    expect(result.rows[0].percent).toBe(45);

    const expanded = buildRegionRows(sampleRegions, 22, sampleRegions.length);
    expect(expanded.rows).toHaveLength(7);
    expect(expanded.restCount).toBe(0);
  });

  it('si totalWineries es 0, calcula percent = 0 sin dividir por cero', () => {
    const result = buildRegionRows(sampleRegions.slice(0, 2), 0);

    expect(result.rows).toEqual([
      { stateId: 1, stateName: 'Mendoza', wineryCount: 10, percent: 0 },
      { stateId: 2, stateName: 'Salta', wineryCount: 4, percent: 0 },
    ]);
  });
});
