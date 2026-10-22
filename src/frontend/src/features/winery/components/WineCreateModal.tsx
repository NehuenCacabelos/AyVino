import { useState, useEffect, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { X, Plus, Trash2, Wine, AlertCircle, Save } from 'lucide-react';
import { getGrapes } from '../api/grapeApi';
import { createWine } from '../api/wineApi';
import type {
  GrapeResponseDto,
  WineResponseDto,
  WineType,
  CreateWineRequestDto,
} from '../types';

export interface WineCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  wineryId: number;
  locationId?: number | null;
  onWineCreated: (newWine: WineResponseDto) => void;
}

interface BlendRow {
  grapeId: number | '';
  percentage: number | '';
}

const WINE_TYPES: { value: WineType; label: string }[] = [
  { value: 'Red', label: 'Tinto' },
  { value: 'White', label: 'Blanco' },
  { value: 'Rose', label: 'Rosado' },
  { value: 'Sparkling', label: 'Espumoso' },
  { value: 'Orange', label: 'Naranjo' },
];

/**
 * Modal de alta de nueva etiqueta oficial para la bodega.
 * Incluye metadatos de la etiqueta y configuración de la añada inaugural con blend varietal.
 */
export default function WineCreateModal({
  isOpen,
  onClose,
  wineryId,
  locationId,
  onWineCreated,
}: WineCreateModalProps) {
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);

  // Datos de la Etiqueta
  const [name, setName] = useState('');
  const [wineType, setWineType] = useState<WineType>('Red');
  const [description, setDescription] = useState('');

  // Datos de la Añada Inaugural
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [alcoholContent, setAlcoholContent] = useState<string>('14.0');
  const [servingTemperature, setServingTemperature] = useState<string>('16');
  const [agingAdvice, setAgingAdvice] = useState('');

  // Blend Varietal
  const [blend, setBlend] = useState<BlendRow[]>([]);

  // Feedback y Errores
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Cargar catálogo de cepas al abrir
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    getGrapes({ pageSize: 100 })
      .then((data) => {
        if (!isMounted) return;
        setGrapesCatalog(data);
        if (data.length > 0) {
          setBlend((prev) => {
            if (prev.length > 0) return prev;
            const defaultGrape =
              data.find((g) => g.name.toLowerCase().includes('malbec')) ?? data[0];
            return [{ grapeId: defaultGrape.id, percentage: 100 }];
          });
        }
      })
      .catch(() => {
        // Ignorar
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddGrape = () => {
    if (grapesCatalog.length === 0) return;
    const remainingGrapes = grapesCatalog.filter(
      (g) => !blend.some((b) => b.grapeId === g.id),
    );
    const nextGrape = remainingGrapes.length > 0 ? remainingGrapes[0].id : grapesCatalog[0].id;
    setBlend([...blend, { grapeId: nextGrape, percentage: '' }]);
  };

  const handleRemoveGrape = (index: number) => {
    setBlend(blend.filter((_, i) => i !== index));
  };

  const handleGrapeChange = (index: number, grapeId: number) => {
    const updated = [...blend];
    updated[index].grapeId = grapeId;
    setBlend(updated);
  };

  const handlePercentageChange = (index: number, val: string) => {
    const updated = [...blend];
    const num = val === '' ? '' : Math.max(0, Math.min(100, Number(val)));
    updated[index].percentage = num;
    setBlend(updated);
  };

  const totalPercentage = blend.reduce((acc, row) => {
    return acc + (typeof row.percentage === 'number' ? row.percentage : 0);
  }, 0);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del vino es obligatorio.';
    }

    if (!year.trim()) {
      newErrors.year = 'El año de cosecha es obligatorio.';
    } else {
      const y = Number(year);
      const currentYear = new Date().getFullYear();
      if (isNaN(y) || y < 1900 || y > currentYear + 1) {
        newErrors.year = `Año inválido (1900-${currentYear + 1}).`;
      }
    }

    if (alcoholContent.trim()) {
      const alc = Number(alcoholContent);
      if (isNaN(alc) || alc < 5 || alc > 25) {
        newErrors.alcoholContent = 'Graduación alcohólica inválida (5.0 a 25.0).';
      }
    }

    if (servingTemperature.trim()) {
      const temp = Number(servingTemperature);
      if (isNaN(temp) || temp < 0 || temp > 30) {
        newErrors.servingTemperature = 'Temperatura inválida (0 a 30 °C).';
      }
    }

    if (blend.length > 0) {
      if (totalPercentage > 100) {
        newErrors.blend = `La suma del corte (${totalPercentage}%) no puede superar el 100%.`;
      }
      const hasEmptyGrape = blend.some((b) => b.grapeId === '');
      if (hasEmptyGrape) {
        newErrors.blend = 'Seleccioná la cepa para todas las filas del corte.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const validGrapes = blend
        .filter((b) => typeof b.grapeId === 'number')
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: typeof b.percentage === 'number' ? b.percentage : null,
        }));

      const payload: CreateWineRequestDto = {
        name: name.trim(),
        wineType,
        wineryId,
        locationId: locationId ?? null,
        description: description.trim() || null,
        firstVintage: {
          year: Number(year),
          alcoholContent: alcoholContent ? Number(alcoholContent) : null,
          servingTemperature: servingTemperature ? Number(servingTemperature) : null,
          agingAdvice: agingAdvice.trim() || null,
          grapes: validGrapes.length > 0 ? validGrapes : null,
        },
      };

      const created = await createWine(payload);
      onWineCreated(created);
      onClose();
    } catch (err: unknown) {
      let detail: string | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }
      setServerError(
        detail ?? 'No se pudo crear la etiqueta de vino. Verificá los campos ingresados.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#141416] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header del Modal */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 text-rose-300 flex items-center justify-center shadow-sm">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-neutral-100">
                Nueva Etiqueta Oficial
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Creá la ficha técnica y definí su primera cosecha.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-stone-900/60 border border-white/5 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario Scrolleable */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {serverError && (
            <div
              role="alert"
              className="flex items-center gap-3 p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs font-sans"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Sección 1: Datos de la Etiqueta */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
              1. Identidad de la Etiqueta
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Nombre del Vino <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ej: Gran Reserva Malbec"
                  className={`h-12 w-full rounded-xl px-4 text-sm bg-zinc-900/50 text-zinc-100 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                    errors.name ? 'border-rose-500' : 'border-zinc-800/80 focus:border-zinc-500'
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Tipo de Vino
                </label>
                <select
                  value={wineType}
                  onChange={(e) => setWineType(e.target.value as WineType)}
                  className="h-12 w-full rounded-xl px-3 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors cursor-pointer"
                >
                  {WINE_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#141416] text-zinc-100">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Notas y Descripción <span className="text-neutral-500">(Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Perfil de la etiqueta, viñedos seleccionados, etc."
                className="w-full rounded-xl p-3 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Sección 2: Cosecha Inaugural */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
              2. Primera Añada / Cosecha
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Año de Cosecha <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2022"
                  className="h-12 w-full rounded-xl px-4 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
                />
                {errors.year && <p className="text-[11px] text-rose-400 mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Graduación (% vol)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={alcoholContent}
                  onChange={(e) => setAlcoholContent(e.target.value)}
                  placeholder="14.0"
                  className="h-12 w-full rounded-xl px-4 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
                />
                {errors.alcoholContent && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.alcoholContent}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  value={servingTemperature}
                  onChange={(e) => setServingTemperature(e.target.value)}
                  placeholder="16"
                  className="h-12 w-full rounded-xl px-4 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
                />
                {errors.servingTemperature && (
                  <p className="text-[11px] text-rose-400 mt-1">{errors.servingTemperature}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1.5">
                Potencial de Guarda y Crianza
              </label>
              <input
                type="text"
                value={agingAdvice}
                onChange={(e) => setAgingAdvice(e.target.value)}
                placeholder="Ej: 12 meses en barricas de roble francés, guarda de 8 años."
                className="h-12 w-full rounded-xl px-4 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          {/* Sección 3: Blend / Corte Varietal */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                  3. Composición Varietal (Blend)
                </span>
                <span className="text-xs text-neutral-500 font-sans">
                  Total asignado:{' '}
                  <strong
                    className={
                      totalPercentage === 100
                        ? 'text-emerald-400 font-mono'
                        : 'text-amber-300 font-mono'
                    }
                  >
                    {totalPercentage}%
                  </strong>{' '}
                  / 100%
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddGrape}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir uva</span>
              </button>
            </div>

            {errors.blend && <p className="text-[11px] text-rose-400">{errors.blend}</p>}

            <div className="space-y-2.5">
              {blend.map((row, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <select
                    value={row.grapeId}
                    onChange={(e) => handleGrapeChange(idx, Number(e.target.value))}
                    className="h-11 flex-1 rounded-xl px-3 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    {grapesCatalog.map((g) => (
                      <option key={g.id} value={g.id} className="bg-[#141416] text-zinc-100">
                        {g.name} ({g.colorType === 'Red' ? 'Tinta' : 'Blanca'})
                      </option>
                    ))}
                  </select>

                  <div className="relative w-28">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={row.percentage}
                      onChange={(e) => handlePercentageChange(idx, e.target.value)}
                      placeholder="%"
                      className="h-11 w-full rounded-xl pl-3 pr-7 text-sm font-mono bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                      %
                    </span>
                  </div>

                  {blend.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGrape(idx)}
                      className="w-10 h-10 rounded-xl bg-stone-900/60 border border-white/5 text-neutral-500 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-rose-200/30 border-t-rose-100 rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Publicar Etiqueta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

