import { describe, it, expect } from 'vitest';
import { toPublicCatalogWine, toPublicCatalogWines } from '@/features/winery/utils/catalogAdapter';
import type { WineryCatalogWineDto } from '@/features/winery/types';

describe('catalogAdapter', () => {
  it('mapea correctamente WineryCatalogWineDto a WineryPublicCatalogWineDto', () => {
    const input: WineryCatalogWineDto = {
      id: 10,
      name: 'Gran Corte Reserva',
      description: 'Corte de altura criado en barricas de roble francés',
      wineType: 'Red',
      sourceType: 'Official',
      averageRating: 4.75,
      reviewCount: 24,
      vintages: [
        {
          id: 101,
          year: 2020,
          alcoholContent: 14.5,
          servingTemperature: 16,
          agingAdvice: 'Conservar hasta 2030',
          imageId: 'img-101-uuid',
          imageUrl: 'https://example.com/vintage101.jpg',
          approvalStatus: 'Approved',
          averageRating: 4.8,
          reviewCount: 20,
          registerDate: '2026-01-15T10:00:00Z',
          grapes: [
            { grapeId: 1, grapeName: 'Malbec', percentage: 70 },
            { grapeId: 2, grapeName: 'Cabernet Sauvignon', percentage: 30 },
          ],
        },
      ],
    };

    const output = toPublicCatalogWine(input);

    expect(output.id).toBe(10);
    expect(output.name).toBe('Gran Corte Reserva');
    expect(output.description).toBe('Corte de altura criado en barricas de roble francés');
    expect(output.wineType).toBe('Red');
    expect(output.sourceType).toBe('Official');
    expect(output.averageRating).toBe(4.75);
    expect(output.reviewCount).toBe(24);
    expect(output.vintages).toHaveLength(1);

    const vintage = output.vintages[0];
    expect(vintage.id).toBe(101);
    expect(vintage.year).toBe(2020);
    expect(vintage.alcoholContent).toBe(14.5);
    expect(vintage.servingTemperature).toBe(16);
    expect(vintage.agingAdvice).toBe('Conservar hasta 2030');
    expect(vintage.imageId).toBe('img-101-uuid');
    expect(vintage.imageUrl).toBe('https://example.com/vintage101.jpg');
    expect(vintage.approvalStatus).toBe('Approved');
    expect(vintage.grapes).toEqual([
      { grapeId: 1, grapeName: 'Malbec', percentage: 70 },
      { grapeId: 2, grapeName: 'Cabernet Sauvignon', percentage: 30 },
    ]);
  });

  it('mapea listas completas de vinos mediante toPublicCatalogWines', () => {
    const list: WineryCatalogWineDto[] = [
      {
        id: 1,
        name: 'Vino Uno',
        wineType: 'Red',
        sourceType: 'Official',
        reviewCount: 0,
        vintages: [],
      },
      {
        id: 2,
        name: 'Vino Dos',
        wineType: 'White',
        sourceType: 'Official',
        reviewCount: 5,
        vintages: [],
      },
    ];

    const result = toPublicCatalogWines(list);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });
});
