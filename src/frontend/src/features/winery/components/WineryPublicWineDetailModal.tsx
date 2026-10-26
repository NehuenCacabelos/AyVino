import { X, Star, MapPin, Building2, ShieldCheck } from 'lucide-react';
import type { WineResponseDto } from '../types';

interface WineryPublicWineDetailModalProps {
  wine: WineResponseDto | null;
  wineryName?: string;
  locationLabel?: string;
  onClose: () => void;
}

function getWineTypeSpanish(type?: string | null): string {
  switch (type?.toLowerCase()) {
    case 'red':
      return 'Tinto';
    case 'white':
      return 'Blanco';
    case 'rose':
      return 'Rosado';
    case 'sparkling':
      return 'Espumoso';
    case 'orange':
      return 'Naranjo';
    default:
      return type || 'Vino';
  }
}

/**
 * WineryPublicWineDetailModal Component
 * Ficha técnica modal para la vidriera pública de bodegas.
 * Componente 100% desacoplado de features/wines.
 */
export default function WineryPublicWineDetailModal({
  wine,
  wineryName,
  locationLabel = 'Argentina',
  onClose,
}: WineryPublicWineDetailModalProps) {
  if (!wine) return null;

  const typeLabel = getWineTypeSpanish(wine.wineType);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg bg-[#141416] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 sm:p-8 space-y-6">
        {/* Cabecera del modal */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                {typeLabel}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                {locationLabel}
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100">
              {wine.name}
            </h2>
            {wineryName && (
              <p className="text-xs text-rose-300 font-sans flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{wineryName}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-white/5 bg-stone-900/60 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo técnico */}
        <div className="space-y-4 text-sm text-neutral-300 font-sans leading-relaxed">
          {wine.description ? (
            <p className="bg-[#101012] p-4 rounded-2xl border border-white/5 text-neutral-300 text-xs sm:text-sm">
              {wine.description}
            </p>
          ) : (
            <p className="italic text-neutral-500 text-xs">
              Esta etiqueta cuenta con certificación oficial de elaboración y guarda en el catálogo AyVino.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-stone-900/50 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Origen Certificado
              </span>
              <span className="text-xs font-medium text-neutral-200 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/50 border border-white/5 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
                Certificación
              </span>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Oficial de Bodega</span>
              </span>
            </div>
          </div>

          {wine.averageRating && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-900/50 border border-white/5">
              <span className="text-xs text-neutral-400 font-sans">Puntaje promedio en comunidad</span>
              <div className="flex items-center gap-1.5 text-amber-300 font-mono text-sm font-semibold">
                <Star className="w-4 h-4 fill-amber-300" />
                <span>{wine.averageRating.toFixed(1)}</span>
                <span className="text-xs text-neutral-500 font-normal">({wine.reviewCount ?? 0} notas)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
