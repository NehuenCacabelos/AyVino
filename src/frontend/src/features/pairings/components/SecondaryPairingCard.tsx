import { ArrowRight } from 'lucide-react';
import type { EnrichedFoodRecommendation } from '../../../data/pairingsData';

interface SecondaryPairingCardProps {
  item: EnrichedFoodRecommendation;
  wineName: string;
  onSelectFood: (id: string, fromLabel?: string) => void;
  variant?: 'affinity' | 'contrast';
}

/**
 * SecondaryPairingCard Component
 * Ficha secundaria de maridaje gastronómico con porcentaje de afinidad/balance y micro-interacción.
 */
export function SecondaryPairingCard({
  item,
  wineName,
  onSelectFood,
  variant = 'affinity',
}: SecondaryPairingCardProps) {
  const isAffinity = variant === 'affinity';
  const badgeColor = isAffinity ? 'text-emerald-400' : 'text-amber-400';
  const hoverBorder = isAffinity
    ? 'hover:border-emerald-500/30'
    : 'hover:border-amber-500/30';

  const handleClick = () => {
    onSelectFood(item.id, wineName);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group w-full text-left p-4 rounded-xl bg-[#201f21] hover:bg-[#2a2a2c] border border-white/5 ${hoverBorder} transition-all duration-200 cursor-pointer space-y-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400/40`}
    >
      <div className="flex items-center justify-between gap-2">
        <h5 className="font-sans text-sm sm:text-base text-zinc-100 font-medium group-hover:text-white transition-colors leading-snug">
          {item.title}
        </h5>
        {item.matchPercentage && (
          <span
            className={`font-mono text-[11px] font-semibold shrink-0 ${badgeColor}`}
          >
            {item.matchPercentage}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <p className="font-sans text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-2">
          {item.description}
        </p>
        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mb-0.5" />
      </div>
    </button>
  );
}

export default SecondaryPairingCard;

