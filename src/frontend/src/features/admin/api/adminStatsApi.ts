import apiClient from '../../../services/apiClient';
import type { AdminStatsDto } from '../types/adminStats';

/**
 * Obtiene métricas y conteos exactos de moderación y catálogos para el dashboard de administración.
 * GET /api/admin/stats (solo Admin)
 */
export async function getAdminStats(): Promise<AdminStatsDto> {
  const response = await apiClient.get<AdminStatsDto>('/admin/stats');
  return response.data;
}
