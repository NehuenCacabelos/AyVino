import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, Pen, Trash2, X, AlertTriangle, Wine } from 'lucide-react';
import {
  getAdminWines,
  updateWine,
  deleteWine,
} from '../features/admin/api/adminWinesApi';
import { getWineVintages } from '../features/winery/api/wineApi';
import { getWineries } from '../features/winery/api/wineryApi';
import type { WineResponseDto } from '../features/admin/types/adminWines';
import type { WineVintageResponseDto } from '../features/winery/types/wine';
import type { WineryResponseDto } from '../features/winery/types/winery';
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
import { getWineTypeLabel } from '../features/admin/utils/wineTypeLabels';
import { cn } from '../lib/utils';

const WINE_TYPES = [
  { value: 'Red', label: 'Tinto' },
  { value: 'White', label: 'Blanco' },
  { value: 'Rose', label: 'Rosado' },
  { value: 'Sparkling', label: 'Espumante' },
  { value: 'Orange', label: 'Naranjo' },
];

export default function AdminWinesPage() {
  const toast = useAdminToast();

  // Filtros de búsqueda
  const [searchName, setSearchName] = useState('');
  const [searchWinery, setSearchWinery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Bodegas aprobadas para el selector de edición
  const [approvedWineries, setApprovedWineries] = useState<WineryResponseDto[]>([]);

  useEffect(() => {
    getWineries({ status: 'Approved', pageSize: 100 })
      .then((data) => setApprovedWineries(data))
      .catch(() => {
        // Silencioso si falla la precarga de bodegas
      });
  }, []);

  const wineriesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const w of approvedWineries) {
      map.set(w.id, w.name);
    }
    return map;
  }, [approvedWineries]);

  // Fetcher paginado
  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getAdminWines({
        pageNumber: page,
        pageSize,
        name: searchName || undefined,
        winery: searchWinery || undefined,
        wineType: selectedType || undefined,
      });
    },
    [searchName, searchWinery, selectedType]
  );

  const {
    items: wines,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<WineResponseDto>(fetcher, [
    searchName,
    searchWinery,
    selectedType,
  ]);

  // Modal de Detalle (Cosechas)
  const [detailWine, setDetailWine] = useState<WineResponseDto | null>(null);
  const [detailVintages, setDetailVintages] = useState<WineVintageResponseDto[]>([]);
  const [isLoadingVintages, setIsLoadingVintages] = useState(false);

  const handleOpenDetail = async (wine: WineResponseDto) => {
    setDetailWine(wine);
    setIsLoadingVintages(true);
    try {
      const vintages = await getWineVintages(wine.id);
      setDetailVintages(vintages);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
      setDetailVintages([]);
    } finally {
      setIsLoadingVintages(false);
    }
  };

  // Modal de Edición
  const [editingWine, setEditingWine] = useState<WineResponseDto | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    wineType: string;
    description: string;
    wineryId: number | null;
    wineryNameText: string;
  }>({
    name: '',
    wineType: 'Red',
    description: '',
    wineryId: null,
    wineryNameText: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenEdit = (wine: WineResponseDto) => {
    setEditingWine(wine);
    setEditForm({
      name: wine.name,
      wineType: wine.wineType,
      description: wine.description ?? '',
      wineryId: wine.wineryId,
      wineryNameText: wine.wineryNameText ?? '',
    });
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWine) return;

    if (!editForm.name.trim()) {
      setEditError('El nombre del vino es obligatorio.');
      return;
    }
    if (editForm.name.length > 150) {
      setEditError('El nombre no puede superar los 150 caracteres.');
      return;
    }
    if (editForm.description.length > 1000) {
      setEditError('La descripción no puede superar los 1000 caracteres.');
      return;
    }
    if (editForm.wineryNameText.length > 150) {
      setEditError('El nombre de la bodega no puede superar los 150 caracteres.');
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);
    try {
      await updateWine(editingWine.id, {
        name: editForm.name.trim(),
        wineType: editForm.wineType,
        description: editForm.description.trim() || null,
        wineryId: editForm.wineryId,
        wineryNameText: editForm.wineryNameText.trim() || null,
      });
      toast.success('Vino actualizado exitosamente.');
      setEditingWine(null);
      await reload();
    } catch (err: unknown) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Diálogo de Eliminación
  const [deletingWine, setDeletingWine] = useState<WineResponseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingWine) return;
    setIsDeleting(true);
    try {
      await deleteWine(deletingWine.id);
      toast.success('Vino eliminado exitosamente.');
      setDeletingWine(null);
      await reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
      setDeletingWine(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<WineResponseDto>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nombre',
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-zinc-100">{row.name}</span>
            {row.duplicateOfWineId != null && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60 w-fit">
                Duplicado de #{row.duplicateOfWineId}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'winery',
        header: 'Bodega',
        render: (row) => {
          const wineryName = row.wineryId
            ? wineriesMap.get(row.wineryId) ?? `Bodega #${row.wineryId}`
            : row.wineryNameText;
          return <span className="text-neutral-300 text-xs">{wineryName || '—'}</span>;
        },
      },
      {
        key: 'wineType',
        header: 'Tipo',
        render: (row) => (
          <span className="text-xs text-neutral-300">
            {getWineTypeLabel(row.wineType)}
          </span>
        ),
      },
      {
        key: 'sourceType',
        header: 'Origen',
        className: 'text-center',
        render: (row) => {
          const isOfficial = row.sourceType === 'Official';
          return (
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border',
                isOfficial
                  ? 'bg-purple-950/50 text-purple-300 border-purple-800/60'
                  : 'bg-sky-950/50 text-sky-300 border-sky-800/60'
              )}
            >
              {isOfficial ? 'Oficial' : 'Comunitario'}
            </span>
          );
        },
      },
      {
        key: 'reviews',
        header: 'Reseñas',
        render: (row) => {
          if (row.reviewCount === 0) {
            return <span className="text-xs text-neutral-500 italic">Sin reseñas</span>;
          }
          return (
            <span className="text-xs text-neutral-300 font-mono">
              ★ {row.averageRating != null ? Number(row.averageRating).toFixed(1) : '—'}{' '}
              <span className="text-neutral-500">({row.reviewCount})</span>
            </span>
          );
        },
      },
      {
        key: 'actions',
        header: 'Acciones',
        className: 'text-right',
        render: (row) => {
          const isDuplicate = row.duplicateOfWineId != null;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Detalle */}
              <button
                type="button"
                title="Ver detalle y cosechas"
                onClick={() => void handleOpenDetail(row)}
                className="p-1.5 rounded-lg border border-white/10 bg-zinc-800/60 text-neutral-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Editar (oculto si ya es duplicado) */}
              {!isDuplicate && (
                <button
                  type="button"
                  title="Editar vino"
                  onClick={() => handleOpenEdit(row)}
                  className="p-1.5 rounded-lg border border-white/10 bg-zinc-800/60 text-neutral-300 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <Pen className="w-4 h-4" />
                </button>
              )}

              {/* Eliminar (oculto si ya es duplicado) */}
              {!isDuplicate && (
                <button
                  type="button"
                  title="Eliminar vino"
                  onClick={() => setDeletingWine(row)}
                  className="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wineriesMap]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Vinos"
        description="Bandeja de gestión, edición y moderación de etiquetas de vinos comunitarios y oficiales."
      />

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex flex-wrap gap-3">
        {/* Nombre */}
        <div className="flex-1 min-w-[180px] space-y-1">
          <label
            htmlFor="wine-name-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Buscar por nombre
          </label>
          <input
            id="wine-name-filter"
            aria-label="Buscar por nombre"
            type="text"
            placeholder="Ej: Malbec Reserva..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          />
        </div>

        {/* Tipo */}
        <div className="w-40 space-y-1">
          <label
            htmlFor="wine-type-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Tipo de vino
          </label>
          <select
            id="wine-type-filter"
            aria-label="Filtrar por tipo"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          >
            <option value="">Todos los tipos</option>
            {WINE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bodega */}
        <div className="flex-1 min-w-[180px] space-y-1">
          <label
            htmlFor="wine-winery-filter"
            className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
          >
            Bodega
          </label>
          <input
            id="wine-winery-filter"
            aria-label="Filtrar por bodega"
            type="text"
            placeholder="Ej: Catena Zapata..."
            value={searchWinery}
            onChange={(e) => setSearchWinery(e.target.value)}
            className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
          />
        </div>
      </div>

      {/* Error con reintento */}
      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* Tabla */}
      <DataTable
        columns={columns}
        rows={wines}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No se encontraron vinos con los filtros especificados."
      />

      {/* Paginación */}
      <PaginationControls
        page={page}
        pageSize={pageSize}
        itemsOnPage={wines.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modal de Detalle (Solo Lectura) */}
      {detailWine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-modal-title"
            className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 id="detail-modal-title" className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <Wine className="w-5 h-5 text-rose-400" />
                  <span>{detailWine.name}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Tipo: {getWineTypeLabel(detailWine.wineType)} · Origen: {detailWine.sourceType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailWine(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Cerrar modal de detalle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailWine.description && (
              <p className="text-xs text-neutral-300 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-white/5">
                {detailWine.description}
              </p>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Cosechas registradas ({detailVintages.length})
              </h4>
              {isLoadingVintages ? (
                <div className="py-6 text-center text-xs text-neutral-500 animate-pulse">
                  Cargando cosechas...
                </div>
              ) : detailVintages.length === 0 ? (
                <div className="py-4 text-center text-xs text-neutral-500 italic">
                  Este vino no tiene cosechas registradas.
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto divide-y divide-white/5 border border-white/5 rounded-lg bg-zinc-950">
                  {detailVintages.map((v) => (
                    <div key={v.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-zinc-200">
                          Año: {v.year ?? 'S/A'}
                        </span>
                        <div className="text-[11px] text-neutral-400">
                          Graduación: {v.alcoholContent ? `${v.alcoholContent}%` : '—'}
                        </div>
                      </div>
                      <StatusBadge status={v.approvalStatus} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDetailWine(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editingWine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <h3 id="edit-modal-title" className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Pen className="w-4 h-4 text-rose-400" />
                <span>Editar Vino #{editingWine.id}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingWine(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Cerrar modal de edición"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={(e) => void handleSaveEdit(e)} className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-wine-name"
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
                >
                  Nombre del vino *
                </label>
                <input
                  id="edit-wine-name"
                  type="text"
                  required
                  maxLength={150}
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-wine-type"
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
                >
                  Tipo de vino *
                </label>
                <select
                  id="edit-wine-type"
                  value={editForm.wineType}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, wineType: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
                >
                  {WINE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Bodega Oficial */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-wine-winery"
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
                >
                  Bodega oficial
                </label>
                <select
                  id="edit-wine-winery"
                  value={editForm.wineryId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setEditForm((prev) => ({ ...prev, wineryId: val }));
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
                >
                  <option value="">Sin bodega oficial vinculada</option>
                  {approvedWineries.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de Bodega en Texto */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-wine-winery-text"
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
                >
                  Nombre de bodega en texto
                </label>
                <input
                  id="edit-wine-winery-text"
                  type="text"
                  maxLength={150}
                  placeholder="Texto libre de bodega cuando no hay bodega oficial"
                  value={editForm.wineryNameText}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, wineryNameText: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label
                  htmlFor="edit-wine-description"
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
                >
                  Descripción
                </label>
                <textarea
                  id="edit-wine-description"
                  rows={3}
                  maxLength={1000}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingWine(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6b1d28] hover:bg-[#852332] text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Eliminación */}
      <ConfirmDialog
        open={Boolean(deletingWine)}
        tone="danger"
        title="¿Eliminar vino?"
        message={`¿Estás seguro de que deseás eliminar el vino "${deletingWine?.name}"? Esta acción borrará todas sus cosechas y reseñas asociadas.`}
        confirmLabel="Eliminar"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingWine(null)}
      />
    </div>
  );
}
