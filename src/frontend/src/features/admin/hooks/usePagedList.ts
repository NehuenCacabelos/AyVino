import { useState, useEffect, useCallback } from 'react';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import type { PagedResponse } from '../types/pagedResult';

export interface UsePagedListReturn<T> {
  items: T[];
  totalCount: number | null;
  totalPages: number | null;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  setPage: (newPage: number) => void;
  setPageSize: (newPageSize: number) => void;
  reload: () => Promise<void>;
}

/**
 * Hook reutilizable para listas paginadas en el panel de administración.
 * - Acepta respuestas `{ items, totalCount }` y expone `totalCount` y `totalPages`.
 * - Resetea a página 1 ante cambios en dependencias externas.
 * - Descarta respuestas de peticiones asíncronas desactualizadas mediante señal de cancelación.
 * - Unifica la obtención de mensajes de error amigables.
 */
export function usePagedList<T>(
  fetcher: (page: number, pageSize: number) => Promise<PagedResponse<T>>,
  deps: unknown[] = []
): UsePagedListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const depsKey = JSON.stringify(deps);
  const [prevDepsKey, setPrevDepsKey] = useState<string>(depsKey);

  // Al cambiar las dependencias externas (filtros), vuelve a página 1
  if (prevDepsKey !== depsKey) {
    setPrevDepsKey(depsKey);
    setPage(1);
    setIsLoading(true);
  }

  useEffect(() => {
    let isCancelled = false;

    fetcher(page, pageSize)
      .then((data) => {
        if (!isCancelled) {
          setItems([...data.items]);
          setTotalCount(data.totalCount);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fetcher, page, pageSize, depsKey, reloadKey]);

  const handleSetPage = useCallback((newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
  }, []);

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setIsLoading(true);
    setPageSize(newPageSize);
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  const totalPages = totalCount !== null ? Math.max(1, Math.ceil(totalCount / pageSize)) : null;

  return {
    items,
    totalCount,
    totalPages,
    page,
    pageSize,
    isLoading,
    error,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    reload,
  };
}
