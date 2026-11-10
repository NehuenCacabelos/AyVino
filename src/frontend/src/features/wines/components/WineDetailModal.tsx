import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Star, MapPin, ShieldCheck } from 'lucide-react';
import type { CuratedWine } from '../../../types/wine';
import type { AuthMode } from '../../auth';
import WineBottleSilhouette from './WineBottleSilhouette';

interface WineDetailModalProps {
  wine: CuratedWine | null;
  onClose: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
}

/**
 * Formatea un arreglo de descriptores aromáticos en una oración fluida en español.
 * Ejemplo: ["Jazmín", "Pomelo Rosado", "Flor de Azahar", "Mineral Salino"] ->
 *          "Jazmín, pomelo rosado, flor de azahar y mineral salino."
 */
function formatAromas(descriptors: string[]): string {
  if (descriptors.length === 0) return '';
  const lowerDesc = descriptors.map((d) => d.toLowerCase());
  lowerDesc[0] = lowerDesc[0].charAt(0).toUpperCase() + lowerDesc[0].slice(1);
  if (lowerDesc.length === 1) return `${lowerDesc[0]}.`;
  if (lowerDesc.length === 2) return `${lowerDesc[0]} y ${lowerDesc[1]}.`;
  return `${lowerDesc.slice(0, -1).join(', ')} y ${lowerDesc[lowerDesc.length - 1]}.`;
}

/**
 * WineDetailModal Component
 * Ficha técnica editorial compacta diseñada para encajar al 100% en pantallas de escritorio
 * sin barra de desplazamiento vertical (cero scroll), con acentos dorados cava,
 * tipografía nítida de alto contraste y redirección directa de CTA hacia /login con estado de retorno.
 */
export default function WineDetailModal({ wine, onClose }: WineDetailModalProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wine) {
        onClose();
      }
    };

    if (wine) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [wine, onClose]);

  if (!wine) return null;

  const isWineryOfficial = wine.sourceType === 'Official' || wine.sourceType === 'winery' || wine.isOfficial;
  const aromasFormatted = wine.descriptors && wine.descriptors.length > 0 ? formatAromas(wine.descriptors) : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wine-detail-title"
    >
      <div className="relative w-full max-w-4xl h-auto max-h-[92dvh] md:max-h-[85vh] overflow-y-auto md:overflow-hidden bg-[#141417] border border-white/10 rounded-2xl shadow-2xl flex flex-col md:flex-row text-neutral-200">
        
        {/* Botón flotante accesible de cierre */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-2 right-2 z-30 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Cerrar ficha"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Columna Izquierda: Escaparate de la botella */}
        <div className="relative w-full md:w-5/12 bg-[#0f0f12] border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-between p-6 sm:p-7 shrink-0 overflow-hidden">
          
          {/* Resplandor sutil de fondo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center -z-0"
          >
            <div className="w-52 h-52 rounded-full bg-rose-900/10 blur-[70px]" />
          </div>

          {/* Etiquetas superiores */}
          <div className="relative z-10 flex items-center justify-between w-full text-xs font-sans uppercase tracking-widest text-neutral-300 font-medium">
            <span>{wine.grape}</span>
            <span>Añada {wine.vintage}</span>
          </div>

          {/* Visualización de la botella real con sombra profunda */}
          <div className="relative z-10 flex items-center justify-center my-auto py-3 min-h-[220px] sm:min-h-[260px]">
            {wine.imageUrl ? (
              <img
                src={wine.imageUrl}
                alt={wine.name}
                loading="lazy"
                decoding="async"
                width={200}
                height={340}
                className="max-h-[260px] sm:max-h-[300px] md:max-h-[340px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] transition-transform duration-500 hover:scale-[1.02]"
              />
            ) : (
              <WineBottleSilhouette className="w-20 h-48 md:w-24 md:h-56 text-neutral-400" />
            )}
          </div>

          {/* Etiquetas inferiores */}
          <div className="relative z-10 flex items-center justify-between w-full text-xs font-sans uppercase tracking-widest text-neutral-300 font-medium pt-1">
            <span>{wine.alcoholContent != null ? `${wine.alcoholContent}% Vol.` : 'Graduación n/d'}</span>
            <span>{wine.servingTemperature != null ? `${wine.servingTemperature}°C Serv.` : 'T° bodega'}</span>
          </div>
        </div>

        {/* Columna Derecha: Ficha Técnica Editorial (Sin Scroll en Desktop) */}
        <div className="flex-1 p-6 sm:p-7 md:p-8 flex flex-col justify-between md:overflow-hidden">
          <div>
            
            {/* Eyebrow superior sin píldoras */}
            <div className="flex items-center">
              <span
                className={`text-[11px] font-sans uppercase tracking-[0.25em] font-medium ${
                  isWineryOfficial ? 'text-amber-200/70' : 'text-neutral-400'
                }`}
              >
                {isWineryOfficial ? 'FICHA OFICIAL' : 'COMUNIDAD'}
              </span>
              <span className="text-neutral-600 mx-2">·</span>
              <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-neutral-400">
                {wine.winery}
              </span>
            </div>

            {/* Título & Origen */}
            <h3
              id="wine-detail-title"
              className="font-serif text-2xl sm:text-3xl text-neutral-100 font-semibold tracking-tight leading-snug mt-1"
            >
              {wine.name}
            </h3>

            <p className="text-sm text-neutral-300 font-normal mt-1 flex items-center gap-1 font-sans">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{wine.region}</span>
            </p>

            {/* Bloque de Métricas con líneas sutiles y padding vertical contenido */}
            <div className="grid grid-cols-3 divide-x divide-white/10 py-3 my-3.5 border-y border-white/10">
              <div className="pr-4 text-left">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-amber-200/60 font-medium block">
                  Puntaje
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="font-serif text-xl text-white font-semibold">
                    {wine.rating !== null ? wine.rating.toFixed(1) : 'S/C'}
                  </span>
                </div>
                <span className="text-[10px] font-sans text-neutral-500 block mt-0.5">
                  {wine.reviewCount} catas
                </span>
              </div>

              <div className="px-4 text-left">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-amber-200/60 font-medium block">
                  Cosecha
                </span>
                <span className="font-serif text-xl text-white font-semibold block mt-1">
                  {wine.vintage}
                </span>
                <span className="text-[10px] font-sans text-neutral-500 block mt-0.5">
                  Añada
                </span>
              </div>

              <div className="pl-4 text-left flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-amber-200/60 font-medium block">
                    Crianza
                  </span>
                  <span
                    className="text-xs text-neutral-300 leading-snug block mt-1 line-clamp-2"
                    title={wine.aging || 'Sin datos'}
                  >
                    {wine.aging || 'Sin roble'}
                  </span>
                </div>
                <span className="text-[10px] font-sans text-neutral-500 block mt-0.5">
                  Método
                </span>
              </div>
            </div>

            {/* Notas de Cata & Aromas con alto contraste */}
            {(wine.longDescription || wine.tastingNotes || aromasFormatted) && (
              <div>
                <h4 className="text-[10px] font-sans uppercase tracking-[0.2em] text-amber-200/60 font-semibold mb-1">
                  Notas de cata
                </h4>
                {(wine.longDescription || wine.tastingNotes) && (
                  <p className="text-sm sm:text-base text-neutral-100 font-normal leading-relaxed line-clamp-3">
                    {wine.longDescription || wine.tastingNotes}
                  </p>
                )}
                {aromasFormatted && (
                  <p className="text-sm text-neutral-200 mt-2 font-normal">
                    <span className="text-amber-200/90 font-medium">Aromas:</span> {aromasFormatted}
                  </p>
                )}
              </div>
            )}

            {/* Maridaje y Terroir en 2 Columnas (Layout Horizontal) */}
            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
              <div>
                <h5 className="text-[11px] font-sans uppercase tracking-[0.2em] text-amber-200/80 font-semibold mb-1">
                  Maridaje
                </h5>
                <p className="text-sm text-neutral-100 font-normal leading-snug">
                  {wine.pairing || 'Carnes asadas, pastas rellenas o quesos curados.'}
                </p>
              </div>

              <div>
                <h5 className="text-[11px] font-sans uppercase tracking-[0.2em] text-amber-200/80 font-semibold mb-1">
                  Terroir
                </h5>
                <p className="text-sm text-neutral-100 font-normal leading-snug">
                  {wine.altitude || `${wine.region} · Viñedos seleccionados.`}
                </p>
              </div>
            </div>

          </div>

          {/* Footer del Modal con redirección estricta a /login */}
          <div className="border-t border-white/5 pt-3 mt-3.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-light">
              <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0" />
              <span>¿Tenés esta botella en tu cava?</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/login', { state: { from: location } });
              }}
              className="bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 rounded-xl px-5 py-2.5 min-h-[44px] text-xs uppercase tracking-wider font-medium shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              Guardar en mi colección
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
