import { describe, it, expect } from 'vitest';
import { adaptWineryPublicCatalogWineToDashboardWine } from '@/features/winery/utils/publicCatalogAdapter';
import type { WineryPublicCatalogWineDto } from '@/features/winery/types';

describe('adaptWineryPublicCatalogWineToDashboardWine', () => {
  it('adapta correctamente una etiqueta con todos los campos completos', () => {
    const fullWine: WineryPublicCatalogWineDto = {
      id: 42,
      name: 'Gran Malbec Reserva',
      description: 'Crianza en barricas francesas',
      wineType: 'Red',
      sourceType: 'Official',
      averageRating: 4.85,
      reviewCount: 30,
      vintages: [
        {
          id: 101,
          year: 2020,
          alcoholContent: 14.5,
          servingTemperature: 16,
          agingAdvice: '18 meses',
          imageId: 'img_reserva_2020',
          imageUrl: null,
          approvalStatus: 'Approved',
          averageRating: 4.85,
          reviewCount: 30,
          grapes: [
            { grapeId: 1, grapeName: 'Malbec', percentage: 90 },
            { grapeId: 2, grapeName: 'Cabernet Franc', percentage: 10 },
          ],
        },
        {
          id: 102,
          year: 2022,
          alcoholContent: 14.0,
          servingTemperature: 16,
          agingAdvice: '12 meses',
          imageId: 'img_reserva_2022',
          imageUrl: null,
          approvalStatus: 'Approved',
          averageRating: 4.9,
          reviewCount: 15,
          grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
        },
      ],
    };

    const result = adaptWineryPublicCatalogWineToDashboardWine(
      fullWine,
      'Bodega Norton',
      12,
      'Luján de Cuyo, Mendoza',
    );

    expect(result.id).toBe('42');
    expect(result.wineryId).toBe(12);
    expect(result.name).toBe('Gran Malbec Reserva');
    expect(result.winery).toBe('Bodega Norton');
    expect(result.region).toBe('Luján de Cuyo, Mendoza');
    expect(result.varietal).toBe('Malbec');
    // Toma la cosecha válida más reciente (2022)
    expect(result.vintage).toBe(2022);
    expect(result.rating).toBe(4.85);
    expect(result.bottle).toBe('red-cream');
    // Debe usar imageUrl(imageId, 'bottle')
    expect(result.imageUrl).toContain('/api/images/img_reserva_2020?variant=bottle');
  });

  it('resuelve adecuadamente campos faltantes con valores por defecto del dashboard', () => {
    const minimalWine: WineryPublicCatalogWineDto = {
      id: 99,
      name: 'Vino Blanco Genérico',
      wineType: 'White',
      sourceType: 'Community',
      averageRating: null,
      reviewCount: 0,
      vintages: [],
    };

    const result = adaptWineryPublicCatalogWineToDashboardWine(minimalWine);

    expect(result.id).toBe('99');
    expect(result.wineryId).toBeUndefined();
    expect(result.name).toBe('Vino Blanco Genérico');
    expect(result.winery).toBe('Bodega');
    expect(result.region).toBe('Mendoza, Argentina');
    expect(result.varietal).toBe('Blancos');
    expect(result.vintage).toBe(new Date().getFullYear());
    expect(result.rating).toBe(0);
    expect(result.bottle).toBe('white');
    expect(result.imageUrl).toBeUndefined();
  });

  it('resuelve uva tinto Malbec cuando no hay uvas cargadas ni año en cosechas', () => {
    const wineNoGrapes: WineryPublicCatalogWineDto = {
      id: 77,
      name: 'Blend Clásico',
      wineType: 'Red',
      sourceType: 'Official',
      averageRating: 0,
      reviewCount: 0,
      vintages: [
        {
          id: 201,
          year: null,
          approvalStatus: 'Approved',
          reviewCount: 0,
          grapes: [],
        },
      ],
    };

    const result = adaptWineryPublicCatalogWineToDashboardWine(wineNoGrapes, 'Bodega Salentein', 5);

    expect(result.id).toBe('77');
    expect(result.wineryId).toBe(5);
    expect(result.varietal).toBe('Malbec');
    expect(result.vintage).toBe(new Date().getFullYear());
    expect(result.rating).toBe(0);
    expect(result.imageUrl).toBeUndefined();
  });
});
