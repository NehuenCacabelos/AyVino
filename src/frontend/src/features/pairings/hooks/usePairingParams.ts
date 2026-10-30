import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import {
  DISH_PAIRINGS,
  WINE_VARIETIES,
  FOOD_FAMILIES_MAP,
  type FoodFamilyId,
} from '../../../data/pairingsData';

export type PairingHubMode = 'food' | 'wine';

const DEFAULT_FOOD_ID = 'fuegos';
const DEFAULT_WINE_ID = 'malbec';

export function usePairingParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modo activo validado (por defecto 'wine')
  const modeParam = searchParams.get('mode');
  const mode: PairingHubMode = modeParam === 'food' ? 'food' : 'wine';

  // ID de comida (puede ser familia 'fuegos' o plato concreto 'bife-de-chorizo')
  const foodParam = searchParams.get('food');
  const foodId: string = useMemo(() => {
    if (foodParam && (foodParam in DISH_PAIRINGS || foodParam in FOOD_FAMILIES_MAP)) {
      return foodParam;
    }
    return DEFAULT_FOOD_ID;
  }, [foodParam]);

  // Familia activa y plato específico activo (si aplica)
  const isDish = foodId in DISH_PAIRINGS;
  const activeFamilyId: FoodFamilyId = useMemo(() => {
    if (isDish) {
      return DISH_PAIRINGS[foodId].familyId;
    }
    return (foodId in FOOD_FAMILIES_MAP ? foodId : 'fuegos') as FoodFamilyId;
  }, [foodId, isDish]);

  const activeDishId: string | null = isDish ? foodId : null;

  // Cepa activa validada
  const wineParam = searchParams.get('wine');
  const wineId: string = useMemo(() => {
    if (wineParam && wineParam in WINE_VARIETIES) {
      return wineParam;
    }
    return DEFAULT_WINE_ID;
  }, [wineParam]);

  // Sub-estilo activo opcional (ej: 'altura', 'crianza')
  const styleAnchor = searchParams.get('style') || null;

  // Contexto de origen (procedencia de clic en hipertexto)
  const sourceContext = searchParams.get('from') || null;

  // Cambiar de modo conservando los IDs válidos
  const setMode = useCallback(
    (newMode: PairingHubMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', newMode);
          if (newMode === 'food') {
            next.set('food', foodId);
            next.delete('style');
          } else {
            next.set('wine', wineId);
          }
          return next;
        },
        { replace: true }
      );
    },
    [foodId, wineId, setSearchParams]
  );

  // Seleccionar categoría general de comida (limpia el plato específico)
  const selectCategory = useCallback(
    (familyId: FoodFamilyId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'food');
          next.set('food', familyId);
          next.delete('style');
          next.delete('from');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Seleccionar plato específico dentro de una categoría
  const selectDish = useCallback(
    (dishId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'food');
          next.set('food', dishId);
          next.delete('style');
          next.delete('from');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Seleccionar comida (general o plato)
  const selectFood = useCallback(
    (newFoodId: string, fromLabel?: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'food');
          next.set('food', newFoodId);
          next.delete('style');
          if (fromLabel) {
            next.set('from', fromLabel);
          } else {
            next.delete('from');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Seleccionar cepa con ancla de estilo opcional
  const selectWine = useCallback(
    (newWineId: string, anchor?: string, fromLabel?: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'wine');
          next.set('wine', newWineId);
          if (anchor) {
            next.set('style', anchor);
          } else {
            next.delete('style');
          }
          if (fromLabel) {
            next.set('from', fromLabel);
          } else {
            next.delete('from');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Limpiar el contexto de procedencia
  const clearSourceContext = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('from');
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return {
    mode,
    foodId,
    activeFamilyId,
    activeDishId,
    wineId,
    styleAnchor,
    sourceContext,
    setMode,
    selectCategory,
    selectDish,
    selectFood,
    selectWine,
    clearSourceContext,
  };
}
