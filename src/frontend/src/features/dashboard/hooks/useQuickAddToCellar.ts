import { useState, useCallback } from 'react';
import type { DashboardWine } from '../../../types/wine';

export interface UseQuickAddToCellarReturn {
  isModalOpen: boolean;
  activeWine: DashboardWine | null;
  initialName: string;
  openQuickAdd: (wine?: DashboardWine) => void;
  openQuickAddNew: (name?: string) => void;
  closeQuickAdd: () => void;
}

/**
 * Hook para gestionar la apertura y estado del modal QuickAddBottleModal
 * cargando un vino existente o inicializando un alta rápida.
 */
export function useQuickAddToCellar(): UseQuickAddToCellarReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeWine, setActiveWine] = useState<DashboardWine | null>(null);
  const [initialName, setInitialName] = useState('');

  const openQuickAdd = useCallback((wine?: DashboardWine) => {
    if (wine) {
      setActiveWine(wine);
      setInitialName(wine.name);
    } else {
      setActiveWine(null);
      setInitialName('');
    }
    setIsModalOpen(true);
  }, []);

  const openQuickAddNew = useCallback((name?: string) => {
    setActiveWine(null);
    setInitialName(name || '');
    setIsModalOpen(true);
  }, []);

  const closeQuickAdd = useCallback(() => {
    setIsModalOpen(false);
    setActiveWine(null);
    setInitialName('');
  }, []);

  return {
    isModalOpen,
    activeWine,
    initialName,
    openQuickAdd,
    openQuickAddNew,
    closeQuickAdd,
  };
}
