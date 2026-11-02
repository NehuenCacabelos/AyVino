import apiClient from '../../../services/apiClient';

export interface UserVintageImageResponseDto {
  imageId: string;
}

/**
 * Obtiene la foto personal del usuario para una cosecha.
 * Devuelve el UUID de la imagen si existe, o null si responde 404 (sin foto).
 * GET /api/wines/{wineId}/vintages/{vintageId}/my-image
 */
export async function getMyVintageImage(
  wineId: number,
  vintageId: number
): Promise<string | null> {
  try {
    const response = await apiClient.get<UserVintageImageResponseDto>(
      `/wines/${wineId}/vintages/${vintageId}/my-image`
    );
    return response.data?.imageId ?? null;
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosErr = error as { response?: { status?: number } };
      if (axiosErr.response?.status === 404) {
        return null;
      }
    }
    throw error;
  }
}

/**
 * Sube o reemplaza la foto personal del usuario para una cosecha puntual.
 * PUT /api/wines/{wineId}/vintages/{vintageId}/my-image (multipart/form-data)
 */
export async function uploadMyVintageImage(
  wineId: number,
  vintageId: number,
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.put<UserVintageImageResponseDto>(
    `/wines/${wineId}/vintages/${vintageId}/my-image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.imageId;
}

/**
 * Elimina la foto personal del usuario para una cosecha.
 * DELETE /api/wines/{wineId}/vintages/{vintageId}/my-image
 */
export async function deleteMyVintageImage(
  wineId: number,
  vintageId: number
): Promise<void> {
  await apiClient.delete<void>(`/wines/${wineId}/vintages/${vintageId}/my-image`);
}

