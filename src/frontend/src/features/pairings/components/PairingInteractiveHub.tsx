import { useState } from 'react';
import {
  UtensilsCrossed,
  Wine,
  Check,
} from 'lucide-react';
import {
  FOOD_CATEGORY_LIST,
  WINE_VARIETY_LIST,
  getFoodPairing,
  getWineVariety,
} from '../../../data/pairingsData';
import type {
  FoodCategoryId,
  WineVarietyId,
} from '../../../data/pairingsData';
import PairingDetailView from './PairingDetailView';
import { WineDetailModal } from '../../wines';
import type { CuratedWine } from '../../../types/wine';

export type HubMode = 'food' | 'wine';
type WineTypeFilter = 'all' | 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Fortificado';

interface PairingInteractiveHubProps {
  currentMode?: HubMode;
  onModeChange?: (mode: HubMode) => void;
}

export default function PairingInteractiveHub({
  currentMode,
  onModeChange,
}: PairingInteractiveHubProps = {}) {
  const [internalMode, setInternalMode] = useState<HubMode>('food');
  const mode = currentMode ?? internalMode;

  const handleModeChange = (newMode: HubMode) => {
    setInternalMode(newMode);
    onModeChange?.(newMode);
  };

  const [selectedFoodId, setSelectedFoodId] = useState<FoodCategoryId>('carnes-rojas');
  const [selectedWineId, setSelectedWineId] = useState<WineVarietyId>('malbec');
  const [wineFilter, setWineFilter] = useState<WineTypeFilter>('all');
  const [selectedModalWine, setSelectedModalWine] = useState<CuratedWine | null>(null);

  const activeFood = getFoodPairing(selectedFoodId);
  const activeWine = getWineVariety(selectedWineId);

  const handleSelectFood = (id: FoodCategoryId) => {
    setSelectedFoodId(id);
    handleModeChange('food');
  };

  const handleSelectWine = (id: WineVarietyId) => {
    setSelectedWineId(id);
    handleModeChange('wine');
  };

  const filteredWineList = WINE_VARIETY_LIST.filter((w) => {
    if (wineFilter === 'all') return true;
    return w.wineType === wineFilter;
  });

  return (
    <div className="flex flex-col gap-10">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-100 leading-tight">
          El Arte del Maridaje
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-3xl leading-relaxed">
          Una buena botella transforma cualquier comida. Decinos qué vas a cocinar o qué vino tenés a mano, y te mostramos las combinaciones ideales según nuestros sommeliers.
        </p>
      </div>

      {/* Switcher de Modo: Selector Bidireccional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-lg bg-[#121215] border border-neutral-800">
        <button
          type="button"
          onClick={() => handleModeChange('food')}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-md border text-left transition-all duration-200 cursor-pointer ${
            mode === 'food'
              ? 'bg-[#181216] border-rose-600/80 shadow-sm text-white ring-1 ring-rose-600/30'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-md shrink-0 transition-colors ${
              mode === 'food'
                ? 'bg-[#722F37] text-white'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
          >
            <UtensilsCrossed className="h-6 w-6" />
          </div>

          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl font-semibold text-neutral-100">
              ¿Qué vas a comer?
            </span>
            <span className="text-xs text-neutral-400 font-sans mt-0.5">
              Partí del menú, corte o salsa y descubrí los perfiles enológicos que mejor acompañan.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('wine')}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-md border text-left transition-all duration-200 cursor-pointer ${
            mode === 'wine'
              ? 'bg-[#181216] border-rose-600/80 shadow-sm text-white ring-1 ring-rose-600/30'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-md shrink-0 transition-colors ${
              mode === 'wine'
                ? 'bg-[#722F37] text-white'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
          >
            <Wine className="h-6 w-6" />
          </div>

          <div className="flex flex-col">
            <span className="font-serif text-lg sm:text-xl font-semibold text-neutral-100">
              ¿Qué vas a tomar?
            </span>
            <span className="text-xs text-neutral-400 font-sans mt-0.5">
              Elegí una cepa o estilo de botella y explorá qué platos elevan su bouquet.
            </span>
          </div>
        </button>
      </div>

      {/* Selector de Categorías / Varietales */}
      {mode === 'food' ? (
        <section aria-label="Categorías Gastronómicas" className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
              1. Seleccioná una categoría gastronómica ({FOOD_CATEGORY_LIST.length}):
            </span>
          </div>

          {/* Grilla de Selección de Comidas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {FOOD_CATEGORY_LIST.map((item) => {
              const isSelected = item.id === selectedFoodId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedFoodId(item.id)}
                  className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-lg border text-left transition-all duration-200 cursor-pointer min-h-[90px] group ${
                    isSelected
                      ? 'bg-rose-950/20 border-rose-600/80 shadow-sm ring-1 ring-rose-600/40'
                      : 'bg-[#121215] border-neutral-800 hover:border-neutral-700 hover:bg-[#16161a]'
                  }`}
                >
                  <div className="flex items-center justify-end w-full">
                    <span className="text-[10px] font-mono text-neutral-500">
                      {item.recommendedVarieties.length} cepas
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col">
                    <span
                      className={`text-xs sm:text-sm font-serif font-semibold leading-snug line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section aria-label="Cepas Enológicas" className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
              1. Seleccioná una cepa o estilo ({filteredWineList.length} disponibles):
            </span>

            {/* Filtros rápidos por tipo de vino */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { label: 'Todos', value: 'all' },
                  { label: 'Tintos', value: 'Tinto' },
                  { label: 'Blancos', value: 'Blanco' },
                  { label: 'Rosados', value: 'Rosado' },
                  { label: 'Espumantes & Fort.', value: 'Espumante' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setWineFilter(tab.value)}
                  className={`px-3 py-1 rounded-md text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                    wineFilter === tab.value
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'bg-neutral-900/60 text-neutral-500 hover:text-neutral-300 border border-neutral-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Varietales */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredWineList.map((item) => {
              const isSelected = item.id === selectedWineId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedWineId(item.id)}
                  className={`flex flex-col justify-between p-3.5 rounded-lg border text-left transition-all duration-200 cursor-pointer min-h-[90px] group ${
                    isSelected
                      ? 'bg-rose-950/20 border-rose-600/80 shadow-sm ring-1 ring-rose-600/40'
                      : 'bg-[#121215] border-neutral-800 hover:border-neutral-700 hover:bg-[#16161a]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
                      {item.wineType}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>

                  <div className="mt-2 flex flex-col">
                    <span
                      className={`text-xs sm:text-sm font-serif font-semibold leading-snug line-clamp-1 ${
                        isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 line-clamp-1 mt-0.5">
                      {item.body}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Panel de Detalle Sommelier con Navegación Cruzada */}
      <section aria-label="Detalle de Maridaje">
        <PairingDetailView
          mode={mode}
          food={activeFood}
          wine={activeWine}
          onSelectFood={handleSelectFood}
          onSelectWine={handleSelectWine}
          onOpenWineModal={(wine) => setSelectedModalWine(wine)}
        />
      </section>

      {/* Modal Ficha de Vino */}
      <WineDetailModal
        wine={selectedModalWine}
        onClose={() => setSelectedModalWine(null)}
      />
    </div>
  );
}
