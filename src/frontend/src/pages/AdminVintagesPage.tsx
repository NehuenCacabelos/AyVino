import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  Upload,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { ApprovalStatus, WineVintageResponseDto } from '../features/winery/types/wine';
import {
  getAdminVintages,
  changeVintageStatus,
  deleteVintage,
  getVintageDetail,
  getVintageContributions,
  promoteVintageImage,
  updateVintage,
  uploadVintageImage,
  deleteVintageImage,
} from '../features/admin/api/adminVintagesApi';
import type {
  AdminWineVintageListItem,
  VintageContributionDto,
} from '../features/admin/types/adminVintages';
import { getGrapes } from '../features/winery/api/grapeApi';
import type { GrapeResponseDto } from '../features/winery/types';
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
import { imageUrl } from '../lib/image';

type StatusFilter = 'Pending' | 'Approved' | 'Rejected' | 'All';

const STATUS_CHIPS: { label: string; value: StatusFilter }[] = [
  { label: 'Pendientes', value: 'Pending' },
  { label: 'Aprobadas', value: 'Approved' },
  { label: 'Rechazadas', value: 'Rejected' },
  { label: 'Todas', value: 'All' },
];

interface GrapeEditItem {
  grapeId: number;
  percentage: string;
}

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

  const rawSort = searchParams.get('sort');
  const currentSort: 'users' | 'date' =
    rawSort === 'users' || rawSort === 'date'
      ? rawSort
      : currentStatus === 'Pending'
        ? 'users'
        : 'date';

  // Estados de operaciones
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Estado del modal de detalle
  const [detailItem, setDetailItem] = useState<AdminWineVintageListItem | null>(null);
  const [detailData, setDetailData] = useState<WineVintageResponseDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Aportes de la comunidad
  const [contributions, setContributions] = useState<VintageContributionDto[]>([]);
  const [contributionsLoading, setContributionsLoading] = useState(false);
  const [contributionsError, setContributionsError] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<number | null>(null);

  // Imagen pública
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Formulario de edición de cosecha
  const [editYear, setEditYear] = useState('');
  const [editAlcohol, setEditAlcohol] = useState('');
  const [editServingTemp, setEditServingTemp] = useState('');
  const [editAgingAdvice, setEditAgingAdvice] = useState('');
  const [editGrapes, setEditGrapes] = useState<GrapeEditItem[]>([]);
  const [isSavingVintage, setIsSavingVintage] = useState(false);
  const [vintageEditError, setVintageEditError] = useState<string | null>(null);

  // Uvas disponibles
  const [availableGrapes, setAvailableGrapes] = useState<GrapeResponseDto[]>([]);

  useEffect(() => {
    let isMounted = true;
    getGrapes({ pageNumber: 1, pageSize: 100 })
      .then((data) => {
        if (!isMounted) return;
        setAvailableGrapes(data);
      })
      .catch(() => {
        // Silencioso en fallo de precarga
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
        sort: currentSort,
      });
    },
    [statusParam, currentSort]
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
  } = usePagedList<AdminWineVintageListItem>(fetcher, [statusParam, currentSort]);

  const handleChipClick = (status: StatusFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('status', status);
    next.delete('sort'); // Restaura el orden por defecto para el nuevo estado
    setSearchParams(next);
  };

  const handleSortChange = (sort: 'users' | 'date') => {
    const next = new URLSearchParams(searchParams);
    next.set('sort', sort);
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

  // Carga de aportes comunitarios
  const loadContributions = useCallback(async (vintageId: number) => {
    setContributionsLoading(true);
    setContributionsError(null);
    try {
      const data = await getVintageContributions(vintageId);
      setContributions(data);
    } catch (err: unknown) {
      setContributionsError(getApiErrorMessage(err));
    } finally {
      setContributionsLoading(false);
    }
  }, []);

  // Carga de detalle de cosecha
  const loadDetail = useCallback(
    async (wineId: number, vintageId: number) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await getVintageDetail(wineId, vintageId);
        setDetailData(data);
        // Inicializar formulario de edición
        setEditYear(data.year != null ? String(data.year) : '');
        setEditAlcohol(data.alcoholContent != null ? String(data.alcoholContent) : '');
        setEditServingTemp(data.servingTemperature != null ? String(data.servingTemperature) : '');
        setEditAgingAdvice(data.agingAdvice ?? '');
        setEditGrapes(
          data.grapes?.map((g) => ({
            grapeId: g.grapeId,
            percentage: g.percentage != null ? String(g.percentage) : '',
          })) ?? []
        );
      } catch (err: unknown) {
        setDetailError(getApiErrorMessage(err));
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  const openDetailModal = (item: AdminWineVintageListItem) => {
    setDetailItem(item);
    setDetailData(null);
    setVintageEditError(null);
    void loadDetail(item.wineId, item.vintageId);
    void loadContributions(item.vintageId);
  };

  // Promover foto de la comunidad
  const handlePromoteImage = (contrib: VintageContributionDto) => {
    if (!detailItem) return;
    setConfirmDialog({
      open: true,
      title: '¿Usar como foto pública?',
      message: `¿Estás seguro de que deseás usar la foto personal de ${contrib.username} como imagen pública oficial de esta cosecha?`,
      confirmLabel: 'Usar como foto pública',
      tone: 'default',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setPromotingUserId(contrib.userId);
        try {
          const res = await promoteVintageImage(detailItem.vintageId, contrib.userId);
          const newImageId = res.imageId;
          setDetailItem((prev) => (prev ? { ...prev, imageId: newImageId } : null));
          setDetailData((prev) => (prev ? { ...prev, imageId: newImageId } : null));
          toast.success('Foto pública actualizada a partir del aporte del usuario.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await reload();
        } catch (err: unknown) {
          toast.error(getApiErrorMessage(err));
        } finally {
          setIsConfirmLoading(false);
          setPromotingUserId(null);
        }
      },
    });
  };

  // Cambiar imagen pública (archivo manual)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detailItem) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadVintageImage(detailItem.wineId, detailItem.vintageId, file);
      const newImageId = res.imageId;
      setDetailItem((prev) => (prev ? { ...prev, imageId: newImageId } : null));
      setDetailData((prev) => (prev ? { ...prev, imageId: newImageId } : null));
      toast.success('Imagen pública actualizada exitosamente.');
      await reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Quitar imagen pública
  const handleOpenDeleteImageDialog = () => {
    if (!detailItem) return;
    setConfirmDialog({
      open: true,
      title: '¿Quitar imagen pública?',
      message: '¿Estás seguro de que deseás quitar la imagen pública de esta cosecha? La imagen quedará sin foto oficial.',
      confirmLabel: 'Quitar imagen',
      tone: 'danger',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setIsDeletingImage(true);
        try {
          await deleteVintageImage(detailItem.wineId, detailItem.vintageId);
          setDetailItem((prev) => (prev ? { ...prev, imageId: null, imageUrl: null } : null));
          setDetailData((prev) => (prev ? { ...prev, imageId: null, imageUrl: null } : null));
          toast.success('Imagen pública eliminada.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await reload();
        } catch (err: unknown) {
          toast.error(getApiErrorMessage(err));
        } finally {
          setIsConfirmLoading(false);
          setIsDeletingImage(false);
        }
      },
    });
  };

  // Guardar datos editados de la cosecha
  const handleSaveVintageData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailItem) return;

    setVintageEditError(null);

    // Validaciones equivalentes al backend
    const parsedYear = editYear.trim() ? Number(editYear) : null;
    if (parsedYear != null && (isNaN(parsedYear) || parsedYear < 1800 || parsedYear > 2100)) {
      setVintageEditError('El año de la cosecha debe estar entre 1800 y 2100.');
      return;
    }

    const parsedAlcohol = editAlcohol.trim() ? Number(editAlcohol) : null;
    if (parsedAlcohol != null && (isNaN(parsedAlcohol) || parsedAlcohol < 0 || parsedAlcohol > 99.99)) {
      setVintageEditError('El contenido de alcohol debe estar entre 0 y 99.99 %.');
      return;
    }

    const parsedTemp = editServingTemp.trim() ? Number(editServingTemp) : null;
    if (parsedTemp != null && (isNaN(parsedTemp) || parsedTemp < 0 || parsedTemp > 30)) {
      setVintageEditError('La temperatura de servicio debe estar entre 0 y 30 °C.');
      return;
    }

    if (editAgingAdvice.length > 500) {
      setVintageEditError('El consejo de guarda no puede superar los 500 caracteres.');
      return;
    }

    if (editGrapes.length > 20) {
      setVintageEditError('Una cosecha no puede tener más de 20 uvas.');
      return;
    }

    const payloadGrapes = [];
    for (const g of editGrapes) {
      const parsedPct = g.percentage.trim() ? Number(g.percentage) : null;
      if (parsedPct != null && (isNaN(parsedPct) || parsedPct < 0.01 || parsedPct > 100)) {
        setVintageEditError('El porcentaje de uva debe estar entre 0.01 y 100.');
        return;
      }
      payloadGrapes.push({
        grapeId: g.grapeId,
        percentage: parsedPct,
      });
    }

    setIsSavingVintage(true);
    try {
      const updated = await updateVintage(detailItem.wineId, detailItem.vintageId, {
        year: parsedYear,
        alcoholContent: parsedAlcohol,
        servingTemperature: parsedTemp,
        agingAdvice: editAgingAdvice.trim() || null,
        grapes: payloadGrapes,
      });

      setDetailData(updated);
      setDetailItem((prev) =>
        prev
          ? {
              ...prev,
              year: updated.year,
              alcoholContent: updated.alcoholContent,
            }
          : null
      );
      toast.success('Datos de la cosecha actualizados exitosamente.');
      await reload();
    } catch (err: unknown) {
      setVintageEditError(getApiErrorMessage(err));
    } finally {
      setIsSavingVintage(false);
    }
  };

  const handleAddGrape = () => {
    if (availableGrapes.length === 0) return;
    const unusedGrape = availableGrapes.find((ag) => !editGrapes.some((eg) => eg.grapeId === ag.id));
    const grapeIdToAdd = unusedGrape ? unusedGrape.id : availableGrapes[0].id;
    setEditGrapes((prev) => [...prev, { grapeId: grapeIdToAdd, percentage: '' }]);
  };

  const handleRemoveGrape = (index: number) => {
    setEditGrapes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGrapeChange = (index: number, grapeId: number) => {
    setEditGrapes((prev) =>
      prev.map((g, i) => (i === index ? { ...g, grapeId } : g))
    );
  };

  const handlePercentageChange = (index: number, percentage: string) => {
    setEditGrapes((prev) =>
      prev.map((g, i) => (i === index ? { ...g, percentage } : g))
    );
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
        key: 'communityUsers',
        header: 'Usuarios',
        className: 'text-center font-mono',
        render: (row) => (
          <span
            className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-neutral-200"
            title="Usuarios que usan esta cosecha"
          >
            {row.communityUsers ?? 0}
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

  const currentPublicImageId = detailData?.imageId || detailItem?.imageId;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cosechas"
        description="Revisá y aprobá las cosechas cargadas por usuarios y bodegas"
      />

      {/* Controles de Filtros y Orden */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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

        {/* Selector de Orden: Más usadas / Más recientes */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 font-mono">Orden:</span>
          <div className="inline-flex rounded-xl bg-[#121015] border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => handleSortChange('users')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                currentSort === 'users'
                  ? 'bg-[#6b1d28] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              Más usadas
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('date')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                currentSort === 'date'
                  ? 'bg-[#6b1d28] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              Más recientes
            </button>
          </div>
        </div>
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
          <div className="relative w-full max-w-2xl bg-[#121015] border border-white/10 rounded-2xl p-6 shadow-2xl text-neutral-200 max-h-[90vh] overflow-y-auto space-y-6">
            {/* Header del Modal */}
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
              <div className="space-y-6 text-xs">
                {/* 1. SECCIÓN B: IMAGEN PÚBLICA */}
                <div className="p-4 bg-[#0c0c0e] rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-zinc-300 font-semibold flex items-center gap-1.5">
                      <Wine className="w-4 h-4 text-rose-400" />
                      Imagen Pública Oficial
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-28 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                      {currentPublicImageId || detailData?.imageUrl || detailItem.imageUrl ? (
                        <img
                          src={
                            currentPublicImageId
                              ? imageUrl(currentPublicImageId, 'bottle')!
                              : detailData?.imageUrl || detailItem.imageUrl!
                          }
                          alt={detailItem.wineName}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Wine className="w-8 h-8 text-neutral-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          disabled={isUploadingImage || isDeletingImage}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <Upload className="w-3.5 h-3.5 text-neutral-400" />
                          {isUploadingImage ? 'Subiendo...' : 'Cambiar imagen'}
                        </button>

                        {(currentPublicImageId || detailData?.imageUrl || detailItem.imageUrl) && (
                          <button
                            type="button"
                            disabled={isUploadingImage || isDeletingImage}
                            onClick={handleOpenDeleteImageDialog}
                            className="px-3 py-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isDeletingImage ? 'Eliminando...' : 'Quitar imagen'}
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-400 italic">
                        Las fotos personales de los usuarios no se modifican.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. SECCIÓN A: APORTES DE LA COMUNIDAD */}
                <div className="p-4 bg-[#0c0c0e] rounded-xl border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-zinc-300 font-semibold flex items-center gap-1.5">
                      <User className="w-4 h-4 text-rose-400" />
                      Aportes de la Comunidad
                    </span>
                    <button
                      type="button"
                      onClick={() => void loadContributions(detailItem.vintageId)}
                      disabled={contributionsLoading}
                      className="p-1 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Actualizar aportes"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', contributionsLoading && 'animate-spin')} />
                    </button>
                  </div>

                  {contributionsLoading ? (
                    <div className="py-6 text-center text-neutral-400">
                      <span className="text-xs font-mono">Cargando aportes...</span>
                    </div>
                  ) : contributionsError ? (
                    <div className="py-2">
                      <ErrorBanner
                        message={contributionsError}
                        onRetry={() => void loadContributions(detailItem.vintageId)}
                      />
                    </div>
                  ) : contributions.length === 0 ? (
                    <div className="py-6 text-center text-neutral-500 italic">
                      Nadie aportó fotos todavía.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                      {contributions.map((contrib) => {
                        const isCurrentPublic =
                          Boolean(contrib.personalImageId) &&
                          Boolean(currentPublicImageId) &&
                          String(contrib.personalImageId).toLowerCase() ===
                            String(currentPublicImageId).toLowerCase();

                        return (
                          <div
                            key={contrib.userId}
                            className={cn(
                              'p-3 rounded-xl border flex items-center gap-3 transition-colors',
                              isCurrentPublic
                                ? 'bg-rose-950/20 border-rose-600/50 shadow-xs'
                                : 'bg-neutral-900/60 border-white/5 hover:border-white/10'
                            )}
                          >
                            <div className="w-12 h-16 rounded-md overflow-hidden bg-neutral-950 border border-white/10 flex items-center justify-center shrink-0">
                              {contrib.personalImageId ? (
                                <img
                                  src={imageUrl(contrib.personalImageId, 'bottle')!}
                                  alt={`Foto de ${contrib.username}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Wine className="w-5 h-5 text-neutral-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-zinc-100 truncate text-xs">
                                  {contrib.username}
                                </span>
                                {contrib.isUploader && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/40">
                                    Subió la cosecha
                                  </span>
                                )}
                              </div>

                              {isCurrentPublic && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                                  <Sparkles className="w-3 h-3" />
                                  Foto pública actual
                                </span>
                              )}

                              {contrib.personalImageId && (
                                <div>
                                  <button
                                    type="button"
                                    disabled={promotingUserId === contrib.userId}
                                    onClick={() => handlePromoteImage(contrib)}
                                    className="mt-1 px-2 py-1 rounded text-[10px] font-medium bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 border border-rose-700/40 transition-colors cursor-pointer disabled:opacity-40"
                                  >
                                    {promotingUserId === contrib.userId
                                      ? 'Aplicando...'
                                      : 'Usar como foto pública'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. SECCIÓN C: EDITAR DATOS DE LA COSECHA */}
                <form
                  onSubmit={handleSaveVintageData}
                  className="p-4 bg-[#0c0c0e] rounded-xl border border-white/5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase tracking-wider text-[11px] text-zinc-300 font-semibold flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-rose-400" />
                      Editar Datos de la Cosecha
                    </span>

                    <Link
                      to={`/admin/vinos?focusWineId=${detailItem.wineId}`}
                      className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Editar vino
                    </Link>
                  </div>

                  {vintageEditError && <ErrorBanner message={vintageEditError} />}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="edit-year" className="block text-[11px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Año de Añada
                      </label>
                      <input
                        id="edit-year"
                        type="number"
                        min="1800"
                        max="2100"
                        placeholder="Ej. 2022 (o vacío)"
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs focus:outline-hidden focus:border-rose-500/60 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-alcohol" className="block text-[11px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        Graduación (% alc)
                      </label>
                      <input
                        id="edit-alcohol"
                        type="number"
                        step="0.01"
                        min="0"
                        max="99.99"
                        placeholder="Ej. 14.2"
                        value={editAlcohol}
                        onChange={(e) => setEditAlcohol(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs focus:outline-hidden focus:border-rose-500/60 font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-temp" className="block text-[11px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" />
                        T° Servicio (°C)
                      </label>
                      <input
                        id="edit-temp"
                        type="number"
                        min="0"
                        max="30"
                        placeholder="Ej. 16"
                        value={editServingTemp}
                        onChange={(e) => setEditServingTemp(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs focus:outline-hidden focus:border-rose-500/60 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="edit-advice" className="block text-[11px] font-mono text-neutral-400 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Consejo de Guarda
                    </label>
                    <textarea
                      id="edit-advice"
                      rows={2}
                      maxLength={500}
                      placeholder="Ej. Consumir dentro de los próximos 5 años a temperatura controlada."
                      value={editAgingAdvice}
                      onChange={(e) => setEditAgingAdvice(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs focus:outline-hidden focus:border-rose-500/60"
                    />
                    <div className="text-right text-[10px] text-neutral-500 font-mono">
                      {editAgingAdvice.length} / 500
                    </div>
                  </div>

                  {/* Uvas y porcentajes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Corte de Uvas (Blend)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddGrape}
                        disabled={editGrapes.length >= 20 || availableGrapes.length === 0}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar uva
                      </button>
                    </div>

                    {editGrapes.length === 0 ? (
                      <div className="text-[11px] text-neutral-500 italic">
                        Sin uvas asignadas a esta cosecha.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {editGrapes.map((g, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <select
                              aria-label={`Uva #${index + 1}`}
                              value={g.grapeId}
                              onChange={(e) => handleGrapeChange(index, Number(e.target.value))}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs focus:outline-hidden focus:border-rose-500/60"
                            >
                              {availableGrapes.map((ag) => (
                                <option key={ag.id} value={ag.id}>
                                  {ag.name}
                                </option>
                              ))}
                            </select>

                            <input
                              aria-label={`Porcentaje de uva #${index + 1}`}
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="100"
                              placeholder="% (opc)"
                              value={g.percentage}
                              onChange={(e) => handlePercentageChange(index, e.target.value)}
                              className="w-24 px-3 py-1.5 rounded-lg bg-neutral-900 border border-white/10 text-neutral-200 text-xs focus:outline-hidden focus:border-rose-500/60 font-mono"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveGrape(index)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Quitar uva"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingVintage}
                      className="px-4 py-2 rounded-xl bg-[#6b1d28] hover:bg-[#832232] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
                    >
                      {isSavingVintage ? 'Guardando...' : 'Guardar datos de cosecha'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Footer del Modal */}
            <div className="pt-4 border-t border-white/[0.08] flex justify-end">
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
