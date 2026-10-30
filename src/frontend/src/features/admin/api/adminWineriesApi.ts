import apiClient from '../../../services/apiClient';
import type { WineryStatus } from '../../winery/types/winery';

/**
 * Cambia el estado de moderación de una bodega.
 * PATCH /api/wineries/{id}/status
 */
export async function changeWineryStatus(
  id: number,
  status: WineryStatus
): Promise<void> {
  await apiClient.patch<void>(`/wineries/${id}/status`, { status });
}

/**
 * Elimina una bodega del sistema.
 * DELETE /api/wineries/{id}
 */
export async function deleteWinery(id: number): Promise<void> {
  await apiClient.delete<void>(`/wineries/${id}`);
}

