import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Wine,
  Users,
  Grape,
  UtensilsCrossed,
  ArrowRight,
  Clock,
  RotateCcw,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import { getWineries } from '../features/winery/api/wineryApi';
import type { WineryResponseDto } from '../features/winery/types/winery';
import { getCities } from '../features/admin/api/adminCitiesApi';
import type { CityResponseDto } from '../features/winery/types/location';
import { getUsers } from '../features/admin/api/adminUsersApi';
import type { AdminUserListItemDto } from '../features/admin/types/adminUsers';
import { getAdminVintages } from '../features/admin/api/adminVintagesApi';
import type { AdminWineVintageListItem } from '../features/admin/types/adminVintages';
import { PageHeader, getApiErrorMessage } from '../features/admin';
import { cn } from '../lib/utils';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Estados independientes para cada tarjeta
  const [wineriesState, setWineriesState] = useState<{
    items: WineryResponseDto[];
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });

  const [citiesState, setCitiesState] = useState<{
    items: CityResponseDto[];
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });

  const [usersState, setUsersState] = useState<{
    items: AdminUserListItemDto[];
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });

  const [vintagesState, setVintagesState] = useState<{
    items: AdminWineVintageListItem[];
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });

  // Claves de recarga independientes para reintentos
  const [wineriesKey, setWineriesKey] = useState(0);
  const [citiesKey, setCitiesKey] = useState(0);
  const [usersKey, setUsersKey] = useState(0);
  const [vintagesKey, setVintagesKey] = useState(0);

  // Carga de bodegas
  useEffect(() => {
    let isMounted = true;
    getWineries({ status: 'Pending', pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (isMounted) setWineriesState({ items: data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (isMounted)
          setWineriesState({ items: [], isLoading: false, error: getApiErrorMessage(err) });
      });

    return () => {
      isMounted = false;
    };
  }, [wineriesKey]);

  // Carga de ciudades
  useEffect(() => {
    let isMounted = true;
    getCities({ status: 'Pending', pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (isMounted) setCitiesState({ items: data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (isMounted)
          setCitiesState({ items: [], isLoading: false, error: getApiErrorMessage(err) });
      });

    return () => {
      isMounted = false;
    };
  }, [citiesKey]);

  // Carga de usuarios
  useEffect(() => {
    let isMounted = true;
    getUsers({ pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (isMounted) setUsersState({ items: data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (isMounted)
          setUsersState({ items: [], isLoading: false, error: getApiErrorMessage(err) });
      });

    return () => {
      isMounted = false;
    };
  }, [usersKey]);

  // Carga de cosechas pendientes
  useEffect(() => {
    let isMounted = true;
    getAdminVintages({ status: 'Pending', pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (isMounted) setVintagesState({ items: data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (isMounted)
          setVintagesState({ items: [], isLoading: false, error: getApiErrorMessage(err) });
      });

    return () => {
      isMounted = false;
    };
  }, [vintagesKey]);

  const retryWineries = useCallback(() => {
    setWineriesState((prev) => ({ ...prev, isLoading: true, error: null }));
    setWineriesKey((k) => k + 1);
  }, []);

  const retryCities = useCallback(() => {
    setCitiesState((prev) => ({ ...prev, isLoading: true, error: null }));
    setCitiesKey((k) => k + 1);
  }, []);

  const retryUsers = useCallback(() => {
    setUsersState((prev) => ({ ...prev, isLoading: true, error: null }));
    setUsersKey((k) => k + 1);
  }, []);

  const retryVintages = useCallback(() => {
    setVintagesState((prev) => ({ ...prev, isLoading: true, error: null }));
    setVintagesKey((k) => k + 1);
  }, []);

  // Formateador de conteos (100 -> "100+")
  const formatCount = (count: number) => {
    return count >= 100 ? '100+' : String(count);
  };

  return (
    <div className="space-y-8">
      {/* Encabezado con saludo */}
      <PageHeader
        title="Panel de administración"
        description={`Hola, ${user?.username || 'Administrador'}. Revisá las solicitudes pendientes y gestioná el ecosistema vitivinícola.`}
      />

      {/* 4 Tarjetas de Resumen independientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Tarjeta 1: Bodegas pendientes */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            wineriesState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : !wineriesState.isLoading && wineriesState.items.length > 0
                ? 'border-amber-900/60 bg-[#171311] hover:border-amber-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {wineriesState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : wineriesState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{wineriesState.error}</p>
              <button
                type="button"
                onClick={retryWineries}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : (
            <Link to="/admin/bodegas?status=Pending" className="flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">
                  Bodegas pendientes
                </span>
                <div
                  className={cn(
                    'p-2 rounded-xl border',
                    wineriesState.items.length > 0
                      ? 'border-amber-900/50 bg-amber-950/40 text-amber-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {formatCount(wineriesState.items.length)}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {wineriesState.items.length === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Todo al día
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium">Requieren moderación</span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Tarjeta 2: Ciudades pendientes */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            citiesState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : !citiesState.isLoading && citiesState.items.length > 0
                ? 'border-amber-900/60 bg-[#171311] hover:border-amber-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {citiesState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : citiesState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{citiesState.error}</p>
              <button
                type="button"
                onClick={retryCities}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : (
            <Link to="/admin/ciudades?status=Pending" className="flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">
                  Ciudades pendientes
                </span>
                <div
                  className={cn(
                    'p-2 rounded-xl border',
                    citiesState.items.length > 0
                      ? 'border-amber-900/50 bg-amber-950/40 text-amber-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {formatCount(citiesState.items.length)}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {citiesState.items.length === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Todo al día
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium">Requieren moderación</span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Tarjeta 3: Usuarios registrados */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            usersState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {usersState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : usersState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{usersState.error}</p>
              <button
                type="button"
                onClick={retryUsers}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : (
            <Link to="/admin/usuarios" className="flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">
                  Usuarios registrados
                </span>
                <div className="p-2 rounded-xl border border-white/10 bg-white/5 text-neutral-300">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {formatCount(usersState.items.length)}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                  <span>Cuentas en plataforma</span>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Tarjeta 4: Cosechas pendientes */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            vintagesState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : !vintagesState.isLoading && vintagesState.items.length > 0
                ? 'border-amber-900/60 bg-[#171311] hover:border-amber-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {vintagesState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : vintagesState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{vintagesState.error}</p>
              <button
                type="button"
                onClick={retryVintages}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : (
            <Link to="/admin/cosechas?status=Pending" className="flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-medium">
                  Cosechas pendientes
                </span>
                <div
                  className={cn(
                    'p-2 rounded-xl border',
                    vintagesState.items.length > 0
                      ? 'border-amber-900/50 bg-amber-950/40 text-amber-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <Wine className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {formatCount(vintagesState.items.length)}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {vintagesState.items.length === 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Todo al día
                    </span>
                  ) : (
                    <span className="text-amber-300 font-medium">Requieren moderación</span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Bloque: Últimos pendientes */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-100 tracking-tight">
          Últimos pendientes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sub-bloque: Bodegas pendientes */}
          <div className="rounded-2xl border border-white/10 bg-[#121015] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-200">
                  Bodegas pendientes
                </h3>
              </div>
              <Link
                to="/admin/bodegas?status=Pending"
                className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 transition-colors font-medium"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {wineriesState.isLoading ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              </div>
            ) : wineriesState.items.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">
                No hay solicitudes pendientes.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {wineriesState.items.slice(0, 5).map((w) => (
                  <li key={w.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{w.name}</span>
                    <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      {w.registerDate ? new Date(w.registerDate).toLocaleDateString('es-AR') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Sub-bloque: Ciudades pendientes */}
          <div className="rounded-2xl border border-white/10 bg-[#121015] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-200">
                  Ciudades pendientes
                </h3>
              </div>
              <Link
                to="/admin/ciudades?status=Pending"
                className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 transition-colors font-medium"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {citiesState.isLoading ? (
              <div className="py-6 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
              </div>
            ) : citiesState.items.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">
                No hay solicitudes pendientes.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {citiesState.items.slice(0, 5).map((c) => (
                  <li key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-200">{c.name}</span>
                    <span className="text-[11px] font-mono text-amber-300/80 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                      Pendiente
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Sección: Accesos rápidos */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-100 tracking-tight">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/admin/uvas"
            className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#121015] hover:bg-white/[0.03] hover:border-white/20 transition-all text-neutral-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-400 group-hover:scale-105 transition-transform">
                <Grape className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Catálogo de Uvas</p>
                <p className="text-xs text-neutral-400">Varietales, perfiles de taninos y acidez</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/maridajes"
            className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#121015] hover:bg-white/[0.03] hover:border-white/20 transition-all text-neutral-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-400 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Catálogo de Maridajes</p>
                <p className="text-xs text-neutral-400">Categorías gastronómicas y combinaciones</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
