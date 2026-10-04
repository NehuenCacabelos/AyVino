import { useState, useEffect, type FormEvent } from 'react';
import { Star, X, Wine as WineIcon, Sparkles, Heart, Minus, Plus } from 'lucide-react';
import BottleVector from './BottleVector';
import type { DashboardWine, UncorkSubmission } from '../../types/wine';

interface UncorkDialogProps {
  wine: DashboardWine | null;
  onClose: () => void;
  onSave?: (data: UncorkSubmission) => void;
}

/**
 * UncorkDialog Component (Ficha Técnica y Modal de Descorche — Inspiración Imagen 1)
 * Modal estructurado como tarjeta de cata profesional:
 * - Columna Izquierda: Escaparate de botella sobre fondo oscuro con reflejos y badge de stock.
 * - Columna Derecha: Título en Serif, valoración de estrellas, tabla técnica estructurada
 *   (añada, color, varietal, denominación, formato y servicio), selector de cantidad [- 01 +]
 *   y notas de cata con botón de descorche en borgoña.
 */
export default function UncorkDialog({ wine, onClose, onSave }: UncorkDialogProps) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [occasion, setOccasion] = useState('Cena en casa');
  const [tastingNotes, setTastingNotes] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isFav, setIsFav] = useState(false);

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
    };
  }, [wine, onClose]);

  if (!wine) return null;

  const currentHoverOrRating = hover || rating;
  const currentUnits = wine.units ?? 1;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSaved(true);

    onSave?.({
      wine,
      rating,
      date,
      occasion,
      tastingNotes,
    });

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
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

      {/* Contenedor Modal Dividido (Estilo Ficha Imagen 1) */}
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

        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
          
          {/* ========================================================
              COLUMNA IZQUIERDA (5 cols): Exhibición Gráfica de Botella
              ======================================================== */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#1b050b] via-[#120206] to-[#0d0104] p-8 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-stone-800/80">
            
            {/* Cabecera superior izquierda: Badge y Favorito */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-950/80 border border-wine-800 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                <WineIcon className="h-3 w-3" />
                Cava Privada
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

            {/* Ilustración de Botella en Gran Escala con Sombra y Luz Cenital */}
            <div className="relative my-8 flex flex-col items-center justify-center">
              {/* Halos de luz tenue detrás del vidrio */}
              <div className="absolute inset-0 h-64 w-48 rounded-full bg-wine-800/25 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <BottleVector kind={wine.bottle} className="h-64 sm:h-72 w-auto drop-shadow-2xl" alt={wine.name} />
              </div>

              {/* Sombra de apoyo */}
              <div className="w-24 h-4 bg-black/80 rounded-full blur-[3px] -mt-1 pointer-events-none" />
            </div>

            {/* Badge de Stock Disponible */}
            <div className="w-full text-center z-10">
              <p className="text-xs text-stone-400 uppercase tracking-widest font-sans">
                Inventario actual:
              </p>
              <p className="font-serif text-base font-bold text-amber-300 mt-0.5">
                {`${currentUnits} ${currentUnits === 1 ? 'botella' : 'botellas'} en cava`}
              </p>
            </div>

          </div>

          {/* ========================================================
              COLUMNA DERECHA (7 cols): Ficha Técnica y Formulario
              ======================================================== */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-6 bg-[#160408]">
            
            {/* 1. Encabezado de la Etiqueta */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  {wine.winery}
                </span>

                {/* Estrellas de Puntuación */}
                <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      aria-label={`${val} de 5 estrellas`}
                      onMouseEnter={() => setHover(val)}
                      onClick={() => setRating(val)}
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
                    {currentHoverOrRating}.0
                  </span>
                </div>
              </div>

              <h2 id="uncork-modal-title" className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight mt-1">
                {wine.name}
              </h2>
              
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                {wine.region}
              </p>
            </div>

            {/* 2. Tabla Técnica Estructurada (Inspiración Imagen 1) */}
            <div className="rounded-2xl border border-stone-800 bg-white/[0.03] p-4 text-xs font-sans">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Añada</span>
                  <span className="font-semibold text-stone-200">{wine.vintage}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Varietal</span>
                  <span className="font-semibold text-stone-200">{wine.varietal}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Formato</span>
                  <span className="font-semibold text-stone-200">750 ml</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Servicio</span>
                  <span className="font-semibold text-stone-200">16°–18° C</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Guarda</span>
                  <span className="font-semibold text-stone-200">Ventana Óptima</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-stone-500 tracking-wider">Ubicación</span>
                  <span className="font-semibold text-stone-200 truncate block">{wine.location || 'Cava Principal'}</span>
                </div>
              </div>
            </div>

            {/* 3. Formulario de Descorche */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {/* Selector de Cantidad, Ocasión y Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                
                {/* Selector Numérico [- 01 +] (Estilo Imagen 1) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Botellas
                  </label>
                  <div className="inline-flex items-center rounded-full border border-stone-700 bg-white/5 p-1 w-full justify-between">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Restar una botella"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-stone-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="text-center font-mono font-bold text-xs text-white">
                      {quantity < 10 ? `0${quantity}` : quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(currentUnits, q + 1))}
                      disabled={quantity >= currentUnits}
                      aria-label="Sumar una botella"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-stone-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Selector de Ocasión */}
                <div>
                  <label htmlFor="uncork-occasion" className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Ocasión
                  </label>
                  <select
                    id="uncork-occasion"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full rounded-full border border-stone-700 bg-[#210910] px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="Cena en casa">Cena en casa</option>
                    <option value="Con amigos">Con amigos</option>
                    <option value="Celebración especial">Celebración</option>
                    <option value="Maridaje de domingo">Maridaje</option>
                    <option value="Cata técnica">Cata técnica</option>
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label htmlFor="uncork-date" className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                    Fecha
                  </label>
                  <input
                    id="uncork-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-full border border-stone-700 bg-[#210910] px-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                  />
                </div>

              </div>

              {/* Notas de Cata Sensoriales */}
              <div>
                <label htmlFor="uncork-notes" className="block text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Notas de cata e impresiones
                </label>
                <textarea
                  id="uncork-notes"
                  rows={2}
                  value={tastingNotes}
                  onChange={(e) => setTastingNotes(e.target.value)}
                  placeholder="Aromas predominantes, maridaje elegido, evolución en copa..."
                  className="w-full resize-none rounded-2xl border border-stone-800 bg-white/[0.04] p-3 text-xs text-stone-200 placeholder:text-stone-500 focus:border-amber-400 focus:outline-none font-sans"
                />
              </div>

              {/* Botón Principal en Borgoña Sólido (Estilo Imagen 1) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaved}
                  className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-full bg-wine-700 hover:bg-wine-600 text-white text-xs font-bold uppercase tracking-[0.16em] shadow-xl shadow-wine-950/80 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{isSaved ? '¡Descorche Registrado!' : 'REGISTRAR DESCORCHE'}</span>
                </button>
              </div>

            </form>

          </div>

        </div>

      </div>
    </div>
  );
}
