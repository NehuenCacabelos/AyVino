import apiClient from '../../../services/apiClient';
import type { CatalogWineItemDto } from '../../../types/wine';

export interface CatalogFilterItem {
  id: number;
  name: string;
  wineCount: number;
}

export interface CatalogFiltersResponse {
  grapes: CatalogFilterItem[];
  provinces: CatalogFilterItem[];
  wineries: CatalogFilterItem[];
}

export interface WineSuggestion {
  id: number;
  name: string;
  wineryName?: string | null;
  vintage?: number | null;
  imageId?: string | null;
}

export interface WinerySuggestion {
  id: number;
  name: string;
  logoImageId?: string | null;
  location?: string | null;
}

export interface SearchSuggestionsResponse {
  wines: WineSuggestion[];
  wineries: WinerySuggestion[];
  grapes: CatalogFilterItem[];
  regions: CatalogFilterItem[];
}

export interface CatalogSearchParams {
  search?: string;
  name?: string;
  winery?: string;
  year?: number;
  wineType?: string;
  grapeId?: number;
  stateId?: number;
  wineryId?: number;
  pageNumber?: number;
  pageSize?: number;
}

const SESSION_STORAGE_KEY = 'ayvino_catalog_filters';
let inMemoryFiltersCache: CatalogFiltersResponse | null = null;

/**
 * Limpia la caché en memoria y en sessionStorage (útil para pruebas unitarias).
 */
export function clearCatalogFiltersCache(): void {
  inMemoryFiltersCache = null;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Entornos sin sessionStorage
  }
}

/**
 * Obtiene los filtros del catálogo (uvas, provincias, bodegas) con conteo de vinos.
 * Implementa caché de sesión (memoria + sessionStorage).
 */
export async function getCatalogFilters(forceRefresh = false): Promise<CatalogFiltersResponse> {
  if (!forceRefresh && inMemoryFiltersCache) {
    return inMemoryFiltersCache;
  }

  if (!forceRefresh) {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CatalogFiltersResponse;
        inMemoryFiltersCache = parsed;
        return parsed;
      }
    } catch {
      // sessionStorage no disponible o JSON inválido
    }
  }

  const response = await apiClient.get<CatalogFiltersResponse>('/catalog/filters');
  inMemoryFiltersCache = response.data;

  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(response.data));
  } catch {
    // ignorar cuota excedida o modo incógnito
  }

  return response.data;
}

/**
 * Obtiene sugerencias agrupadas (vinos, bodegas, uvas, regiones) para el buscador.
 * Cancela con AbortSignal y retorna listas vacías si la consulta tiene menos de 2 caracteres.
 */
export async function getSearchSuggestions(
  q: string,
  signal?: AbortSignal,
): Promise<SearchSuggestionsResponse> {
  const query = q.trim();
  if (query.length < 2) {
    return {
      wines: [],
      wineries: [],
      grapes: [],
      regions: [],
    };
  }

  const response = await apiClient.get<SearchSuggestionsResponse>('/search/suggestions', {
    params: { q: query },
    signal,
  });
  return response.data;
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
      grapeId: params.grapeId,
      stateId: params.stateId,
      wineryId: params.wineryId,
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 24,
    },
    signal,
  });
  return response.data;
}
