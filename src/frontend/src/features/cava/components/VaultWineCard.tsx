import { useState } from 'react';
import { Link } from 'react-router-dom';
import BottleVector from '../../dashboard/components/BottleVector';
import { formatRating } from '../../../lib/formatRating';
import type { CellarWine } from '../types';

interface VaultWineCardProps {
  wine: CellarWine;
  onOpenDetails: (wine: CellarWine) => void;
  onUncork: (wine: CellarWine) => void;
}

export default function VaultWineCard({ wine, onOpenDetails, onUncork }: VaultWineCardProps) {
  const [hasError, setHasError] = useState(false);
  const isOptimal = wine.agingStatus === 'optimal';
  const wineDetailPath = `/vinos/${wine.wineId || wine.id.replace('api-item-', '')}`;

  return (
    <article className="bg-[#121216] border border-neutral-800/80 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between group hover:border-[#fbbf24]/30 hover:bg-[#15151b] transition-all duration-300 h-full">
      <div className="space-y-3">
        {/* Header badges: Shelf Location & Score */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-[11px] text-[#fbbf24] tracking-wider uppercase truncate">
              {wine.location || '—'}
            </span>
            {wine.sourceType === 'Community' && (
              <span className="bg-amber-950/40 text-amber-300 border border-amber-800/40 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase shrink-0">
                Comunidad
              </span>
            )}
          </div>
          {wine.userRating && wine.userRating > 0 ? (
            <span className="bg-[#201f25] px-2 py-0.5 rounded text-amber-300 font-mono text-[11px] font-bold border border-amber-400/20 shrink-0">
              TU RESEÑA {formatRating(wine.userRating)} ★
            </span>
          ) : wine.criticBadge ? (
            <span className="bg-[#201f25] px-2 py-0.5 rounded text-[#fbbf24] font-mono text-[11px] font-bold border border-[#fbbf24]/20 shadow-[0_0_8px_rgba(251,191,36,0.15)] shrink-0">
              {wine.criticBadge}
            </span>
          ) : wine.rating && wine.rating > 0 ? (
            <span className="bg-[#201f25] px-2 py-0.5 rounded text-amber-300 font-mono text-[11px] font-semibold border border-amber-400/15 shrink-0">
              TU RESEÑA {formatRating(wine.rating > 5 ? wine.rating / 20 : wine.rating)} ★
            </span>
          ) : (
            <span className="bg-[#201f25] px-2 py-0.5 rounded text-neutral-400 font-mono text-[11px] shrink-0">
              —
            </span>
          )}
        </div>

        {/* Escenario blanco en proporción fija 4:5 para entrega de botella sin pérdidas */}
        <Link
          to={wineDetailPath}
          aria-label={`Ver ficha de ${wine.name}`}
          data-testid="vault-card-image-container"
          className="relative w-full aspect-[4/5] rounded-lg overflow-hidden bg-white flex items-center justify-center border border-neutral-200/20 group-hover:border-[#fbbf24]/40 transition-colors shadow-sm block cursor-pointer"
        >
          {wine.imageUrl && !hasError ? (
            <img
              src={wine.imageUrl}
              alt={wine.name}
              onError={() => setHasError(true)}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 relative z-10"
              loading="lazy"
            />
          ) : (
            <div data-testid="vault-card-fallback" className="relative z-10 group-hover:scale-105 transition-transform duration-500 p-4 flex items-center justify-center w-full h-full">
              <BottleVector kind={wine.bottle} className="h-56 w-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]" />
            </div>
          )}

          {/* Temperature Badge */}
          <span className="absolute bottom-2.5 left-2.5 font-mono text-[10px] text-neutral-300 bg-[#0c0c0e]/90 border border-neutral-800 px-2 py-0.5 rounded backdrop-blur-sm z-20">
            {wine.temperatureConst || '15°C CONSTANTE'}
          </span>

          {/* Units indicator if > 1 */}
          {wine.units > 1 && (
            <span className="absolute top-2.5 right-2.5 font-mono text-[10px] text-neutral-200 bg-[#722F37]/90 border border-rose-500/40 px-2 py-0.5 rounded backdrop-blur-sm z-20">
              {wine.units} {wine.units === 1 ? 'botella' : 'botellas'}
            </span>
          )}
        </Link>

        {/* Metadata & Title */}
        <div className="pt-1 space-y-1.5">
          <span className="font-mono text-[11px] text-[#ffb2b8] block tracking-wide uppercase">
            {wine.region || '—'}
          </span>
          <Link to={wineDetailPath} className="block group/title">
            <h3 className="font-serif text-lg sm:text-xl text-neutral-100 font-medium leading-snug line-clamp-2 min-h-[3.25rem] group-hover:text-[#fde68a] transition-colors">
              {wine.name}
            </h3>
          </Link>
          <p className="text-xs text-neutral-400 font-sans line-clamp-2 leading-relaxed">
            {wine.terroirNote ||
              `${wine.varietal || '—'} · Cosecha ${wine.vintage || '—'} · ${wine.winery || '—'}`}
          </p>
        </div>

        {/* Status Pill */}
        <div
          className={`rounded p-2 flex items-center justify-between font-mono text-[11px] border ${
            isOptimal
              ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]'
              : 'bg-[#1a1a22] border-neutral-800 text-neutral-400'
          }`}
        >
          <span className="text-[10px] uppercase text-neutral-400">Estado</span>
          <span className={`font-medium ${isOptimal ? 'text-[#fbbf24]' : 'text-[#ffb2b8]'}`}>
            {wine.agingStatusLabel}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 grid grid-cols-2 gap-2 mt-auto">
        <button
          type="button"
          onClick={() => onOpenDetails(wine)}
          className="w-full bg-[#1c1b22] hover:bg-[#25242c] text-neutral-200 hover:text-white text-center font-sans font-semibold text-xs py-2 rounded border border-neutral-700/60 transition-colors cursor-pointer"
        >
          Gestionar
        </button>
        <button
          type="button"
          onClick={() => onUncork(wine)}
          className="w-full bg-[#722F37] hover:bg-[#5C1D24] text-white text-center font-sans font-semibold text-xs py-2 rounded shadow-sm border border-rose-500/25 transition-colors cursor-pointer"
        >
          Registrar Cata
        </button>
      </div>
    </article>
  );
}
