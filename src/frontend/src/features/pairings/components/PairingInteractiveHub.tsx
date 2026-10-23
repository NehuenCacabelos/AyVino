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

type HubMode = 'food' | 'wine';
type WineTypeFilter = 'all' | 'Tinto' | 'Blanco' | 'Rosado' | 'Espumante' | 'Fortificado';

export default function PairingInteractiveHub() {
  const [mode, setMode] = useState<HubMode>('food');
  const [selectedFoodId, setSelectedFoodId] = useState<FoodCategoryId>('carnes-rojas');
  const [selectedWineId, setSelectedWineId] = useState<WineVarietyId>('malbec');
  const [wineFilter, setWineFilter] = useState<WineTypeFilter>('all');
  const [selectedModalWine, setSelectedModalWine] = useState<CuratedWine | null>(null);

  const activeFood = getFoodPairing(selectedFoodId);
  const activeWine = getWineVariety(selectedWineId);

  const handleSelectFood = (id: FoodCategoryId) => {
    setSelectedFoodId(id);
    setMode('food');
  };

  const handleSelectWine = (id: WineVarietyId) => {
    setSelectedWineId(id);
    setMode('wine');
  };

  const filteredWineList = WINE_VARIETY_LIST.filter((w) => {
    if (wineFilter === 'all') return true;
    return w.wineType === wineFilter;
  });

  return (
    <div className="flex flex-col gap-10">
      {/* Cabecera Principal del Laboratorio */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.25em] text-neutral-400">
            LABORATORIO ENOGASTRONÓMICO
          </span>
          <span className="h-1 w-1 rounded-full bg-rose-500" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400/90">
            Interactividad Bidireccional
          </span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-100 leading-tight">
          El Arte del Maridaje
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-3xl leading-relaxed">
          Descubrí la afinidad molecular entre el terruño, los taninos, la acidez y la alta gastronomía.
          Elegí qué vas a cocinar para encontrar la etiqueta idónea, o partí de tu cepa predilecta para diseñar el menú perfecto.
        </p>
      </div>

      {/* Switcher de Modo: Gran Selector Bidireccional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1.5 rounded-2xl bg-[#121214] border border-neutral-800">
        <button
          type="button"
          onClick={() => setMode('food')}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
            mode === 'food'
              ? 'bg-[#1b1418] border-rose-900/50 shadow-lg text-white'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-colors ${
              mode === 'food'
                ? 'bg-[#722F37] text-white'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
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
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <span className="text-xs text-neutral-400 font-sans mt-0.5">
              Partí del menú, corte o salsa y descubrí los perfiles enológicos armonizantes.
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('wine')}
          className={`flex items-center gap-4 p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
            mode === 'wine'
              ? 'bg-[#1b1418] border-rose-900/50 shadow-lg text-white'
              : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40'
          }`}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 transition-colors ${
              mode === 'wine'
                ? 'bg-[#722F37] text-white'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
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
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
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
            <span className="text-xs font-mono text-neutral-500">
              Taxonomía técnica de maridaje
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
                  className={`flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[105px] group ${
                    isSelected
                      ? 'bg-[#181216] border-rose-500/80 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-[#141417] border-neutral-800 hover:border-neutral-700 hover:bg-[#16161a]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected ? 'bg-rose-500' : 'bg-neutral-700 group-hover:bg-neutral-600'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-neutral-500">
                      {item.recommendedVarieties.length} cepas
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col">
                    <span
                      className={`text-xs sm:text-sm font-serif font-semibold leading-snug line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-tight mt-0.5 line-clamp-1">
                      {item.badge}
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
                  className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer min-h-[95px] group ${
                    isSelected
                      ? 'bg-[#181216] border-rose-500/80 shadow-md ring-1 ring-rose-500/50'
                      : 'bg-[#141417] border-neutral-800 hover:border-neutral-700 hover:bg-[#16161a]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 uppercase">
                      {item.wineType}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-400" />}
                  </div>

                  <div className="mt-2.5 flex flex-col">
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
