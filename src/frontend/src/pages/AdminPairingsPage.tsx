import { useState, useCallback, useMemo, type FormEvent } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, UtensilsCrossed } from 'lucide-react';
import {
  getPairings,
  createPairing,
  updatePairing,
  deletePairing,
} from '../features/admin/api/adminPairingsApi';
import type { PairingResponseDto } from '../features/admin/types/adminPairings';
import {
  PAIRING_CATEGORY_LABELS,
  PAIRING_CATEGORY_OPTIONS,
} from '../features/admin/utils/pairingLabels';
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
import { isAxiosError } from 'axios';
import type { ProblemDetails } from '../features/winery/types/problemDetails';

type CategoryFilter = 'ALL' | string;

export default function AdminPairingsPage() {
  const toast = useAdminToast();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');

  // Modal crear / editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPairing, setEditingPairing] = useState<PairingResponseDto | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Meat');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalFormError, setGeneralFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Eliminación
  const [deletingPairing, setDeletingPairing] = useState<PairingResponseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetcher paginado: en este endpoint pageNumber y pageSize son obligatorios
  const categoryParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getPairings({
        pageNumber: page,
        pageSize,
        category: categoryParam,
      });
    },
    [categoryParam]
  );

  const {
    items: pairings,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<PairingResponseDto>(fetcher, [categoryParam]);

  // Abrir modal crear
  const handleOpenCreate = () => {
    setEditingPairing(null);
    setName('');
    setCategory('Meat');
    setFormErrors({});
    setGeneralFormError(null);
    setModalOpen(true);
  };

  // Abrir modal editar
  const handleOpenEdit = (pairing: PairingResponseDto) => {
    setEditingPairing(pairing);
    setName(pairing.name);
    setCategory(pairing.category);
    setFormErrors({});
    setGeneralFormError(null);
    setModalOpen(true);
  };

  // Submit crear / editar
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralFormError(null);

    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'El nombre del maridaje es obligatorio.';
    } else if (name.length > 100) {
      errors.name = 'El nombre del maridaje no puede superar los 100 caracteres.';
    }

    if (!category) {
      errors.category = 'La categoría es obligatoria.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    const payload = {
      name: name.trim(),
      category,
    };

    try {
      if (editingPairing) {
        await updatePairing(editingPairing.id, payload);
        toast.success('Maridaje actualizado correctamente.');
      } else {
        await createPairing(payload);
        toast.success('Maridaje creado exitosamente.');
      }
      setModalOpen(false);
      await reload();
    } catch (err: unknown) {
      if (isAxiosError<ProblemDetails>(err) && err.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(err.response.data.errors)) {
          const lowerKey = key.charAt(0).toLowerCase() + key.slice(1);
          serverErrors[lowerKey] = msgs.join(' ');
        }
        setFormErrors(serverErrors);
      } else {
        setGeneralFormError(getApiErrorMessage(err));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!deletingPairing) return;
    setIsDeleting(true);
    try {
      await deletePairing(deletingPairing.id);
      toast.success('Maridaje eliminado correctamente.');
      setDeletingPairing(null);
      await reload();
    } catch (err: unknown) {
      // 409 conflicto por maridaje asociado u otro error: mostrar tal cual en toast
      toast.error(getApiErrorMessage(err));
      setDeletingPairing(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Columnas
  const columns: Column<PairingResponseDto>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nombre',
        render: (row) => (
          <span className="font-medium text-zinc-100">{row.name}</span>
        ),
      },
      {
        key: 'category',
        header: 'Categoría',
        className: 'text-center',
        render: (row) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-900 border border-white/10 text-neutral-300">
            <UtensilsCrossed className="w-3 h-3 text-rose-400" />
            <span>{PAIRING_CATEGORY_LABELS[row.category] ?? row.category}</span>
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Acciones',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Editar maridaje"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Eliminar maridaje"
              onClick={() => setDeletingPairing(row)}
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
        title="Maridajes"
        description="Catálogo de combinaciones gastronómicas y pautas de maridaje"
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6b1d28] hover:bg-[#85222e] text-white border border-rose-800/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo maridaje</span>
          </button>
        }
      />

      {/* Chips de categoría: Todas + 9 categorías */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory('ALL')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
            selectedCategory === 'ALL'
              ? 'bg-[#6b1d28] border-rose-700/60 text-white shadow-sm'
              : 'bg-[#141416] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
          )}
        >
          Todas
        </button>
        {PAIRING_CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setSelectedCategory(cat.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
              selectedCategory === cat.value
                ? 'bg-[#6b1d28] border-rose-700/60 text-white shadow-sm'
                : 'bg-[#141416] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Error de carga */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de maridajes */}
      <DataTable
        columns={columns}
        rows={pairings}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay maridajes registrados."
      />

      {/* Paginación */}
      {!isLoading && pairings.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          itemsOnPage={pairings.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pairing-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl text-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <h2
                id="pairing-modal-title"
                className="font-serif text-lg font-bold text-zinc-100"
              >
                {editingPairing ? 'Editar maridaje' : 'Nuevo maridaje'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generalFormError && (
              <div className="mb-4">
                <ErrorBanner message={generalFormError} />
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              {/* Nombre */}
              <div>
                <label htmlFor="pairing-name" className="block text-neutral-300 font-medium mb-1">
                  Nombre del maridaje <span className="text-rose-400">*</span>
                </label>
                <input
                  id="pairing-name"
                  type="text"
                  maxLength={100}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  placeholder="Ej: Ojo de bife a las brasas..."
                  className={`w-full h-10 rounded-xl px-3 text-xs bg-[#0c0c0e] border text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors ${
                    formErrors.name ? 'border-rose-500' : 'border-white/10 focus:border-rose-500'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Categoría */}
              <div>
                <label htmlFor="pairing-cat" className="block text-neutral-300 font-medium mb-1">
                  Categoría gastronómica <span className="text-rose-400">*</span>
                </label>
                <select
                  id="pairing-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-xl px-3 text-xs bg-[#0c0c0e] border border-white/10 text-zinc-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {PAIRING_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#6b1d28] hover:bg-[#85222e] text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Guardando...' : editingPairing ? 'Actualizar' : 'Crear'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        open={Boolean(deletingPairing)}
        title="¿Eliminar maridaje?"
        message={`¿Estás seguro de que deseás eliminar el maridaje "${deletingPairing?.name}"? Esta acción es irreversible.`}
        confirmLabel="Eliminar definitivamente"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingPairing(null)}
      />
    </div>
  );
}
