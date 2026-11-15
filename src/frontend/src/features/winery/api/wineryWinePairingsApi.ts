import apiClient from '../../../services/apiClient';
import type { WineryWinePairingDto } from '../types/catalog';

/**
 * Obtiene los maridajes asociados a una etiqueta oficial de vino.
 * Consulta el endpoint público GET /api/wines/{wineId}/pairings.
 */
export async function getWinePairings(wineId: number): Promise<WineryWinePairingDto[]> {
  const response = await apiClient.get<WineryWinePairingDto[]>(`/wines/${wineId}/pairings`);
  return response.data;
}

/**
 * Asocia un maridaje del catálogo a una etiqueta de vino oficial de la bodega.
 * Endpoint autenticado: POST /api/wines/{wineId}/pairings/{pairingId}
 */
export async function addWinePairing(wineId: number, pairingId: number): Promise<void> {
  await apiClient.post<void>(`/wines/${wineId}/pairings/${pairingId}`);
}

/**
 * Desasocia un maridaje de una etiqueta de vino de la bodega.
 * Endpoint autenticado: DELETE /api/wines/{wineId}/pairings/{pairingId}
 */
export async function removeWinePairing(wineId: number, pairingId: number): Promise<void> {
  await apiClient.delete<void>(`/wines/${wineId}/pairings/${pairingId}`);
}

/**
 * Lista maridajes paginados del catálogo maestro con filtro opcional por categoría.
 * Endpoint público: GET /api/pairings
 */
export async function getPairingsCatalog(params?: {
  pageNumber?: number;
  pageSize?: number;
  category?: string;
}): Promise<WineryWinePairingDto[]> {
  const response = await apiClient.get<WineryWinePairingDto[]>('/pairings', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 100,
      category: params?.category || undefined,
    },
  });
  return response.data;
}
