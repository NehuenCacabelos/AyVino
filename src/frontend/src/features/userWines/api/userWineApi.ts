import apiClient from '../../../services/apiClient';
import type { UserWineMarksResponseDto, UserWineListItemDto, UserWineQueryParams } from '../types';

/**
 * Consulta el estado de las marcas del usuario para un vino (deseado, probado, favorito).
 * GET /api/wines/{wineId}/my-marks
 */
export async function getMyWineMarks(wineId: number): Promise<UserWineMarksResponseDto> {
  const response = await apiClient.get<UserWineMarksResponseDto>(`/wines/${wineId}/my-marks`);
  return response.data;
}

/**
 * Marca el vino como deseado.
 * PUT /api/wines/{wineId}/wanted
 */
export async function markWineAsWanted(wineId: number): Promise<void> {
  await apiClient.put<void>(`/wines/${wineId}/wanted`);
}

/**
 * Desmarca el vino de la lista de deseados.
 * DELETE /api/wines/{wineId}/wanted
 */
export async function unmarkWineAsWanted(wineId: number): Promise<void> {
  await apiClient.delete<void>(`/wines/${wineId}/wanted`);
}

/**
 * Marca el vino como probado (inmutable: no posee DELETE).
 * PUT /api/wines/{wineId}/tried
 */
export async function markWineAsTried(wineId: number): Promise<void> {
  await apiClient.put<void>(`/wines/${wineId}/tried`);
}

/**
 * Marca el vino como favorito.
 * PUT /api/wines/{wineId}/favorite
 */
export async function markWineAsFavorite(wineId: number): Promise<void> {
  await apiClient.put<void>(`/wines/${wineId}/favorite`);
}

/**
 * Desmarca el vino de favoritos.
 * DELETE /api/wines/{wineId}/favorite
 */
export async function unmarkWineAsFavorite(wineId: number): Promise<void> {
  await apiClient.delete<void>(`/wines/${wineId}/favorite`);
}

/**
 * Lista paginada de todos los vinos marcados por el usuario actual con filtros combinables.
 * GET /api/user-wines/me
 */
export async function getMyUserWines(params?: UserWineQueryParams): Promise<UserWineListItemDto[]> {
  const response = await apiClient.get<UserWineListItemDto[]>('/user-wines/me', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      wanted: params?.wanted,
      tried: params?.tried,
      favorite: params?.favorite,
    },
  });
  return response.data;
}

