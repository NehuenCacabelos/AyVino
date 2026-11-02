import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  X,
  Plus,
  Trash2,
  Wine,
  AlertCircle,
  AlertTriangle,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Camera,
} from 'lucide-react';
import { getGrapes } from '../api/grapeApi';
import {
  createWine,
  getWineVintages,
  createWineVintage,
  matchWine,
  putMyVintageImage,
  extractConflictWineExtensions,
} from '../api/wineApi';
import { getWineries } from '../api/wineryApi';
import { uploadVintageImage } from '../api/imageApi';
import ImageUploadField from './ImageUploadField';
import type {
  GrapeResponseDto,
  WineResponseDto,
  WineType,
  CreateWineRequestDto,
  WineMatchResult,
  WineryResponseDto,
} from '../types';

export interface WineCreationResult {
  outcome: 'created' | 'adopted' | 'vintage-added';
  wine: { id: number; name: string };
  vintageId: number;
  photoUploaded: boolean;
}

export interface WineryModeProps {
  mode?: 'winery';
  isOpen: boolean;
  onClose: () => void;
  wineryId: number;
  locationId?: number | null;
  onWineCreated: (newWine: WineResponseDto) => void;
  initialName?: never;
  onResolved?: never;
}

export interface UserModeProps {
  mode: 'user';
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onResolved: (result: WineCreationResult) => void;
  wineryId?: never;
  locationId?: never;
  onWineCreated?: never;
}

export type WineCreateModalProps = WineryModeProps | UserModeProps;

interface BlendRow {
  id: string;
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
 * Modal de creación de vino unificado:
 * - Modo Bodega ('winery'): Alta de etiquetas oficiales para bodegas certificadas (comportamiento previo).
 * - Modo Usuario ('user'): Alta colaborativa con coincidencia en vivo, adopción y carga de foto personal.
 */
export default function WineCreateModal(props: WineCreateModalProps) {
  const { isOpen, onClose } = props;
  const isUserMode = props.mode === 'user';
  const navigate = useNavigate();

  // Catálogos
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);
  const [approvedWineries, setApprovedWineries] = useState<WineryResponseDto[]>([]);

  // Datos básicos del Vino
  const [name, setName] = useState(props.initialName ?? '');
  const [wineryName, setWineryName] = useState('');
  const [wineType, setWineType] = useState<WineType | ''>(isUserMode ? '' : 'Red');
  const [description, setDescription] = useState('');

  // Cosecha
  const [year, setYear] = useState<string>(isUserMode ? '' : new Date().getFullYear().toString());
  const [isNoVintage, setIsNoVintage] = useState(false);

  // Datos Enológicos ("Agregar más datos" en modo usuario)
  const [alcoholContent, setAlcoholContent] = useState<string>(isUserMode ? '' : '14.0');
  const [servingTemperature, setServingTemperature] = useState<string>(isUserMode ? '' : '16');
  const [agingAdvice, setAgingAdvice] = useState('');
  const [blend, setBlend] = useState<BlendRow[]>([]);
  const [isMoreDataOpen, setIsMoreDataOpen] = useState(false);

  // Foto (opcional)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Sugerencias de bodegas
  const [showWinerySuggestions, setShowWinerySuggestions] = useState(false);

  // Estado de Coincidencia en Vivo (Modo usuario)
  const [matchStatus, setMatchStatus] = useState<'idle' | 'checking' | 'matched' | 'error'>('idle');
  const [matchResult, setMatchResult] = useState<WineMatchResult | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Feedback y Errores de envío
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Estado Final Completado (para mostrar pantalla de éxito dentro del modal)
  const [completedResult, setCompletedResult] = useState<{
    outcome: 'created' | 'adopted' | 'vintage-added';
    wine: { id: number; name: string };
    vintageId: number;
    photoWarning?: string;
  } | null>(null);

  // Sincronizar initialName si cambia externamente (patrón React: ajustar estado durante el render)
  const [prevInitialName, setPrevInitialName] = useState(props.initialName);
  if (props.initialName !== prevInitialName) {
    setPrevInitialName(props.initialName);
    setName(props.initialName ?? '');
  }

  // Cargar catálogo de cepas al abrir
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    getGrapes({ pageSize: 100 })
      .then((data) => {
        if (!isMounted) return;
        setGrapesCatalog(data);
        if (!isUserMode && data.length > 0) {
          setBlend((prev) => {
            if (prev.length > 0) return prev;
            const defaultGrape =
              data.find((g) => g.name.toLowerCase().includes('malbec')) ?? data[0];
            return [{ id: `blend-${defaultGrape.id}-${Date.now()}`, grapeId: defaultGrape.id, percentage: '' }];
          });
        }
      })
      .catch(() => {
        // Fallo silencioso de carga de uvas
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isUserMode]);

  // Cargar bodegas aprobadas para autocompletado en modo usuario
  useEffect(() => {
    if (!isOpen || !isUserMode) return;
    let isMounted = true;

    getWineries({ status: 'Approved', pageSize: 100 })
      .then((data) => {
        if (!isMounted) return;
        setApprovedWineries(data);
      })
      .catch(() => {
        // Fallo silencioso: si falla o no está permitida, sin sugerencias
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isUserMode]);

  // Sugerencias filtradas de bodegas
  const winerySuggestions = useMemo(() => {
    if (!isUserMode || !wineryName.trim()) return [];
    const q = wineryName.trim().toLowerCase();
    return approvedWineries
      .filter((w) => w.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [isUserMode, wineryName, approvedWineries]);

  // Debounce para Coincidencia en Vivo (Modo Usuario)
  useEffect(() => {
    if (!isOpen || !isUserMode || completedResult) return;

    const trimmedName = name.trim();
    const trimmedWinery = wineryName.trim();
    const hasYear = isNoVintage || (year.trim() !== '' && !isNaN(Number(year)));

    if (!trimmedName || !trimmedWinery || !wineType || !hasYear) {
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(() => {
      setMatchStatus('checking');
      setMatchError(null);

      matchWine(
        {
          name: trimmedName,
          wineryName: trimmedWinery,
          wineType,
          year: isNoVintage ? null : Number(year),
        },
        abortController.signal
      )
        .then((res) => {
          setMatchResult(res);
          setMatchStatus('matched');
        })
        .catch(() => {
          if (abortController.signal.aborted) return;
          setMatchStatus('error');
          setMatchError('No se pudo verificar la existencia del vino. Podés reintentar.');
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [isOpen, isUserMode, name, wineryName, wineType, year, isNoVintage, completedResult]);

  if (!isOpen) return null;

  // Modificadores de Corte Varietal
  const handleAddGrape = () => {
    if (grapesCatalog.length === 0 || blend.length >= 20) return;
    const remainingGrapes = grapesCatalog.filter(
      (g) => !blend.some((b) => b.grapeId === g.id)
    );
    if (remainingGrapes.length === 0) return;
    const nextGrape = remainingGrapes[0];
    setBlend((prev) => [
      ...prev,
      { id: `blend-${nextGrape.id}-${Date.now()}-${Math.random()}`, grapeId: nextGrape.id, percentage: '' },
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

  // Validación común y específica
  const validateCommon = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del vino es obligatorio.';
    }

    if (isUserMode && !wineryName.trim()) {
      newErrors.winery = 'La bodega es obligatoria.';
    }

    if (!wineType) {
      newErrors.wineType = 'Seleccioná el tipo de vino.';
    }

    if (!isNoVintage) {
      if (!year.trim()) {
        newErrors.year = 'El año de cosecha es obligatorio.';
      } else {
        const y = Number(year);
        const currentYear = new Date().getFullYear();
        if (isNaN(y) || y < 1900 || y > currentYear + 1) {
          newErrors.year = `Año inválido (1900-${currentYear + 1}).`;
        }
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
        newErrors.blend = 'Elegí la cepa para todas las filas del corte.';
      }
      const hasInvalidPercentage = blend.some(
        (b) => typeof b.percentage === 'number' && (b.percentage < 0.01 || b.percentage > 100)
      );
      if (hasInvalidPercentage) {
        newErrors.blend = 'Cada porcentaje debe ser mayor a 0% y menor o igual a 100%.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Envío en Modo Bodega (Official)
  const handleWinerySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!props.onWineCreated) return;
    setServerError(null);

    if (!validateCommon()) return;

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
        wineType: wineType as WineType,
        wineryId: props.wineryId,
        locationId: props.locationId ?? null,
        description: description.trim() || null,
        firstVintage: {
          year: isNoVintage ? null : Number(year),
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
          alert('Vino creado pero falló la subida de imagen. Podés subirla editando la cosecha.');
        }
      }

      props.onWineCreated(created);
      onClose();
    } catch (err: unknown) {
      let detail: string | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }
      setServerError(
        detail ?? 'No se pudo crear la etiqueta de vino. Verificá los campos ingresados.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Envío en Modo Usuario (Community)
  const handleUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!props.onResolved) return;
    setServerError(null);

    if (!validateCommon()) return;

    setIsLoading(true);

    try {
      let finalOutcome: 'created' | 'adopted' | 'vintage-added' = 'created';
      let resolvedWineId: number;
      let resolvedWineName: string;
      let resolvedVintageId: number;

      const validGrapes = blend
        .filter((b) => typeof b.grapeId === 'number')
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: typeof b.percentage === 'number' ? b.percentage : null,
        }));

      // 1. Caso 'adopted': Vino y cosecha ya existentes
      if (matchResult?.wine && matchResult.vintage) {
        finalOutcome = 'adopted';
        resolvedWineId = matchResult.wine.id;
        resolvedWineName = matchResult.wine.name;
        resolvedVintageId = matchResult.vintage.id;
      }
      // 2. Caso 'vintage-added': Vino existente, cosecha nueva
      else if (matchResult?.wine && !matchResult.vintage) {
        finalOutcome = 'vintage-added';
        resolvedWineId = matchResult.wine.id;
        resolvedWineName = matchResult.wine.name;

        const newVintage = await createWineVintage(resolvedWineId, {
          year: isNoVintage ? null : Number(year),
          alcoholContent: alcoholContent ? Number(alcoholContent) : null,
          servingTemperature: servingTemperature ? Number(servingTemperature) : null,
          agingAdvice: agingAdvice.trim() || null,
          grapes: validGrapes.length > 0 ? validGrapes : null,
        });
        resolvedVintageId = newVintage.id;
      }
      // 3. Caso 'created': Crear vino y cosecha
      else {
        finalOutcome = 'created';
        try {
          const created = await createWine({
            name: name.trim(),
            wineType: wineType as WineType,
            wineryNameText: wineryName.trim(),
            description: description.trim() || null,
            firstVintage: {
              year: isNoVintage ? null : Number(year),
              alcoholContent: alcoholContent ? Number(alcoholContent) : null,
              servingTemperature: servingTemperature ? Number(servingTemperature) : null,
              agingAdvice: agingAdvice.trim() || null,
              grapes: validGrapes.length > 0 ? validGrapes : null,
            },
          });
          resolvedWineId = created.id;
          resolvedWineName = created.name;

          const vintages = await getWineVintages(created.id);
          resolvedVintageId = vintages && vintages.length > 0 ? vintages[0].id : 0;
        } catch (err: unknown) {
          // Manejo de conflicto 409
          const conflictExt = extractConflictWineExtensions(err);
          if (conflictExt && conflictExt.existingWineId && conflictExt.existingVintageId) {
            finalOutcome = 'adopted';
            resolvedWineId = conflictExt.existingWineId;
            resolvedWineName = name.trim();
            resolvedVintageId = conflictExt.existingVintageId;
          } else {
            throw err;
          }
        }
      }

      // Subida opcional de imagen personal
      let photoUploaded = false;
      let photoWarning: string | undefined;

      if (selectedFile && resolvedVintageId > 0) {
        try {
          await putMyVintageImage(resolvedWineId, resolvedVintageId, selectedFile);
          photoUploaded = true;
        } catch {
          photoWarning = 'El vino se cargó pero la foto no se pudo subir; podés agregarla desde la ficha.';
        }
      }

      // Guardar resultado y notificar
      setCompletedResult({
        outcome: finalOutcome,
        wine: { id: resolvedWineId, name: resolvedWineName },
        vintageId: resolvedVintageId,
        photoWarning,
      });

      props.onResolved({
        outcome: finalOutcome,
        wine: { id: resolvedWineId, name: resolvedWineName },
        vintageId: resolvedVintageId,
        photoUploaded,
      });
    } catch (err: unknown) {
      let detail: string | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }
      setServerError(detail ?? 'No se pudo guardar el vino. Verificá los datos ingresados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForAnother = () => {
    setName('');
    setWineryName('');
    setWineType('');
    setYear('');
    setIsNoVintage(false);
    setAlcoholContent('');
    setServingTemperature('');
    setAgingAdvice('');
    setDescription('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setBlend([]);
    setIsMoreDataOpen(false);
    setErrors({});
    setServerError(null);
    setCompletedResult(null);
    setMatchStatus('idle');
    setMatchResult(null);
  };

  // Determinación de visibilidad de secciones en Modo Usuario
  const isAdopted = matchResult?.wine && matchResult.vintage;
  const isVintageAdded = matchResult?.wine && !matchResult.vintage;

  // Botón dinámico según coincidencia
  const getActionLabel = () => {
    if (isLoading) return 'Guardando...';
    if (isAdopted) return 'Usar este vino';
    if (isVintageAdded) return `Agregar la cosecha ${isNoVintage ? 'Sin añada' : year} a este vino`;
    return 'Cargar vino';
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
                {isUserMode ? 'Cargar un vino' : 'Nueva Etiqueta Oficial'}
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                {isUserMode
                  ? 'Completá los datos básicos para buscarlo en la comunidad o cargarlo.'
                  : 'Creá la ficha técnica y definí su primera cosecha.'}
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

        {/* Pantalla Final de Éxito en Modo Usuario */}
        {isUserMode && completedResult ? (
          <div className="p-8 flex-1 overflow-y-auto space-y-6 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="font-serif text-2xl font-bold text-neutral-100">
                {completedResult.outcome === 'adopted'
                  ? '¡Vino adoptado!'
                  : completedResult.outcome === 'vintage-added'
                  ? '¡Cosecha agregada!'
                  : '¡Vino cargado!'}
              </h3>
              <p className="text-sm text-neutral-300 font-sans leading-relaxed">
                {completedResult.outcome === 'created' &&
                  `Cargaste «${completedResult.wine.name}». Queda como «Sin verificar» hasta que otros usuarios lo usen o un administrador lo apruebe.`}
                {completedResult.outcome === 'adopted' && 'Este vino ya estaba cargado: lo usamos.'}
                {completedResult.outcome === 'vintage-added' &&
                  `Se agregó la cosecha a «${completedResult.wine.name}».`}
              </p>
            </div>

            {completedResult.photoWarning && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs flex items-center gap-2 max-w-md text-left">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{completedResult.photoWarning}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 w-full">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/vinos/${completedResult.wine.id}`);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white font-medium text-sm hover:brightness-110 transition-all shadow-md cursor-pointer"
              >
                Ver ficha
              </button>
              <button
                type="button"
                onClick={handleResetForAnother}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-200 text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
              >
                Cargar otro
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Formulario */
          <form
            onSubmit={isUserMode ? handleUserSubmit : handleWinerySubmit}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {serverError && (
              <div
                role="alert"
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Aviso de Coincidencia en Vivo (Modo Usuario) */}
            {isUserMode && (
              <>
                {matchStatus === 'checking' && (
                  <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-neutral-300 text-xs flex items-center gap-2 animate-pulse">
                    <Sparkles className="w-4 h-4 text-rose-400 animate-spin" />
                    <span>Verificando si este vino ya existe en la comunidad...</span>
                  </div>
                )}

                {matchStatus === 'matched' && isAdopted && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-emerald-300">¡Vino y cosecha encontrados!</p>
                      <p className="text-neutral-300 leading-relaxed">
                        Encontramos <span className="text-white font-medium">«{matchResult?.wine?.name}»</span> de{' '}
                        <span className="text-white font-medium">{matchResult?.wine?.winery}</span> con la cosecha{' '}
                        <span className="text-white font-medium">
                          {matchResult?.vintage?.year ? matchResult.vintage.year : 'Sin añada'}
                        </span>
                        . Al continuar, vas a usar esta ficha existente.
                      </p>
                    </div>
                  </div>
                )}

                {matchStatus === 'matched' && isVintageAdded && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-amber-300">Vino existente, cosecha nueva</p>
                      <p className="text-neutral-300 leading-relaxed">
                        El vino <span className="text-white font-medium">«{matchResult?.wine?.name}»</span> ya existe, pero la
                        cosecha <span className="text-white font-medium">{isNoVintage ? 'Sin añada' : year}</span> no está registrada.
                        Se sumará como una nueva cosecha comunitaria.
                      </p>
                    </div>
                  </div>
                )}

                {matchStatus === 'error' && matchError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{matchError}</span>
                  </div>
                )}
              </>
            )}

            {/* Datos Básicos */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                {isUserMode ? 'Datos del Vino' : '1. Identidad de la Etiqueta'}
              </span>

              {/* Nombre del Vino */}
              <div>
                <label htmlFor="wine-name" className="block text-xs font-medium text-neutral-300 mb-1">
                  Nombre del Vino <span className="text-rose-400">*</span>
                </label>
                <input
                  id="wine-name"
                  type="text"
                  value={name}
                  disabled={Boolean(isAdopted)}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    if (matchStatus !== 'idle') {
                      setMatchStatus('idle');
                      setMatchResult(null);
                    }
                  }}
                  placeholder="Ej: Gran Reserva Malbec"
                  className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Bodega (solo en modo usuario con autocomplete) */}
              {isUserMode && (
                <div className="relative">
                  <label htmlFor="wine-winery" className="block text-xs font-medium text-neutral-300 mb-1">
                    Bodega <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="wine-winery"
                    type="text"
                    value={wineryName}
                    disabled={Boolean(isAdopted)}
                    onChange={(e) => {
                      setWineryName(e.target.value);
                      setShowWinerySuggestions(true);
                      if (errors.winery) setErrors((prev) => ({ ...prev, winery: '' }));
                      if (matchStatus !== 'idle') {
                        setMatchStatus('idle');
                        setMatchResult(null);
                      }
                    }}
                    onFocus={() => setShowWinerySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowWinerySuggestions(false), 200)}
                    placeholder="Ej: Catena Zapata"
                    className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  />
                  {errors.winery && <p className="text-xs text-rose-400 mt-1">{errors.winery}</p>}

                  {showWinerySuggestions && winerySuggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-[#1a171e] border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {winerySuggestions.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setWineryName(w.name);
                            setShowWinerySuggestions(false);
                            if (errors.winery) setErrors((prev) => ({ ...prev, winery: '' }));
                            if (matchStatus !== 'idle') {
                              setMatchStatus('idle');
                              setMatchResult(null);
                            }
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-neutral-200 hover:bg-white/10 cursor-pointer flex items-center justify-between"
                        >
                          <span>{w.name}</span>
                          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-mono">Oficial</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tipo de Vino y Cosecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="wine-type" className="block text-xs font-medium text-neutral-300 mb-1">
                    Tipo de Vino <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="wine-type"
                    value={wineType}
                    disabled={Boolean(isAdopted)}
                    onChange={(e) => {
                      setWineType(e.target.value as WineType);
                      if (errors.wineType) setErrors((prev) => ({ ...prev, wineType: '' }));
                      if (matchStatus !== 'idle') {
                        setMatchStatus('idle');
                        setMatchResult(null);
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUserMode && <option value="">Seleccionar tipo...</option>}
                    {WINE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {errors.wineType && <p className="text-xs text-rose-400 mt-1">{errors.wineType}</p>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="wine-year" className="block text-xs font-medium text-neutral-300">
                      Año de Cosecha {!isNoVintage && <span className="text-rose-400">*</span>}
                    </label>
                    {isUserMode && (
                      <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isNoVintage}
                          disabled={Boolean(isAdopted)}
                          onChange={(e) => {
                            setIsNoVintage(e.target.checked);
                            if (e.target.checked) setYear('');
                            if (errors.year) setErrors((prev) => ({ ...prev, year: '' }));
                            if (matchStatus !== 'idle') {
                              setMatchStatus('idle');
                              setMatchResult(null);
                            }
                          }}
                          className="rounded border-white/20 bg-neutral-900 text-rose-600 focus:ring-0"
                        />
                        <span>Sin añada</span>
                      </label>
                    )}
                  </div>
                  <input
                    id="wine-year"
                    type="number"
                    disabled={isNoVintage || Boolean(isAdopted)}
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      if (errors.year) setErrors((prev) => ({ ...prev, year: '' }));
                      if (matchStatus !== 'idle') {
                        setMatchStatus('idle');
                        setMatchResult(null);
                      }
                    }}
                    placeholder={isNoVintage ? 'Sin añada' : 'Ej: 2020'}
                    className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  />
                  {errors.year && <p className="text-xs text-rose-400 mt-1">{errors.year}</p>}
                </div>
              </div>

              {/* Foto de la Botella (Modo Usuario: opcional, directa) */}
              {isUserMode && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Foto de tu botella <span className="text-neutral-500">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {previewUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 bg-neutral-900 shrink-0">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 bg-neutral-900/40 hover:bg-neutral-900/70 text-neutral-300 text-xs cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 text-rose-300" />
                      <span>{previewUrl ? 'Cambiar foto' : 'Subir o sacar foto'}</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedFile(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* En Modo Bodega: Campos Enológicos y Foto Oficial */}
            {!isUserMode && (
              <>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                    Notas y Descripción
                  </span>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Perfil de la etiqueta, viñedos seleccionados, etc."
                    className="w-full rounded-xl p-3 text-sm bg-neutral-900/60 text-zinc-100 border border-white/10 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                    2. Datos de Cosecha & Enología
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Graduación (% vol)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={alcoholContent}
                        onChange={(e) => setAlcoholContent(e.target.value)}
                        placeholder="14.0"
                        className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                      />
                      {errors.alcoholContent && <p className="text-xs text-rose-400 mt-1">{errors.alcoholContent}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">Temperatura (°C)</label>
                      <input
                        type="number"
                        value={servingTemperature}
                        onChange={(e) => setServingTemperature(e.target.value)}
                        placeholder="16"
                        className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                      />
                      {errors.servingTemperature && <p className="text-xs text-rose-400 mt-1">{errors.servingTemperature}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Potencial de Guarda</label>
                    <input
                      type="text"
                      value={agingAdvice}
                      onChange={(e) => setAgingAdvice(e.target.value)}
                      placeholder="Ej: 12 meses en roble, guarda de 8 años."
                      className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                    />
                  </div>
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
              </>
            )}

            {/* En Modo Usuario: Desplegable Opcional de Datos Enológicos (solo si no es adoptado) */}
            {isUserMode && !isAdopted && (
              <div className="border-t border-white/10 pt-4 space-y-4">
                <button
                  type="button"
                  onClick={() => setIsMoreDataOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white py-1 cursor-pointer transition-colors"
                >
                  <span>Agregar más datos (opcional)</span>
                  {isMoreDataOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isMoreDataOpen && (
                  <div className="space-y-4 pt-2">
                    {/* Descripción solo si no es vintage-added */}
                    {!isVintageAdded && (
                      <div>
                        <label htmlFor="wine-desc" className="block text-xs font-medium text-neutral-300 mb-1">
                          Descripción o historia del vino
                        </label>
                        <textarea
                          id="wine-desc"
                          rows={2}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Detalles sobre el terruño, estilo o notas..."
                          className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500 resize-none"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="wine-alcohol" className="block text-xs font-medium text-neutral-300 mb-1">
                          Graduación alcohólica (% vol)
                        </label>
                        <input
                          id="wine-alcohol"
                          type="number"
                          step="0.1"
                          value={alcoholContent}
                          onChange={(e) => setAlcoholContent(e.target.value)}
                          placeholder="Ej: 14.2"
                          className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                        />
                        {errors.alcoholContent && <p className="text-xs text-rose-400 mt-1">{errors.alcoholContent}</p>}
                      </div>
                      <div>
                        <label htmlFor="wine-temp" className="block text-xs font-medium text-neutral-300 mb-1">
                          Temperatura de servicio (°C)
                        </label>
                        <input
                          id="wine-temp"
                          type="number"
                          value={servingTemperature}
                          onChange={(e) => setServingTemperature(e.target.value)}
                          placeholder="Ej: 16"
                          className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                        />
                        {errors.servingTemperature && (
                          <p className="text-xs text-rose-400 mt-1">{errors.servingTemperature}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="wine-aging" className="block text-xs font-medium text-neutral-300 mb-1">
                        Consejo de guarda o crianza
                      </label>
                      <input
                        id="wine-aging"
                        type="text"
                        value={agingAdvice}
                        onChange={(e) => setAgingAdvice(e.target.value)}
                        placeholder="Ej: Consumir antes de 2028 o guardar a 14 °C"
                        className="w-full px-4 py-2.5 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sección de Blend / Corte (ambos modos, solo si no es adoptado) */}
            {!isAdopted && (!isUserMode || isMoreDataOpen) && (
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                      Composición Varietal (Corte)
                    </span>
                    <span className="text-xs text-neutral-500 font-sans">
                      Total: <strong className="text-neutral-300">{totalPercentage}%</strong> / 100%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddGrape}
                    disabled={isAddGrapeDisabled}
                    className="inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar uva</span>
                  </button>
                </div>

                {errors.blend && <p className="text-xs text-rose-400">{errors.blend}</p>}

                {grapesCatalog.length === 0 ? (
                  <p className="text-xs text-neutral-400 font-sans italic py-2">
                    Todavía no hay uvas cargadas en el catálogo oficial.
                  </p>
                ) : blend.length > 0 ? (
                  <div className="space-y-2">
                    {blend.map((row) => {
                      const availableGrapes = grapesCatalog.filter(
                        (g) => g.id === row.grapeId || !blend.some((b) => b.id !== row.id && b.grapeId === g.id)
                      );
                      return (
                        <div key={row.id} className="flex items-center gap-2">
                          <select
                            value={row.grapeId}
                            onChange={(e) => handleGrapeChange(row.id, Number(e.target.value))}
                            className="flex-1 px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-xs focus:outline-none focus:border-rose-500"
                          >
                            <option value="">Seleccionar cepa...</option>
                            {availableGrapes.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          <div className="w-24 relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={row.percentage}
                              onChange={(e) => handlePercentageChange(row.id, e.target.value)}
                              placeholder="%"
                              className="w-full px-3 py-2 bg-neutral-900/60 border border-white/10 rounded-xl text-neutral-100 text-xs focus:outline-none focus:border-rose-500 pr-6"
                            />
                            <span className="absolute right-2 top-2 text-xs text-neutral-500">%</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveGrape(row.id)}
                            className="p-2 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            aria-label="Quitar cepa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {/* Footer de Acciones del Formulario */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-300 text-sm font-medium hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || (isUserMode && matchStatus === 'checking')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isUserMode ? getActionLabel() : isLoading ? 'Publicando...' : 'Publicar Etiqueta'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
