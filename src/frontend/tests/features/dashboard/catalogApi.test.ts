import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '@/services/apiClient';
import {
  getCatalogFilters,
  clearCatalogFiltersCache,
  getSearchSuggestions,
  searchCatalogWines,
  type CatalogFiltersResponse,
} from '@/features/dashboard/api/catalogApi';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
  },
}));

describe('catalogApi: filtros con caché de sesión y búsqueda con sugerencias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCatalogFiltersCache();
  });

  it('getCatalogFilters consulta la API en la primera llamada y usa caché en las siguientes', async () => {
    const mockData: CatalogFiltersResponse = {
      grapes: [{ id: 1, name: 'Malbec', wineCount: 5 }],
      provinces: [{ id: 10, name: 'Mendoza', wineCount: 10 }],
      wineries: [{ id: 100, name: 'Catena', wineCount: 3 }],
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    // Primera llamada -> consulta endpoint
    const firstCall = await getCatalogFilters();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(apiClient.get).toHaveBeenCalledWith('/catalog/filters');
    expect(firstCall).toEqual(mockData);

    // Segunda llamada -> no debe consultar endpoint, usa caché
    const secondCall = await getCatalogFilters();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
    expect(secondCall).toEqual(mockData);

    // Con forceRefresh = true -> vuelve a consultar
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });
    await getCatalogFilters(true);
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('getSearchSuggestions devuelve arrays vacíos si el texto tiene menos de 2 caracteres', async () => {
    const resEmpty = await getSearchSuggestions('a');
    expect(resEmpty).toEqual({ wines: [], wineries: [], grapes: [], regions: [] });
    expect(apiClient.get).not.toHaveBeenCalled();

    const resWhitespace = await getSearchSuggestions('   ');
    expect(resWhitespace).toEqual({ wines: [], wineries: [], grapes: [], regions: [] });
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('getSearchSuggestions consulta /search/suggestions con q y AbortSignal si tiene >= 2 caracteres', async () => {
    const mockResult = {
      wines: [],
      wineries: [{ id: 5, name: 'Zuccardi', location: 'Mendoza', logoImageId: null }],
      grapes: [],
      regions: [],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockResult });

    const controller = new AbortController();
    const res = await getSearchSuggestions('Zuccardi', controller.signal);

    expect(apiClient.get).toHaveBeenCalledWith('/search/suggestions', {
      params: { q: 'Zuccardi' },
      signal: controller.signal,
    });
    expect(res).toEqual(mockResult);
  });

  it('searchCatalogWines incluye grapeId, stateId y wineryId en los parámetros de consulta', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    await searchCatalogWines({
      search: 'Gran',
      grapeId: 1,
      stateId: 10,
      wineryId: 100,
      pageSize: 48,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/wines/search', {
      params: expect.objectContaining({
        search: 'Gran',
        grapeId: 1,
        stateId: 10,
        wineryId: 100,
        pageSize: 48,
      }),
      signal: undefined,
    });
  });
});
