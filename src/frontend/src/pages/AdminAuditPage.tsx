import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { getAuditLogs } from '../features/admin/api/adminAuditApi';
import type { AuditLogEntryDto } from '../features/admin/types/adminAudit';
import {
  PageHeader,
  DataTable,
  PaginationControls,
  ErrorBanner,
  usePagedList,
} from '../features/admin';
import type { Column } from '../features/admin';
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  getAuditActionLabel,
  getAuditEntityLabel,
  getEntityLink,
} from '../features/admin/utils/auditLabels';

export default function AdminAuditPage() {
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getAuditLogs({
        pageNumber: page,
        pageSize,
        action: selectedAction || undefined,
        entityType: selectedEntity || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      });
    },
    [selectedAction, selectedEntity, fromDate, toDate]
  );

  const {
    items: logs,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<AuditLogEntryDto>(fetcher, [
    selectedAction,
    selectedEntity,
    fromDate,
    toDate,
  ]);

  const handleResetFilters = () => {
    setSelectedAction('');
    setSelectedEntity('');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = Boolean(
    selectedAction || selectedEntity || fromDate || toDate
  );

  const columns: Column<AuditLogEntryDto>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Fecha y hora',
        className: 'whitespace-nowrap',
        render: (row) => {
          const dateObj = new Date(row.createdAt);
          const formatted = isNaN(dateObj.getTime())
            ? row.createdAt
            : dateObj.toLocaleString('es-AR');
          return <span className="text-xs text-neutral-300 font-mono">{formatted}</span>;
        },
      },
      {
        key: 'username',
        header: 'Administrador',
        render: (row) => (
          <span className="font-medium text-zinc-100">
            {row.username ?? '—'}
          </span>
        ),
      },
      {
        key: 'action',
        header: 'Acción',
        render: (row) => (
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-rose-300 border border-zinc-700">
            {getAuditActionLabel(row.action)}
          </span>
        ),
      },
      {
        key: 'entity',
        header: 'Entidad',
        render: (row) => {
          const label = getAuditEntityLabel(row.entityType);
          const link = getEntityLink(row.entityType, row.entityId);
          return (
            <span className="text-neutral-300 text-xs">
              {label}{' '}
              {row.entityId != null && (
                link ? (
                  <Link
                    to={link}
                    className="font-mono text-rose-400 hover:text-rose-300 hover:underline"
                    title={`Ver en sección ${label}`}
                  >
                    #{row.entityId}
                  </Link>
                ) : (
                  <span className="font-mono text-neutral-400">#{row.entityId}</span>
                )
              )}
            </span>
          );
        },
      },
      {
        key: 'details',
        header: 'Detalle',
        render: (row) => {
          if (!row.details) {
            return <span className="text-neutral-500 text-xs">—</span>;
          }
          return (
            <span
              className="text-xs text-neutral-400 block max-w-xs sm:max-w-md truncate font-mono"
              title={row.details}
            >
              {row.details}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro de Auditoría"
        description="Historial inmutable de acciones realizadas por administradores en el sistema."
      />

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex flex-wrap items-end gap-3">
        {/* Acción */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <label
            htmlFor="audit-action-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Acción
          </label>
          <select
            id="audit-action-filter"
            aria-label="Filtrar por acción"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          >
            <option value="">Todas las acciones</option>
            {AUDIT_ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de entidad */}
        <div className="flex-1 min-w-[160px] space-y-1">
          <label
            htmlFor="audit-entity-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Tipo de entidad
          </label>
          <select
            id="audit-entity-filter"
            aria-label="Filtrar por tipo de entidad"
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          >
            <option value="">Todos los tipos</option>
            {AUDIT_ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha desde */}
        <div className="space-y-1 min-w-[140px]">
          <label
            htmlFor="audit-from-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Desde
          </label>
          <input
            id="audit-from-filter"
            aria-label="Fecha desde"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          />
        </div>

        {/* Fecha hasta */}
        <div className="space-y-1 min-w-[140px]">
          <label
            htmlFor="audit-to-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Hasta
          </label>
          <input
            id="audit-to-filter"
            aria-label="Fecha hasta"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          />
        </div>

        {/* Botón limpiar */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-9 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-neutral-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar filtros</span>
          </button>
        )}
      </div>

      {/* Error con reintento */}
      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* Tabla */}
      <DataTable
        columns={columns}
        rows={logs}
        rowKey={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No hay registros para estos filtros."
      />

      {/* Paginación */}
      <PaginationControls
        page={page}
        pageSize={pageSize}
        itemsOnPage={logs.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
