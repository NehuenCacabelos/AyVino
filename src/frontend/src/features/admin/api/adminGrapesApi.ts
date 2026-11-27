import apiClient from '../../../services/apiClient';
import type { GrapeResponseDto } from '../../winery/types/grape';
import type { PagedResponse } from '../types/pagedResult';
import { parseTotalCountHeader } from '../utils/totalCount';

export interface GetAdminGrapesParams {
  pageNumber?: number;
  pageSize?: number;
  colorType?: string;
}

/**
 * Lista paginada de cepas para el panel de administración, leyendo `X-Total-Count`.
 * GET /api/grapes
 */
export async function getAdminGrapes(
  params?: GetAdminGrapesParams
): Promise<PagedResponse<GrapeResponseDto>> {
  const response = await apiClient.get<GrapeResponseDto[]>('/grapes', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      colorType: params?.colorType,
    },
  });
  return {
    items: response.data,
    totalCount: parseTotalCountHeader(response.headers),
  };
}

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

