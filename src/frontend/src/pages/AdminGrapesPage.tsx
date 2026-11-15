import { useState, useCallback, useMemo, type FormEvent } from 'react';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { getGrapes } from '../features/winery/api/grapeApi';
import type { GrapeResponseDto } from '../features/winery/types/grape';
import {
  createGrape,
  updateGrape,
  deleteGrape,
} from '../features/admin/api/adminGrapesApi';
import {
  COLOR_TYPE_LABELS,
  COLOR_TYPE_OPTIONS,
  TYPICAL_BODY_LABELS,
  TYPICAL_BODY_OPTIONS,
  TYPICAL_TANNINS_LABELS,
  TYPICAL_TANNINS_OPTIONS,
  TYPICAL_ACIDITY_LABELS,
  TYPICAL_ACIDITY_OPTIONS,
} from '../features/admin/utils/grapeLabels';
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

type ColorFilter = 'ALL' | 'Red' | 'White' | 'Rose' | 'Orange';

const COLOR_CHIPS: { label: string; value: ColorFilter }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Tinta', value: 'Red' },
  { label: 'Blanca', value: 'White' },
  { label: 'Rosada', value: 'Rose' },
  { label: 'Naranja', value: 'Orange' },
];

interface GrapeFormData {
  name: string;
  colorType: string;
  typicalBody: string;
  typicalTannins: string;
  typicalAcidity: string;
  description: string;
}

const INITIAL_FORM: GrapeFormData = {
  name: '',
  colorType: 'Red',
  typicalBody: '',
  typicalTannins: '',
  typicalAcidity: '',
  description: '',
};

export default function AdminGrapesPage() {
  const toast = useAdminToast();
  const [selectedColor, setSelectedColor] = useState<ColorFilter>('ALL');

  // Estado del modal de creación / edición
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrape, setEditingGrape] = useState<GrapeResponseDto | null>(null);
  const [formData, setFormData] = useState<GrapeFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [generalFormError, setGeneralFormError] = useState<string | null>(null);

  // Estado de eliminación
  const [deletingGrape, setDeletingGrape] = useState<GrapeResponseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetcher paginado
  const colorParam = selectedColor === 'ALL' ? undefined : selectedColor;
  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getGrapes({ pageNumber: page, pageSize, colorType: colorParam });
    },
    [colorParam]
  );

  const {
    items: grapes,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<GrapeResponseDto>(fetcher, [colorParam]);

  // Abrir modal para crear
  const handleOpenCreate = () => {
    setEditingGrape(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setGeneralFormError(null);
    setModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (grape: GrapeResponseDto) => {
    setEditingGrape(grape);
    setFormData({
      name: grape.name,
      colorType: grape.colorType,
      typicalBody: grape.typicalBody ?? '',
      typicalTannins: grape.typicalTannins ?? '',
      typicalAcidity: grape.typicalAcidity ?? '',
      description: grape.description ?? '',
    });
    setFormErrors({});
    setGeneralFormError(null);
    setModalOpen(true);
  };

  // Validar y guardar
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralFormError(null);

    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'El nombre de la uva es obligatorio.';
    } else if (formData.name.length > 100) {
      errors.name = 'El nombre de la uva no puede superar los 100 caracteres.';
    }

    if (!formData.colorType) {
      errors.colorType = 'El tipo de color es obligatorio.';
    }

    if (formData.description.length > 1000) {
      errors.description = 'La descripción no puede superar los 1000 caracteres.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    const payload = {
      name: formData.name.trim(),
      colorType: formData.colorType,
      typicalBody: formData.typicalBody ? formData.typicalBody : null,
      typicalTannins: formData.typicalTannins ? formData.typicalTannins : null,
      typicalAcidity: formData.typicalAcidity ? formData.typicalAcidity : null,
      description: formData.description.trim() ? formData.description.trim() : null,
    };

    try {
      if (editingGrape) {
        await updateGrape(editingGrape.id, payload);
        toast.success('Uva actualizada correctamente.');
      } else {
        await createGrape(payload);
        toast.success('Uva creada exitosamente.');
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

  // Eliminar uva
  const handleConfirmDelete = async () => {
    if (!deletingGrape) return;
    setIsDeleting(true);
    try {
      await deleteGrape(deletingGrape.id);
      toast.success('Uva eliminada exitosamente.');
      setDeletingGrape(null);
      await reload();
    } catch (err: unknown) {
      // 409 uva usada en vinos u otro error: mostrar tal cual en toast
      toast.error(getApiErrorMessage(err));
      setDeletingGrape(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper para badge de color
  const renderColorBadge = (colorType: string) => {
    const label = COLOR_TYPE_LABELS[colorType] ?? colorType;
    let dotClass = 'bg-neutral-400';
    if (colorType === 'Red') dotClass = 'bg-rose-600';
    if (colorType === 'White') dotClass = 'bg-amber-200';
    if (colorType === 'Rose') dotClass = 'bg-pink-400';
    if (colorType === 'Orange') dotClass = 'bg-orange-400';

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-stone-900 border border-white/10 text-neutral-200">
        <span className={cn('w-2 h-2 rounded-full', dotClass)} aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  };

  // Columnas
  const columns: Column<GrapeResponseDto>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Nombre',
        render: (row) => (
          <div className="font-medium text-zinc-100 flex flex-col">
            <span>{row.name}</span>
            {row.description && (
              <span className="text-[11px] text-neutral-400 font-sans line-clamp-1 max-w-[280px]">
                {row.description}
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'colorType',
        header: 'Color',
        className: 'text-center',
        render: (row) => renderColorBadge(row.colorType),
      },
      {
        key: 'typicalBody',
        header: 'Cuerpo',
        className: 'text-neutral-300',
        render: (row) => (
          <span>
            {row.typicalBody ? TYPICAL_BODY_LABELS[row.typicalBody] ?? row.typicalBody : '—'}
          </span>
        ),
      },
      {
        key: 'typicalTannins',
        header: 'Taninos',
        className: 'text-neutral-300',
        render: (row) => (
          <span>
            {row.typicalTannins
              ? TYPICAL_TANNINS_LABELS[row.typicalTannins] ?? row.typicalTannins
              : '—'}
          </span>
        ),
      },
      {
        key: 'typicalAcidity',
        header: 'Acidez',
        className: 'text-neutral-300',
        render: (row) => (
          <span>
            {row.typicalAcidity
              ? TYPICAL_ACIDITY_LABELS[row.typicalAcidity] ?? row.typicalAcidity
              : '—'}
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
              title="Editar uva"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Eliminar uva"
              onClick={() => setDeletingGrape(row)}
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
        title="Uvas"
        description="Catálogo maestro de cepas y varietales vitivinícolas"
        actions={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6b1d28] hover:bg-[#85222e] text-white border border-rose-800/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva uva</span>
          </button>
        }
      />

      {/* Chips de filtro por color */}
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_CHIPS.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => setSelectedColor(chip.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
              selectedColor === chip.value
                ? 'bg-[#6b1d28] border-rose-700/60 text-white shadow-sm'
                : 'bg-[#141416] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Error de carga */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de uvas */}
      <DataTable
        columns={columns}
        rows={grapes}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay uvas registradas."
      />

      {/* Paginación */}
      {!isLoading && grapes.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          itemsOnPage={grapes.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Modal Crear / Editar Uva */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="grape-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#141416] p-6 shadow-2xl text-neutral-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
              <h2
                id="grape-modal-title"
                className="font-serif text-lg font-bold text-zinc-100"
              >
                {editingGrape ? 'Editar uva' : 'Nueva uva'}
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
                <label htmlFor="grape-name" className="block text-neutral-300 font-medium mb-1">
                  Nombre <span className="text-rose-400">*</span>
                </label>
                <input
                  id="grape-name"
                  type="text"
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.name;
                        return next;
                      });
                    }
                  }}
                  placeholder="Ej: Malbec, Cabernet Franc..."
                  className={`w-full h-10 rounded-xl px-3 text-xs bg-[#0c0c0e] border text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors ${
                    formErrors.name ? 'border-rose-500' : 'border-white/10 focus:border-rose-500'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Color */}
              <div>
                <label htmlFor="grape-color" className="block text-neutral-300 font-medium mb-1">
                  Tipo de color <span className="text-rose-400">*</span>
                </label>
                <select
                  id="grape-color"
                  value={formData.colorType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, colorType: e.target.value }))
                  }
                  className="w-full h-10 rounded-xl px-3 text-xs bg-[#0c0c0e] border border-white/10 text-zinc-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {COLOR_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selects opcionales: Cuerpo, Taninos, Acidez */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="grape-body" className="block text-neutral-300 font-medium mb-1">
                    Cuerpo típico
                  </label>
                  <select
                    id="grape-body"
                    value={formData.typicalBody}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, typicalBody: e.target.value }))
                    }
                    className="w-full h-10 rounded-xl px-2.5 text-xs bg-[#0c0c0e] border border-white/10 text-zinc-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">Sin especificar</option>
                    {TYPICAL_BODY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="grape-tannins" className="block text-neutral-300 font-medium mb-1">
                    Taninos típicos
                  </label>
                  <select
                    id="grape-tannins"
                    value={formData.typicalTannins}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, typicalTannins: e.target.value }))
                    }
                    className="w-full h-10 rounded-xl px-2.5 text-xs bg-[#0c0c0e] border border-white/10 text-zinc-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">Sin especificar</option>
                    {TYPICAL_TANNINS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="grape-acidity" className="block text-neutral-300 font-medium mb-1">
                    Acidez típica
                  </label>
                  <select
                    id="grape-acidity"
                    value={formData.typicalAcidity}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, typicalAcidity: e.target.value }))
                    }
                    className="w-full h-10 rounded-xl px-2.5 text-xs bg-[#0c0c0e] border border-white/10 text-zinc-100 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="">Sin especificar</option>
                    {TYPICAL_ACIDITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="grape-desc" className="text-neutral-300 font-medium">
                    Descripción
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {formData.description.length} / 1000
                  </span>
                </div>
                <textarea
                  id="grape-desc"
                  rows={3}
                  maxLength={1000}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Notas organolépticas, origen y perfil de vinificación..."
                  className="w-full rounded-xl p-3 text-xs bg-[#0c0c0e] border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                />
                {formErrors.description && (
                  <p className="text-[11px] text-rose-400 mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Botones de acción */}
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
                  <span>{isSaving ? 'Guardando...' : editingGrape ? 'Actualizar' : 'Crear'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo de Confirmación para Eliminar */}
      <ConfirmDialog
        open={Boolean(deletingGrape)}
        title="¿Eliminar uva?"
        message={`¿Estás seguro de que deseás eliminar la uva "${deletingGrape?.name}"? Esta acción es irreversible.`}
        confirmLabel="Eliminar definitivamente"
        tone="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingGrape(null)}
      />
    </div>
  );
}
