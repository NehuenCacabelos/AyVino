import { useState, useEffect, useCallback, useMemo } from 'react';
import { Eye, Pen, Trash2, X, AlertTriangle, Wine, GitMerge, Search, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  getAdminWines,
  updateWine,
  deleteWine,
  mergeWines,
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

  // Modal de Fusión
  const [mergeDuplicateWine, setMergeDuplicateWine] = useState<WineResponseDto | null>(null);
  const [mergeStep, setMergeStep] = useState<1 | 2>(1);
  const [mergeSearchQuery, setMergeSearchQuery] = useState('');
  const [mergeSearchResults, setMergeSearchResults] = useState<WineResponseDto[]>([]);
  const [isSearchingMerge, setIsSearchingMerge] = useState(false);
  const [selectedTargetWine, setSelectedTargetWine] = useState<WineResponseDto | null>(null);
  const [confirmedUndone, setConfirmedUndone] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const handleOpenMerge = (wine: WineResponseDto) => {
    setMergeDuplicateWine(wine);
    setMergeStep(1);
    setMergeSearchQuery('');
    setMergeSearchResults([]);
    setSelectedTargetWine(null);
    setConfirmedUndone(false);
    setMergeError(null);
  };

  const handleSearchTargetWines = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mergeSearchQuery.trim()) {
      setMergeSearchResults([]);
      return;
    }
    setIsSearchingMerge(true);
    setMergeError(null);
    try {
      const results = await getAdminWines({
        name: mergeSearchQuery.trim(),
        pageSize: 20,
      });
      // Excluir el mismo vino y vinos que ya son duplicados
      const filtered = results.filter(
        (w) => w.id !== mergeDuplicateWine?.id && w.duplicateOfWineId == null
      );
      setMergeSearchResults(filtered);
    } catch (err: unknown) {
      setMergeError(getApiErrorMessage(err));
    } finally {
      setIsSearchingMerge(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (!mergeDuplicateWine || !selectedTargetWine || !confirmedUndone) return;
    setIsMerging(true);
    setMergeError(null);
    try {
      const res = await mergeWines(selectedTargetWine.id, mergeDuplicateWine.id);
      toast.success(
        `Fusión exitosa: ${res.movedVintages} cosechas movidas, ${res.mergedVintages} fusionadas. ${res.movedReviews} reseñas movidas, ${res.discardedReviews} descartadas.`
      );
      setMergeDuplicateWine(null);
      await reload();
    } catch (err: unknown) {
      setMergeError(getApiErrorMessage(err));
    } finally {
      setIsMerging(false);
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

              {/* Fusionar (oculto si ya es duplicado) */}
              {!isDuplicate && (
                <button
                  type="button"
                  title="Fusionar vino..."
                  aria-label="Fusionar vino..."
                  onClick={() => handleOpenMerge(row)}
                  className="p-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
                >
                  <GitMerge className="w-4 h-4" />
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

      {/* Modal de Fusión de Vinos Duplicados */}
      {mergeDuplicateWine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="merge-modal-title"
            className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 id="merge-modal-title" className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-amber-400" />
                  <span>Fusionar vino duplicado</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Paso {mergeStep} de 2: {mergeStep === 1 ? 'Seleccionar vino principal' : 'Confirmar fusión'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMergeDuplicateWine(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Cerrar modal de fusión"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {mergeError && <ErrorBanner message={mergeError} />}

            {mergeStep === 1 && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200">
                  <span className="font-semibold text-amber-100">Vino a absorber (duplicado):</span> «{mergeDuplicateWine.name}» (#{mergeDuplicateWine.id}).
                  Dejará de ser visible públicamente y todas sus cosechas y reseñas pasarán al vino principal canónico.
                </div>

                <form onSubmit={handleSearchTargetWines} className="space-y-2">
                  <label htmlFor="merge-search-input" className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Buscar vino principal canónico
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
                      <input
                        id="merge-search-input"
                        type="text"
                        placeholder="Escribí el nombre del vino..."
                        value={mergeSearchQuery}
                        onChange={(e) => setMergeSearchQuery(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingMerge || !mergeSearchQuery.trim()}
                      className="px-3.5 h-9 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-neutral-200 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSearchingMerge ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    Resultados ({mergeSearchResults.length})
                  </span>
                  {mergeSearchResults.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500 italic bg-zinc-950 rounded-lg border border-white/5">
                      {mergeSearchQuery.trim()
                        ? 'No se encontraron vinos candidatos para fusionar.'
                        : 'Realizá una búsqueda por nombre para encontrar el vino principal.'}
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto divide-y divide-white/5 border border-white/5 rounded-lg bg-zinc-950">
                      {mergeSearchResults.map((candidate) => {
                        const isSelected = selectedTargetWine?.id === candidate.id;
                        return (
                          <div
                            key={candidate.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedTargetWine(candidate)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                setSelectedTargetWine(candidate);
                              }
                            }}
                            className={cn(
                              'p-3 flex items-center justify-between text-xs cursor-pointer transition-colors',
                              isSelected
                                ? 'bg-amber-950/40 border-l-2 border-amber-400'
                                : 'hover:bg-white/5'
                            )}
                          >
                            <div>
                              <div className="font-semibold text-zinc-100 flex items-center gap-1.5">
                                <span>{candidate.name}</span>
                                <span className="text-[10px] text-neutral-500 font-mono">#{candidate.id}</span>
                              </div>
                              <div className="text-[11px] text-neutral-400 mt-0.5">
                                Tipo: {getWineTypeLabel(candidate.wineType)} · {candidate.wineryNameText ?? (candidate.wineryId ? `Bodega #${candidate.wineryId}` : 'Sin bodega')}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400 text-zinc-950">
                                  Seleccionado
                                </span>
                              ) : (
                                <span className="text-[11px] text-neutral-400 underline hover:text-white">
                                  Elegir
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setMergeDuplicateWine(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTargetWine}
                    onClick={() => {
                      setMergeStep(2);
                      setMergeError(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {mergeStep === 2 && selectedTargetWine && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-300 leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Resumen de la operación</span>
                  </div>
                  <p>
                    «{mergeDuplicateWine.name}» (#{mergeDuplicateWine.id}) se fusionará dentro de «{selectedTargetWine.name}» (#{selectedTargetWine.id}).
                    Sus cosechas, reseñas, marcas y maridajes pasarán a «{selectedTargetWine.name}».
                    Si ambos tienen una cosecha del mismo año se unirán; si un usuario reseñó las dos, se conserva la reseña de «{selectedTargetWine.name}».
                    «{mergeDuplicateWine.name}» dejará de ser visible para el público. Esta acción no se puede deshacer.
                  </p>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/20 border border-rose-900/40">
                  <input
                    type="checkbox"
                    id="merge-undone-checkbox"
                    checked={confirmedUndone}
                    onChange={(e) => setConfirmedUndone(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-rose-800 bg-zinc-950 text-rose-600 focus:ring-rose-500 focus:ring-offset-zinc-900 cursor-pointer"
                  />
                  <label htmlFor="merge-undone-checkbox" className="text-xs text-rose-200 cursor-pointer select-none">
                    Entiendo que no se puede deshacer
                  </label>
                </div>

                <div className="flex justify-between gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    disabled={isMerging}
                    onClick={() => {
                      setMergeStep(1);
                      setConfirmedUndone(false);
                      setMergeError(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isMerging}
                      onClick={() => setMergeDuplicateWine(null)}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!confirmedUndone || isMerging}
                      onClick={() => void handleConfirmMerge()}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isMerging ? 'Fusionando...' : 'Fusionar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
