import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface AdminFilterValues {
  status?: string;
  search?: string;
  page: number;
  role?: string;
  origin?: string;
  type?: string;
}

export type AdminFilterKey = 'status' | 'search' | 'role' | 'origin' | 'type';

export interface UseAdminFiltersOptions {
  defaults?: Partial<Record<AdminFilterKey, string>>;
}

export interface UseAdminFiltersReturn {
  filters: AdminFilterValues;
  setFilter: (key: AdminFilterKey, value: string | undefined) => void;
  setFilters: (updates: Partial<Record<AdminFilterKey, string | undefined>>) => void;
  setPage: (newPage: number) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const FILTER_KEYS: readonly AdminFilterKey[] = ['status', 'search', 'role', 'origin', 'type'];

/**
 * Hook para sincronizar filtros de listados de administración con los query params de la URL:
 * `status`, `search`, `page`, `role`, `origin`, `type`.
 * - Al cambiar cualquier filtro, `page` vuelve a 1.
 * - Al quitar un filtro (`undefined` o `''`), elimina su parámetro de la URL.
 */
export function useAdminFilters(options?: UseAdminFiltersOptions): UseAdminFiltersReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultStatus = options?.defaults?.status;
  const defaultSearch = options?.defaults?.search;
  const defaultRole = options?.defaults?.role;
  const defaultOrigin = options?.defaults?.origin;
  const defaultType = options?.defaults?.type;

  const status = searchParams.get('status') || defaultStatus || undefined;
  const search = searchParams.get('search') || defaultSearch || undefined;
  const role = searchParams.get('role') || defaultRole || undefined;
  const origin = searchParams.get('origin') || defaultOrigin || undefined;
  const type = searchParams.get('type') || defaultType || undefined;

  const rawPage = searchParams.get('page');
  const parsedPage = rawPage ? Number(rawPage) : 1;
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const filters = useMemo<AdminFilterValues>(
    () => ({
      status,
      search,
      page,
      role,
      origin,
      type,
    }),
    [status, search, page, role, origin, type]
  );

  const setFilter = useCallback(
    (key: AdminFilterKey, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const trimmed = value === undefined ? '' : key === 'search' ? value : value.trim();
          if (trimmed.trim() !== '') {
            next.set(key, trimmed);
          } else {
            next.delete(key);
          }
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setFilters = useCallback(
    (updates: Partial<Record<AdminFilterKey, string | undefined>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const key of FILTER_KEYS) {
            if (!(key in updates)) continue;
            const val = updates[key];
            if (val !== undefined && val.trim() !== '') {
              next.set(key, key === 'search' ? val : val.trim());
            } else {
              next.delete(key);
            }
          }
          next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const safePage = Number.isFinite(newPage) ? Math.floor(newPage) : 1;
          if (safePage <= 1) {
            next.delete('page');
          } else {
            next.set('page', String(safePage));
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of FILTER_KEYS) {
          next.delete(key);
        }
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const hasActiveFilters = Boolean(status || search || role || origin || type);

  return {
    filters,
    setFilter,
    setFilters,
    setPage,
    clearFilters,
    hasActiveFilters,
  };
}
