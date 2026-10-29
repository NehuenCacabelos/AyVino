import { Utensils, Flame } from 'lucide-react';
import { FOOD_CATEGORY_LIST } from '../../../data/pairingsData';
import type { FoodCategoryId } from '../../../data/pairingsData';

interface PairingFoodSelectorProps {
  selectedFoodId: FoodCategoryId;
  onSelectFood: (id: FoodCategoryId) => void;
}

export default function PairingFoodSelector({
  selectedFoodId,
  onSelectFood,
}: PairingFoodSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono text-neutral-300">
          <Flame className="w-3.5 h-3.5 text-rose-300" />
          Categoría gastronómica ({FOOD_CATEGORY_LIST.length})
        </span>
        <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
          Selección rápida
        </span>
      </div>

      {/* Chips de Comidas con estilo oficial AyVino de Cava / Iniciar Sesión */}
      <div
        className="flex items-center gap-2.5 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-none"
        role="group"
        aria-label="Seleccionar plato o estilo gastronómico"
      >
        {FOOD_CATEGORY_LIST.map((item) => {
          const isSelected = item.id === selectedFoodId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFood(item.id)}
              className={`group inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-sans font-medium transition-colors shrink-0 cursor-pointer border ${
                isSelected
                  ? 'bg-[#4f131f] hover:bg-[#5e1725] text-rose-100 border-rose-400/30 shadow-sm'
                  : 'bg-zinc-900/70 text-zinc-300 border-zinc-700/60 hover:border-zinc-500 hover:text-white hover:bg-zinc-800/80 shadow-sm'
              }`}
            >
              <Utensils
                className={`w-3.5 h-3.5 transition-colors ${
                  isSelected ? 'text-rose-200' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              />
              <span>{item.title}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                  isSelected
                    ? 'bg-[#6e1a24] text-rose-100 border border-rose-400/20 font-semibold'
                    : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'
                }`}
              >
                {item.recommendedVarieties.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
