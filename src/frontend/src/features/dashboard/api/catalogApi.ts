import apiClient from '../../../services/apiClient';
import type { CatalogWineItemDto } from '../../../types/wine';

export interface CatalogSearchParams {
  search?: string;
  name?: string;
  winery?: string;
  year?: number;
  wineType?: string;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Consulta el catálogo de vinos en tiempo real con soporte de fuzzy search (pg_trgm) y filtros server-side.
 * Acepta un término de búsqueda en texto plano o un objeto CatalogSearchParams, junto a un AbortSignal opcional.
 */
export async function searchCatalogWines(
  queryOrParams?: string | CatalogSearchParams,
  signal?: AbortSignal,
): Promise<CatalogWineItemDto[]> {
  const params: CatalogSearchParams =
    typeof queryOrParams === 'string'
      ? { search: queryOrParams }
      : queryOrParams || {};

  const response = await apiClient.get<CatalogWineItemDto[]>('/wines/search', {
    params: {
      search: params.search?.trim() || undefined,
      name: params.name?.trim() || undefined,
      winery: params.winery?.trim() || undefined,
      year: params.year,
      wineType: params.wineType && params.wineType !== 'Todos' ? params.wineType : undefined,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 24,
    },
    signal,
  });
  return response.data;
}

