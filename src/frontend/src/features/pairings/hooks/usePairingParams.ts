import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import {
  FOOD_PAIRINGS,
  WINE_VARIETIES,
} from '../../../data/pairingsData';
import type {
  FoodCategoryId,
  WineVarietyId,
} from '../../../data/pairingsData';

export type PairingHubMode = 'food' | 'wine';

const DEFAULT_FOOD_ID: FoodCategoryId = 'asado-fuegos';
const DEFAULT_WINE_ID: WineVarietyId = 'malbec';

export function usePairingParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modo activo validado
  const modeParam = searchParams.get('mode');
  const mode: PairingHubMode = modeParam === 'wine' ? 'wine' : 'food';

  // Plato activo validado
  const foodParam = searchParams.get('food');
  const foodId: FoodCategoryId = useMemo(() => {
    if (foodParam && foodParam in FOOD_PAIRINGS) {
      return foodParam as FoodCategoryId;
    }
    return DEFAULT_FOOD_ID;
  }, [foodParam]);

  // Cepa activa validada
  const wineParam = searchParams.get('wine');
  const wineId: WineVarietyId = useMemo(() => {
    if (wineParam && wineParam in WINE_VARIETIES) {
      return wineParam as WineVarietyId;
    }
    return DEFAULT_WINE_ID;
  }, [wineParam]);

  // Contexto de origen (por ejemplo si viene de hacer clic en una cepa sugerida desde comida)
  const sourceContext = searchParams.get('from') || null;

  // Cambiar de modo conservando o restaurando los IDs válidos
  const setMode = useCallback(
    (newMode: PairingHubMode) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', newMode);
          if (newMode === 'food') {
            next.set('food', foodId);
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

  // Seleccionar comida
  const selectFood = useCallback(
    (newFoodId: FoodCategoryId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'food');
          next.set('food', newFoodId);
          next.delete('from');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Seleccionar cepa (opcionalmente con procedencia de comida para el badge contextual)
  const selectWine = useCallback(
    (newWineId: WineVarietyId, fromTitle?: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('mode', 'wine');
          next.set('wine', newWineId);
          if (fromTitle) {
            next.set('from', fromTitle);
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

  // Limpiar el badge contextual
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
    wineId,
    sourceContext,
    setMode,
    selectFood,
    selectWine,
    clearSourceContext,
  };
}

