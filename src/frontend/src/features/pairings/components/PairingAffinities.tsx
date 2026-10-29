import { ArrowRight, Layers, UtensilsCrossed, Sparkles } from 'lucide-react';
import { getWineVariety, getFoodPairing } from '../../../data/pairingsData';
import type {
  FoodPairingEntity,
  WineVarietyEntity,
  WineVarietyId,
  FoodCategoryId,
} from '../../../data/pairingsData';

interface PairingAffinitiesProps {
  mode: 'food' | 'wine';
  food?: FoodPairingEntity;
  wine?: WineVarietyEntity;
  onSelectWine: (id: WineVarietyId, fromTitle?: string) => void;
  onSelectFood: (id: FoodCategoryId) => void;
  section?: 'all' | 'suggested' | 'secondary';
}

export default function PairingAffinities({
  mode,
  food,
  wine,
  onSelectWine,
  onSelectFood,
  section = 'all',
}: PairingAffinitiesProps) {
  if (mode === 'food' && food) {
    const showSuggested = section === 'all' || section === 'suggested';
    const showSecondary = section === 'all' || section === 'secondary';

    return (
      <div className="flex flex-col gap-6">
        {/* 1. Cepas Recomendadas */}
        {showSuggested && (
          <section aria-label="Cepas enológicas sugeridas" className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif text-lg font-semibold text-neutral-100">
                Cepas enológicas sugeridas{' '}
                <span className="font-mono text-xs font-normal text-zinc-400">
                  ({food.recommendedVarieties.length})
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {food.recommendedVarieties.map((varId) => {
                const variety = getWineVariety(varId);
                if (!variety) return null;

                return (
                  <button
                    key={varId}
                    type="button"
                    onClick={() => onSelectWine(varId, food.title)}
                    className="group flex items-center justify-between p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-amber-400/50 hover:bg-zinc-800/60 text-left transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-serif text-sm font-semibold text-neutral-100 group-hover:text-amber-200 transition-colors">
                        {variety.title}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {variety.body} · {variety.acidity}
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Platos Representativos en Chips rounded-lg con % Afinidad */}
        {showSecondary && (
          <section aria-label="Platos representativos afines" className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-rose-300" />
                <h3 className="font-serif text-lg font-semibold text-neutral-100">
                  Platos representativos afines{' '}
                  <span className="font-mono text-xs font-normal text-zinc-400">
                    ({food.dishes.length})
                  </span>
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-300 uppercase tracking-wider">
                Afinidad Sommelier
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {food.dishes.map((dish, idx) => {
                const affinity = 98 - idx * 2;
                return (
                  <div
                    key={dish}
                    className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-zinc-900/70 border border-zinc-700/60 text-zinc-200 text-xs font-sans font-medium shadow-sm hover:border-zinc-500 transition-colors"
                  >
                    <span>{dish}</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#4f131f] border border-rose-400/30 text-rose-100 font-semibold">
                      {affinity}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (mode === 'wine' && wine) {
    const showSuggested = section === 'all' || section === 'suggested';
    const showSecondary = section === 'all' || section === 'secondary';

    return (
      <div className="flex flex-col gap-6">
        {/* 1. Categorías Gastronómicas Sugeridas */}
        {showSuggested && (
          <section aria-label="Cocina argentina armonizada" className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-rose-300" />
              <h3 className="font-serif text-lg font-semibold text-neutral-100">
                Cocina argentina armonizada{' '}
                <span className="font-mono text-xs font-normal text-zinc-400">
                  ({wine.recommendedFoods.length})
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {wine.recommendedFoods.map((foodId) => {
                const foodItem = getFoodPairing(foodId);
                if (!foodItem) return null;

                return (
                  <button
                    key={foodId}
                    type="button"
                    onClick={() => onSelectFood(foodId)}
                    className="group flex items-center justify-between p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-rose-400/50 hover:bg-zinc-800/60 text-left transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-serif text-sm font-semibold text-neutral-100 group-hover:text-rose-200 transition-colors">
                        {foodItem.title}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {foodItem.badge}
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-rose-300 group-hover:translate-x-1 transition-all" />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Perfil de Sabor / Notas Aromáticas */}
        {showSecondary && (
          <section aria-label="Perfil organoléptico" className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-serif text-lg font-semibold text-neutral-100">
                Perfil organoléptico y aromático
              </h3>
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800">
              <p className="text-sm font-sans text-amber-200/90 leading-relaxed font-light">
                {wine.flavorProfile}
              </p>
            </div>
          </section>
        )}
      </div>
    );
  }

  return null;
}
