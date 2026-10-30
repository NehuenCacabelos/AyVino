/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { getMyCatalog } from '../api/wineryCatalogApi';
import type { WineryCatalogResponseDto } from '../types/catalog';
import { useWinery } from './WineryContext';

export interface WineryCatalogContextValue {
  catalog: WineryCatalogResponseDto | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const WineryCatalogContext = createContext<WineryCatalogContextValue | undefined>(undefined);

export interface WineryCatalogProviderProps {
  children: ReactNode;
}

export function WineryCatalogProvider({ children }: WineryCatalogProviderProps) {
  const { winery } = useWinery();
  const [catalog, setCatalog] = useState<WineryCatalogResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(winery?.id));
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    if (!winery?.id) {
      return;
    }

    getMyCatalog()
      .then((data) => {
        if (!isCancelled) {
          setCatalog(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar el catálogo de la bodega.');
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
  }, [winery?.id, reloadKey]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      catalog,
      isLoading,
      error,
      reload,
    }),
    [catalog, isLoading, error, reload]
  );

  return (
    <WineryCatalogContext.Provider value={value}>
      {children}
    </WineryCatalogContext.Provider>
  );
}

const defaultCatalogContextValue: WineryCatalogContextValue = {
  catalog: null,
  isLoading: false,
  error: null,
  reload: async () => {},
};

export function useWineryCatalog(): WineryCatalogContextValue {
  const context = useContext(WineryCatalogContext);
  return context ?? defaultCatalogContextValue;
}
