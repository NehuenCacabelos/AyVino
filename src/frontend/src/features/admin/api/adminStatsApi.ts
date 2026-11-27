import apiClient from '../../../services/apiClient';
import type {
  AdminStatsDto,
  GrapesDistribution,
  WineriesByRegion,
} from '../types/adminStats';

/**
 * Obtiene métricas y conteos exactos de moderación y catálogos para el dashboard de administración.
 * GET /api/admin/stats (solo Admin)
 */
export async function getAdminStats(): Promise<AdminStatsDto> {
  const response = await apiClient.get<AdminStatsDto>('/admin/stats');
  return response.data;
}

/**
 * Obtiene la distribución de presencia de varietales en cosechas aprobadas de vinos no duplicados.
 * GET /api/admin/stats/grapes-distribution (solo Admin)
 */
export async function getGrapesDistribution(): Promise<GrapesDistribution> {
  const response = await apiClient.get<GrapesDistribution>('/admin/stats/grapes-distribution');
  return response.data;
}

/**
 * Obtiene el conteo de bodegas aprobadas por provincia y sus pines geográficos.
 * GET /api/admin/stats/wineries-by-region (solo Admin)
 */
export async function getWineriesByRegion(): Promise<WineriesByRegion> {
  const response = await apiClient.get<WineriesByRegion>('/admin/stats/wineries-by-region');
  return response.data;
}
