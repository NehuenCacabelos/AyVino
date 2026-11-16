import apiClient from '../../../services/apiClient';
import type {
  UncorkListItemDto,
  CreateUncorkRequestDto,
  UncorkResponseDto,
} from '../types/uncork';

/**
 * Registra un evento de descorche para una cosecha (servicio unificado).
 * Si se incluye calificación, crea o actualiza la reseña en la misma transacción.
 * Endpoint autenticado: POST /api/users/me/uncorks
 */
export async function createUncork(data: CreateUncorkRequestDto): Promise<UncorkResponseDto> {
  const response = await apiClient.post<UncorkResponseDto>('/users/me/uncorks', data);
  return response.data;
}

/**
 * Obtiene la bitácora cronológica paginada de descorches del usuario autenticado.
 * Cada ítem incluye la reseña vigente del usuario (calificación y comentario).
 * Endpoint autenticado: GET /api/users/me/uncorks
 */
export async function getMyUncorks(params?: {
  pageNumber?: number;
  pageSize?: number;
  wineVintageId?: number;
}): Promise<UncorkListItemDto[]> {
  const response = await apiClient.get<UncorkListItemDto[]>('/users/me/uncorks', { params });
  return response.data;
}
