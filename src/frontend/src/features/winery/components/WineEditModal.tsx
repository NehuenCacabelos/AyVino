import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { X, Save, AlertCircle, Wine } from 'lucide-react';
import { updateWine } from '../api/wineApi';
import type { WineryCatalogWineDto } from '../types/catalog';
import type { WineType, UpdateWineRequestDto } from '../types';

export interface WineEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  wine: WineryCatalogWineDto | null;
  wineryId: number;
  locationId?: number | null;
  onWineUpdated: () => void;
}

const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: 'Red', label: 'Tinto' },
  { value: 'White', label: 'Blanco' },
  { value: 'Rose', label: 'Rosado' },
  { value: 'Sparkling', label: 'Espumoso' },
  { value: 'Orange', label: 'Naranjo' },
];

interface WineEditFormProps {
  wine: WineryCatalogWineDto;
  wineryId: number;
  locationId?: number | null;
  onClose: () => void;
  onWineUpdated: () => void;
}

function WineEditForm({
  wine,
  wineryId,
  locationId,
  onClose,
  onWineUpdated,
}: WineEditFormProps) {
  const [name, setName] = useState(wine.name);
  const [wineType, setWineType] = useState<WineType>(
    (wine.wineType as WineType) || 'Red'
  );
  const [description, setDescription] = useState(wine.description ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('El nombre del vino es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: UpdateWineRequestDto = {
      name: name.trim(),
      wineType,
      wineryId,
      locationId: locationId ?? null,
      description: description.trim() ? description.trim() : null,
    };

    try {
      await updateWine(wine.id, payload);
      onWineUpdated();
      onClose();
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.detail) {
        setErrorMessage(err.response.data.detail as string);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Ocurrió un error inesperado al actualizar la etiqueta.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-lg rounded-2xl bg-[#141217] border border-white/10 p-6 shadow-2xl shadow-black/80 space-y-5 animate-in zoom-in-95">
      {/* Cabecera del Modal */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/40 text-rose-300">
            <Wine className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="edit-wine-modal-title"
              className="font-serif text-lg font-semibold text-zinc-100"
            >
              Editar etiqueta
            </h2>
            <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Información general de la etiqueta
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mensaje de Error */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre de la Etiqueta */}
        <div className="space-y-1.5">
          <label
            htmlFor="edit-wine-name"
            className="text-xs font-mono uppercase tracking-wider text-neutral-300 block"
          >
            Nombre de la etiqueta <span className="text-rose-400">*</span>
          </label>
          <input
            id="edit-wine-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
        </div>

        {/* Tipo de Vino */}
        <div className="space-y-1.5">
          <label
            htmlFor="edit-wine-type"
            className="text-xs font-mono uppercase tracking-wider text-neutral-300 block"
          >
            Tipo de vino <span className="text-rose-400">*</span>
          </label>
          <select
            id="edit-wine-type"
            value={wineType}
            onChange={(e) => setWineType(e.target.value as WineType)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-rose-500/50 cursor-pointer"
          >
            {WINE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label
            htmlFor="edit-wine-description"
            className="text-xs font-mono uppercase tracking-wider text-neutral-300 block"
          >
            Notas de cata o descripción
          </label>
          <textarea
            id="edit-wine-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describí las características sensoriales o el terroir de esta etiqueta..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-xs text-zinc-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
          />
        </div>

        {/* Acciones de Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-semibold uppercase tracking-wider text-white transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function WineEditModal({
  isOpen,
  onClose,
  wine,
  wineryId,
  locationId,
  onWineUpdated,
}: WineEditModalProps) {
  if (!isOpen || !wine) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-wine-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
    >
      <WineEditForm
        key={`${wine.id}-${wine.name}`}
        wine={wine}
        wineryId={wineryId}
        locationId={locationId}
        onClose={onClose}
        onWineUpdated={onWineUpdated}
      />
    </div>
  );
}
