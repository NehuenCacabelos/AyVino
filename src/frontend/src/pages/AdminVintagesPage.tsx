import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  Check,
  X,
  Trash2,
  Wine,
  User,
  Calendar,
  Thermometer,
  Clock,
  Percent,
  Layers,
} from 'lucide-react';
import type { ApprovalStatus, WineVintageResponseDto } from '../features/winery/types/wine';
import {
  getAdminVintages,
  changeVintageStatus,
  deleteVintage,
  getVintageDetail,
} from '../features/admin/api/adminVintagesApi';
import type { AdminWineVintageListItem } from '../features/admin/types/adminVintages';
import { getGrapes } from '../features/winery/api/grapeApi';
import { getWineTypeLabel } from '../features/admin/utils/wineTypeLabels';
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

export default function AdminVintagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useAdminToast();

  // Estado de filtros
  const rawStatus = searchParams.get('status');
  const currentStatus: StatusFilter =
    rawStatus === 'Approved' || rawStatus === 'Rejected' || rawStatus === 'All'
      ? rawStatus
      : 'Pending';

  const statusParam = currentStatus === 'All' ? undefined : (currentStatus as ApprovalStatus);

  // Estados de operaciones y modales
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Estado del modal de detalle
  const [detailItem, setDetailItem] = useState<AdminWineVintageListItem | null>(null);
  const [detailData, setDetailData] = useState<WineVintageResponseDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Diccionario en memoria de uvas para resolver ids
  const [grapesMap, setGrapesMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let isMounted = true;
    getGrapes({ pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (!isMounted) return;
        const map: Record<number, string> = {};
        data.forEach((g) => {
          map[g.id] = g.name;
        });
        setGrapesMap(map);
      })
      .catch(() => {
        // En caso de fallo, se mantendrá vacío y se mostrará "Uva #id"
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        status: statusParam,
      });
    },
    [statusParam]
  );

  const {
    items: vintages,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<AdminWineVintageListItem>(fetcher, [statusParam]);

  const handleChipClick = (status: StatusFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('status', status);
    setSearchParams(next);
  };

  // Acciones sobre la cosecha
  const handleApprove = async (item: AdminWineVintageListItem) => {
    setProcessingId(item.vintageId);
    try {
      await changeVintageStatus(item.wineId, item.vintageId, 'Approved');
      toast.success('Cosecha aprobada exitosamente.');
      await reload();
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

  const openDeleteDialog = (item: AdminWineVintageListItem) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar cosecha?',
      message: 'Esta acción es irreversible.',
      confirmLabel: 'Eliminar',
      tone: 'danger',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(item.vintageId);
        try {
          await deleteVintage(item.wineId, item.vintageId);
          toast.success('Cosecha eliminada del catálogo.');
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

  const loadDetail = useCallback(async (wineId: number, vintageId: number) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await getVintageDetail(wineId, vintageId);
      setDetailData(data);
    } catch (err: unknown) {
      setDetailError(getApiErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openDetailModal = (item: AdminWineVintageListItem) => {
    setDetailItem(item);
    setDetailData(null);
    void loadDetail(item.wineId, item.vintageId);
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
            {row.imageUrl ? (
              <img
                src={row.imageUrl}
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

              <button
                type="button"
                onClick={() => openDetailModal(row)}
                disabled={isBusy}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/5 disabled:opacity-40 transition-colors cursor-pointer"
                title="Ver detalle"
                aria-label="Ver detalle de la cosecha"
              >
                <Eye className="w-4 h-4" />
              </button>

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

      {/* Filtros por estado */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((chip) => {
          const isActive = currentStatus === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleChipClick(chip.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
                isActive
                  ? 'bg-[#6b1d28] text-white border-rose-700/60 shadow-sm shadow-rose-950/50'
                  : 'bg-[#121015] text-neutral-400 hover:text-neutral-200 border-white/10 hover:border-white/20'
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Banner de Error */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de Datos */}
      <DataTable
        columns={columns}
        rows={vintages}
        rowKey={(row) => row.vintageId}
        isLoading={isLoading}
        emptyMessage="No hay cosechas con este estado."
      />

      {/* Controles de Paginación */}
      <PaginationControls
        page={page}
        pageSize={pageSize}
        itemsOnPage={vintages.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modal de Detalle de Cosecha */}
      {detailItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-xl bg-[#121015] border border-white/10 rounded-2xl p-6 shadow-2xl text-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 block mb-1">
                  Ficha Técnica de Cosecha
                </span>
                <h2 id="detail-title" className="text-xl font-serif font-bold text-zinc-100">
                  {detailItem.wineName}{' '}
                  <span className="text-rose-400 font-mono text-base font-normal">
                    ({detailItem.year != null ? detailItem.year : 'S/A'})
                  </span>
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDetailItem(null);
                  setDetailData(null);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar modal de detalle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                <Wine className="w-8 h-8 animate-pulse text-rose-500" />
                <span className="text-xs font-mono">Cargando especificaciones...</span>
              </div>
            ) : detailError ? (
              <div className="py-6">
                <ErrorBanner
                  message={detailError}
                  onRetry={() => void loadDetail(detailItem.wineId, detailItem.vintageId)}
                />
              </div>
            ) : (
              <div className="mt-4 space-y-4 text-xs">
                {/* Imagen y ficha principal */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-[#0c0c0e] rounded-xl border border-white/5 items-center sm:items-start">
                  <div className="w-24 h-32 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                    {detailData?.imageUrl || detailItem.imageUrl ? (
                      <img
                        src={detailData?.imageUrl || detailItem.imageUrl || ''}
                        alt={detailItem.wineName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Wine className="w-8 h-8 text-neutral-600" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-neutral-300">
                        {getWineTypeLabel(String(detailItem.wineType))}
                      </span>
                      <StatusBadge
                        status={
                          detailItem.approvalStatus === 'Approved' ||
                          detailItem.approvalStatus === 'Rejected'
                            ? detailItem.approvalStatus
                            : 'Pending'
                        }
                      />
                    </div>

                    <div className="text-neutral-400 text-xs">
                      <span className="font-mono text-neutral-500 block uppercase tracking-wider text-[10px]">
                        Bodega
                      </span>
                      <span className="text-zinc-200 font-medium text-sm">
                        {detailItem.wineryName || 'Sin bodega asignada'}
                      </span>
                    </div>

                    <div className="text-neutral-400 text-xs">
                      <span className="font-mono text-neutral-500 block uppercase tracking-wider text-[10px]">
                        Subido por
                      </span>
                      <span className="text-neutral-300">
                        {detailItem.uploadedByUsername || `Usuario #${detailItem.uploadedByUserId}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas técnicas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                    <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-[10px]">
                      <Calendar className="w-3.5 h-3.5" />
                      Año de Añada
                    </span>
                    <span className="font-mono text-zinc-100 font-bold text-sm">
                      {detailData?.year ?? detailItem.year ?? 'S/A'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                    <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-[10px]">
                      <Percent className="w-3.5 h-3.5" />
                      Graduación
                    </span>
                    <span className="font-mono text-zinc-100 font-bold text-sm">
                      {detailData?.alcoholContent != null || detailItem.alcoholContent != null
                        ? `${Number(
                            detailData?.alcoholContent ?? detailItem.alcoholContent
                          ).toLocaleString('es-AR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          })} %`
                        : '—'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-[10px]">
                      <Thermometer className="w-3.5 h-3.5" />
                      T° Servicio
                    </span>
                    <span className="font-mono text-zinc-100 font-bold text-sm">
                      {detailData?.servingTemperature != null
                        ? `${detailData.servingTemperature} °C`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Consejo de Guarda */}
                {detailData?.agingAdvice && (
                  <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                    <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-1 flex items-center gap-1.5 text-[10px]">
                      <Clock className="w-3.5 h-3.5" />
                      Consejo de Guarda
                    </span>
                    <p className="text-neutral-300 font-sans leading-relaxed">
                      {detailData.agingAdvice}
                    </p>
                  </div>
                )}

                {/* Corte de Uvas (Blends) */}
                <div className="p-3 bg-[#0c0c0e] rounded-xl border border-white/5">
                  <span className="text-neutral-500 font-mono uppercase tracking-wider block mb-2 flex items-center gap-1.5 text-[10px]">
                    <Layers className="w-3.5 h-3.5" />
                    Corte de Varietales (Blend)
                  </span>
                  {detailData?.grapes && detailData.grapes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {detailData.grapes.map((grape) => {
                        const grapeName = grapesMap[grape.grapeId] || `Uva #${grape.grapeId}`;
                        return (
                          <span
                            key={grape.grapeId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-white/10 text-xs text-neutral-200"
                          >
                            <span className="font-medium">{grapeName}</span>
                            {grape.percentage != null && (
                              <span className="text-rose-400 font-mono text-[11px]">
                                {grape.percentage} %
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-neutral-500 font-sans italic">
                      No se registraron porcentajes de uvas para esta cosecha.
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setDetailItem(null);
                  setDetailData(null);
                }}
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
