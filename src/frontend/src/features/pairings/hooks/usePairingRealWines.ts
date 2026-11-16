import { useState, useEffect } from 'react';
import { searchCatalogWines } from '../../dashboard/api/catalogApi';
import type { CatalogWineItemDto } from '../../../types/wine';

export interface UsePairingRealWinesResult {
  realWines: CatalogWineItemDto[];
  isLoading: boolean;
  hasRealWines: boolean;
}

/**
 * usePairingRealWines Hook
 * Consulta vinos reales de la base de datos a través de /api/wines/search (pg_trgm fuzzy search).
 * Permite reemplazar las botellas testigo mock por etiquetas y bodegas reales activas en el sistema,
 * con fallback transparente ante errores o ausencia de resultados.
 */
export function usePairingRealWines(
  searchTerm?: string,
  limit = 4,
): UsePairingRealWinesResult {
  const [realWines, setRealWines] = useState<CatalogWineItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const trimmed = searchTerm?.trim();
    if (!trimmed) {
      setRealWines([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    searchCatalogWines(
      {
        search: trimmed,
        pageSize: limit,
      },
      controller.signal,
    )
      .then((items) => {
        setRealWines(Array.isArray(items) ? items : []);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        // Ignorar cancelaciones por desmontado o cambio de varietal
        if (
          (err instanceof DOMException && err.name === 'AbortError') ||
          (typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code: string }).code === 'ERR_CANCELED')
        ) {
          return;
        }
        setRealWines([]);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [searchTerm, limit]);

  return {
    realWines,
    isLoading,
    hasRealWines: realWines.length > 0,
  };
}

export default usePairingRealWines;
