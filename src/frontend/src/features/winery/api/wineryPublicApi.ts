import apiClient from '../../../services/apiClient';
import type {
  WineryPublicProfileResponseDto,
  WineryPublicCatalogResponseDto,
  WineryPublicCatalogQueryParams,
} from '../types';

/**
 * Obtiene el perfil público vidriera de una bodega.
 * Soporta autenticación opcional (determina isFollowedByMe e isPreview si es dueño/admin).
 */
export async function getWineryPublicProfile(
  id: number,
  signal?: AbortSignal,
): Promise<WineryPublicProfileResponseDto> {
  const response = await apiClient.get<WineryPublicProfileResponseDto>(`/wineries/${id}/public`, {
    signal,
  });
  return response.data;
}

/**
 * Obtiene el catálogo público paginado de una bodega con filtros server-side.
 */
export async function getWineryPublicCatalog(
  id: number,
  params?: WineryPublicCatalogQueryParams,
  signal?: AbortSignal,
): Promise<WineryPublicCatalogResponseDto> {
  const response = await apiClient.get<WineryPublicCatalogResponseDto>(`/wineries/${id}/catalog`, {
    params,
    signal,
  });
  return response.data;
}
