import { useMemo } from 'react';
import {
  FOOD_FAMILIES,
  getDishesByFamily,
  type FoodFamilyId,
} from '../../../data/pairingsData';

interface PairingFoodSelectorProps {
  selectedFamilyId: FoodFamilyId;
  selectedDishId: string | null;
  onSelectCategory: (familyId: FoodFamilyId) => void;
  onSelectDish: (dishId: string) => void;
}

/**
 * PairingFoodSelector Component
 * Selector progresivo por categorías gastronómicas.
 * A primera vista solo muestra las 6 categorías principales para evitar sobrecarga.
 * Ofrece una línea secundaria sutil para afinar opcionalmente por plato concreto.
 */
export default function PairingFoodSelector({
  selectedFamilyId,
  selectedDishId,
  onSelectCategory,
  onSelectDish,
}: PairingFoodSelectorProps) {
  // Platos correspondientes a la categoría seleccionada
  const categoryDishes = useMemo(() => {
    return getDishesByFamily(selectedFamilyId);
  }, [selectedFamilyId]);

  return (
    <div className="space-y-3 pt-1 pb-4 border-b border-neutral-800/80">
      {/* 1. Nivel Principal: Solo Categorías Gastronómicas a primera vista */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium sm:w-28 shrink-0">
          Categoría
        </span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {FOOD_FAMILIES.map((fam) => {
            const isCategoryActive = fam.id === selectedFamilyId;
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => onSelectCategory(fam.id as FoodFamilyId)}
                className={`rounded-sm px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
                  isCategoryActive
                    ? 'bg-neutral-800 border-neutral-600 text-white font-medium shadow-sm'
                    : 'border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {fam.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Nivel Secundario: Afinar por plato concreto (opcional) */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-medium sm:w-28 shrink-0 sm:pt-1">
          Afinar plato
        </span>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <button
            type="button"
            onClick={() => onSelectCategory(selectedFamilyId)}
            className={`rounded-sm px-2.5 py-1 text-[11px] transition-colors cursor-pointer border ${
              selectedDishId === null
                ? 'bg-neutral-800/90 border-neutral-600 text-amber-200 font-medium'
                : 'border-neutral-800/60 hover:border-neutral-700 text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Toda la categoría
          </button>

          {categoryDishes.map((dish) => {
            const isDishSelected = dish.id === selectedDishId;
            return (
              <button
                key={dish.id}
                type="button"
                onClick={() => onSelectDish(dish.id)}
                className={`rounded-sm px-2.5 py-1 text-[11px] transition-colors cursor-pointer border ${
                  isDishSelected
                    ? 'bg-neutral-800 border-neutral-600 text-white font-medium shadow-sm'
                    : 'border-neutral-800/60 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {dish.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
