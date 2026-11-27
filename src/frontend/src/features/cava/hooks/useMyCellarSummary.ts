import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/apiClient';

export interface MyCellarSummaryItem {
  id: number;
  name: string;
  vintageCount: number;
  bottleCount: number;
  createdAt: string;
}

/**
 * useMyCellarSummary Hook
 * Obtiene el resumen real de las cavas del usuario (/api/cellars/me)
 * y calcula el total de botellas en inventario sin usar estados hardcodeados.
 */
export function useMyCellarSummary() {
  const [totalBottles, setTotalBottles] = useState<number>(0);
  const [cellars, setCellars] = useState<MyCellarSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .get<MyCellarSummaryItem[]>('/cellars/me')
      .then((response) => {
        if (!isMounted) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setCellars(data);
        const total = data.reduce((acc, c) => acc + (Number(c.bottleCount) || 0), 0);
        setTotalBottles(total);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Error al obtener resumen de la cava.';
        setError(msg);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  return {
    totalBottles,
    cellars,
    isLoading,
    error,
    refresh,
  };
}
