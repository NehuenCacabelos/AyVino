import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useWineCatalogs,
  fetchAllGrapes,
  fetchAllPairings,
} from '@/features/wines/hooks/useWineCatalogs';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryWinePairingsApi', () => ({
  getPairingsCatalog: vi.fn(),
  getWinePairings: vi.fn(),
  addWinePairing: vi.fn(),
  removeWinePairing: vi.fn(),
}));

describe('useWineCatalogs Hook', () => {
  const mockGrapesPage1 = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Uva ${i + 1}`,
    colorType: 'Red',
  }));

  const mockGrapesPage2 = [
    { id: 101, name: 'Uva 101 Extra', colorType: 'White' },
  ];

  const mockPairingsPage1 = [
    { id: 1, name: 'Asado de tira', category: 'Meat' },
    { id: 2, name: 'Bife de chorizo', category: 'Meat' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('funciona independientemente de wineId cargando ambos catálogos', async () => {
    vi.mocked(grapeApi.getGrapes).mockResolvedValueOnce([
      { id: 1, name: 'Malbec', colorType: 'Red' },
    ]);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValueOnce(mockPairingsPage1);

    const { result } = renderHook(() => useWineCatalogs());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.grapesCatalog).toHaveLength(1);
    expect(result.current.grapesCatalog[0].name).toBe('Malbec');
    expect(result.current.pairingsCatalog).toHaveLength(2);
    expect(grapeApi.getGrapes).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 100 });
    expect(pairingsApi.getPairingsCatalog).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 100 });
  });

  it('soporta paginación cuando el total de elementos supera 100', async () => {
    vi.mocked(grapeApi.getGrapes)
      .mockResolvedValueOnce(mockGrapesPage1)
      .mockResolvedValueOnce(mockGrapesPage2);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValueOnce(mockPairingsPage1);

    const { result } = renderHook(() => useWineCatalogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.grapesCatalog).toHaveLength(101);
    expect(result.current.grapesCatalog[100].name).toBe('Uva 101 Extra');
    expect(grapeApi.getGrapes).toHaveBeenCalledTimes(2);
    expect(grapeApi.getGrapes).toHaveBeenNthCalledWith(1, { pageNumber: 1, pageSize: 100 });
    expect(grapeApi.getGrapes).toHaveBeenNthCalledWith(2, { pageNumber: 2, pageSize: 100 });
  });

  it('maneja errores con aviso claro y permite reintentar con retry()', async () => {
    vi.mocked(grapeApi.getGrapes).mockRejectedValueOnce(new Error('Fallo de conexión en uvas'));
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValueOnce(mockPairingsPage1);

    const { result } = renderHook(() => useWineCatalogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Fallo de conexión en uvas');
    expect(result.current.grapesCatalog).toEqual([]);

    // Preparar recuperación en el reintento
    vi.mocked(grapeApi.getGrapes).mockResolvedValueOnce([
      { id: 1, name: 'Malbec Recuperado', colorType: 'Red' },
    ]);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValueOnce(mockPairingsPage1);

    await act(async () => {
      await result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.grapesCatalog).toHaveLength(1);
      expect(result.current.grapesCatalog[0].name).toBe('Malbec Recuperado');
    });
  });

  it('no ejecuta pedidos cuando enabled es false', () => {
    const { result } = renderHook(() => useWineCatalogs({ enabled: false }));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.grapesCatalog).toEqual([]);
    expect(result.current.pairingsCatalog).toEqual([]);
    expect(grapeApi.getGrapes).not.toHaveBeenCalled();
    expect(pairingsApi.getPairingsCatalog).not.toHaveBeenCalled();
  });

  it('fetchAllGrapes y fetchAllPairings obtienen colecciones completas', async () => {
    vi.mocked(grapeApi.getGrapes).mockResolvedValueOnce([{ id: 1, name: 'Malbec', colorType: 'Red' }]);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValueOnce(mockPairingsPage1);

    const grapes = await fetchAllGrapes();
    const pairings = await fetchAllPairings();

    expect(grapes).toHaveLength(1);
    expect(pairings).toHaveLength(2);
  });
});
