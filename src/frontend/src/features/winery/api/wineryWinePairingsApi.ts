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
