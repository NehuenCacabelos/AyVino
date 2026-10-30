import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { getStates } from '../features/winery/api/locationApi';
import type { StateResponseDto, CityResponseDto, CityStatus } from '../features/winery/types/location';
import {
  getCities,
  changeCityStatus,
} from '../features/admin/api/adminCitiesApi';
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

export default function AdminCitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useAdminToast();

  // Estados de provincias en memoria
  const [states, setStates] = useState<StateResponseDto[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | undefined>(undefined);

  // Carga inicial de provincias
  useEffect(() => {
    let isMounted = true;
    getStates()
      .then((data) => {
        if (isMounted) setStates(data);
      })
      .catch(() => {
        // Fallback silencioso si falla la lista de provincias
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const statesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const state of states) {
      map.set(state.id, state.name);
    }
    return map;
  }, [states]);

  // Filtro de estado desde URL
  const rawStatus = searchParams.get('status');
  const currentStatus: StatusFilter =
    rawStatus === 'Approved' || rawStatus === 'Rejected' || rawStatus === 'All'
      ? rawStatus
      : 'Pending';

  const statusParam = currentStatus === 'All' ? undefined : currentStatus;

  // Modales y procesamiento
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    onConfirm: async () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Fetcher paginado
  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getCities({
        pageNumber: page,
        pageSize,
        stateId: selectedStateId,
        status: statusParam,
      });
    },
    [selectedStateId, statusParam]
  );

  const {
    items: cities,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<CityResponseDto>(fetcher, [selectedStateId, statusParam]);

  const handleChipClick = (status: StatusFilter) => {
    const next = new URLSearchParams(searchParams);
    next.set('status', status);
    setSearchParams(next);
  };

  // Acciones
  const handleApprove = async (id: number) => {
    setProcessingId(id);
    try {
      await changeCityStatus(id, 'Approved');
      toast.success('Ciudad aprobada exitosamente.');
      await reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (city: CityResponseDto) => {
    setConfirmDialog({
      open: true,
      title: '¿Rechazar ciudad?',
      message: `¿Estás seguro de que deseás rechazar la ciudad "${city.name}"?`,
      confirmLabel: 'Rechazar',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(city.id);
        try {
          await changeCityStatus(city.id, 'Rejected');
          toast.success('Ciudad rechazada.');
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

  // Columnas de la tabla
  const columns: Column<CityResponseDto>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nombre',
        render: (row) => (
          <span className="font-medium text-zinc-100">{row.name}</span>
        ),
      },
      {
        key: 'state',
        header: 'Provincia',
        render: (row) => (
          <span className="text-neutral-300">
            {statesMap.get(row.stateId) ?? `Provincia #${row.stateId}`}
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
          const status = row.status as CityStatus;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Aprobar */}
              {(status === 'Pending' || status === 'Rejected') && (
                <button
                  type="button"
                  title="Aprobar ciudad"
                  disabled={isProcessing}
                  onClick={() => void handleApprove(row.id)}
                  className="p-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* Rechazar */}
              {(status === 'Pending' || status === 'Approved') && (
                <button
                  type="button"
                  title="Rechazar ciudad"
                  disabled={isProcessing}
                  onClick={() => openRejectDialog(row)}
                  className="p-1.5 rounded-lg border border-amber-900/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processingId, statesMap]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ciudades"
        description="Revisá y aprobá las ciudades agregadas por usuarios para su inclusión pública"
      />

      {/* Barra de filtros: Chips de estado + Selector de provincia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Chips de estado */}
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

        {/* Selector de provincia */}
        <div className="flex items-center gap-2">
          <label htmlFor="state-filter" className="text-xs text-neutral-400 whitespace-nowrap">
            Provincia:
          </label>
          <select
            id="state-filter"
            value={selectedStateId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedStateId(val ? Number(val) : undefined);
            }}
            aria-label="Filtrar por provincia"
            className="rounded-xl border border-white/10 bg-[#141416] px-3 py-1.5 text-xs text-neutral-200 focus:border-rose-500 focus:outline-none cursor-pointer"
          >
            <option value="">Todas las provincias</option>
            {states.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error de carga */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de ciudades */}
      <DataTable
        columns={columns}
        rows={cities}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay ciudades con este estado."
      />

      {/* Paginación */}
      {!isLoading && cities.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          itemsOnPage={cities.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Diálogo de Confirmación para Rechazar */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        isLoading={isConfirmLoading}
        onConfirm={() => void confirmDialog.onConfirm()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
