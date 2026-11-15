import apiClient from '../../../services/apiClient';
import type {
  PairingResponseDto,
  CreatePairingRequestDto,
  UpdatePairingRequestDto,
} from '../types/adminPairings';

export interface GetPairingsParams {
  pageNumber: number;
  pageSize: number;
  category?: string;
}

/**
 * Obtiene la lista paginada de maridajes.
 * En este endpoint pageNumber y pageSize son obligatorios en el backend.
 * GET /api/pairings
 */
export async function getPairings(
  params: GetPairingsParams
): Promise<PairingResponseDto[]> {
  const response = await apiClient.get<PairingResponseDto[]>('/pairings', {
    params: {
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
      category: params.category,
    },
  });
  return response.data;
}

/**
 * Crea un nuevo maridaje en el catálogo (solo Admin).
 * POST /api/pairings
 */
export async function createPairing(
  data: CreatePairingRequestDto
): Promise<PairingResponseDto> {
  const response = await apiClient.post<PairingResponseDto>('/pairings', data);
  return response.data;
}

/**
 * Actualiza un maridaje existente (solo Admin).
 * PUT /api/pairings/{id}
 */
export async function updatePairing(
  id: number,
  data: UpdatePairingRequestDto
): Promise<PairingResponseDto> {
  const response = await apiClient.put<PairingResponseDto>(
    `/pairings/${id}`,
    data
  );
  return response.data;
}

/**
 * Elimina un maridaje (solo Admin).
 * DELETE /api/pairings/{id}
 */
export async function deletePairing(id: number): Promise<void> {
  await apiClient.delete<void>(`/pairings/${id}`);
}

