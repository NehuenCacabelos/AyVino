import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchGrapesCatalogOnce,
  clearGrapesCatalogCache,
  sortGrapesForWineType,
} from '@/features/cava/api/grapesCatalogCache';
import apiClient from '@/services/apiClient';
import type { GrapeResponseDto } from '@/features/winery/types';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
  },
}));

describe('grapesCatalogCache - fetchGrapesCatalogOnce', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGrapesCatalogCache();
    sessionStorage.clear();
  });

  it('nunca pide pageSize > 100 y concatena varias páginas correctamente', async () => {
    // Generar página 1 con exactamente 100 uvas
    const page1: GrapeResponseDto[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Grape ${i + 1}`,
      colorType: 'Red',
      typicalBody: null,
      typicalTannins: null,
      typicalAcidity: null,
      description: null,
    }));

    // Generar página 2 con 25 uvas (< 100, termina paginación)
    const page2: GrapeResponseDto[] = Array.from({ length: 25 }, (_, i) => ({
      id: 101 + i,
      name: `Grape ${101 + i}`,
      colorType: 'White',
      typicalBody: null,
      typicalTannins: null,
      typicalAcidity: null,
      description: null,
    }));

    vi.mocked(apiClient.get).mockImplementation((url, config) => {
      if (url === '/grapes') {
        const pageNumber = (config?.params as { pageNumber?: number })?.pageNumber;
        if (pageNumber === 1) {
          return Promise.resolve({ data: page1 });
        }
        if (pageNumber === 2) {
          return Promise.resolve({ data: page2 });
        }
      }
      return Promise.resolve({ data: [] });
    });

    const result = await fetchGrapesCatalogOnce();

    // 1. Debe haber concatenado las dos páginas (100 + 25 = 125)
    expect(result).toHaveLength(125);
    expect(result[0].name).toBe('Grape 1');
    expect(result[124].name).toBe('Grape 125');

    // 2. Verificar que se hicieron exactamente 2 llamadas con pageSize <= 100
    expect(apiClient.get).toHaveBeenCalledTimes(2);

    const calls = vi.mocked(apiClient.get).mock.calls;
    calls.forEach((call) => {
      const params = call[1]?.params as { pageNumber: number; pageSize: number };
      expect(params.pageSize).toBeLessThanOrEqual(100);
      expect(params.pageSize).toBe(100);
    });

    expect(calls[0][1]?.params).toEqual({ pageNumber: 1, pageSize: 100 });
    expect(calls[1][1]?.params).toEqual({ pageNumber: 2, pageSize: 100 });

    // 3. Debe haberse guardado en sessionStorage
    const stored = sessionStorage.getItem('ayvino_grapes_catalog');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toHaveLength(125);

    // 4. Siguiente llamada debe responder desde caché sin llamar a apiClient.get
    const cachedResult = await fetchGrapesCatalogOnce();
    expect(cachedResult).toHaveLength(125);
    expect(apiClient.get).toHaveBeenCalledTimes(2); // no hubo llamadas adicionales
  });

  it('no cachea listas vacías si la API falla o responde error', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error 400 Bad Request'));

    const result = await fetchGrapesCatalogOnce();

    expect(result).toEqual([]);
    expect(sessionStorage.getItem('ayvino_grapes_catalog')).toBeNull();

    // Si luego la API se recupera, debe poder volver a llamar sin estar bloqueada por caché vacía
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 1,
          name: 'Malbec',
          colorType: 'Red',
          typicalBody: null,
          typicalTannins: null,
          typicalAcidity: null,
          description: null,
        },
      ],
    });

    const recovered = await fetchGrapesCatalogOnce();
    expect(recovered).toHaveLength(1);
    expect(recovered[0].name).toBe('Malbec');
    expect(sessionStorage.getItem('ayvino_grapes_catalog')).not.toBeNull();
  });

  it('no cachea listas vacías si la API responde array vacío', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [] });

    const result = await fetchGrapesCatalogOnce();

    expect(result).toEqual([]);
    expect(sessionStorage.getItem('ayvino_grapes_catalog')).toBeNull();
  });

  it('mantiene la lógica de sortGrapesForWineType intacta', () => {
    const grapes: GrapeResponseDto[] = [
      { id: 1, name: 'Malbec', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
      { id: 2, name: 'Torrontés', colorType: 'White', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
      { id: 3, name: 'Cabernet', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    ];

    const sortedRed = sortGrapesForWineType(grapes, 'Red');
    expect(sortedRed.map((g) => g.name)).toEqual(['Cabernet', 'Malbec', 'Torrontés']);

    const sortedWhite = sortGrapesForWineType(grapes, 'White');
    expect(sortedWhite.map((g) => g.name)).toEqual(['Torrontés', 'Cabernet', 'Malbec']);
  });
});
