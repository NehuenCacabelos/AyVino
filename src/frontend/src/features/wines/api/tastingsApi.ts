import apiClient from '../../../services/apiClient';
import type {
  CreateTastingRequestDto,
  TastingResponseDto,
  TastingListItemDto,
} from '../types/tasting';

/**
 * Registra una cata privada para una cosecha de vino (servicio unificado).
 * Endpoint autenticado: POST /api/users/me/tastings
 */
export async function createTasting(
  data: CreateTastingRequestDto
): Promise<TastingResponseDto> {
  const response = await apiClient.post<TastingResponseDto>('/users/me/tastings', data);
  return response.data;
}

/**
 * Obtiene la bitácora de catas del usuario actual con paginación y filtro opcional por cosecha.
 * Endpoint autenticado: GET /api/users/me/tastings
 */
export async function getMyTastings(params?: {
  wineVintageId?: number;
  pageNumber?: number;
  pageSize?: number;
}): Promise<TastingListItemDto[]> {
  const response = await apiClient.get<TastingListItemDto[]>('/users/me/tastings', {
    params,
  });
  return response.data;
}
