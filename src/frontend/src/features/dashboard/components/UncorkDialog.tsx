import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Star, X, Wine as WineIcon, Sparkles, Heart, AlertTriangle } from 'lucide-react';
import BottleVector from './BottleVector';
import type { BottleKind } from '../../../types/wine';
import {
  createUncork,
  formatUncorkDate,
  type UncorkResponse,
} from '../../cava/api/uncorkApi';
import {
  getMyWineMarks,
  markWineAsFavorite,
  unmarkWineAsFavorite,
} from '../../userWines';
import { extractCellarErrorMessage } from '../../cava/api/cellarApi';

export interface UncorkTargetWine {
  wineId: number;
  wineVintageId: number;
  name: string;
  winery?: string;
  year: number | null;
  imageUrl?: string;
  wineType?: string;
  bottle?: BottleKind;
  cellarId?: number;
  availableUnits?: number;
}

export interface UncorkDialogProps {
  wine: UncorkTargetWine | null;
  onClose: () => void;
  onDone?: (response: UncorkResponse) => void;
  /** @deprecated mantenido por compatibilidad */
  onSave?: (data: unknown) => void;
}

const WINE_TYPE_LABELS: Record<string, string> = {
  Red: 'Tinto',
  White: 'Blanco',
  Rose: 'Rosado',
  Sparkling: 'Espumoso',
  Orange: 'Naranjo',
};

export default function UncorkDialog({
  wine,
  onClose,
  onDone,
  onSave,
}: UncorkDialogProps) {
  // Puntaje: estrellas enteras 1 a 5, sin valor por defecto (arranca en null)
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState(0);

  // Comentario / Notas de cata: hasta 1000 caracteres, solo con puntaje
  const [comment, setComment] = useState('');

  // Fecha: opcional, por defecto hoy, máximo hoy
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  // Favorito: estado inicial desde GET /api/wines/{wineId}/my-marks
  const [isFav, setIsFav] = useState(false);
  const initialFavRef = useRef(false);

  // Estados de envío y feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [favWarning, setFavWarning] = useState<string | null>(null);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [prevWineVintageId, setPrevWineVintageId] = useState<number | null>(null);

  if (wine && wine.wineVintageId !== prevWineVintageId) {
    setPrevWineVintageId(wine.wineVintageId);
    setRating(null);
    setHover(0);
    setComment('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsSaved(false);
    setErrorMessage(null);
    setFavWarning(null);
  } else if (!wine && prevWineVintageId !== null) {
    setPrevWineVintageId(null);
  }

  // Cargar marcas iniciales (Favorito)
  const wineId = wine?.wineId;
  useEffect(() => {
    if (!wineId) return;
    let isMounted = true;

    getMyWineMarks(wineId)
      .then((marks) => {
        if (!isMounted) return;
        const fav = marks?.isFavorite ?? false;
        setIsFav(fav);
        initialFavRef.current = fav;
      })
      .catch(() => {
        // Silencioso si falla la lectura de marcas
      });

    return () => {
      isMounted = false;
    };
  }, [wineId]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wine) {
        onClose();
      }
    };

    if (wine) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(closeTimerRef.current);
    };
  }, [wine, onClose]);

  if (!wine) return null;

  const currentHoverOrRating = hover || rating || 0;
  const currentUnits = wine.availableUnits ?? 1;

  const handleRatingClick = (val: number) => {
    // Si toca la misma estrella ya seleccionada, se deselecciona (queda sin puntuar)
    if (rating === val) {
      setRating(null);
      setComment(''); // regla: no hay comentario sin puntaje
    } else {
      setRating(val);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSaved) return;

    if (!rating && comment.trim()) {
      setErrorMessage('No se puede enviar un comentario sin puntaje.');
      return;
    }

    if (comment.length > 1000) {
      setErrorMessage('El comentario no puede superar los 1000 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setFavWarning(null);

    try {
      const occurredAtIso = formatUncorkDate(date);

      const response = await createUncork({
        wineVintageId: wine.wineVintageId,
        cellarId: wine.cellarId,
        rating: rating ?? null,
        comment: rating && comment.trim() ? comment.trim() : null,
        occurredAt: occurredAtIso ?? null,
      });

      // Si cambió el estado de favorito, actualizarlo tras el descorche exitoso
      if (isFav !== initialFavRef.current) {
        try {
          if (isFav) {
            await markWineAsFavorite(wine.wineId);
          } else {
            await unmarkWineAsFavorite(wine.wineId);
          }
        } catch {
          setFavWarning('El descorche se guardó, pero no se pudo actualizar el estado de favorito.');
        }
      }

      setIsSaved(true);
      setIsSubmitting(false);

      onDone?.(response);
      onSave?.(response);

      closeTimerRef.current = setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 900);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const anyErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (anyErr?.response?.status === 409 || anyErr?.response?.status === 404) {
        setErrorMessage('Ya no quedan botellas de este vino en la cava.');
      } else {
        setErrorMessage(
          extractCellarErrorMessage(err, 'Ocurrió un error al registrar el descorche.')
        );
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="uncork-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* Backdrop con desenfoque cinematográfico */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Contenedor Modal Dividido */}
      <div className="relative w-full max-w-4xl rounded-3xl border border-stone-800 bg-[#160408] text-cream-50 shadow-2xl z-10 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Botón de Cierre Flotante */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha de descorche"
          className="absolute right-4 top-4 z-30 rounded-full p-2 text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[540px]">
          {/* ========================================================
              COLUMNA IZQUIERDA (5 cols): Exhibición Gráfica de Botella
              ======================================================== */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#1b050b] via-[#120206] to-[#0d0104] p-8 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-stone-800/80">
            {/* Cabecera superior izquierda: Badge y Favorito */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-950/80 border border-wine-800 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <WineIcon className="h-3 w-3" />
                {wine.cellarId ? 'Cava Privada' : 'Descorche Directo'}
              </span>

              <button
                type="button"
                onClick={() => setIsFav(!isFav)}
                aria-label="Marcar como favorito"
                className={`p-2 rounded-full border transition-all cursor-pointer ${
                  isFav
                    ? 'border-wine-500 bg-wine-900/60 text-wine-400'
                    : 'border-white/10 text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Heart className={`h-4 w-4 ${isFav ? 'fill-wine-400' : ''}`} />
              </button>
            </div>

            {/* Ilustración de Botella o Imagen Real */}
            <div className="relative my-8 flex flex-col items-center justify-center">
              <div className="absolute inset-0 h-64 w-48 rounded-full bg-wine-800/25 blur-3xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-center h-64 sm:h-72">
                {wine.imageUrl ? (
                  <img
                    src={wine.imageUrl}
                    alt={wine.name}
                    className="max-h-64 sm:max-h-72 w-auto object-contain drop-shadow-2xl"
                  />
                ) : (
                  <BottleVector
                    kind={wine.bottle || 'red-burgundy'}
                    className="h-64 sm:h-72 w-auto drop-shadow-2xl"
                    alt={wine.name}
                  />
                )}
              </div>

              <div className="w-24 h-4 bg-black/80 rounded-full blur-[3px] -mt-1 pointer-events-none" />
            </div>

            {/* Inventario Disponible */}
            <div className="w-full text-center z-10">
              {wine.cellarId ? (
                <>
                  <p className="text-xs text-stone-400 uppercase tracking-widest font-sans">
                    Inventario en cava:
                  </p>
                  <p className="font-serif text-base font-bold text-amber-300 mt-0.5">
                    {`${currentUnits} ${currentUnits === 1 ? 'botella' : 'botellas'}`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-stone-400 font-sans">
                  Registrando descorche directo
                </p>
              )}
            </div>
          </div>

          {/* ========================================================
              COLUMNA DERECHA (7 cols): Ficha Técnica y Formulario
              ======================================================== */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-[#160408]">
            {/* 1. Encabezado de la Etiqueta */}
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  {wine.winery || 'Bodega'}
                </span>

                {/* Estrellas de Puntuación */}
                <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      aria-label={`${val} de 5 estrellas`}
                      onMouseEnter={() => setHover(val)}
                      onClick={() => handleRatingClick(val)}
                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`h-4 w-4 transition-colors ${
                          val <= currentHoverOrRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-stone-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-amber-300 font-mono">
                    {rating !== null ? `${rating}.0` : 'Sin puntuar'}
                  </span>
                </div>
              </div>

              <h2
                id="uncork-modal-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mt-1"
              >
                {wine.name}
              </h2>
            </div>

            {/* 2. Cuadro Técnico: sólo lo que se conoce */}
            <div className="rounded-2xl border border-stone-800 bg-white/[0.03] p-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    Añada
                  </span>
                  <span className="font-semibold text-stone-200">
                    {wine.year ?? 'Sin añada'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                    Tipo de vino
                  </span>
                  <span className="font-semibold text-stone-200">
                    {wine.wineType
                      ? WINE_TYPE_LABELS[wine.wineType] || wine.wineType
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerta de Error */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Alerta de Favorito */}
            {favWarning && (
              <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{favWarning}</span>
              </div>
            )}

            {/* 3. Formulario de Descorche */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Fecha del descorche */}
              <div>
                <label
                  htmlFor="uncork-date"
                  className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5"
                >
                  Fecha del descorche
                </label>
                <input
                  id="uncork-date"
                  type="date"
                  max={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-[#210910] px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Notas de Cata / Comentario */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="uncork-notes"
                    className="block text-[11px] font-bold uppercase tracking-wider text-stone-400"
                  >
                    Notas de cata e impresiones
                  </label>
                  <span className="text-[10px] font-mono text-stone-500">
                    {comment.length}/1000
                  </span>
                </div>
                <textarea
                  id="uncork-notes"
                  rows={2}
                  maxLength={1000}
                  disabled={rating === null}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    rating === null
                      ? 'Para dejar un comentario, puntuá primero el vino'
                      : 'Aromas predominantes, maridaje elegido, evolución en copa...'
                  }
                  className={`w-full resize-none rounded-2xl border border-stone-800 p-3 text-xs text-stone-200 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none font-sans ${
                    rating === null
                      ? 'bg-neutral-900/40 opacity-60 cursor-not-allowed'
                      : 'bg-white/[0.04]'
                  }`}
                />
                {rating === null && (
                  <p className="text-[11px] text-stone-500 mt-1 italic">
                    Para dejar un comentario, puntuá primero el vino
                  </p>
                )}
              </div>

              {/* Botón Principal */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isSaved}
                  className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-full bg-wine-700 hover:bg-wine-600 text-white text-xs font-bold uppercase tracking-[0.16em] shadow-xl shadow-wine-950/80 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>
                    {isSaved
                      ? '¡Descorche Registrado!'
                      : isSubmitting
                      ? 'Registrando...'
                      : 'REGISTRAR DESCORCHE'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
