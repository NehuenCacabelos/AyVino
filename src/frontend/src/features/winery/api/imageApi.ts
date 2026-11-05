import apiClient from '../../../services/apiClient';
import type { ImageUploadResultDto } from '../types';

export type { ImageUploadResultDto };

/**
 * Sube el logo oficial de una bodega.
 */
export async function uploadWineryLogo(
  wineryId: number,
  file: File,
): Promise<ImageUploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<ImageUploadResultDto>(
    `/wineries/${wineryId}/logo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

/**
 * Elimina el logo oficial de una bodega.
 */
export async function deleteWineryLogo(wineryId: number): Promise<void> {
  await apiClient.delete(`/wineries/${wineryId}/logo`);
}

/**
 * Sube el banner oficial de una bodega.
 */
export async function uploadWineryBanner(
  wineryId: number,
  file: File,
): Promise<ImageUploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<ImageUploadResultDto>(
    `/wineries/${wineryId}/banner`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

/**
 * Elimina el banner oficial de una bodega.
 */
export async function deleteWineryBanner(wineryId: number): Promise<void> {
  await apiClient.delete(`/wineries/${wineryId}/banner`);
}

/**
 * Sube la imagen oficial de una cosecha de vino.
 */
export async function uploadVintageImage(
  wineId: number,
  vintageId: number,
  file: File,
): Promise<ImageUploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<ImageUploadResultDto>(
    `/wines/${wineId}/vintages/${vintageId}/image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

/**
 * Elimina la imagen oficial de una cosecha de vino.
 */
export async function deleteVintageImage(
  wineId: number,
  vintageId: number,
): Promise<void> {
  await apiClient.delete(`/wines/${wineId}/vintages/${vintageId}/image`);
}

/**
 * Sube la imagen de avatar para el usuario actual autenticado.
 */
export async function uploadMyAvatar(file: File): Promise<ImageUploadResultDto> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<ImageUploadResultDto>(
    '/users/me/avatar',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
}

/**
 * Elimina la imagen de avatar del usuario actual autenticado.
 */
export async function deleteMyAvatar(): Promise<void> {
  await apiClient.delete('/users/me/avatar');
}
