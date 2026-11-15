import { describe, it, expect } from 'vitest';
import {
  getVintageYearsRange,
  getMainGrape,
  getVintageStatusBadge,
  getVintageStatusSummary,
  filterAndSortCatalogWines,
} from '@/features/winery/utils/catalogUtils';
import type {
  WineryCatalogVintageDto,
  WineryCatalogWineDto,
} from '@/features/winery/types/catalog';

describe('catalogUtils', () => {
  describe('getVintageYearsRange', () => {
    it('retorna "Sin añadas registradas" si el arreglo es vacío o nulo', () => {
      expect(getVintageYearsRange([])).toBe('Sin añadas registradas');
    });

    it('retorna "X añadas (S/A)" si ninguna tiene año numérico', () => {
      const vintages: WineryCatalogVintageDto[] = [
        { id: 1, year: null, approvalStatus: 'Pending', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 2, year: undefined, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
      ];
      expect(getVintageYearsRange(vintages)).toBe('2 añadas (S/A)');
    });

    it('retorna año único con singular o plural', () => {
      const single: WineryCatalogVintageDto[] = [
        { id: 1, year: 2021, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
      ];
      expect(getVintageYearsRange(single)).toBe('1 añada (2021)');

      const multipleSameYear: WineryCatalogVintageDto[] = [
        { id: 1, year: 2021, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 2, year: 2021, approvalStatus: 'Pending', reviewCount: 0, registerDate: '', grapes: [] },
      ];
      expect(getVintageYearsRange(multipleSameYear)).toBe('2 añadas (2021)');
    });

    it('retorna rango "X añadas: MIN a MAX" cuando hay años disímiles', () => {
      const vintages: WineryCatalogVintageDto[] = [
        { id: 1, year: 2022, approvalStatus: 'Pending', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 2, year: 2019, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 3, year: 2020, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
      ];
      expect(getVintageYearsRange(vintages)).toBe('3 añadas: 2019 a 2022');
    });
  });

  describe('getMainGrape', () => {
    it('retorna la uva con mayor porcentaje', () => {
      const vintages: WineryCatalogVintageDto[] = [
        {
          id: 1,
          year: 2020,
          approvalStatus: 'Approved',
          reviewCount: 0,
          registerDate: '',
          grapes: [
            { grapeId: 1, grapeName: 'Cabernet Franc', percentage: 15 },
            { grapeId: 2, grapeName: 'Malbec', percentage: 85 },
          ],
        },
      ];
      const main = getMainGrape(vintages);
      expect(main?.grapeName).toBe('Malbec');
      expect(main?.percentage).toBe(85);
    });

    it('retorna null si no hay uvas', () => {
      expect(getMainGrape([])).toBeNull();
    });
  });

  describe('getVintageStatusBadge', () => {
    it('retorna "Publicado" con tone emerald para Approved', () => {
      const badge = getVintageStatusBadge('Approved', 'Approved');
      expect(badge.label).toBe('Publicado');
      expect(badge.tone).toBe('emerald');
    });

    it('retorna "Rechazado" con tone rose para Rejected', () => {
      const badge = getVintageStatusBadge('Rejected', 'Approved');
      expect(badge.label).toBe('Rechazado');
      expect(badge.tone).toBe('rose');
    });

    it('retorna "Borrador, solo lo ves vos" si la bodega está Pending y la cosecha es Pending', () => {
      const badge = getVintageStatusBadge('Pending', 'Pending');
      expect(badge.label).toBe('Borrador, solo lo ves vos');
      expect(badge.tone).toBe('neutral');
    });

    it('retorna "En revisión" si la bodega está Approved y la cosecha es Pending', () => {
      const badge = getVintageStatusBadge('Pending', 'Approved');
      expect(badge.label).toBe('En revisión');
      expect(badge.tone).toBe('amber');
    });
  });

  describe('getVintageStatusSummary', () => {
    it('genera chips correctos según el estado de la bodega', () => {
      const vintages: WineryCatalogVintageDto[] = [
        { id: 1, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 2, approvalStatus: 'Approved', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 3, approvalStatus: 'Pending', reviewCount: 0, registerDate: '', grapes: [] },
        { id: 4, approvalStatus: 'Rejected', reviewCount: 0, registerDate: '', grapes: [] },
      ];

      // Bodega aprobada
      const summaryApproved = getVintageStatusSummary(vintages, 'Approved');
      expect(summaryApproved).toEqual([
        { label: '2 publicadas', tone: 'emerald' },
        { label: '1 en revisión', tone: 'amber' },
        { label: '1 rechazada', tone: 'rose' },
      ]);

      // Bodega pendiente (cosecha pendiente se convierte en "borrador")
      const summaryPending = getVintageStatusSummary(vintages, 'Pending');
      expect(summaryPending).toEqual([
        { label: '2 publicadas', tone: 'emerald' },
        { label: '1 borrador', tone: 'neutral' },
        { label: '1 rechazada', tone: 'rose' },
      ]);
    });
  });

  describe('filterAndSortCatalogWines', () => {
    const sampleWines: WineryCatalogWineDto[] = [
      {
        id: 1,
        name: 'Zuelo Malbec',
        wineType: 'Red',
        sourceType: 'Official',
        averageRating: 4.2,
        reviewCount: 10,
        vintages: [
          {
            id: 10,
            year: 2018,
            approvalStatus: 'Approved',
            reviewCount: 5,
            registerDate: '',
            grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
          },
        ],
      },
      {
        id: 2,
        name: 'Altos Chardonnay',
        wineType: 'White',
        sourceType: 'Official',
        averageRating: 4.8,
        reviewCount: 20,
        vintages: [
          {
            id: 20,
            year: 2022,
            approvalStatus: 'Pending',
            reviewCount: 0,
            registerDate: '',
            grapes: [{ grapeId: 2, grapeName: 'Chardonnay', percentage: 100 }],
          },
        ],
      },
    ];

    it('no muta el array original', () => {
      const copy = [...sampleWines];
      const result = filterAndSortCatalogWines(sampleWines, { sortBy: 'name_desc' });
      expect(result).not.toBe(sampleWines);
      expect(sampleWines[0].id).toBe(copy[0].id);
      expect(result[0].name).toBe('Zuelo Malbec');
    });

    it('filtra por búsqueda de texto y tipo', () => {
      const result = filterAndSortCatalogWines(sampleWines, {
        searchQuery: 'altos',
        wineType: 'White',
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Altos Chardonnay');
    });

    it('ordena por valoración descendente', () => {
      const result = filterAndSortCatalogWines(sampleWines, { sortBy: 'rating_desc' });
      expect(result[0].name).toBe('Altos Chardonnay'); // 4.8 vs 4.2
      expect(result[1].name).toBe('Zuelo Malbec');
    });

    it('ordena por año más reciente descendente', () => {
      const result = filterAndSortCatalogWines(sampleWines, { sortBy: 'year_desc' });
      expect(result[0].name).toBe('Altos Chardonnay'); // 2022 vs 2018
      expect(result[1].name).toBe('Zuelo Malbec');
    });
  });
});
