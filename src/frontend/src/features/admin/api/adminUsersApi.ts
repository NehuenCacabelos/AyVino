import apiClient from '../../../services/apiClient';
import type { AdminUserListItemDto } from '../types/adminUsers';

export interface GetUsersParams {
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Obtiene la lista paginada de usuarios registrados (solo Admin).
 * GET /api/users
 */
export async function getUsers(
  params?: GetUsersParams
): Promise<AdminUserListItemDto[]> {
  const response = await apiClient.get<AdminUserListItemDto[]>('/users', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
    },
  });
  return response.data;
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
 * Elimina permanentemente a un usuario y sus credenciales (solo Admin).
 * DELETE /api/users/{id}
 */
export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete<void>(`/users/${id}`);
}

