import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, MapPin, Award, Utensils, Droplets, ShieldCheck } from 'lucide-react';
import type { CuratedWine } from '../../../types/wine';
import type { AuthMode } from '../../auth/types';
import WineBottleSilhouette from './WineBottleSilhouette';

interface WineDetailModalProps {
  wine: CuratedWine | null;
  onClose: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
}

/**
 * WineDetailModal Component
 * Ficha de cata técnica a dos columnas:
 * - Columna izquierda: Escaparate de botella (foto o silueta SVG sobria).
 * - Columna derecha: Métricas clave (sin precio), notas de cata, aromas, maridaje y origen.
 */
export default function WineDetailModal({ wine, onClose, onOpenAuth }: WineDetailModalProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && wine) onClose();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl bg-[#141416] rounded-sm border border-neutral-800 text-neutral-200 overflow-hidden max-h-[90vh] flex flex-col md:flex-row shadow-2xl">
        
        {/* Botón flotante de cierre */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 z-20 p-1.5 rounded-sm text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
          aria-label="Cerrar ficha"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Columna Izquierda: Escaparate Visual de la Botella */}
        <div className="w-full md:w-5/12 bg-neutral-900/60 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col items-center justify-center p-5 md:p-6 shrink-0">
          <div className="relative flex items-center justify-center w-full h-44 md:h-60">
            {wine.imageUrl ? (
              <img
                src={wine.imageUrl}
                alt={wine.name}
                className="max-h-44 md:max-h-56 w-auto object-contain drop-shadow-md"
              />
            ) : (
              <WineBottleSilhouette className="w-20 h-44 md:w-24 md:h-56 text-neutral-400" />
            )}
          </div>

          <div className="mt-3 text-center space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 block">
              {wine.grape} · {wine.vintage}
            </span>
            {(wine.alcoholContent != null || wine.servingTemperature != null) && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-neutral-500 tracking-wider">
                {wine.alcoholContent != null && <span>{wine.alcoholContent}% Vol.</span>}
                {wine.alcoholContent != null && wine.servingTemperature != null && <span>·</span>}
                {wine.servingTemperature != null && <span>{wine.servingTemperature}°C Serv.</span>}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Contenido y Ficha Técnica Detallada (Compactada para Desktop sin Scroll) */}
        <div className="flex-1 py-4 px-5 md:py-4 md:px-6 overflow-y-auto flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            
            {/* Encabezado: Procedencia, Título y Metadatos Técnicos */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm">
                  {isWineryOfficial ? 'Ficha Oficial' : 'Aporte de Comunidad'}
                </span>
                <span className="text-neutral-500 font-mono text-[11px] uppercase tracking-wider">
                  {wine.winery}
                </span>
                {wine.alcoholContent != null && (
                  <span className="font-mono text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-sm">
                    {wine.alcoholContent}% Vol.
                  </span>
                )}
                {wine.servingTemperature != null && (
                  <span className="font-mono text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded-sm">
                    {wine.servingTemperature}°C Serv.
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-tight text-neutral-100">
                {wine.name}
              </h3>

              <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 font-sans">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 inline shrink-0" />
                <span>{wine.region}</span>
              </p>
            </div>

            {/* Métricas Técnicas Clave: Grid flexible con celda de crianza expandida y texto completo */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.35fr] gap-2.5">
              <div className="bg-neutral-900/60 p-2.5 rounded-sm border border-neutral-800 text-center flex flex-col justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
                  Puntaje
                </span>
                <span className="text-base font-bold text-neutral-100 flex items-center justify-center gap-1 my-0.5 font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {wine.rating !== null ? wine.rating.toFixed(1) : 'S/C'}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {wine.reviewCount} notas
                </span>
              </div>

              <div className="bg-neutral-900/60 p-2.5 rounded-sm border border-neutral-800 text-center flex flex-col justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
                  Cosecha
                </span>
                <span className="text-base font-mono font-bold text-neutral-100 my-0.5 block">
                  {wine.vintage}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  Añada
                </span>
              </div>

              <div className="bg-neutral-900/60 p-2.5 rounded-sm border border-neutral-800 text-center flex flex-col justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 block">
                  Crianza
                </span>
                <span className="text-xs font-mono leading-tight text-neutral-200 my-0.5 block break-words" title={wine.aging || 'Sin datos'}>
                  {wine.aging || 'Sin roble'}
                </span>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  Método
                </span>
              </div>
            </div>

            {/* Notas de Cata y Aromas */}
            {(wine.longDescription || wine.tastingNotes) && (
              <div className="bg-neutral-900/40 p-3 rounded-sm border border-neutral-800">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 mb-1.5 font-medium">
                  <Droplets className="w-3.5 h-3.5 text-neutral-400" />
                  Notas de cata y aromas
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                  {wine.longDescription || wine.tastingNotes}
                </p>

                {wine.descriptors && wine.descriptors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-neutral-800/80">
                    {wine.descriptors.map((desc) => (
                      <span
                        key={desc}
                        className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm bg-neutral-800/80 text-neutral-300 border border-neutral-700/80"
                      >
                        {desc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Maridaje y Origen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-sm border border-neutral-800 bg-[#18181b]">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 mb-1 font-medium">
                  <Utensils className="w-3 h-3 text-neutral-400" />
                  Maridaje recomendado
                </h5>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  {wine.pairing || 'Carnes asadas, pastas con salsas consistentes o quesos curados.'}
                </p>
              </div>

              <div className="p-2.5 rounded-sm border border-neutral-800 bg-[#18181b]">
                <h5 className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 mb-1 font-medium">
                  <Award className="w-3 h-3 text-neutral-400" />
                  Origen y altura
                </h5>
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  {wine.altitude || `${wine.region} · Viñedos de altura.`}
                </p>
              </div>
            </div>

          </div>

          {/* Footer de Acción */}
          <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-sans">
              <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>¿Tenés esta botella o querés agendarla?</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenAuth) {
                  onOpenAuth('register');
                } else {
                  navigate('/register');
                }
              }}
              className="w-full sm:w-auto px-5 py-2 rounded-sm bg-[#6b1d28] hover:bg-[#7e2432] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Guardar en mi colección
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
