import { useState, useEffect, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Save,
} from 'lucide-react';
import { getWineVintages, createWineVintage } from '../api/wineApi';
import { uploadVintageImage } from '../api/imageApi';
import { getGrapes } from '../api/grapeApi';
import ImageUploadField from './ImageUploadField';
import { imageUrl } from '../../../lib/image';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  GrapeResponseDto,
  CreateWineVintageRequestDto,
} from '../types';

export interface WineVintagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  wine: WineResponseDto | null;
  onVintageAdded?: () => void;
}

interface BlendRow {
  id: string;
  grapeId: number | '';
  percentage: number | '';
}

/**
 * Modal de administración de cosechas (Añadas) de una etiqueta oficial.
 * Muestra el historial de cosechas de la etiqueta y permite incorporar nuevas añadas al catálogo.
 */
export default function WineVintagesModal({
  isOpen,
  onClose,
  wine,
  onVintageAdded,
}: WineVintagesModalProps) {
  const [vintages, setVintages] = useState<WineVintageResponseDto[]>([]);
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Formulario de nueva cosecha
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newAlcohol, setNewAlcohol] = useState('14.0');
  const [newServingTemp, setNewServingTemp] = useState('16');
  const [newAgingAdvice, setNewAgingAdvice] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blend, setBlend] = useState<BlendRow[]>([]);

  // Estados de feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss del mensaje de éxito con limpieza estricta de timer
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const wineId = wine?.id;

  useEffect(() => {
    if (!isOpen || !wineId) return;
    let isMounted = true;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const [vintagesData, grapesData] = await Promise.all([
          getWineVintages(wineId),
          getGrapes({ pageSize: 100 }),
        ]);

        if (!isMounted) return;
        setVintages(vintagesData);
        setGrapesCatalog(grapesData);
        if (grapesData.length > 0) {
          setBlend((prev) => {
            if (prev.length > 0) return prev;
            const defaultGrape =
              grapesData.find((g) => g.name.toLowerCase().includes('malbec')) ?? grapesData[0];
            return [{ id: `vintage-blend-${defaultGrape.id}-${Date.now()}`, grapeId: defaultGrape.id, percentage: '' }];
          });
        }
      } catch {
        if (isMounted) {
          setServerError('No pudimos cargar el historial de cosechas.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, wineId]);

  if (!isOpen || !wine) return null;

  const getGrapeName = (grapeId: number): string => {
    return grapesCatalog.find((g) => g.id === grapeId)?.name ?? `Cepa #${grapeId}`;
  };

  const handleAddGrape = () => {
    if (grapesCatalog.length === 0 || blend.length >= 20) return;
    const remainingGrapes = grapesCatalog.filter(
      (g) => !blend.some((b) => b.grapeId === g.id),
    );
    if (remainingGrapes.length === 0) return;
    const nextGrape = remainingGrapes[0];
    setBlend((prev) => [
      ...prev,
      { id: `vintage-blend-${nextGrape.id}-${Date.now()}-${Math.random()}`, grapeId: nextGrape.id, percentage: '' },
    ]);
  };

  const handleRemoveGrape = (id: string) => {
    setBlend((prev) => prev.filter((b) => b.id !== id));
  };

  const handleGrapeChange = (id: string, grapeId: number) => {
    setBlend((prev) =>
      prev.map((row) => (row.id === id ? { ...row, grapeId } : row))
    );
  };

  const handlePercentageChange = (id: string, val: string) => {
    let cleanVal: number | '' = '';
    if (val !== '') {
      const num = Number(val);
      if (!isNaN(num)) {
        cleanVal = Math.max(0, Math.min(100, num));
      }
    }
    setBlend((prev) =>
      prev.map((row) => (row.id === id ? { ...row, percentage: cleanVal } : row))
    );
    if (errors.blend) setErrors((prev) => ({ ...prev, blend: '' }));
  };

  const totalPercentage = blend.reduce((acc, row) => {
    return acc + (typeof row.percentage === 'number' ? row.percentage : 0);
  }, 0);

  const isAddGrapeDisabled =
    blend.length >= 20 ||
    grapesCatalog.length === 0 ||
    blend.length >= grapesCatalog.length;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newYear.trim()) {
      newErrors.year = 'El año de cosecha es requerido.';
    } else {
      const y = Number(newYear);
      const curYear = new Date().getFullYear();
      if (isNaN(y) || y < 1900 || y > curYear + 1) {
        newErrors.year = `Año inválido (1900-${curYear + 1}).`;
      }
    }

    if (blend.length > 0) {
      if (totalPercentage > 100) {
        newErrors.blend = `La suma del corte (${totalPercentage}%) no puede superar el 100%.`;
      }
      const hasEmpty = blend.some((b) => b.grapeId === '');
      if (hasEmpty) {
        newErrors.blend = 'Elegí la cepa en todas las filas del corte.';
      }
      const hasInvalidPercentage = blend.some(
        (b) => typeof b.percentage === 'number' && (b.percentage < 0.01 || b.percentage > 100),
      );
      if (hasInvalidPercentage) {
        newErrors.blend = 'Cada porcentaje debe ser mayor a 0% y menor o igual a 100%.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateVintage = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const validGrapes = blend
        .filter((b) => typeof b.grapeId === 'number')
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: typeof b.percentage === 'number' ? b.percentage : null,
        }));

      const payload: CreateWineVintageRequestDto = {
        year: Number(newYear),
        alcoholContent: newAlcohol ? Number(newAlcohol) : null,
        servingTemperature: newServingTemp ? Number(newServingTemp) : null,
        agingAdvice: newAgingAdvice.trim() || null,
        grapes: validGrapes.length > 0 ? validGrapes : null,
      };

      const created = await createWineVintage(wine.id, payload);

      if (selectedFile) {
        try {
          await uploadVintageImage(wine.id, created.id, selectedFile);
        } catch {
          alert('Cosecha creada pero falló la subida de imagen. Podés reintentar editando la cosecha.');
        }
      }

      setVintages((prev) => [...prev, created]);
      setSuccessMessage(`Añada ${created.year ?? 'nueva'} registrada con éxito.`);
      setShowAddForm(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      onVintageAdded?.();
    } catch (err: unknown) {
      let detail: string | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }
      setServerError(detail ?? 'No se pudo registrar la nueva cosecha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#121015] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 text-amber-300 flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-neutral-100">
                Añadas y Cosechas
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Etiqueta: <strong className="text-neutral-200">{wine.name}</strong>
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

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {successMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {serverError && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Botón de Agregar Añada */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              {vintages.length} {vintages.length === 1 ? 'añada registrada' : 'añadas registradas'}
            </span>

            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 bg-rose-950/20 border border-rose-900/40 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva cosecha</span>
              </button>
            )}
          </div>

          {/* Formulario Desplegable para Crear Añada */}
          {showAddForm && (
            <form
              noValidate
              onSubmit={handleCreateVintage}
              className="p-5 rounded-2xl bg-stone-950/80 border border-white/10 space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-200 font-semibold">
                  Registrar Nueva Cosecha
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Año <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="h-10 w-full rounded-xl px-3 text-sm bg-zinc-900 text-zinc-100 border border-zinc-800"
                  />
                  {errors.year && <p className="text-[10px] text-rose-400 mt-1">{errors.year}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Alcohol (% vol)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newAlcohol}
                    onChange={(e) => setNewAlcohol(e.target.value)}
                    className="h-10 w-full rounded-xl px-3 text-sm bg-zinc-900 text-zinc-100 border border-zinc-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                    Temp. Servicio (°C)
                  </label>
                  <input
                    type="number"
                    value={newServingTemp}
                    onChange={(e) => setNewServingTemp(e.target.value)}
                    className="h-10 w-full rounded-xl px-3 text-sm bg-zinc-900 text-zinc-100 border border-zinc-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">
                  Notas de Guarda
                </label>
                <input
                  type="text"
                  value={newAgingAdvice}
                  onChange={(e) => setNewAgingAdvice(e.target.value)}
                  placeholder="Ej: Crianza 14 meses en roble francés"
                  className="h-10 w-full rounded-xl px-3 text-sm bg-zinc-900 text-zinc-100 border border-zinc-800"
                />
              </div>

              {/* Foto de la Cosecha / Añada (Opcional) */}
              <div className="pt-1">
                <ImageUploadField
                  value={previewUrl}
                  variant="bottle"
                  aspectRatio="bottle"
                  onUpload={async (file: File) => {
                    setSelectedFile(file);
                    const objectUrl = URL.createObjectURL(file);
                    setPreviewUrl(objectUrl);
                    return objectUrl;
                  }}
                  onDelete={async () => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  folder="vintages"
                  label="Foto de la botella o cosecha (opcional)"
                  helperText="Subí una foto nítida de la botella o etiqueta (JPG, PNG o WEBP, máx. 5 MB)."
                />
              </div>

              {/* Blend */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-neutral-400">
                    Corte de Varietales ({totalPercentage}%)
                    {totalPercentage > 100 && (
                      <span className="text-rose-400 ml-1.5 font-mono text-[10px]">
                        (Supera el 100%)
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddGrape}
                    disabled={isAddGrapeDisabled}
                    className="text-[11px] text-rose-300 hover:text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Cepa
                  </button>
                </div>
                {errors.blend && <p className="text-[10px] text-rose-400">{errors.blend}</p>}

                {grapesCatalog.length === 0 ? (
                  <p className="text-xs text-neutral-400 font-sans italic py-1">
                    Todavía no hay uvas cargadas en el catálogo oficial.
                  </p>
                ) : (
                  blend.map((row) => {
                    const availableGrapes = grapesCatalog.filter(
                      (g) =>
                        g.id === row.grapeId ||
                        !blend.some((b) => b.id !== row.id && b.grapeId === g.id),
                    );

                    return (
                      <div key={row.id} className="flex items-center gap-2">
                        <select
                          value={row.grapeId}
                          onChange={(e) => handleGrapeChange(row.id, Number(e.target.value))}
                          className="h-9 flex-1 rounded-xl px-3 text-xs bg-zinc-900 text-zinc-100 border border-zinc-800"
                        >
                          {availableGrapes.map((g) => (
                            <option key={g.id} value={g.id} className="bg-[#121015]">
                              {g.name}
                            </option>
                          ))}
                        </select>

                        <div className="relative w-24">
                          <input
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value={row.percentage}
                            onChange={(e) => handlePercentageChange(row.id, e.target.value)}
                            placeholder="%"
                            className="h-9 w-full rounded-xl pl-2 pr-6 text-xs font-mono bg-zinc-900 text-zinc-100 border border-zinc-800 text-right"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neutral-500 font-mono">
                            %
                          </span>
                        </div>

                        {blend.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGrape(row.id)}
                            className="text-neutral-500 hover:text-rose-400 p-1 cursor-pointer"
                            aria-label="Quitar uva de la cosecha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Cosecha'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Listado de Cosechas Existentes */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-stone-900/40 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : vintages.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-neutral-400">
              <Calendar className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm">Esta etiqueta aún no tiene cosechas registradas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vintages.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl bg-[#121015] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Miniatura de Cosecha */}
                    {(v.imageId || v.imageUrl) && (
                      <div className="w-14 h-20 rounded-xl overflow-hidden bg-stone-900 border border-white/10 shrink-0">
                        <img
                          src={imageUrl(v.imageId, 'bottle') ?? v.imageUrl!}
                          alt={`Cosecha ${v.year ?? ''}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-serif text-2xl font-semibold text-neutral-100">
                          {v.year ?? 'S/A'}
                        </span>

                        {/* Badge de Aprobación */}
                        {v.approvalStatus === 'Approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Aprobada</span>
                          </span>
                        )}
                        {v.approvalStatus === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/40">
                            <Clock className="w-3 h-3" />
                            <span>En Revisión</span>
                          </span>
                        )}
                        {v.approvalStatus === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-rose-950/40 text-rose-300 border border-rose-800/40">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Rechazada</span>
                          </span>
                        )}
                      </div>

                      {/* Ficha Rápida: Graduación, Temperatura, Guarda */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-sans">
                        {v.alcoholContent && (
                          <span>
                            <strong className="text-neutral-200">{v.alcoholContent}%</strong> alc.
                          </span>
                        )}
                        {v.servingTemperature && (
                          <span>
                            Servicio: <strong className="text-neutral-200">{v.servingTemperature} °C</strong>
                          </span>
                        )}
                        {v.agingAdvice && (
                          <span className="text-neutral-500 truncate max-w-xs">{v.agingAdvice}</span>
                        )}
                      </div>

                      {/* Desglose de Varietales */}
                      {v.grapes && v.grapes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {v.grapes.map((g) => (
                            <span
                              key={g.grapeId}
                              className="inline-block text-[10px] font-mono bg-stone-900 border border-white/5 px-2 py-0.5 rounded text-neutral-300"
                            >
                              {getGrapeName(g.grapeId)} {g.percentage ? `(${g.percentage}%)` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calificación */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 text-right">
                    <div className="flex items-center gap-1 text-sm text-amber-200 font-mono">
                      <Star className="w-4 h-4 fill-amber-300/30 text-amber-300" />
                      <span className="font-semibold">
                        {v.averageRating ? v.averageRating.toFixed(1) : '—'}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {v.reviewCount ?? 0} {v.reviewCount === 1 ? 'reseña' : 'reseñas'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

