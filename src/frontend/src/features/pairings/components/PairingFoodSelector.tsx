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

// Íconos emoji representativos por familia
const FAMILY_ICON: Record<string, string> = {
  fuegos: '🔥',
  'ollas-y-guisos': '🥘',
  pastas: '🍝',
  'rio-y-mar': '🐟',
  'clasicos-urbanos': '🫓',
  'quesos-charcuteria': '🧀',
};

/**
 * PairingFoodSelector Component — Diseño Editorial
 * Tabs horizontales editoriales con íconos y labels en mayúsculas.
 * Nivel secundario de platos concretos debajo, con separador sutil.
 */
export default function PairingFoodSelector({
  selectedFamilyId,
  selectedDishId,
  onSelectCategory,
  onSelectDish,
}: PairingFoodSelectorProps) {
  const categoryDishes = useMemo(
    () => getDishesByFamily(selectedFamilyId),
    [selectedFamilyId]
  );

  return (
    <div className="space-y-0 pb-6 border-b border-white/[0.06]">

      {/* Tabs de categoría gastronómica */}
      <div
        className="flex overflow-x-auto gap-0 border-b border-white/[0.06]"
        style={{ scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Categorías gastronómicas"
      >
        {FOOD_FAMILIES.map((fam) => {
          const isActive = fam.id === selectedFamilyId;
          const icon = FAMILY_ICON[fam.id] ?? '🍽️';

          return (
            <button
              key={fam.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectCategory(fam.id as FoodFamilyId)}
              className={[
                'flex items-center gap-2 px-4 py-3 shrink-0 text-[11px] font-mono uppercase tracking-wider',
                'border-b-2 -mb-px transition-all duration-200 cursor-pointer whitespace-nowrap',
                isActive
                  ? 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/5'
                  : 'border-transparent text-[#a18c8c] hover:text-[#e5e1e4] hover:border-[#a18c8c]/40',
              ].join(' ')}
            >
              <span aria-hidden="true">{icon}</span>
              <span>{fam.title}</span>
            </button>
          );
        })}
      </div>

      {/* Selector de plato concreto (opcional) */}
      <div className="pt-3 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#534343] shrink-0">
          Afinar
        </span>

        {/* Opción "Toda la categoría" */}
        <button
          type="button"
          onClick={() => onSelectCategory(selectedFamilyId)}
          className={[
            'px-3 py-1 rounded-lg text-[11px] font-mono transition-all duration-150 cursor-pointer border',
            selectedDishId === null
              ? 'bg-[#fbbf24]/10 border-[#fbbf24]/40 text-[#fbbf24]'
              : 'border-white/[0.08] text-[#a18c8c] hover:border-white/[0.15] hover:text-[#e5e1e4]',
          ].join(' ')}
        >
          Toda la categoría
        </button>

        {/* Platos concretos de la categoría */}
        {categoryDishes.map((dish) => {
          const isSelected = dish.id === selectedDishId;
          return (
            <button
              key={dish.id}
              type="button"
              onClick={() => onSelectDish(dish.id)}
              className={[
                'px-3 py-1 rounded-lg text-[11px] font-mono transition-all duration-150 cursor-pointer border',
                isSelected
                  ? 'bg-[#201f21] border-white/20 text-[#e5e1e4] font-medium'
                  : 'border-white/[0.06] text-[#a18c8c] hover:border-white/[0.15] hover:text-[#e5e1e4]',
              ].join(' ')}
            >
              {dish.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
