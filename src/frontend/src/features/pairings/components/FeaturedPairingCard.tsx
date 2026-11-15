import { ArrowRight, Sparkles } from 'lucide-react';
import type { EnrichedFoodRecommendation } from '../../../data/pairingsData';
import { EditorialDishImage } from './EditorialDishImage';

interface FeaturedPairingCardProps {
  item: EnrichedFoodRecommendation;
  wineName: string;
  onSelectFood: (id: string, fromLabel?: string) => void;
  variant?: 'affinity' | 'contrast';
}

/**
 * FeaturedPairingCard Component
 * Tarjeta fotográfica principal para maridajes destacados (Afinidad o Contraste).
 * Al hacer click, transiciona hacia la ficha del plato correspondiente en el Hub de Maridaje.
 */
export function FeaturedPairingCard({
  item,
  wineName,
  onSelectFood,
  variant = 'affinity',
}: FeaturedPairingCardProps) {
  const isAffinity = variant === 'affinity';
  const accentBorderHover = isAffinity
    ? 'hover:border-emerald-500/40'
    : 'hover:border-amber-500/40';

  const handleClick = () => {
    onSelectFood(item.id, wineName);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group w-full text-left rounded-xl overflow-hidden bg-[#0e0e10] border border-white/10 ${accentBorderHover} transition-all duration-300 shadow-xl cursor-pointer flex flex-col focus:outline-none focus:ring-1 focus:ring-amber-400/50`}
    >
      {/* Contenedor de Fotografía y Badge */}
      <EditorialDishImage
        src={item.imageUrl}
        alt={item.title}
        badge={item.badge}
        badgeIcon={<Sparkles className="w-3.5 h-3.5" />}
      />

      {/* Contenido Editorial Inferior */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-grow space-y-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-serif text-xl sm:text-2xl text-white font-semibold tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
              {item.title}
            </h4>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-200 shrink-0 mt-1" />
          </div>

          <p className="font-sans text-sm text-[#d8c1c2] leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Métricas / Stats de la comida */}
        {item.stats && item.stats.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[#fbbf24]">
            {item.stats.map((stat) => (
              <span key={stat.label}>
                <span className="text-zinc-500">{stat.label}:</span>{' '}
                <span className="text-[#fbbf24] font-medium">{stat.value}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

export default FeaturedPairingCard;

