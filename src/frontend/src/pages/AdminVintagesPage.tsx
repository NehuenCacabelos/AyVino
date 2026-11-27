import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  Check,
  X,
  Trash2,
  Wine,
  User,
} from 'lucide-react';
import type { ApprovalStatus } from '../features/winery/types/wine';
import {
  getAdminVintages,
  changeVintageStatus,
  deleteVintage,
} from '../features/admin/api/adminVintagesApi';
import type { AdminWineVintageListItem } from '../features/admin/types/adminVintages';
import { getWineTypeLabel } from '../features/admin/utils/wineTypeLabels';
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
import { imageUrl } from '../lib/image';

type StatusFilter = 'All' | 'Pending' | 'Approved' | 'Rejected';

export default function AdminVintagesPage() {
  const toast = useAdminToast();
  const { stats, refresh: refreshStats } = useAdminStats();
  const { filters, setFilter, setPage: setUrlPage, clearFilters } = useAdminFilters();

  const statusChips = useMemo<FilterChipOption[]>(
    () => [
      { label: 'Todas', value: 'All' },
      {
        label: stats ? `Pendientes (${stats.vintages.pending})` : 'Pendientes',
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

  const statusParam = currentStatus === 'All' ? undefined : (currentStatus as ApprovalStatus);
  const searchParam = filters.search?.trim() || undefined;

  // Estados de operaciones
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
      return getAdminVintages({
        pageNumber: page,
        pageSize,
        ...(statusParam ? { status: statusParam } : {}),
        ...(searchParam ? { search: searchParam } : {}),
      });
    },
    [statusParam, searchParam]
  );

  const {
    items: vintages,
    totalCount,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<AdminWineVintageListItem>(fetcher, [statusParam, searchParam], {
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

  // Acciones sobre la cosecha
  const handleApprove = async (item: AdminWineVintageListItem) => {
    setProcessingId(item.vintageId);
    try {
      await changeVintageStatus(item.wineId, item.vintageId, 'Approved');
      toast.success('Cosecha aprobada exitosamente.');
      await Promise.all([reload(), refreshStats()]);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (item: AdminWineVintageListItem) => {
    setConfirmDialog({
      open: true,
      title: '¿Rechazar cosecha?',
      message: `¿Estás seguro de que deseás rechazar la cosecha "${item.year ?? 'S/A'}" de ${item.wineName}?`,
      confirmLabel: 'Rechazar',
      tone: 'default',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(item.vintageId);
        try {
          await changeVintageStatus(item.wineId, item.vintageId, 'Rejected');
          toast.success('Cosecha rechazada.');
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

  const openDeleteDialog = (item: AdminWineVintageListItem) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar cosecha?',
      message: 'Esta acción es irreversible. Si tiene reseñas, marcas o cava no se podrá eliminar: usá Fusionar (vinos) o Rechazar (cosechas).',
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(item.vintageId);
        try {
          await deleteVintage(item.wineId, item.vintageId);
          toast.success('Cosecha eliminada del catálogo.');
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
  const columns: Column<AdminWineVintageListItem>[] = useMemo(
    () => [
      {
        key: 'image',
        header: 'Imagen',
        className: 'w-16 text-center',
        render: (row) => (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center mx-auto">
            {row.imageId || row.imageUrl ? (
              <img
                src={row.imageId ? imageUrl(row.imageId, 'bottle')! : row.imageUrl!}
                alt={row.wineName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Wine className="w-5 h-5 text-neutral-600" />
            )}
          </div>
        ),
      },
      {
        key: 'wine',
        header: 'Vino',
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-zinc-100">{row.wineName}</span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {getWineTypeLabel(String(row.wineType))}
            </span>
          </div>
        ),
      },
      {
        key: 'winery',
        header: 'Bodega',
        render: (row) => (
          <span className="text-neutral-300 text-xs">{row.wineryName || '—'}</span>
        ),
      },
      {
        key: 'year',
        header: 'Cosecha',
        className: 'text-center font-mono',
        render: (row) => (
          <span className="text-zinc-200 text-xs">
            {row.year != null ? row.year : 'S/A'}
          </span>
        ),
      },
      {
        key: 'alcohol',
        header: 'Alcohol',
        className: 'text-right font-mono',
        render: (row) => (
          <span className="text-neutral-300 text-xs">
            {row.alcoholContent != null
              ? `${Number(row.alcoholContent).toLocaleString('es-AR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })} %`
              : '—'}
          </span>
        ),
      },
      {
        key: 'uploader',
        header: 'Subida por',
        render: (row) => (
          <span className="text-neutral-300 text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-neutral-500" />
            {row.uploadedByUsername || `Usuario #${row.uploadedByUserId}`}
          </span>
        ),
      },
      {
        key: 'date',
        header: 'Registro',
        className: 'font-mono text-xs text-neutral-400',
        render: (row) => {
          try {
            return new Date(row.registerDate).toLocaleDateString('es-AR');
          } catch {
            return row.registerDate;
          }
        },
      },
      {
        key: 'status',
        header: 'Estado',
        className: 'text-center',
        render: (row) => (
          <StatusBadge
            status={
              row.approvalStatus === 'Approved' || row.approvalStatus === 'Rejected'
                ? row.approvalStatus
                : 'Pending'
            }
          />
        ),
      },
      {
        key: 'actions',
        header: 'Acciones',
        className: 'text-right',
        render: (row) => {
          const isBusy = processingId === row.vintageId;
          const status = row.approvalStatus;

          return (
            <div className="flex items-center justify-end gap-1">
              {(status === 'Pending' || status === 'Rejected') && (
                <button
                  type="button"
                  onClick={() => void handleApprove(row)}
                  disabled={isBusy}
                  className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Aprobar cosecha"
                  aria-label="Aprobar cosecha"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {(status === 'Pending' || status === 'Approved') && (
                <button
                  type="button"
                  onClick={() => openRejectDialog(row)}
                  disabled={isBusy}
                  className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Rechazar cosecha"
                  aria-label="Rechazar cosecha"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <Link
                to={
                  row.year != null
                    ? `/vinos/${row.wineId}?cosecha=${row.year}`
                    : `/vinos/${row.wineId}`
                }
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors inline-flex items-center justify-center"
                title="Ver detalle"
                aria-label="Ver detalle"
              >
                <Eye className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => openDeleteDialog(row)}
                disabled={isBusy}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 disabled:opacity-40 transition-colors cursor-pointer"
                title="Eliminar cosecha"
                aria-label="Eliminar cosecha"
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
        title="Cosechas"
        description="Revisá y aprobá las cosechas cargadas por usuarios y bodegas"
      />

      {/* Filtros por estado y búsqueda */}
      <AdminFilterBar
        chips={statusChips}
        activeChip={currentStatus}
        onChipChange={handleChipClick}
        searchValue={filters.search ?? ''}
        onSearchChange={handleSearchChange}
        searchLabel="Buscar cosecha"
        searchPlaceholder="Buscar por vino o bodega..."
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Banner de Error */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de Datos */}
      <DataTable
        columns={columns}
        rows={vintages}
        rowKey={(row) => row.vintageId}
        isLoading={isLoading}
        emptyMessage="No hay cosechas con este estado."
        rowClassName={(row) =>
          row.approvalStatus === 'Pending' ? 'border-l-2 border-l-amber-400/80 bg-amber-950/10' : undefined
        }
      />

      {/* Controles de Paginación */}
      <PaginationControls
        page={page}
        pageSize={pageSize}
        itemsOnPage={vintages.length}
        totalCount={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

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
