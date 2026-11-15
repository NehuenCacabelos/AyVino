import apiClient from '../../../services/apiClient';
import type { CityResponseDto, CityStatus } from '../../winery/types/location';

export interface GetCitiesParams {
  pageNumber?: number;
  pageSize?: number;
  stateId?: number;
  status?: string;
}

/**
 * Lista ciudades con paginación y filtros opcionales.
 * GET /api/cities
 */
export async function getCities(params?: GetCitiesParams): Promise<CityResponseDto[]> {
  const response = await apiClient.get<CityResponseDto[]>('/cities', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      stateId: params?.stateId,
      status: params?.status,
    },
  });
  return response.data;
}

/**
 * Cambia el estado de moderación de una ciudad (Approved, Rejected, Pending).
 * PATCH /api/cities/{id}/status
 */
export async function changeCityStatus(
  id: number,
  status: CityStatus
): Promise<void> {
  await apiClient.patch<void>(`/cities/${id}/status`, { status });
}

