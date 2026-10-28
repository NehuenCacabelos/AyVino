import { useState, useRef } from 'react';
import {
  UtensilsCrossed,
  Wine,
  Check,
  Sparkles,
  Flame,
  Grape,
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
  WineCategoryGroup,
} from '../../../data/pairingsData';
import PairingDetailView from './PairingDetailView';
import { WineDetailModal } from '../../wines';
import type { CuratedWine } from '../../../types/wine';

export type HubMode = 'food' | 'wine';
type VarietyFilterTab = 'all' | WineCategoryGroup;

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

  const [selectedFoodId, setSelectedFoodId] = useState<FoodCategoryId>('asado-fuegos');
  const [selectedWineId, setSelectedWineId] = useState<WineVarietyId>('malbec');
  const [varietyFilter, setVarietyFilter] = useState<VarietyFilterTab>('all');
  const [selectedModalWine, setSelectedModalWine] = useState<CuratedWine | null>(null);

  const detailSectionRef = useRef<HTMLElement>(null);

  const activeFood = getFoodPairing(selectedFoodId);
  const activeWine = getWineVariety(selectedWineId);

  /**
   * Smooth scroll inteligente y condicional:
   * Solo realiza el scroll suave si la sección de detalle no está visible en el viewport
   */
  const scrollToDetailIfNeeded = () => {
    if (!detailSectionRef.current) return;
    const rect = detailSectionRef.current.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.top <= window.innerHeight - 150;
    if (!isVisible) {
      detailSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectFood = (id: FoodCategoryId) => {
    setSelectedFoodId(id);
    handleModeChange('food');
    // Pequeño retardo para dar tiempo a renderizar antes de comprobar visibilidad
    setTimeout(scrollToDetailIfNeeded, 60);
  };

  const handleSelectWine = (id: WineVarietyId) => {
    setSelectedWineId(id);
    handleModeChange('wine');
    setTimeout(scrollToDetailIfNeeded, 60);
  };

  const filteredWineList = WINE_VARIETY_LIST.filter((w) => {
    if (varietyFilter === 'all') return true;
    return w.categoryGroup === varietyFilter;
  });

  // Conteo de cepas por categoría para los chips de filtro
  const countTintos = WINE_VARIETY_LIST.filter((w) => w.categoryGroup === 'Tintos').length;
  const countBlancos = WINE_VARIETY_LIST.filter((w) => w.categoryGroup === 'Blancos').length;
  const countCriollas = WINE_VARIETY_LIST.filter((w) => w.categoryGroup === 'Criollas / Rosados').length;

  return (
    <div className="flex flex-col gap-10">
      {/* Cabecera Principal */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-rose-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            SOMMELIER VIRTUAL AYVINO
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-100 leading-tight">
          El Arte del Maridaje
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-3xl leading-relaxed">
          Una buena botella transforma cualquier comida. Decinos qué vas a cocinar o qué vino tenés a mano, y descubrí las combinaciones ideales inspiradas en la gastronomía y los terruños de Argentina.
        </p>
      </div>

      {/* 1. Switcher de Modo: Segmented Control Flotante */}
      <div className="relative p-1.5 rounded-2xl bg-[#141418] border border-neutral-700/60 shadow-[0_12px_32px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleModeChange('food')}
            className={`group relative flex items-center gap-4 p-4 sm:p-5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
              mode === 'food'
                ? 'bg-[#722F37]/25 border-rose-500/80 shadow-[0_4px_20px_rgba(114,47,55,0.35)] text-white ring-1 ring-rose-400/40'
                : 'bg-[#101014]/60 border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#18181f]/70'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-all duration-300 ${
                mode === 'food'
                  ? 'bg-[#722F37] text-white shadow-md shadow-rose-950/60 scale-105'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-neutral-200 group-hover:border-neutral-700'
              }`}
            >
              <UtensilsCrossed className="h-6 w-6" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-semibold text-neutral-100">
                  ¿Qué vas a comer?
                </span>
                {mode === 'food' && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Activo
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-400 font-sans mt-0.5 line-clamp-1">
                Elegí un plato o cocción y descubrí qué cepas elevan su sabor.
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('wine')}
            className={`group relative flex items-center gap-4 p-4 sm:p-5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
              mode === 'wine'
                ? 'bg-[#722F37]/25 border-rose-500/80 shadow-[0_4px_20px_rgba(114,47,55,0.35)] text-white ring-1 ring-rose-400/40'
                : 'bg-[#101014]/60 border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#18181f]/70'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-all duration-300 ${
                mode === 'wine'
                  ? 'bg-[#722F37] text-white shadow-md shadow-rose-950/60 scale-105'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-neutral-200 group-hover:border-neutral-700'
              }`}
            >
              <Wine className="h-6 w-6" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-semibold text-neutral-100">
                  ¿Qué vas a tomar?
                </span>
                {mode === 'wine' && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Activo
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-400 font-sans mt-0.5 line-clamp-1">
                Partí de tu cepa favorita y encontrá sus maridajes clásicos argentinos.
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Zona de Interacción Superior: Selector de Comidas o Cepas */}
      {mode === 'food' ? (
        <section aria-label="Categorías Gastronómicas Argentinas" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                1. Seleccioná una categoría gastronómica ({FOOD_CATEGORY_LIST.length}):
              </span>
            </div>
          </div>

          {/* Grilla de Selección de Comidas (7 Categorías Argentinas) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {FOOD_CATEGORY_LIST.map((item) => {
              const isSelected = item.id === selectedFoodId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectFood(item.id)}
                  className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[96px] group relative ${
                    isSelected
                      ? 'bg-[#722F37]/25 border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40'
                      : 'bg-[#121216] border-neutral-800 hover:border-neutral-700 hover:bg-[#18181e]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {item.recommendedVarieties.length} cepas
                    </span>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col">
                    <span
                      className={`text-xs sm:text-sm font-serif font-semibold leading-snug line-clamp-2 transition-colors ${
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
        <section aria-label="Cepas Enológicas de Argentina" className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Grape className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-mono uppercase text-neutral-400 tracking-wider">
                1. Seleccioná una cepa ({filteredWineList.length} de {WINE_VARIETY_LIST.length}):
              </span>
            </div>

            {/* Pestañas de filtro rápido por categoría enológica */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { label: `Todas (${WINE_VARIETY_LIST.length})`, value: 'all' as VarietyFilterTab },
                  { label: `Tintos (${countTintos})`, value: 'Tintos' as VarietyFilterTab },
                  { label: `Blancos (${countBlancos})`, value: 'Blancos' as VarietyFilterTab },
                  { label: `Criollas & Rosados (${countCriollas})`, value: 'Criollas / Rosados' as VarietyFilterTab },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setVarietyFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer shrink-0 ${
                    varietyFilter === tab.value
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                      : 'bg-[#121216] text-neutral-400 hover:text-neutral-200 border border-neutral-800/80 hover:bg-[#18181f]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grilla de Varietales (29 Cepas) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredWineList.map((item) => {
              const isSelected = item.id === selectedWineId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectWine(item.id)}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[96px] group relative ${
                    isSelected
                      ? 'bg-[#722F37]/25 border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/40'
                      : 'bg-[#121216] border-neutral-800 hover:border-neutral-700 hover:bg-[#18181e]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
                      {item.wineType}
                    </span>
                    {isSelected && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col">
                    <span
                      className={`text-xs sm:text-sm font-serif font-semibold leading-snug line-clamp-1 transition-colors ${
                        isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </span>

                    {/* Microinteracción: Indicador textual en una sola línea que se ilumina y expande en hover */}
                    <div className="text-[10px] font-mono text-neutral-500 group-hover:text-amber-200/90 transition-colors mt-0.5 truncate">
                      <span>{item.body}</span>
                      <span className="text-neutral-600 mx-1">·</span>
                      <span>Acidez {item.acidity}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Panel de Detalle Sommelier con Tratamiento de Lectura Diferenciado */}
      <section
        id="maridaje-detalle"
        ref={detailSectionRef}
        aria-label="Detalle de Maridaje Sommelier"
        className="scroll-mt-28"
      >
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
