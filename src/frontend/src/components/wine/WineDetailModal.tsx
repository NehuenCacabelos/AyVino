import { useEffect } from 'react';
import { X, Star, MapPin, Award, CheckCircle, Sparkles, Utensils, Droplets, ShieldCheck } from 'lucide-react';
import type { CuratedWine } from '../../types/wine';
import type { AuthMode } from '../../types/auth';

interface WineDetailModalProps {
  wine: CuratedWine | null;
  onClose: () => void;
  onOpenAuth?: (mode: AuthMode) => void;
}

/**
 * WineDetailModal Component
 * Muestra la ficha de cata abierta y completa para la selección curada,
 * cumpliendo el requerimiento de visualización libre sin bloqueo de contenido demo.
 */
export default function WineDetailModal({ wine, onClose, onOpenAuth }: WineDetailModalProps) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-earth-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-cream-50 rounded-2xl border border-cream-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Cabecera decorativa */}
        <div className="relative bg-gradient-to-r from-wine-950 via-wine-900 to-wine-800 text-cream-50 p-6 sm:p-8">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-4 right-4 p-2 rounded-full text-cream-200 hover:text-cream-50 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar ficha"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
              {wine.grape} · {wine.vintage}
            </span>
            {wine.isOfficial ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-950/80 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                <CheckCircle className="w-3 h-3" /> Ficha Oficial
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-950/80 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                <Sparkles className="w-3 h-3" /> Reseña Comunitaria
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl sm:text-4xl font-bold leading-tight">
            {wine.name}
          </h3>
          <p className="text-sm sm:text-base text-cream-200 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-cream-100">{wine.winery}</span>
            <span>—</span>
            <MapPin className="w-4 h-4 text-amber-300/80 inline shrink-0" />
            <span>{wine.region}</span>
          </p>
        </div>

        {/* Contenido scrolleable de la ficha */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Métricas rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-cream-100/70 p-3 rounded-xl border border-cream-200 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-earth-900/50 block">Puntaje</span>
              <span className="text-lg font-bold text-wine-900 flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                {wine.rating.toFixed(1)}
              </span>
            </div>
            <div className="bg-cream-100/70 p-3 rounded-xl border border-cream-200 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-earth-900/50 block">Añada</span>
              <span className="text-lg font-bold font-mono text-earth-900 mt-0.5 block">{wine.vintage}</span>
            </div>
            <div className="bg-cream-100/70 p-3 rounded-xl border border-cream-200 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-earth-900/50 block">Crianza</span>
              <span className="text-xs font-semibold text-earth-900 mt-1 block">{wine.aging || '14 meses en roble'}</span>
            </div>
            <div className="bg-cream-100/70 p-3 rounded-xl border border-cream-200 text-center">
              <span className="text-[10px] uppercase font-bold tracking-wider text-earth-900/50 block">Precio Ref.</span>
              <span className="text-sm font-bold font-mono text-wine-900 mt-1 block">
                ${wine.price.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* Notas de cata sensoriales ampliadas */}
          <div className="bg-cream-100/50 p-5 rounded-2xl border border-cream-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-wine-900 flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-wine-800" />
              Perfil Organoléptico & Sensorial
            </h4>
            <p className="text-sm text-earth-900/85 leading-relaxed font-sans">
              {wine.longDescription || wine.tastingNotes}
            </p>

            {wine.descriptors && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-cream-200/70">
                {wine.descriptors.map((desc) => (
                  <span
                    key={desc}
                    className="text-xs px-2.5 py-1 rounded-full bg-cream-50 text-wine-900 border border-cream-200 font-medium"
                  >
                    #{desc}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Maridaje y Temperatura de servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-cream-200 bg-cream-50">
              <h5 className="text-xs font-bold uppercase tracking-wider text-earth-900/70 flex items-center gap-1.5 mb-1.5">
                <Utensils className="w-3.5 h-3.5 text-wine-800" />
                Maridaje Recomendado
              </h5>
              <p className="text-xs text-earth-900/80">
                {wine.pairing || 'Carnes rojas asadas a la leña, hongos salteados con hierbas y pastas con reducciones intensas.'}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-cream-200 bg-cream-50">
              <h5 className="text-xs font-bold uppercase tracking-wider text-earth-900/70 flex items-center gap-1.5 mb-1.5">
                <Award className="w-3.5 h-3.5 text-amber-600" />
                Suelo & Altitud
              </h5>
              <p className="text-xs text-earth-900/80">
                {wine.altitude || 'Suelo calcáreo y aluvial, ubicado a más de 1.100 msnm con gran amplitud térmica.'}
              </p>
            </div>
          </div>

        </div>

        {/* Footer del Modal con llamada sutil */}
        <div className="p-4 sm:p-6 bg-cream-100/70 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-earth-900/70">
            <ShieldCheck className="w-4 h-4 text-wine-800 shrink-0" />
            <span>¿Querés calificar este vino o sumarlo a "Por Probar"?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuth?.('register');
            }}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-wine-900 hover:bg-wine-800 text-cream-50 text-xs font-semibold transition-colors cursor-pointer"
          >
            Guardar en mi colección
          </button>
        </div>

      </div>
    </div>
  );
}

