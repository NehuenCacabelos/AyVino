import apiClient from '../../../services/apiClient';
import type { GrapeResponseDto } from '../types';

/**
 * Lista paginada de cepas / varietales del catálogo maestro con filtro opcional por color.
 */
export async function getGrapes(params?: {
  pageNumber?: number;
  pageSize?: number;
  colorType?: string;
}): Promise<GrapeResponseDto[]> {
  const response = await apiClient.get<GrapeResponseDto[]>('/grapes', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 100,
      colorType: params?.colorType,
    },
  });
  return response.data;
}

/**
 * Obtiene el detalle de un varietal por su ID.
 */
export async function getGrapeById(id: number): Promise<GrapeResponseDto> {
  const response = await apiClient.get<GrapeResponseDto>(`/grapes/${id}`);
  return response.data;
}

