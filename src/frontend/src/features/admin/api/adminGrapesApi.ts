import apiClient from '../../../services/apiClient';
import type { GrapeResponseDto } from '../../winery/types/grape';

export interface CreateGrapeRequestDto {
  name: string;
  colorType: string;
  typicalBody?: string | null;
  typicalTannins?: string | null;
  typicalAcidity?: string | null;
  description?: string | null;
}

export interface UpdateGrapeRequestDto {
  name: string;
  colorType: string;
  typicalBody?: string | null;
  typicalTannins?: string | null;
  typicalAcidity?: string | null;
  description?: string | null;
}

/**
 * Crea una nueva uva en el catálogo maestro (solo Admin).
 * POST /api/grapes
 */
export async function createGrape(
  data: CreateGrapeRequestDto
): Promise<GrapeResponseDto> {
  const response = await apiClient.post<GrapeResponseDto>('/grapes', data);
  return response.data;
}

/**
 * Actualiza una uva existente en el catálogo maestro (solo Admin).
 * PUT /api/grapes/{id}
 */
export async function updateGrape(
  id: number,
  data: UpdateGrapeRequestDto
): Promise<GrapeResponseDto> {
  const response = await apiClient.put<GrapeResponseDto>(`/grapes/${id}`, data);
  return response.data;
}

/**
 * Elimina una uva del catálogo maestro (solo Admin).
 * DELETE /api/grapes/{id}
 */
export async function deleteGrape(id: number): Promise<void> {
  await apiClient.delete<void>(`/grapes/${id}`);
}

