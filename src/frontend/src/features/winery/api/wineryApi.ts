import apiClient from '../../../services/apiClient';
import type {
  WineryResponseDto,
  RegisterWineryRequestDto,
  RegisterWineryResponseDto,
  UpdateWineryRequestDto,
  WineryFollowerDto,
} from '../types';

/**
 * Obtiene la bodega asociada al usuario autenticado (Fuente de verdad del panel de bodega).
 * Endpoint acordado: GET /api/wineries/me
 * Devuelve 404 si el usuario autenticado no posee una bodega vinculada.
 */
export async function getMyWinery(): Promise<WineryResponseDto> {
  const response = await apiClient.get<WineryResponseDto>('/wineries/me');
  return response.data;
}

/**
 * Obtiene el perfil público de una bodega por su identificador.
 */
export async function getWineryById(id: number): Promise<WineryResponseDto> {
  const response = await apiClient.get<WineryResponseDto>(`/wineries/${id}`);
  return response.data;
}

/**
 * Lista paginada de bodegas con filtros opcionales de estado y ubicación.
 */
export async function getWineries(params?: {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  locationId?: number;
}): Promise<WineryResponseDto[]> {
  const response = await apiClient.get<WineryResponseDto[]>('/wineries', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      status: params?.status,
      locationId: params?.locationId,
    },
  });
  return response.data;
}

/**
 * Actualiza los datos informativos y de contacto de una bodega existente.
 * El dueño puede editarla incluso si la bodega se encuentra en estado Pending.
 */
export async function updateWinery(
  id: number,
  data: UpdateWineryRequestDto,
): Promise<WineryResponseDto> {
  const response = await apiClient.put<WineryResponseDto>(`/wineries/${id}`, data);
  return response.data;
}

/**
 * Onboarding unificado: crea un usuario con Role="Winery" y su entidad bodega en un solo paso.
 * Devuelve un AccessToken JWT inicial.
 */
export async function registerWinery(
  data: RegisterWineryRequestDto,
): Promise<RegisterWineryResponseDto> {
  const response = await apiClient.post<RegisterWineryResponseDto>('/wineries/register', data);
  return response.data;
}

/**
 * Lista los usuarios seguidores de una bodega aprobada.
 * Nota: Si la bodega está Pending o rechazada, el backend responde 404 Not Found.
 */
export async function getWineryFollowers(
  id: number,
  params?: { pageNumber?: number; pageSize?: number },
): Promise<WineryFollowerDto[]> {
  const response = await apiClient.get<WineryFollowerDto[]>(`/wineries/${id}/followers`, {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  });
  return response.data;
}

/**
 * Comienza a seguir a una bodega oficial aprobada.
 */
export async function followWinery(id: number): Promise<void> {
  await apiClient.post<void>(`/wineries/${id}/follow`);
}

/**
 * Deja de seguir a una bodega.
 */
export async function unfollowWinery(id: number): Promise<void> {
  await apiClient.delete<void>(`/wineries/${id}/follow`);
}

