import apiClient from '../../../services/apiClient';
import type {
  CatalogFiltersResponse,
  CatalogShowcaseResponse,
  CatalogShowcaseParams,
} from '../types';

/**
 * Obtiene los filtros agregados disponibles en el catálogo (varietales, regiones, bodegas).
 */
export async function getCatalogFiltersApi(): Promise<CatalogFiltersResponse> {
  const response = await apiClient.get<CatalogFiltersResponse>('/catalog/filters');
  return response.data;
}

/**
 * Obtiene las bodegas y vinos para el showcase agrupado del catálogo general.
 */
export async function getCatalogShowcaseApi(
  params?: CatalogShowcaseParams
): Promise<CatalogShowcaseResponse> {
  const response = await apiClient.get<CatalogShowcaseResponse>('/catalog/showcase', {
    params: {
      q: params?.q || undefined,
      wineType: params?.wineType || undefined,
      grapeId: params?.grapeId || undefined,
      locationId: params?.locationId || undefined,
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 6,
      winesPerWinery: params?.winesPerWinery ?? 8,
    },
  });
  return response.data;
}
