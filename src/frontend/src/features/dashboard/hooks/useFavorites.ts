import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/apiClient';
import type { DashboardWine } from '../../../types/wine';

export interface UseFavoritesOptions {
  enabled?: boolean;
  onError?: (message: string) => void;
}

export interface UseFavoritesReturn {
  favoriteWineIds: Set<number>;
  setFavoriteWineIds: React.Dispatch<React.SetStateAction<Set<number>>>;
  toggleFavorite: (wine: DashboardWine, nextIsFav: boolean) => Promise<void>;
  isFavorite: (wineId: number | string | undefined) => boolean;
  isLoading: boolean;
}

/**
 * Hook compartido para gestión de favoritos:
 * - Carga inicial en una única consulta optimizada (hasta 100 etiquetas).
 * - Actualización optimista inmediata en UI.
 * - Reversión automática en caso de error de red o backend.
 */
export function useFavorites(options?: UseFavoritesOptions): UseFavoritesReturn {
  const [favoriteWineIds, setFavoriteWineIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const enabled = options?.enabled ?? true;
  const onError = options?.onError;

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    async function loadFavorites() {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/user-wines/me?favorite=true&pageSize=100');
        if (isMounted && Array.isArray(res.data)) {
          const ids = new Set<number>(res.data.map((item: { wineId: number }) => item.wineId));
          setFavoriteWineIds(ids);
        }
      } catch {
        // Silencioso si no está autenticado o error transitorio
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  const toggleFavorite = useCallback(
    async (wine: DashboardWine, nextIsFav: boolean) => {
      const wineId = Number(wine.id);
      if (!wineId || isNaN(wineId)) return;

      // Actualización optimista inmediata
      setFavoriteWineIds((prev) => {
        const next = new Set(prev);
        if (nextIsFav) {
          next.add(wineId);
        } else {
          next.delete(wineId);
        }
        return next;
      });

      try {
        if (nextIsFav) {
          await apiClient.put(`/wines/${wineId}/favorite`);
        } else {
          await apiClient.delete(`/wines/${wineId}/favorite`);
        }
      } catch {
        // Revertir optimismo si falla
        setFavoriteWineIds((prev) => {
          const rollback = new Set(prev);
          if (nextIsFav) {
            rollback.delete(wineId);
          } else {
            rollback.add(wineId);
          }
          return rollback;
        });
        onError?.('No se pudo actualizar favoritos. Intentalo de nuevo.');
      }
    },
    [onError],
  );

  const isFavorite = useCallback(
    (wineId: number | string | undefined): boolean => {
      if (!wineId) return false;
      const num = Number(wineId);
      return !isNaN(num) && favoriteWineIds.has(num);
    },
    [favoriteWineIds],
  );

  return {
    favoriteWineIds,
    setFavoriteWineIds,
    toggleFavorite,
    isFavorite,
    isLoading,
  };
}
