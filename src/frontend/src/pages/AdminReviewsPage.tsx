import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Trash2, X, MessageSquare } from 'lucide-react';
import {
  getAdminReviews,
  deleteReviewByAdmin,
} from '../features/admin/api/adminReviewsApi';
import type { AdminReviewListItemDto } from '../features/admin/types/adminReviews';
import {
  PageHeader,
  DataTable,
  PaginationControls,
  ConfirmDialog,
  ErrorBanner,
  useAdminToast,
  usePagedList,
  getApiErrorMessage,
} from '../features/admin';
import type { Column } from '../features/admin';
import { cn } from '../lib/utils';

const RATING_CHIPS: { label: string; value: number | undefined }[] = [
  { label: 'Todos', value: undefined },
  { label: '1 estrella', value: 1 },
  { label: '2 estrellas', value: 2 },
  { label: '3 estrellas', value: 3 },
  { label: '4 estrellas', value: 4 },
  { label: '5 estrellas', value: 5 },
];

export default function AdminReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useAdminToast();

  // Filtros iniciales desde URL si existen
  const urlRating = searchParams.get('rating');
  const initialRating = urlRating && !isNaN(Number(urlRating)) ? Number(urlRating) : undefined;
  const initialWineId = searchParams.get('wineId') ?? '';
  const initialUserId = searchParams.get('userId') ?? '';

  const [ratingFilter, setRatingFilter] = useState<number | undefined>(initialRating);
  const [wineIdInput, setWineIdInput] = useState<string>(initialWineId);
  const [userIdInput, setUserIdInput] = useState<string>(initialUserId);

  // Modal para ver texto completo
  const [selectedReview, setSelectedReview] = useState<AdminReviewListItemDto | null>(null);

  // Diálogo de confirmación para eliminar
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    reviewId: number | null;
  }>({
    open: false,
    reviewId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const parsedWineId = wineIdInput ? Number(wineIdInput) : undefined;
  const parsedUserId = userIdInput ? Number(userIdInput) : undefined;

  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getAdminReviews({
        pageNumber: page,
        pageSize,
        rating: ratingFilter,
        wineId: isNaN(parsedWineId as number) ? undefined : parsedWineId,
        userId: isNaN(parsedUserId as number) ? undefined : parsedUserId,
      });
    },
    [ratingFilter, parsedWineId, parsedUserId]
  );

  const {
    items: reviews,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<AdminReviewListItemDto>(fetcher, [
    ratingFilter,
    parsedWineId,
    parsedUserId,
  ]);

  const updateUrlParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handleRatingChipClick = (value: number | undefined) => {
    setRatingFilter(value);
    updateUrlParam('rating', value ? String(value) : undefined);
  };

  const handleWineIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setWineIdInput(val);
    updateUrlParam('wineId', val || undefined);
  };

  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserIdInput(val);
    updateUrlParam('userId', val || undefined);
  };

  const handleOpenDelete = (review: AdminReviewListItemDto) => {
    setDeleteDialog({
      open: true,
      reviewId: review.id,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.reviewId) return;
    setIsDeleting(true);
    try {
      await deleteReviewByAdmin(deleteDialog.reviewId);
      toast.success('Reseña eliminada exitosamente.');
      setDeleteDialog({ open: false, reviewId: null });
      await reload();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<AdminReviewListItemDto>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Fecha',
        className: 'whitespace-nowrap',
        render: (row) => {
          const dateObj = new Date(row.createdAt);
          const formatted = isNaN(dateObj.getTime())
            ? row.createdAt
            : dateObj.toLocaleDateString('es-AR');
          return <span className="text-xs text-neutral-300 font-mono">{formatted}</span>;
        },
      },
      {
        key: 'username',
        header: 'Usuario',
        render: (row) => (
          <span className="font-medium text-zinc-100">
            {row.username ?? (row.userId != null ? `Usuario #${row.userId}` : '—')}
          </span>
        ),
      },
      {
        key: 'wine',
        header: 'Vino',
        render: (row) => (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-zinc-100">{row.wineName}</span>
            <span className="text-[11px] text-neutral-400">
              Cosecha: {row.year ?? 'S/A'}
            </span>
          </div>
        ),
      },
      {
        key: 'rating',
        header: 'Puntaje',
        className: 'whitespace-nowrap',
        render: (row) => (
          <div className="flex items-center gap-0.5" aria-label={`${row.rating} de 5 estrellas`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5',
                  i < row.rating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-600'
                )}
              />
            ))}
          </div>
        ),
      },
      {
        key: 'comment',
        header: 'Comentario',
        render: (row) => {
          if (!row.comment) {
            return <span className="text-xs text-neutral-500 italic">Sin comentario</span>;
          }
          const isLong = row.comment.length > 70;
          return (
            <div className="text-xs text-neutral-300 max-w-sm">
              <p className="line-clamp-2">{row.comment}</p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setSelectedReview(row)}
                  className="text-rose-400 hover:text-rose-300 hover:underline text-[11px] mt-0.5 cursor-pointer"
                >
                  Ver más
                </button>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Acciones',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end">
            <button
              type="button"
              title="Eliminar reseña"
              onClick={() => handleOpenDelete(row)}
              className="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderación de Reseñas"
        description="Gestión y moderación comunitaria de reseñas y calificaciones de vinos."
      />

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
        {/* Chips de Puntaje */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Puntaje
          </label>
          <div className="flex flex-wrap gap-2">
            {RATING_CHIPS.map((chip) => {
              const isSelected = ratingFilter === chip.value;
              return (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleRatingChipClick(chip.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border',
                    isSelected
                      ? 'bg-rose-900/50 border-rose-500/60 text-white shadow-sm'
                      : 'bg-zinc-950/80 border-white/10 text-neutral-400 hover:text-zinc-200 hover:bg-zinc-800'
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inputs numéricos de ID */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px] max-w-xs space-y-1">
            <label
              htmlFor="wine-id-filter"
              className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
            >
              ID de Vino
            </label>
            <input
              id="wine-id-filter"
              aria-label="ID de vino"
              type="number"
              min="1"
              placeholder="Ej: 42"
              value={wineIdInput}
              onChange={handleWineIdChange}
              className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
            />
          </div>

          <div className="flex-1 min-w-[140px] max-w-xs space-y-1">
            <label
              htmlFor="user-id-filter"
              className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
            >
              ID de Usuario
            </label>
            <input
              id="user-id-filter"
              aria-label="ID de usuario"
              type="number"
              min="1"
              placeholder="Ej: 7"
              value={userIdInput}
              onChange={handleUserIdChange}
              className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60"
            />
          </div>
        </div>
      </div>

      {/* Error con reintento */}
      {error && <ErrorBanner message={error} onRetry={reload} />}

      {/* Tabla */}
      <DataTable
        columns={columns}
        rows={reviews}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay reseñas registradas para estos filtros."
      />

      {/* Paginación */}
      <PaginationControls
        page={page}
        pageSize={pageSize}
        itemsOnPage={reviews.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Modal de Texto Completo de Reseña */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="w-full max-w-md rounded-2xl bg-zinc-900 border border-white/10 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="space-y-1">
                <h3 id="review-modal-title" className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-400" />
                  <span>Reseña de {selectedReview.username ?? `Usuario #${selectedReview.userId}`}</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  {selectedReview.wineName} ({selectedReview.year ?? 'S/A'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-4 h-4',
                    i < selectedReview.rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-zinc-600'
                  )}
                />
              ))}
              <span className="text-xs font-mono text-neutral-400 ml-2">
                {selectedReview.rating} / 5
              </span>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-lg bg-zinc-950 p-3.5 border border-white/5 text-xs text-neutral-200 leading-relaxed font-sans">
              {selectedReview.comment}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-neutral-200 hover:text-white transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        open={deleteDialog.open}
        tone="danger"
        title="¿Eliminar reseña?"
        message="Se elimina la reseña y se recalcula el puntaje promedio del vino. Esta acción es irreversible."
        confirmLabel="Eliminar"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteDialog({ open: false, reviewId: null })}
      />
    </div>
  );
}
