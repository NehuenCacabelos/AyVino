/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { UseMyWineryReturn } from '../hooks/useMyWinery';

const WineryContext = createContext<UseMyWineryReturn | undefined>(undefined);

export interface WineryProviderProps {
  value: UseMyWineryReturn;
  children: ReactNode;
}

/**
 * Proveedor de contexto para la bodega activa del usuario en el panel.
 * Suministra un `value` memoizado mediante `useMemo` cumpliendo la Regla 11.
 */
export function WineryProvider({ value, children }: WineryProviderProps) {
  const memoizedValue = useMemo(() => value, [value]);

  return <WineryContext.Provider value={memoizedValue}>{children}</WineryContext.Provider>;
}

/**
 * Hook para consumir el contexto de bodega dentro de cualquier componente del panel.
 */
export function useWinery(): UseMyWineryReturn {
  const context = useContext(WineryContext);
  if (!context) {
    throw new Error('useWinery debe ser utilizado dentro de un WineryProvider (WineryLayout).');
  }
  return context;
}

