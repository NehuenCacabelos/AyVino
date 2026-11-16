import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePairingRealWines } from '@/features/pairings/hooks/usePairingRealWines';
import * as catalogApi from '@/features/dashboard/api/catalogApi';
import type { CatalogWineItemDto } from '@/types/wine';

vi.mock('@/features/dashboard/api/catalogApi', () => ({
  searchCatalogWines: vi.fn(),
}));

describe('usePairingRealWines Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve array vacío y hasRealWines=false si el término de búsqueda está vacío', () => {
    const { result } = renderHook(() => usePairingRealWines(''));

    expect(result.current.realWines).toEqual([]);
    expect(result.current.hasRealWines).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(catalogApi.searchCatalogWines).not.toHaveBeenCalled();
  });

  it('consulta searchCatalogWines con el término y límite especificados', async () => {
    const mockWines: CatalogWineItemDto[] = [
      {
        id: 1,
        name: 'Catena Zapata Malbec Argentino',
        wineryId: 10,
        wineryName: 'Catena Zapata',
        wineryNameText: 'Catena Zapata',
        regionName: 'Mendoza',
        varietal: 'Malbec',
        vintage: 2021,
        imageUrl: 'https://res.cloudinary.com/sample.jpg',
        sourceType: 'Official',
        wineType: 'Red',
        locationId: 1,
        imageId: null,
        description: 'Vino icónico',
        duplicateOfWineId: null,
        averageRating: 4.8,
        reviewCount: 32,
      },
    ];

    vi.mocked(catalogApi.searchCatalogWines).mockResolvedValueOnce(mockWines);

    const { result } = renderHook(() => usePairingRealWines('Malbec', 4));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(catalogApi.searchCatalogWines).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Malbec',
        pageSize: 4,
      }),
      expect.any(AbortSignal),
    );
    expect(result.current.hasRealWines).toBe(true);
    expect(result.current.realWines).toHaveLength(1);
    expect(result.current.realWines[0].name).toBe('Catena Zapata Malbec Argentino');
  });

  it('maneja fallos de API retornando array vacío sin interrumpir la ejecución', async () => {
    vi.mocked(catalogApi.searchCatalogWines).mockRejectedValueOnce(
      new Error('Network Error'),
    );

    const { result } = renderHook(() => usePairingRealWines('Cabernet', 4));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasRealWines).toBe(false);
    expect(result.current.realWines).toEqual([]);
  });
});
