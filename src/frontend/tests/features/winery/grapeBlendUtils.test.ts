import { describe, it, expect } from 'vitest';
import {
  createNewBlendRow,
  calculateBlendTotal,
  validateGrapeBlend,
  type BlendRow,
} from '../../../src/features/winery/utils/grapeBlendUtils';

describe('grapeBlendUtils', () => {
  describe('createNewBlendRow', () => {
    it('initializes first grape with 100% when blend is empty', () => {
      const row = createNewBlendRow(1, 0, () => 'row-1');
      expect(row).toEqual({
        id: 'row-1',
        grapeId: 1,
        percentage: 100,
      });
    });

    it('initializes subsequent grapes with 0% when blend has items', () => {
      const row = createNewBlendRow(2, 1, () => 'row-2');
      expect(row).toEqual({
        id: 'row-2',
        grapeId: 2,
        percentage: 0,
      });

      const rowThird = createNewBlendRow(3, 2, () => 'row-3');
      expect(rowThird).toEqual({
        id: 'row-3',
        grapeId: 3,
        percentage: 0,
      });
    });

    it('initializes with 100% again if blend count is 0 after clearing', () => {
      const row = createNewBlendRow(5, 0, () => 'row-restarted');
      expect(row.percentage).toBe(100);
    });
  });

  describe('calculateBlendTotal', () => {
    it('returns 0 for empty array', () => {
      expect(calculateBlendTotal([])).toBe(0);
    });

    it('sums numeric and string percentages correctly', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 1, percentage: 60 },
        { id: '2', grapeId: 2, percentage: 40 },
      ];
      expect(calculateBlendTotal(blend)).toBe(100);
    });

    it('ignores invalid values gracefully', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 1, percentage: 50 },
        { id: '2', grapeId: 2, percentage: '' },
      ];
      expect(calculateBlendTotal(blend)).toBe(50);
    });
  });

  describe('validateGrapeBlend', () => {
    it('is valid for empty blend (grapes optional)', () => {
      const res = validateGrapeBlend([]);
      expect(res.isValid).toBe(true);
      expect(res.totalPercentage).toBe(0);
      expect(res.errorMessage).toBeUndefined();
    });

    it('is valid when single grape is 100%', () => {
      const blend: BlendRow[] = [{ id: '1', grapeId: 10, percentage: 100 }];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(true);
      expect(res.totalPercentage).toBe(100);
    });

    it('is valid when multiple grapes sum to 100% without zeros', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 10, percentage: 60 },
        { id: '2', grapeId: 20, percentage: 40 },
      ];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(true);
      expect(res.totalPercentage).toBe(100);
    });

    it('fails when any grape has no selected grapeId', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: '', percentage: 100 },
      ];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Elegí la cepa en todas las filas del corte.');
    });

    it('fails when grape has 0%', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 10, percentage: 100 },
        { id: '2', grapeId: 20, percentage: 0 },
      ];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Completá el porcentaje de cada uva y asegurate de que sumen 100%');
    });

    it('fails when sum is less than 100%', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 10, percentage: 50 },
        { id: '2', grapeId: 20, percentage: 30 },
      ];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Completá el porcentaje de cada uva y asegurate de que sumen 100%');
    });

    it('fails when sum exceeds 100%', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 10, percentage: 70 },
        { id: '2', grapeId: 20, percentage: 40 },
      ];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Completá el porcentaje de cada uva y asegurate de que sumen 100%');
    });

    it('fails when duplicate grapes are selected', () => {
      const blend: BlendRow[] = [
        { id: '1', grapeId: 10, percentage: 50 },
        { id: '2', grapeId: 10, percentage: 50 },
      ];
      const res = validateGrapeBlend(blend);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('No podés repetir la misma cepa en el corte.');
    });
  });
});
