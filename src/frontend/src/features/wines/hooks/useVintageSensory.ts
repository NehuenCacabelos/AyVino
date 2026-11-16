import { useState, useEffect, useCallback } from 'react';
import { getVintageSensory, type VintageSensoryDto } from '../api/sensoryApi';

export interface UseVintageSensoryReturn {
  sensory: VintageSensoryDto | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useVintageSensory(
  wineId: number | string | undefined,
  vintageId: number | string | undefined
): UseVintageSensoryReturn {
  const numericWineId = typeof wineId === 'number' ? wineId : Number(wineId);
  const numericVintageId = typeof vintageId === 'number' ? vintageId : Number(vintageId);

  const isValid = !isNaN(numericWineId) && numericWineId > 0 && !isNaN(numericVintageId) && numericVintageId > 0;

  const [sensory, setSensory] = useState<VintageSensoryDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(isValid));
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    if (!isValid) {
      return;
    }

    getVintageSensory(numericWineId, numericVintageId)
      .then((data) => {
        if (!active) return;
        setSensory(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Error al cargar perfil sensorial';
        setError(msg);
        setSensory(null);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isValid, numericWineId, numericVintageId, reloadTrigger]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    sensory,
    isLoading,
    error,
    reload,
  };
}
