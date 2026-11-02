import { useState, useEffect } from 'react';
import { searchWines } from '../../winery/api/wineApi';
import type { WineListItemDto } from '../../winery/types/wine';

export interface UseWineSearchOptions {
  limit?: number;
  debounceMs?: number;
}

export interface UseWineSearchResult {
  results: WineListItemDto[];
  isSearching: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook reutilizable para búsqueda paralela por nombre y bodega en el catálogo de vinos.
 * Realiza uniones de resultados sin duplicar por ID y aplica debounce con cancelación por AbortController.
 */
export function useWineSearch(
  query: string,
  options: UseWineSearchOptions = {}
): UseWineSearchResult {
  const { limit = 5, debounceMs = 350 } = options;

  const [results, setResults] = useState<WineListItemDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const refetch = () => setRetryKey((k) => k + 1);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setResults([]);
        setIsSearching(false);
        setError(null);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const abortController = new AbortController();

    const timer = setTimeout(() => {
      setIsSearching(true);
      setError(null);

      Promise.all([
        searchWines({ name: trimmed, pageSize: limit }, abortController.signal),
        searchWines({ winery: trimmed, pageSize: limit }, abortController.signal),
      ])
        .then(([byName, byWinery]) => {
          if (abortController.signal.aborted) return;
          const map = new Map<number, WineListItemDto>();
          for (const item of byName) map.set(item.id, item);
          for (const item of byWinery) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          const combined = Array.from(map.values()).slice(0, limit);
          setResults(combined);
          setIsSearching(false);
        })
        .catch(() => {
          if (abortController.signal.aborted) return;
          setIsSearching(false);
          setError('Error al buscar vinos en el catálogo.');
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query, retryKey, limit, debounceMs]);

  return { results, isSearching, error, refetch };
}
