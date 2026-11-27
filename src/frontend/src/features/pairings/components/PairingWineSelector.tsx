import { useState, useMemo } from 'react';
import {
  getAllWineVarieties,
  MAIN_WINE_IDS,
  type WineVarietyEntry,
} from '../../../data/pairingsData';

type WineFilterTab = 'main' | 'tinto' | 'blanco' | 'rosado-naranjo';

interface PairingWineSelectorProps {
  selectedWineId: string;
  onSelectWine: (id: string) => void;
}

// Gradientes de fallback por categoría cuando no hay imagen
const CATEGORY_GRADIENT: Record<string, string> = {
  tinto: 'from-[#722f37] to-[#3c0610]',
  blanco: 'from-[#5c4300] to-[#1a0e00]',
  rosado: 'from-[#8e0029] to-[#40000d]',
  naranjo: 'from-[#7a3e00] to-[#2e1600]',
};

/**
 * PairingWineSelector Component
 * Galería estilo revista con cards cuadradas (rounded-none), foto de racimo arriba
 * y título con descriptor dentro de la card. Idéntico al diseño de referencia.
 */
export default function PairingWineSelector({
  selectedWineId,
  onSelectWine,
}: PairingWineSelectorProps) {
  const [activeTab, setActiveTab] = useState<WineFilterTab>('main');
  const allVarieties = useMemo(() => getAllWineVarieties(), []);

  // Conteos dinámicos para los tabs
  const mainCount = MAIN_WINE_IDS.length;
  const tintoCount = useMemo(
    () => allVarieties.filter((w) => w.category === 'tinto').length,
    [allVarieties]
  );
  const blancoCount = useMemo(
    () => allVarieties.filter((w) => w.category === 'blanco').length,
    [allVarieties]
  );
  const rosadoNaranjoCount = useMemo(
    () =>
      allVarieties.filter(
        (w) => w.category === 'rosado' || w.category === 'naranjo'
      ).length,
    [allVarieties]
  );

  const filterTabs: { label: string; value: WineFilterTab }[] = [
    { label: `PRINCIPALES (${mainCount})`, value: 'main' },
    { label: `TINTOS (${tintoCount})`, value: 'tinto' },
    { label: `BLANCOS (${blancoCount})`, value: 'blanco' },
    { label: `ROSADOS & NARANJOS (${rosadoNaranjoCount})`, value: 'rosado-naranjo' },
  ];

  const filteredVarieties = useMemo<WineVarietyEntry[]>(() => {
    switch (activeTab) {
      case 'main':
        return allVarieties.filter(
          (w) => MAIN_WINE_IDS.includes(w.id) || w.id === selectedWineId
        );
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

  return (
    <div className="space-y-4">
      {/* 1. Tabs de filtro estilo revista (cuadrados, monoespaciados) */}
      <div
        className="flex overflow-x-auto gap-2 pb-1 scrollbar-none"
        role="tablist"
        aria-label="Filtro de varietales"
      >
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all duration-150 cursor-pointer rounded-none shrink-0 border',
                isActive
                  ? 'bg-[#19181a] border-[#c89d5c]/80 text-white shadow-sm'
                  : 'bg-[#121214] border-white/5 text-[#8e8c8f] hover:text-white hover:border-white/20',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Galería de cards cuadradas de uvas */}
      <div
        className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none lg:grid lg:grid-cols-7"
        role="listbox"
        aria-label="Selector de varietal"
      >
        {filteredVarieties.map((wine) => {
          const isSelected = wine.id === selectedWineId;
          const gradient = CATEGORY_GRADIENT[wine.category] ?? CATEGORY_GRADIENT.tinto;

          return (
            <button
              key={wine.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectWine(wine.id)}
              className={[
                'min-w-[135px] sm:min-w-[150px] lg:min-w-0 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 text-left rounded-none group border',
                isSelected
                  ? 'bg-[#18171a] border-[#c89d5c] shadow-[0_0_15px_rgba(200,157,92,0.14)] ring-1 ring-[#c89d5c]/30'
                  : 'bg-[#121214] border-white/5 hover:border-white/20 hover:bg-[#151517]',
              ].join(' ')}
            >
              {/* Imagen del racimo (cuadrada, dentro de la card) */}
              <div className="w-full aspect-[4/3] overflow-hidden bg-neutral-900 rounded-none mb-2.5">
                {wine.grapeImageUrl ? (
                  <img
                    src={wine.grapeImageUrl}
                    alt={wine.name}
                    loading="lazy"
                    className={[
                      'w-full h-full object-cover transition-transform duration-300',
                      isSelected
                        ? 'scale-105'
                        : 'grayscale-[15%] group-hover:grayscale-0 group-hover:scale-105',
                    ].join(' ')}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
                  >
                    <span className="font-serif text-lg text-white/60">
                      {wine.name.slice(0, 1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Nombre y subtítulo descriptivo DENTRO de la card */}
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-sm sm:text-base text-white font-normal leading-tight truncate">
                  {wine.name}
                </span>
                <span
                  className={[
                    'text-[10px] sm:text-[11px] font-mono tracking-widest uppercase truncate leading-tight',
                    isSelected
                      ? 'text-[#e5a93c] font-medium'
                      : 'text-[#737373] group-hover:text-neutral-400',
                  ].join(' ')}
                >
                  {wine.shortTag || wine.category.toUpperCase()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
