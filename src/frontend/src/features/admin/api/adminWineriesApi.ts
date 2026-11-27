import apiClient from '../../../services/apiClient';
import type { WineryResponseDto, WineryStatus } from '../../winery/types/winery';
import type { PagedResponse } from '../types/pagedResult';
import { parseTotalCountHeader } from '../utils/totalCount';

export interface GetAdminWineriesParams {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  locationId?: number;
  search?: string;
}

/**
 * Lista paginada de bodegas para el panel de administración, leyendo `X-Total-Count`.
 * GET /api/wineries
 */
export async function getAdminWineries(
  params?: GetAdminWineriesParams
): Promise<PagedResponse<WineryResponseDto>> {
  const response = await apiClient.get<WineryResponseDto[]>('/wineries', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      status: params?.status,
      locationId: params?.locationId,
      search: params?.search?.trim() || undefined,
    },
  });
  return {
    items: response.data,
    totalCount: parseTotalCountHeader(response.headers),
  };
}

/**
 * Cambia el estado de moderación de una bodega.
 * PATCH /api/wineries/{id}/status
 */
export async function changeWineryStatus(
  id: number,
  status: WineryStatus
): Promise<void> {
  await apiClient.patch<void>(`/wineries/${id}/status`, { status });
}

/**
 * Elimina una bodega del sistema.
 * DELETE /api/wineries/{id}
 */
export async function deleteWinery(id: number): Promise<void> {
  await apiClient.delete<void>(`/wineries/${id}`);
}

