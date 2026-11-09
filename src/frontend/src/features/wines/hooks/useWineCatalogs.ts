import { useState, useEffect, useCallback, useRef } from 'react';
import { getGrapes } from '../../winery/api/grapeApi';
import { getPairingsCatalog } from '../../winery/api/wineryWinePairingsApi';
import type { GrapeResponseDto } from '../../winery/types';
import type { WineryWinePairingDto } from '../../winery/types/catalog';

export interface UseWineCatalogsOptions {
  enabled?: boolean;
}

export interface UseWineCatalogsReturn {
  grapesCatalog: GrapeResponseDto[];
  pairingsCatalog: WineryWinePairingDto[];
  isLoading: boolean;
  error: string | null;
  retry: () => Promise<void>;
}

export async function fetchAllGrapes(): Promise<GrapeResponseDto[]> {
  const all: GrapeResponseDto[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await getGrapes({ pageNumber: page, pageSize });
    if (!res || !Array.isArray(res)) break;
    all.push(...res);
    if (res.length < pageSize) break;
    page++;
  }
  return all;
}

export async function fetchAllPairings(): Promise<WineryWinePairingDto[]> {
  const all: WineryWinePairingDto[] = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const res = await getPairingsCatalog({ pageNumber: page, pageSize });
    if (!res || !Array.isArray(res)) break;
    all.push(...res);
    if (res.length < pageSize) break;
    page++;
  }
  return all;
}

export function useWineCatalogs(options?: UseWineCatalogsOptions): UseWineCatalogsReturn {
  const enabled = options?.enabled ?? true;
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);
  const [pairingsCatalog, setPairingsCatalog] = useState<WineryWinePairingDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const loadCatalogs = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [grapes, pairings] = await Promise.all([
        fetchAllGrapes(),
        fetchAllPairings(),
      ]);
      if (!isMountedRef.current) return;
      setGrapesCatalog(grapes);
      setPairingsCatalog(pairings);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const maybeError = err as { message?: string };
      setError(maybeError?.message || 'Error al cargar los catálogos de uvas y maridajes.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    if (enabled) {
      void loadCatalogs();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, loadCatalogs]);

  return {
    grapesCatalog,
    pairingsCatalog,
    isLoading,
    error,
    retry: loadCatalogs,
  };
}
