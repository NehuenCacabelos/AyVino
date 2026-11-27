import apiClient from '../../../services/apiClient';
import type { AdminUserListItemDto } from '../types/adminUsers';
import type { PagedResponse } from '../types/pagedResult';
import { parseTotalCountHeader } from '../utils/totalCount';

export interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

/**
 * Obtiene la lista paginada de usuarios registrados (solo Admin).
 * GET /api/users
 */
export async function getUsers(
  params?: GetUsersParams
): Promise<PagedResponse<AdminUserListItemDto>> {
  const response = await apiClient.get<AdminUserListItemDto[]>('/users', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      search: params?.search?.trim() || undefined,
      role: params?.role || undefined,
      status: params?.status || undefined,
    },
  });
  return {
    items: response.data,
    totalCount: parseTotalCountHeader(response.headers),
  };
}

/**
 * Activa o desactiva la cuenta de un usuario (solo Admin).
 * PATCH /api/users/{id}/status
 */
export async function changeUserStatus(
  id: number,
  isActive: boolean
): Promise<void> {
  await apiClient.patch<void>(`/users/${id}/status`, { isActive });
}

/**
 * Cambia el rol de un usuario (solo Admin).
 * PATCH /api/users/{id}/role
 */
export async function changeUserRole(
  id: number,
  role: 'Admin' | 'User'
): Promise<void> {
  await apiClient.patch<void>(`/users/${id}/role`, { role });
}

/**
 * Elimina permanentemente a un usuario y sus credenciales (solo Admin).
 * DELETE /api/users/{id}
 */
export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete<void>(`/users/${id}`);
}

