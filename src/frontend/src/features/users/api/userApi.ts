import apiClient from '../../../services/apiClient';
import type {
  UserProfileDto,
  UpdateUserProfileRequestDto,
  ChangePasswordRequestDto,
} from '../../auth/types';
import type {
  PublicUserProfileDto,
  PublicCellarItemDto,
  UserWineListItemDto,
  CellarDto,
  CellarItemDto,
} from '../types';

/**
 * Obtiene el perfil del usuario autenticado actual.
 */
export async function getCurrentUserApi(): Promise<UserProfileDto> {
  const response = await apiClient.get<UserProfileDto>('/users/me');
  return response.data;
}

/**
 * Obtiene el perfil público de un usuario por su nombre de usuario.
 */
export async function getPublicUserProfileApi(
  username: string
): Promise<PublicUserProfileDto> {
  const response = await apiClient.get<PublicUserProfileDto>(`/users/${encodeURIComponent(username)}`);
  return response.data;
}

/**
 * Obtiene los vinos públicos en cava de un usuario por su nombre de usuario.
 */
export async function getPublicCellarItemsApi(
  username: string,
  pageNumber = 1,
  pageSize = 20
): Promise<PublicCellarItemDto[]> {
  const response = await apiClient.get<PublicCellarItemDto[]>(
    `/users/${encodeURIComponent(username)}/cellar-items`,
    {
      params: { pageNumber, pageSize },
    }
  );
  return response.data;
}

/**
 * Sigue a un usuario.
 */
export async function followUserApi(userId: number): Promise<void> {
  await apiClient.post(`/users/${userId}/follow`);
}

/**
 * Deja de seguir a un usuario.
 */
export async function unfollowUserApi(userId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/follow`);
}

/**
 * Obtiene los usuarios que sigue el usuario autenticado.
 */
export async function getMyFollowingUsersApi(
  pageNumber = 1,
  pageSize = 100
): Promise<{ userId: number; username: string; followedAt: string }[]> {
  const response = await apiClient.get<
    { userId: number; username: string; followedAt: string }[]
  >('/users/me/following', {
    params: { pageNumber, pageSize },
  });
  return response.data;
}

/**
 * Obtiene los vinos marcados del usuario autenticado (deseados, probados/historial, favoritos).
 */
export async function getMyUserWinesApi(filters: {
  wanted?: boolean;
  tried?: boolean;
  favorite?: boolean;
  pageNumber?: number;
  pageSize?: number;
}): Promise<UserWineListItemDto[]> {
  const response = await apiClient.get<UserWineListItemDto[]>('/user-wines/me', {
    params: {
      wanted: filters.wanted,
      tried: filters.tried,
      favorite: filters.favorite,
      pageNumber: filters.pageNumber ?? 1,
      pageSize: filters.pageSize ?? 30,
    },
  });
  return response.data;
}

/**
 * Actualiza el perfil del usuario autenticado (nombre de usuario, bio, foto).
 */
export async function updateProfileApi(
  data: UpdateUserProfileRequestDto
): Promise<UserProfileDto> {
  const response = await apiClient.put<UserProfileDto>('/users/me', data);
  return response.data;
}

/**
 * Sube una imagen de avatar para el usuario autenticado vía multipart/form-data.
 */
export async function uploadAvatarApi(file: File): Promise<UserProfileDto> {
  const formData = new FormData();
  formData.append('file', file);

  await apiClient.put<{ imageId: string }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return await getCurrentUserApi();
}

/**
 * Elimina la foto de perfil personalizada del usuario autenticado.
 */
export async function deleteAvatarApi(): Promise<UserProfileDto> {
  await apiClient.delete('/users/me/avatar');
  return await getCurrentUserApi();
}

/**
 * Cambia la contraseña del usuario autenticado.
 */
export async function changePasswordApi(
  data: ChangePasswordRequestDto
): Promise<void> {
  await apiClient.post<void>('/auth/change-password', data);
}

export async function getMyCellarsApi(): Promise<CellarDto[]> {
  const response = await apiClient.get<CellarDto[]>('/cellars/me');
  return response.data;
}

export async function getCellarItemsApi(cellarId: number): Promise<CellarItemDto[]> {
  const response = await apiClient.get<CellarItemDto[]>(`/cellars/${cellarId}/items`);
  return response.data;
}

