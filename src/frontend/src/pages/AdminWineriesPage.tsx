import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Eye,
  Check,
  X,
  Trash2,
  ExternalLink,
  Globe,
  MapPin,
  Building2,
  User,
} from 'lucide-react';
import { getWineries } from '../features/winery/api/wineryApi';
import type { WineryResponseDto, WineryStatus } from '../features/winery/types/winery';
import WineryLogo from '../features/winery/components/WineryLogo';
import {
  changeWineryStatus,
  deleteWinery,
} from '../features/admin/api/adminWineriesApi';
import {
  PageHeader,
  DataTable,
  PaginationControls,
  StatusBadge,
  ConfirmDialog,
  ErrorBanner,
  useAdminToast,
  usePagedList,
  getApiErrorMessage,
} from '../features/admin';
import type { Column } from '../features/admin';
import { cn } from '../lib/utils';

type StatusFilter = 'Pending' | 'Approved' | 'Rejected' | 'All';

const STATUS_CHIPS: { label: string; value: StatusFilter }[] = [
  { label: 'Pendientes', value: 'Pending' },
  { label: 'Aprobadas', value: 'Approved' },
  { label: 'Rechazadas', value: 'Rejected' },
  { label: 'Todas', value: 'All' },
];

export default function AdminWineriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useAdminToast();

  // Estado de filtros
  const rawStatus = searchParams.get('status');
  const currentStatus: StatusFilter =
    rawStatus === 'Approved' || rawStatus === 'Rejected' || rawStatus === 'All'
      ? rawStatus
      : 'Pending';

  const statusParam = currentStatus === 'All' ? undefined : currentStatus;

  // Estado de modales y operaciones en curso
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [detailWinery, setDetailWinery] = useState<WineryResponseDto | null>(null);

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
      return getWineries({
        pageNumber: page,
        pageSize,
        status: statusParam,
      });
    },
    [statusParam]
  );

  const {
    items: wineries,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<WineryResponseDto>(fetcher, [statusParam]);

  const handleChipClick = (status: StatusFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('status', status);
    setSearchParams(next);
  };

  // Acciones
  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await changeWineryStatus(id, 'Approved');
      toast.success('Bodega aprobada exitosamente.');
      await reload();
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
          await reload();
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
          await reload();
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
              <button
                type="button"
                title="Ver detalle"
                aria-label="Ver detalle"
                disabled={isProcessing}
                onClick={() => setDetailWinery(row)}
                className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>

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

      {/* Chips de filtro por estado */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => handleChipClick(chip.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
              currentStatus === chip.value
                ? 'bg-[#6b1d28] border-rose-700/60 text-white shadow-sm'
                : 'bg-[#141416] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Mensaje de error general si falla la lista */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de bodegas */}
      <DataTable
        columns={columns}
        rows={wineries}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay bodegas con este estado."
      />

      {/* Paginación */}
      {!isLoading && wineries.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          itemsOnPage={wineries.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Modal de Detalle */}
      {detailWinery && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="winery-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl text-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <WineryLogo
                  src={detailWinery.logoUrl}
                  logoImageId={detailWinery.logoImageId}
                  name={detailWinery.name}
                  size="md"
                  className="w-12 h-12 rounded-xl"
                />
                <div>
                  <h2
                    id="winery-detail-title"
                    className="font-serif text-lg font-bold text-zinc-100"
                  >
                    {detailWinery.name}
                  </h2>
                  <div className="mt-1">
                    <StatusBadge status={detailWinery.status} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailWinery(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar modal de detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1">
                  Descripción
                </span>
                <p className="text-neutral-300 font-sans leading-relaxed bg-[#0c0c0e] p-3 rounded-xl border border-white/5">
                  {detailWinery.description || 'Sin descripción registrada.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                  <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Sitio Web
                  </span>
                  {detailWinery.website ? (
                    <a
                      href={
                        detailWinery.website.startsWith('http')
                          ? detailWinery.website
                          : `https://${detailWinery.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-300 hover:text-rose-200 underline font-mono flex items-center gap-1"
                    >
                      <span>{detailWinery.website}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-neutral-400">Sin sitio web</span>
                  )}
                </div>

                <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                  <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Coordenadas
                  </span>
                  <span className="font-mono text-neutral-300">
                    {detailWinery.latitude != null && detailWinery.longitude != null
                      ? `${detailWinery.latitude.toFixed(4)}, ${detailWinery.longitude.toFixed(4)}`
                      : 'Sin coordenadas'}
                  </span>
                </div>

                <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                  <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Usuario Dueño
                  </span>
                  <span className="text-neutral-300">
                    {detailWinery.userId
                      ? `Usuario #${detailWinery.userId}`
                      : 'Sin dueño asignado'}
                  </span>
                </div>

                <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                  <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Ubicación Oficial
                  </span>
                  <span className="text-neutral-300">
                    {detailWinery.location
                      ? `${detailWinery.location.regionName}, ${detailWinery.location.stateName}`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
              <Link
                to={`/bodegas/${detailWinery.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-colors"
              >
                <span>Ver perfil público</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => setDetailWinery(null)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
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
