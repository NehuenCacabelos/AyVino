import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGrapesDistribution, getWineriesByRegion } from '@/features/admin/api/adminStatsApi';
import apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('adminStatsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getGrapesDistribution llama a /admin/stats/grapes-distribution y retorna la respuesta', async () => {
    const payload = {
      totalVintages: 5,
      grapes: [{ grapeId: 1, name: 'Malbec', vintageCount: 5 }],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: payload });

    const result = await getGrapesDistribution();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/stats/grapes-distribution');
    expect(result).toEqual(payload);
  });

  it('getWineriesByRegion llama a /admin/stats/wineries-by-region y retorna la respuesta', async () => {
    const payload = {
      totalWineries: 3,
      withoutCoordinates: 1,
      regions: [{ stateId: 13, stateName: 'Mendoza', wineryCount: 3 }],
      pins: [
        {
          id: 10,
          name: 'Bodega Norte',
          latitude: -33.0,
          longitude: -68.8,
          stateName: 'Mendoza',
          cityName: 'Luján de Cuyo',
        },
      ],
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: payload });

    const result = await getWineriesByRegion();

    expect(apiClient.get).toHaveBeenCalledWith('/admin/stats/wineries-by-region');
    expect(result).toEqual(payload);
  });
});
