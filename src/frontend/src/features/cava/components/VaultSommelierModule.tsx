import { Sparkles, UtensilsCrossed, CalendarClock } from 'lucide-react';
import type { SommelierRecommendation } from '../types';

interface VaultSommelierModuleProps {
  recommendation: SommelierRecommendation;
  onPlanUncork: () => void;
}

export default function VaultSommelierModule({
  recommendation,
  onPlanUncork,
}: VaultSommelierModuleProps) {
  return (
    <div className="bg-[#121216] border border-neutral-800/80 rounded-xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col justify-between group hover:border-amber-400/30 transition-colors">
      {/* Vinous Halation background glow */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#722F37]/20 blur-[80px] pointer-events-none" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#fbbf24]" />
          <span className="font-mono text-[11px] tracking-widest text-[#fbbf24] uppercase">
            {recommendation.badge}
          </span>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-serif text-xl sm:text-2xl text-neutral-100 font-medium leading-snug">
            Momento cumbre para descorchar tu{' '}
            <span className="text-[#ffb2b8] italic font-normal">{recommendation.wineTitle}</span>
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
            {recommendation.sommelierRationale} {recommendation.decantingAdvice}
          </p>
        </div>

        {/* Pairing Highlight Box */}
        <div className="bg-[#1a1a20] border border-neutral-800 rounded-lg p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#25242c] flex items-center justify-center flex-shrink-0 text-[#fbbf24] border border-[#fbbf24]/20 shadow-inner">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block">
              Maridaje Personalizado Sugerido
            </span>
            <p className="font-serif text-base sm:text-lg text-neutral-100 font-medium">
              {recommendation.pairingTitle}
            </p>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              {recommendation.pairingRationale}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 border-t border-neutral-800/60 mt-4">
        <span className="font-mono text-[10px] sm:text-[11px] text-neutral-500 uppercase tracking-wider">
          {recommendation.intelTag}
        </span>
        <button
          type="button"
          onClick={onPlanUncork}
          className="inline-flex items-center gap-2 bg-[#722F37] hover:bg-[#5C1D24] text-white font-sans text-xs font-semibold px-4 py-2 rounded-lg transition-colors border border-rose-500/30 shadow-[0_0_16px_rgba(114,47,55,0.35)]"
        >
          <CalendarClock className="w-3.5 h-3.5 text-[#fbbf24]" />
          <span>Planificar Descorche</span>
        </button>
      </div>
    </div>
  );
}

