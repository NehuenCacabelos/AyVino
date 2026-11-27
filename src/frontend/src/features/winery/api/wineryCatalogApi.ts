import apiClient from '../../../services/apiClient';
import type { WineryCatalogResponseDto } from '../types/catalog';

/**
 * Obtiene el catálogo unificado del productor vitivinícola autenticado,
 * incluyendo todas sus etiquetas, añadas, blends y métricas consolidadas.
 */
export async function getMyCatalog(): Promise<WineryCatalogResponseDto> {
  const response = await apiClient.get<WineryCatalogResponseDto>('/wineries/me/catalog');
  return response.data;
}
