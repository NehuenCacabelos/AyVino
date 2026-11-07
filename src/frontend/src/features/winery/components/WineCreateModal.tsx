import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { X, Plus, Trash2, Wine, AlertCircle, Save } from 'lucide-react';
import { getGrapes } from '../api/grapeApi';
import { createWine, getWineVintages, createWineVintage, getWineById } from '../api/wineApi';
import { uploadVintageImage } from '../api/imageApi';
import ImageUploadField from './ImageUploadField';
import ConfirmDialog from '../../admin/components/ConfirmDialog';
import {
  createNewBlendRow,
  calculateTotalPercentage,
  validateGrapeBlend,
  type BlendRow,
} from '../utils/grapeBlendUtils';
import type {
  GrapeResponseDto,
  WineResponseDto,
  WineType,
  CreateWineRequestDto,
  CreateWineVintageRequestDto,
} from '../types';

export interface WineCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  wineryId: number;
  locationId?: number | null;
  onWineCreated: (newWine: WineResponseDto) => void;
}

interface DuplicateVintageInfo {
  year: string;
  existingWineId?: number;
  existingVintageId?: number;
}

interface ConfirmAddVintageState {
  existingWineId: number;
  name: string;
  year: string;
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
 * Incluye metadatos de la etiqueta y configuración de la añada inaugural con blend varietal e imagen.
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Blend Varietal
  const [blend, setBlend] = useState<BlendRow[]>([]);

  // Feedback y Errores
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Estados para manejo de 409
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateVintageInfo | null>(null);
  const [confirmAddVintage, setConfirmAddVintage] = useState<ConfirmAddVintageState | null>(null);
  const [isAddingVintage, setIsAddingVintage] = useState(false);

  // Guarda contra doble envío
  const isSubmittingRef = useRef(false);

  const resetForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setName('');
    setWineType('Red');
    setDescription('');
    setYear(new Date().getFullYear().toString());
    setAlcoholContent('14.0');
    setServingTemperature('16');
    setAgingAdvice('');
    setErrors({});
    setServerError(null);
    setDuplicateInfo(null);
    setConfirmAddVintage(null);

    if (grapesCatalog.length > 0) {
      const defaultGrape =
        grapesCatalog.find((g) => g.name.toLowerCase().includes('malbec')) ?? grapesCatalog[0];
      setBlend([createNewBlendRow(defaultGrape.id, 0)]);
    } else {
      setBlend([]);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
            return [createNewBlendRow(defaultGrape.id, 0)];
          });
        }
      })
      .catch(() => {
        // Fallo silencioso de carga de uvas
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Reseteo al abrir y limpieza de URL al desmontar
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddGrape = () => {
    if (grapesCatalog.length === 0 || blend.length >= 20) return;
    const remainingGrapes = grapesCatalog.filter(
      (g) => !blend.some((b) => b.grapeId === g.id),
    );
    if (remainingGrapes.length === 0) return;
    const nextGrape = remainingGrapes[0];
    const newRow = createNewBlendRow(nextGrape.id, blend.length);
    setBlend((prev) => [...prev, newRow]);
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

  const totalPercentage = calculateTotalPercentage(blend);

  const isAddGrapeDisabled =
    blend.length >= 20 ||
    grapesCatalog.length === 0 ||
    blend.length >= grapesCatalog.length;

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
      const blendResult = validateGrapeBlend(blend);
      if (!blendResult.isValid && blendResult.errorMessage) {
        newErrors.blend = blendResult.errorMessage;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;
    setServerError(null);
    setDuplicateInfo(null);

    if (!validate()) return;

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const validGrapes = blend
        .filter((b) => typeof b.grapeId === 'number' && typeof b.percentage === 'number' && b.percentage > 0)
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: b.percentage as number,
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

      if (selectedFile) {
        try {
          const vintages = await getWineVintages(created.id);
          if (vintages && vintages.length > 0) {
            await uploadVintageImage(created.id, vintages[0].id, selectedFile);
          }
        } catch {
          // Fallo no crítico de imagen
        }
      }

      onWineCreated(created);
      resetForm();
      onClose();
    } catch (err: unknown) {
      if (isAxiosError<{ code?: string; detail?: string; title?: string; existingWineId?: number; existingVintageId?: number }>(err)) {
        const status = err.response?.status;
        const data = err.response?.data;
        const code = data?.code;

        if (status === 409) {
          if (code === 'WINE_VINTAGE_DUPLICATE') {
            setDuplicateInfo({
              year,
              existingWineId: data?.existingWineId,
              existingVintageId: data?.existingVintageId,
            });
            setServerError(`Ya registraste este vino con la cosecha ${year}.`);
            return;
          }

          if (code === 'WINE_EXISTS_ADD_VINTAGE' && data?.existingWineId) {
            setConfirmAddVintage({
              existingWineId: data.existingWineId,
              name: name.trim(),
              year,
            });
            return;
          }
        }

        const detail = data?.detail ?? data?.title;
        setServerError(detail ?? 'No se pudo crear la etiqueta de vino. Verificá los campos ingresados.');
      } else {
        setServerError('No se pudo crear la etiqueta de vino. Verificá los campos ingresados.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleConfirmAddVintage = async () => {
    if (!confirmAddVintage || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsAddingVintage(true);

    try {
      const validGrapes = blend
        .filter((b) => typeof b.grapeId === 'number' && typeof b.percentage === 'number' && b.percentage > 0)
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: b.percentage as number,
        }));

      const vintagePayload: CreateWineVintageRequestDto = {
        year: Number(confirmAddVintage.year),
        alcoholContent: alcoholContent ? Number(alcoholContent) : null,
        servingTemperature: servingTemperature ? Number(servingTemperature) : null,
        agingAdvice: agingAdvice.trim() || null,
        grapes: validGrapes.length > 0 ? validGrapes : null,
      };

      const createdVintage = await createWineVintage(confirmAddVintage.existingWineId, vintagePayload);

      if (selectedFile) {
        try {
          await uploadVintageImage(confirmAddVintage.existingWineId, createdVintage.id, selectedFile);
        } catch {
          // Fallo no crítico de imagen
        }
      }

      const updatedWine = await getWineById(confirmAddVintage.existingWineId);
      onWineCreated(updatedWine);
      setConfirmAddVintage(null);
      resetForm();
      onClose();
    } catch (err: unknown) {
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        setServerError(
          err.response?.data?.detail ??
            err.response?.data?.title ??
            'No se pudo agregar la cosecha al vino existente.'
        );
      } else {
        setServerError('No se pudo agregar la cosecha al vino existente.');
      }
      setConfirmAddVintage(null);
    } finally {
      isSubmittingRef.current = false;
      setIsAddingVintage(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#121015] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
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
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-stone-900/60 border border-white/5 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario Scrolleable */}
        <form noValidate onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {duplicateInfo && (
            <div
              role="alert"
              className="flex items-center justify-between p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs font-sans"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Ya registraste este vino con la cosecha {duplicateInfo.year}.</span>
              </div>
              <Link
                to={duplicateInfo.existingWineId ? `/bodega/vinos/${duplicateInfo.existingWineId}` : '/bodega/vinos'}
                onClick={handleClose}
                className="font-mono underline text-amber-300 hover:text-amber-100 font-semibold text-xs ml-4 shrink-0"
              >
                Gestionar vino
              </Link>
            </div>
          )}

          {serverError && !duplicateInfo && (
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
                    <option key={t.value} value={t.value} className="bg-[#121015] text-zinc-100">
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

            {/* Foto de la botella o añada (Opcional) */}
            <div className="pt-2">
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
                label="Foto de la botella o etiqueta (opcional)"
                helperText="Subí una foto nítida de la botella o etiqueta (JPG, PNG o WEBP, máx. 5 MB)."
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
                  Total:{' '}
                  <strong
                    className={
                      totalPercentage === 100
                        ? 'text-emerald-400 font-mono'
                        : totalPercentage > 100
                          ? 'text-rose-400 font-mono'
                          : 'text-amber-300 font-mono'
                    }
                  >
                    {totalPercentage}%
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddGrape}
                disabled={isAddGrapeDisabled}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 bg-rose-950/20 border border-rose-900/40 px-3 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar uva</span>
              </button>
            </div>

            {errors.blend && <p className="text-[11px] text-rose-400">{errors.blend}</p>}

            {grapesCatalog.length === 0 ? (
              <p className="text-xs text-neutral-400 font-sans italic py-2">
                Todavía no hay uvas cargadas en el catálogo oficial.
              </p>
            ) : (
              <div className="space-y-2.5">
                {blend.map((row) => {
                  const availableGrapes = grapesCatalog.filter(
                    (g) =>
                      g.id === row.grapeId ||
                      !blend.some((b) => b.id !== row.id && b.grapeId === g.id),
                  );

                  return (
                    <div key={row.id} className="flex items-center gap-3">
                      <select
                        value={row.grapeId}
                        onChange={(e) => handleGrapeChange(row.id, Number(e.target.value))}
                        className="h-11 flex-1 rounded-xl px-3 text-sm bg-zinc-900/50 text-zinc-100 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
                      >
                        {availableGrapes.map((g) => (
                          <option key={g.id} value={g.id} className="bg-[#141416] text-zinc-100">
                            {g.name} ({g.colorType === 'Red' ? 'Tinta' : 'Blanca'})
                          </option>
                        ))}
                      </select>

                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={row.percentage}
                          onChange={(e) => handlePercentageChange(row.id, e.target.value)}
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
                          onClick={() => handleRemoveGrape(row.id)}
                          className="w-10 h-10 rounded-xl bg-stone-900/60 border border-white/5 text-neutral-500 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                          aria-label="Quitar uva del corte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isAddingVintage}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isLoading || isAddingVintage}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-60"
            >
              {isLoading || isAddingVintage ? (
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

        {/* Diálogo de confirmación en caso de que el vino ya exista con otra cosecha */}
        {confirmAddVintage && (
          <ConfirmDialog
            open={true}
            title="Etiqueta existente"
            message={`Ya tenés «${confirmAddVintage.name}» en tu catálogo. ¿Querés agregar la cosecha ${confirmAddVintage.year} a ese vino?`}
            confirmLabel="Agregar cosecha"
            tone="default"
            isLoading={isAddingVintage}
            onConfirm={() => void handleConfirmAddVintage()}
            onCancel={() => setConfirmAddVintage(null)}
          />
        )}
      </div>
    </div>
  );
}

