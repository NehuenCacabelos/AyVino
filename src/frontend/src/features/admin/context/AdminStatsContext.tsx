import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { getAdminStats } from '../api/adminStatsApi';
import type { AdminStatsDto } from '../types/adminStats';

export interface AdminStatsContextValue {
  stats: AdminStatsDto | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const FALLBACK_STATS_CONTEXT: AdminStatsContextValue = {
  stats: null,
  isLoading: false,
  refresh: async () => {},
};

const AdminStatsContext = createContext<AdminStatsContextValue | null>(null);

/**
 * Proveedor de conteos y estadísticas del panel de administración.
 * Consulta `GET /api/admin/stats` una vez al montar y expone `refresh()`
 * para actualizar los indicadores tras acciones de moderación.
 */
export function AdminStatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<AdminStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    getAdminStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
        }
      })
      .catch(() => {
        // Silencioso: si falla el endpoint de métricas, el layout y listados siguen funcionando
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch {
      // Mantiene los últimos datos conocidos si falla el refresco
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AdminStatsContextValue>(
    () => ({
      stats,
      isLoading,
      refresh,
    }),
    [stats, isLoading, refresh]
  );

  return <AdminStatsContext.Provider value={value}>{children}</AdminStatsContext.Provider>;
}

/**
 * Hook para leer estadísticas de moderación y refrescarlas desde páginas hijas de AdminLayout.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAdminStats(): AdminStatsContextValue {
  const ctx = useContext(AdminStatsContext);
  return ctx ?? FALLBACK_STATS_CONTEXT;
}
