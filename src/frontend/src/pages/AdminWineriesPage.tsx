import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Check, X, Trash2 } from 'lucide-react';
import type { WineryResponseDto, WineryStatus } from '../features/winery/types/winery';
import WineryLogo from '../features/winery/components/WineryLogo';
import {
  getAdminWineries,
  changeWineryStatus,
  deleteWinery,
} from '../features/admin/api/adminWineriesApi';
import {
  PageHeader,
  AdminFilterBar,
  DataTable,
  PaginationControls,
  StatusBadge,
  ConfirmDialog,
  ErrorBanner,
  useAdminToast,
  useAdminStats,
  useAdminFilters,
  usePagedList,
  getApiErrorMessage,
} from '../features/admin';
import type { Column, FilterChipOption } from '../features/admin';

type StatusFilter = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function AdminWineriesPage() {
  const toast = useAdminToast();
  const { stats, refresh: refreshStats } = useAdminStats();
  const { filters, setFilter, setPage: setUrlPage, clearFilters } = useAdminFilters();

  const statusChips = useMemo<FilterChipOption[]>(
    () => [
      { label: 'Todas', value: 'All' },
      {
        label: stats ? `Pendientes (${stats.wineries.pending})` : 'Pendientes',
        value: 'Pending',
      },
      { label: 'Aprobadas', value: 'Approved' },
      { label: 'Rechazadas', value: 'Rejected' },
    ],
    [stats]
  );

  const currentStatus: StatusFilter =
    filters.status === 'Pending' || filters.status === 'Approved' || filters.status === 'Rejected'
      ? filters.status
      : 'All';

  const statusParam = currentStatus === 'All' ? undefined : currentStatus;
  const searchParam = filters.search?.trim() || undefined;

  // Estado de modales y operaciones en curso
  const [processingId, setProcessingId] = useState<number | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'default' | 'danger';
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    tone: 'default',
    onConfirm: async () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Hook paginado
  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getAdminWineries({
        pageNumber: page,
        pageSize,
        ...(statusParam ? { status: statusParam } : {}),
        ...(searchParam ? { search: searchParam } : {}),
      });
    },
    [statusParam, searchParam]
  );

  const {
    items: wineries,
    totalCount,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<WineryResponseDto>(fetcher, [statusParam, searchParam], {
    page: filters.page,
    onPageChange: setUrlPage,
  });

  const handleChipClick = useCallback(
    (status: string) => {
      setFilter('status', status === 'All' ? undefined : status);
    },
    [setFilter]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setFilter('search', value.trim() ? value : undefined);
    },
    [setFilter]
  );

  const hasActiveFilters = Boolean(statusParam || searchParam);

  // Acciones
  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await changeWineryStatus(id, 'Approved');
      toast.success('Bodega aprobada exitosamente.');
      await Promise.all([reload(), refreshStats()]);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (winery: WineryResponseDto) => {
    const isApproved = winery.status === 'Approved';
    setConfirmDialog({
      open: true,
      title: isApproved ? '¿Suspender bodega?' : '¿Rechazar bodega?',
      message: isApproved
        ? 'La bodega dejará de ser visible para el público y su dueño no podrá publicar vinos. Podés volver a aprobarla cuando quieras.'
        : `¿Estás seguro de que deseás rechazar la bodega "${winery.name}"?`,
      confirmLabel: isApproved ? 'Suspender' : 'Rechazar',
      tone: 'default',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(winery.id);
        try {
          await changeWineryStatus(winery.id, 'Rejected');
          toast.success(isApproved ? 'Bodega suspendida.' : 'Bodega rechazada.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await Promise.all([reload(), refreshStats()]);
        } catch (err: unknown) {
          toast.error(getApiErrorMessage(err));
        } finally {
          setIsConfirmLoading(false);
          setProcessingId(null);
        }
      },
    });
  };

  const openDeleteDialog = (winery: WineryResponseDto) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar bodega?',
      message: 'Esta acción es irreversible.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(winery.id);
        try {
          await deleteWinery(winery.id);
          toast.success('Bodega eliminada del sistema.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await Promise.all([reload(), refreshStats()]);
        } catch (err: unknown) {
          toast.error(getApiErrorMessage(err));
        } finally {
          setIsConfirmLoading(false);
          setProcessingId(null);
        }
      },
    });
  };

  // Definición de columnas
  const columns: Column<WineryResponseDto>[] = useMemo(
    () => [
      {
        key: 'logo',
        header: 'Logo',
        className: 'w-14 text-center',
        render: (row) => (
          <WineryLogo
            src={row.logoUrl}
            logoImageId={row.logoImageId}
            name={row.name}
            size="sm"
            className="w-9 h-9 rounded-full mx-auto"
          />
        ),
      },
      {
        key: 'name',
        header: 'Nombre',
        render: (row) => (
          <div className="font-medium text-zinc-100 flex flex-col">
            <span>{row.name}</span>
            {row.website && (
              <span className="text-[11px] text-neutral-400 font-mono truncate max-w-[200px]">
                {row.website.replace(/^https?:\/\//, '')}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'location',
        header: 'Ubicación',
        render: (row) => (
          <span className="text-xs text-neutral-300">
            {row.location
              ? `${row.location.regionName}, ${row.location.stateName}`
              : '—'}
          </span>
        ),
      },
      {
        key: 'foundationYear',
        header: 'Año fundación',
        className: 'text-center font-mono',
        render: (row) => <span>{row.foundationYear ?? '—'}</span>,
      },
      {
        key: 'registerDate',
        header: 'Registro',
        className: 'font-mono text-xs',
        render: (row) => (
          <span>
            {row.registerDate
              ? new Date(row.registerDate).toLocaleDateString('es-AR')
              : '—'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        className: 'text-center',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'actions',
        header: 'Acciones',
        className: 'text-right',
        render: (row) => {
          const isProcessing = processingId === row.id;
          const status = row.status as WineryStatus;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Aprobar */}
              {(status === 'Pending' || status === 'Rejected') && (
                <button
                  type="button"
                  title="Aprobar bodega"
                  aria-label="Aprobar bodega"
                  disabled={isProcessing}
                  onClick={() => void handleApprove(row.id)}
                  className="p-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* Rechazar o Suspender */}
              {(status === 'Pending' || status === 'Approved') && (
                <button
                  type="button"
                  title={status === 'Approved' ? 'Suspender bodega' : 'Rechazar bodega'}
                  aria-label={status === 'Approved' ? 'Suspender bodega' : 'Rechazar bodega'}
                  disabled={isProcessing}
                  onClick={() => openRejectDialog(row)}
                  className="p-1.5 rounded-lg border border-amber-900/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Detalle */}
              <Link
                to={`/bodegas/${row.id}`}
                title="Ver detalle"
                aria-label="Ver detalle"
                className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors inline-flex items-center justify-center"
              >
                <Eye className="w-4 h-4" />
              </Link>

              {/* Eliminar */}
              <button
                type="button"
                title="Eliminar bodega"
                aria-label="Eliminar bodega"
                disabled={isProcessing}
                onClick={() => openDeleteDialog(row)}
                className="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processingId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bodegas"
        description="Revisá y aprobá las bodegas registradas"
      />

      {/* Barra de filtros */}
      <AdminFilterBar
        chips={statusChips}
        activeChip={currentStatus}
        onChipChange={handleChipClick}
        searchValue={filters.search ?? ''}
        onSearchChange={handleSearchChange}
        searchLabel="Buscar bodega"
        searchPlaceholder="Buscar por nombre de bodega..."
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Mensaje de error general si falla la lista */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de bodegas */}
      <DataTable
        columns={columns}
        rows={wineries}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay bodegas con este estado."
        rowClassName={(row) =>
          row.status === 'Pending' ? 'border-l-2 border-l-amber-400/80 bg-amber-950/10' : undefined
        }
      />

      {/* Paginación */}
      {!isLoading && wineries.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          itemsOnPage={wineries.length}
          totalCount={totalCount}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        tone={confirmDialog.tone}
        isLoading={isConfirmLoading}
        onConfirm={() => void confirmDialog.onConfirm()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
