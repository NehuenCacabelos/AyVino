import BottleVector from '../../dashboard/components/BottleVector';
import type { CellarWine } from '../types';

interface VaultWineCardProps {
  wine: CellarWine;
  onOpenDetails: (wine: CellarWine) => void;
  onUncork: (wine: CellarWine) => void;
}

export default function VaultWineCard({ wine, onOpenDetails, onUncork }: VaultWineCardProps) {
  const isOptimal = wine.agingStatus === 'optimal';

  return (
    <article className="bg-[#121216] border border-neutral-800/80 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between group hover:border-[#fbbf24]/30 hover:bg-[#15151b] transition-all duration-300">
      <div className="space-y-3">
        {/* Header badges: Shelf Location & Score */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-[#fbbf24] tracking-wider uppercase truncate">
            {wine.location}
          </span>
          {wine.criticBadge ? (
            <span className="bg-[#201f25] px-2 py-0.5 rounded text-[#fbbf24] font-mono text-[11px] font-bold border border-[#fbbf24]/20 shadow-[0_0_8px_rgba(251,191,36,0.15)]">
              {wine.criticBadge}
            </span>
          ) : (
            <span className="bg-[#201f25] px-2 py-0.5 rounded text-neutral-300 font-mono text-[11px]">
              {wine.rating} PTS
            </span>
          )}
        </div>

        {/* Bottle Imagery Viewport with Dark Cellar Radial Vignette */}
        <div className="relative w-full h-72 rounded-lg overflow-hidden bg-[#0c0c0e] flex items-center justify-center border border-neutral-900 group-hover:border-neutral-800 transition-colors">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(114,47,55,0.22)_0%,_rgba(12,12,14,0.95)_75%)] pointer-events-none" />

          {wine.imageUrl ? (
            <img
              src={wine.imageUrl}
              alt={wine.name}
              className="h-60 w-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform duration-500 relative z-10"
              loading="lazy"
            />
          ) : (
            <div className="relative z-10 group-hover:scale-105 transition-transform duration-500">
              <BottleVector kind={wine.bottle} className="h-60 w-auto filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]" />
            </div>
          )}

          {/* Temperature Badge */}
          <span className="absolute bottom-2.5 left-2.5 font-mono text-[10px] text-neutral-300 bg-[#0c0c0e]/85 border border-neutral-800/80 px-2 py-0.5 rounded backdrop-blur-sm z-10">
            {wine.temperatureConst || '15°C CONSTANTE'}
          </span>

          {/* Units indicator if > 1 */}
          {wine.units > 1 && (
            <span className="absolute top-2.5 right-2.5 font-mono text-[10px] text-neutral-200 bg-[#722F37]/80 border border-rose-500/30 px-2 py-0.5 rounded backdrop-blur-sm z-10">
              {wine.units} {wine.units === 1 ? 'botella' : 'botellas'}
            </span>
          )}
        </div>

        {/* Metadata & Title */}
        <div className="pt-1 space-y-1.5">
          <span className="font-mono text-[11px] text-[#ffb2b8] block tracking-wide uppercase">
            {wine.region}
          </span>
          <h3 className="font-serif text-lg sm:text-xl text-neutral-100 font-medium leading-snug line-clamp-2 group-hover:text-[#fde68a] transition-colors">
            {wine.name}
          </h3>
          <p className="text-xs text-neutral-400 font-sans line-clamp-2 leading-relaxed">
            {wine.terroirNote || `${wine.varietal} · Cosecha ${wine.vintage} · ${wine.winery}`}
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
          className="w-full bg-[#1c1b22] hover:bg-[#25242c] text-neutral-200 hover:text-white text-center font-sans font-semibold text-xs py-2 rounded border border-neutral-700/60 transition-colors"
        >
          Ficha Técnica
        </button>
        <button
          type="button"
          onClick={() => onUncork(wine)}
          className="w-full bg-[#722F37] hover:bg-[#5C1D24] text-white text-center font-sans font-semibold text-xs py-2 rounded shadow-sm border border-rose-500/25 transition-colors"
        >
          Registrar Cata
        </button>
      </div>
    </article>
  );
}

