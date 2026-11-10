import { useState, useEffect, useCallback, useMemo } from 'react';
import { isAxiosError } from 'axios';
import { getMyWinery } from '../api/wineryApi';
import type { WineryResponseDto, ProblemDetails } from '../types';
import { getProblemDetails } from '../types';

export interface UseMyWineryReturn {
  winery: WineryResponseDto | null;
  isLoading: boolean;
  error: ProblemDetails | string | null;
  isNotFound: boolean;
  isPending: boolean;
  isApproved: boolean;
  isRejected: boolean;
  reload: () => Promise<void>;
  updateLocalWinery: (updated: WineryResponseDto) => void;
}

/**
 * Hook para consultar y sincronizar la bodega del usuario autenticado.
 * Actúa como la fuente de verdad del panel de bodega.
 */
export function useMyWinery(): UseMyWineryReturn {
  const [winery, setWinery] = useState<WineryResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ProblemDetails | string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    getMyWinery()
      .then((data) => {
        if (!isMounted) return;
        setWinery(data);
        setError(null);
        setIsNotFound(false);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (isAxiosError(err)) {
          if (err.response?.status === 404) {
            setIsNotFound(true);
            setWinery(null);
            return;
          }
          const problem = getProblemDetails(err);
          setError(problem ?? err.message);
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('No se pudo obtener la información de la bodega.');
        }
        setWinery(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  }, []);

  const updateLocalWinery = useCallback((updated: WineryResponseDto) => {
    setWinery(updated);
  }, []);

  const isPending = winery?.status === 'Pending';
  const isApproved = winery?.status === 'Approved';
  const isRejected = winery?.status === 'Rejected';

  return useMemo(
    () => ({
      winery,
      isLoading,
      error,
      isNotFound,
      isPending,
      isApproved,
      isRejected,
      reload,
      updateLocalWinery,
    }),
    [
      winery,
      isLoading,
      error,
      isNotFound,
      isPending,
      isApproved,
      isRejected,
      reload,
      updateLocalWinery,
    ]
  );
}

