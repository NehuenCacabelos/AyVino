import { useState, useMemo } from 'react';
import {
  getAllWineVarieties,
  MAIN_WINE_IDS,
  type WineVarietyEntry,
} from '../../../data/pairingsData';

type WineFilterTab = 'main' | 'all' | 'tinto' | 'blanco' | 'rosado-naranjo';

interface PairingWineSelectorProps {
  selectedWineId: string;
  onSelectWine: (id: string) => void;
}

/**
 * PairingWineSelector Component
 * Selector tipográfico filtrable de cepas.
 * A primera vista solo muestra las cepas principales/comunes para mantener la vista limpia.
 * Permite filtrar por Todas, Tintos, Blancos o Rosados/Naranjos sin cards ni píldoras.
 */
export default function PairingWineSelector({
  selectedWineId,
  onSelectWine,
}: PairingWineSelectorProps) {
  const [activeTab, setActiveTab] = useState<WineFilterTab>('main');
  const allVarieties = useMemo(() => getAllWineVarieties(), []);

  // Lista filtrada derivada
  const filteredVarieties = useMemo(() => {
    switch (activeTab) {
      case 'main':
        // Principales comunes (más la seleccionada si no estuviera en la lista)
        return allVarieties.filter(
          (w) => MAIN_WINE_IDS.includes(w.id) || w.id === selectedWineId
        );
      case 'all':
        return allVarieties;
      case 'tinto':
        return allVarieties.filter((w) => w.category === 'tinto');
      case 'blanco':
        return allVarieties.filter((w) => w.category === 'blanco');
      case 'rosado-naranjo':
        return allVarieties.filter(
          (w) => w.category === 'rosado' || w.category === 'naranjo'
        );
      default:
        return allVarieties;
    }
  }, [activeTab, allVarieties, selectedWineId]);

  const tabs: { label: string; value: WineFilterTab }[] = [
    { label: 'Principales', value: 'main' },
    { label: 'Todas', value: 'all' },
    { label: 'Tintos', value: 'tinto' },
    { label: 'Blancos', value: 'blanco' },
    { label: 'Rosados / Naranjos', value: 'rosado-naranjo' },
  ];

  return (
    <div className="space-y-3 pt-1 pb-4 border-b border-neutral-800/80">
      {/* 1. Barra de Filtrado Tipográfica */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono uppercase tracking-wider text-neutral-400">
        <span className="text-[11px] text-neutral-500 font-medium sm:w-28 shrink-0">
          Filtrar cepas
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab, idx) => {
            const isTabActive = activeTab === tab.value;
            return (
              <span key={tab.value} className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`transition-colors cursor-pointer text-xs ${
                    isTabActive
                      ? 'text-rose-300 font-semibold underline decoration-rose-500 underline-offset-4'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tab.label}
                </button>
                {idx < tabs.length - 1 && (
                  <span className="text-neutral-700 select-none" aria-hidden="true">
                    /
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. Lista de Cepas según filtro activo (Compacta y sobria) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pt-1">
        <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium sm:w-28 shrink-0">
          Varietales ({filteredVarieties.length})
        </span>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {filteredVarieties.map((wine: WineVarietyEntry) => {
            const isSelected = wine.id === selectedWineId;
            return (
              <button
                key={wine.id}
                type="button"
                onClick={() => onSelectWine(wine.id)}
                className={`rounded-sm px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-neutral-800 border-neutral-600 text-white font-medium shadow-sm'
                    : 'border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {wine.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
