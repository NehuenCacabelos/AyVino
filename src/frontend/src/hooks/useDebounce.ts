import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Retrasa la propagación de un valor hasta que transcurra el tiempo `delay` (por defecto 350ms)
 * sin nuevas modificaciones, saneando el temporizador en cada render.
 */
export function useDebounce<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

