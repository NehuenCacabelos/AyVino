import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Wine,
  UserX,
  Users,
  Award,
  Star,
  Grape,
  UtensilsCrossed,
  ArrowRight,
  Clock,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  History,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import { getAdminStats } from '../features/admin/api/adminStatsApi';
import type { AdminStatsDto } from '../features/admin/types/adminStats';
import { getAuditLogs } from '../features/admin/api/adminAuditApi';
import type { AuditLogEntryDto } from '../features/admin/types/adminAudit';
import { getAuditActionLabel } from '../features/admin/utils/auditLabels';
import { PageHeader, getApiErrorMessage } from '../features/admin';
import { cn } from '../lib/utils';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  // Estado independiente de Estadísticas
  const [statsState, setStatsState] = useState<{
    data: AdminStatsDto | null;
    isLoading: boolean;
    error: string | null;
  }>({ data: null, isLoading: true, error: null });

  const [statsKey, setStatsKey] = useState(0);

  // Estado independiente de Actividad Reciente (Auditoría)
  const [auditState, setAuditState] = useState<{
    items: AuditLogEntryDto[];
    isLoading: boolean;
    error: string | null;
  }>({ items: [], isLoading: true, error: null });

  const [auditKey, setAuditKey] = useState(0);

  // Carga de estadísticas del sistema
  useEffect(() => {
    let isMounted = true;
    getAdminStats()
      .then((data) => {
        if (isMounted) setStatsState({ data, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setStatsState({ data: null, isLoading: false, error: getApiErrorMessage(err) });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [statsKey]);

  // Carga de últimas 5 entradas de auditoría
  useEffect(() => {
    let isMounted = true;
    getAuditLogs({ pageNumber: 1, pageSize: 5 })
      .then((items) => {
        if (isMounted) setAuditState({ items, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setAuditState({ items: [], isLoading: false, error: getApiErrorMessage(err) });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [auditKey]);

  const retryStats = useCallback(() => {
    setStatsState((prev) => ({ ...prev, isLoading: true, error: null }));
    setStatsKey((k) => k + 1);
  }, []);

  const retryAudit = useCallback(() => {
    setAuditState((prev) => ({ ...prev, isLoading: true, error: null }));
    setAuditKey((k) => k + 1);
  }, []);

  const stats = statsState.data;

  return (
    <div className="space-y-8">
      {/* Encabezado con saludo */}
      <PageHeader
        title="Panel de administración"
        description={`Hola, ${user?.username || 'Administrador'}. Revisá las solicitudes pendientes y gestioná el ecosistema vitivinícola.`}
      />

      {/* 4 Tarjetas KPI con conteo exacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Bodegas pendientes de moderación */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            statsState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : stats && stats.wineries.pending > 0
                ? 'border-amber-900/60 bg-[#171311] hover:border-amber-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {statsState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : statsState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{statsState.error}</p>
              <button
                type="button"
                onClick={retryStats}
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
                    (stats?.wineries.pending ?? 0) > 0
                      ? 'border-amber-900/50 bg-amber-950/40 text-amber-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {stats?.wineries.pending ?? 0}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {(stats?.wineries.pending ?? 0) === 0 ? (
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

        {/* KPI 2: Cosechas pendientes de moderación */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            statsState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : stats && stats.vintages.pending > 0
                ? 'border-amber-900/60 bg-[#171311] hover:border-amber-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {statsState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : statsState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{statsState.error}</p>
              <button
                type="button"
                onClick={retryStats}
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
                    (stats?.vintages.pending ?? 0) > 0
                      ? 'border-amber-900/50 bg-amber-950/40 text-amber-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <Wine className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {stats?.vintages.pending ?? 0}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {(stats?.vintages.pending ?? 0) === 0 ? (
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

        {/* KPI 3: Ciudades pendientes de moderación */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            statsState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : stats && stats.cities.pending > 0
                ? 'border-amber-900/60 bg-[#171311] hover:border-amber-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {statsState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : statsState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{statsState.error}</p>
              <button
                type="button"
                onClick={retryStats}
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
                    (stats?.cities.pending ?? 0) > 0
                      ? 'border-amber-900/50 bg-amber-950/40 text-amber-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {stats?.cities.pending ?? 0}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {(stats?.cities.pending ?? 0) === 0 ? (
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

        {/* KPI 4: Usuarios bloqueados (tono alerta si > 0) */}
        <div
          className={cn(
            'rounded-2xl border p-5 transition-all flex flex-col justify-between',
            statsState.error
              ? 'border-rose-900/60 bg-rose-950/20'
              : stats && stats.users.blocked > 0
                ? 'border-rose-900/60 bg-rose-950/20 hover:border-rose-700/60'
                : 'border-white/10 bg-[#121015] hover:border-white/20'
          )}
        >
          {statsState.isLoading ? (
            <div className="py-6 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : statsState.error ? (
            <div className="py-2 space-y-3">
              <p className="text-xs text-rose-300 font-sans">{statsState.error}</p>
              <button
                type="button"
                onClick={retryStats}
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
                  Usuarios bloqueados
                </span>
                <div
                  className={cn(
                    'p-2 rounded-xl border',
                    (stats?.users.blocked ?? 0) > 0
                      ? 'border-rose-800/60 bg-rose-950/50 text-rose-300'
                      : 'border-white/10 bg-white/5 text-neutral-400'
                  )}
                >
                  <UserX className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100">
                  {stats?.users.blocked ?? 0}
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  {(stats?.users.blocked ?? 0) > 0 ? (
                    <span className="text-rose-300 font-medium flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Cuentas suspendidas
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sin bloqueos activos
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Grilla de Métricas Completas del Ecosistema */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-100 tracking-tight">
          Métricas del ecosistema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total usuarios */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#121015] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Total Usuarios</p>
              <p className="text-xl font-bold text-zinc-100">{stats?.users.total ?? (statsState.isLoading ? '—' : 0)}</p>
            </div>
          </div>

          {/* Bodegas aprobadas */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#121015] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Bodegas Aprobadas</p>
              <p className="text-xl font-bold text-zinc-100">{stats?.wineries.approved ?? (statsState.isLoading ? '—' : 0)}</p>
            </div>
          </div>

          {/* Total vinos */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#121015] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300">
              <Wine className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Catálogo de Vinos</p>
              <p className="text-xl font-bold text-zinc-100">
                {stats?.wines.total ?? (statsState.isLoading ? '—' : 0)}{' '}
                <span className="text-xs font-normal text-neutral-400">
                  ({stats?.wines.official ?? 0} oficiales · {stats?.wines.community ?? 0} com.)
                </span>
              </p>
            </div>
          </div>

          {/* Total reseñas */}
          <div className="p-4 rounded-2xl border border-white/10 bg-[#121015] flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-neutral-300">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Total Reseñas</p>
              <p className="text-xl font-bold text-zinc-100">{stats?.reviews.total ?? (statsState.isLoading ? '—' : 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Widget: Actividad reciente (Últimas 5 de Auditoría) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-rose-400" />
            <h2 className="text-lg font-serif font-semibold text-zinc-100 tracking-tight">
              Actividad reciente
            </h2>
          </div>
          <Link
            to="/admin/auditoria"
            className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 transition-colors font-medium"
          >
            <span>Ver todo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121015] p-5 shadow-sm">
          {auditState.isLoading ? (
            <div className="py-8 flex items-center justify-center text-neutral-400">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          ) : auditState.error ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-rose-300 font-sans">{auditState.error}</p>
              <button
                type="button"
                onClick={retryAudit}
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-300 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
            </div>
          ) : auditState.items.length === 0 ? (
            <p className="text-xs text-neutral-500 text-center py-6 italic">
              No hay registros de actividad reciente en el log de auditoría.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {auditState.items.map((entry) => (
                <li key={entry.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-zinc-200">{entry.username}</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-300">{getAuditActionLabel(entry.action)}</span>
                    {entry.entityType && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-neutral-400 border border-white/10">
                        {entry.entityType} {entry.entityId ? `#${entry.entityId}` : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Sección: Accesos rápidos a catálogos y moderación */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-semibold text-zinc-100 tracking-tight">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/vinos"
            className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#121015] hover:bg-white/[0.03] hover:border-white/20 transition-all text-neutral-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-400 group-hover:scale-105 transition-transform">
                <Wine className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Catálogo de Vinos</p>
                <p className="text-xs text-neutral-400">Edición y fusión de etiquetas</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/resenas"
            className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#121015] hover:bg-white/[0.03] hover:border-white/20 transition-all text-neutral-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-400 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Reseñas</p>
                <p className="text-xs text-neutral-400">Moderación comunitaria</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </Link>

          <Link
            to="/admin/uvas"
            className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-[#121015] hover:bg-white/[0.03] hover:border-white/20 transition-all text-neutral-200 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/30 text-rose-400 group-hover:scale-105 transition-transform">
                <Grape className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">Variedades de Uva</p>
                <p className="text-xs text-neutral-400">Cepas, taninos y acidez</p>
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
                <p className="text-sm font-semibold text-zinc-100">Maridajes</p>
                <p className="text-xs text-neutral-400">Categorías gastronómicas</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
