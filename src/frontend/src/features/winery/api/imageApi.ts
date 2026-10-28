import apiClient from '../../../services/apiClient';
import type { ImageUploadResponseDto } from '../types';

/**
 * Sube una imagen oficial de bodega, cosecha o banner a Supabase Storage mediante el backend.
 *
 * @param file Archivo binario (JPG, PNG o WEBP, máx 2 MB)
 * @param folder Carpeta de almacenamiento: 'wineries' para logos, 'vintages' para fotos de cosechas, 'banners' para banners
 */
export async function uploadImage(
  file: File,
  folder: 'wineries' | 'vintages' | 'banners',
): Promise<ImageUploadResponseDto> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await apiClient.post<ImageUploadResponseDto>('/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
