import { useState, useMemo } from 'react';
import { Grape, Search, X } from 'lucide-react';
import { WINE_VARIETY_LIST } from '../../../data/pairingsData';
import type {
  WineVarietyId,
  WineCategoryGroup,
} from '../../../data/pairingsData';

const MAIN_VARIETY_IDS: WineVarietyId[] = [
  'malbec',
  'cabernet-sauvignon',
  'cabernet-franc',
  'bonarda',
  'syrah',
  'chardonnay',
  'torrontes',
  'pinot-noir',
];

type VarietyFilterTab = 'main' | 'all' | WineCategoryGroup;

interface PairingWineSelectorProps {
  selectedWineId: WineVarietyId;
  onSelectWine: (id: WineVarietyId) => void;
}

export default function PairingWineSelector({
  selectedWineId,
  onSelectWine,
}: PairingWineSelectorProps) {
  // Pestaña inicial por defecto: "Principales" (6-8 cepas más populares)
  const [activeTab, setActiveTab] = useState<VarietyFilterTab>('main');
  const [searchQuery, setSearchQuery] = useState('');

  // Conteos por categoría
  const countPrincipales = MAIN_VARIETY_IDS.length;
  const countTintos = useMemo(
    () => WINE_VARIETY_LIST.filter((w) => w.categoryGroup === 'Tintos').length,
    []
  );
  const countBlancos = useMemo(
    () => WINE_VARIETY_LIST.filter((w) => w.categoryGroup === 'Blancos').length,
    []
  );
  const countCriollas = useMemo(
    () => WINE_VARIETY_LIST.filter((w) => w.categoryGroup === 'Criollas / Rosados').length,
    []
  );

  // Lista filtrada derivada sin usar useEffect ni useState redundante
  const filteredVarieties = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return WINE_VARIETY_LIST.filter((variety) => {
      // Si hay una búsqueda de texto activa, busca en todo el catálogo de 29 cepas
      if (query) {
        return (
          variety.title.toLowerCase().includes(query) ||
          variety.body.toLowerCase().includes(query) ||
          variety.acidity.toLowerCase().includes(query) ||
          variety.flavorProfile.toLowerCase().includes(query)
        );
      }

      // Si no hay búsqueda, respeta la pestaña seleccionada
      if (activeTab === 'main') {
        // En "Principales", muestra las 8 principales y también la seleccionada actual si no estuviera incluida
        return MAIN_VARIETY_IDS.includes(variety.id) || variety.id === selectedWineId;
      }
      if (activeTab === 'all') return true;
      return variety.categoryGroup === activeTab;
    });
  }, [activeTab, searchQuery, selectedWineId]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Barra superior de control: Tabs de categoría + Buscador instantáneo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] font-mono text-neutral-300 mr-1 shrink-0">
            <Grape className="w-3.5 h-3.5 text-amber-400" />
            Cepa ({filteredVarieties.length})
          </span>

          {(
            [
              { label: `Principales (${countPrincipales})`, value: 'main' as VarietyFilterTab },
              { label: `Todas (${WINE_VARIETY_LIST.length})`, value: 'all' as VarietyFilterTab },
              { label: `Tintos (${countTintos})`, value: 'Tintos' as VarietyFilterTab },
              { label: `Blancos (${countBlancos})`, value: 'Blancos' as VarietyFilterTab },
              { label: `Rosados / Criollas (${countCriollas})`, value: 'Criollas / Rosados' as VarietyFilterTab },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all duration-150 shrink-0 cursor-pointer border ${
                activeTab === tab.value
                  ? 'bg-amber-400/15 text-amber-300 border-amber-400/60 shadow-sm'
                  : 'bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input de Búsqueda Rápida en rounded-lg */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cepa o perfil..."
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg bg-zinc-900/80 border border-zinc-700/60 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400/70 font-sans transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-0.5 cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tags de Cepas con forma rounded-lg y alto contraste */}
      {filteredVarieties.length === 0 ? (
        <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 text-center">
          No se encontraron cepas para &ldquo;{searchQuery}&rdquo;. Intentá con otro término o seleccioná otra categoría.
        </div>
      ) : (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-none"
          role="group"
          aria-label="Seleccionar variedad de uva"
        >
          {filteredVarieties.map((variety) => {
            const isSelected = variety.id === selectedWineId;

            return (
              <button
                key={variety.id}
                type="button"
                onClick={() => onSelectWine(variety.id)}
                className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-sans font-medium transition-all duration-150 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-950/50 text-amber-100 border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30'
                    : 'bg-zinc-900/70 text-zinc-300 border-zinc-700/60 hover:border-zinc-500 hover:text-white hover:bg-zinc-800/80 shadow-sm'
                }`}
              >
                <span>{variety.title}</span>
                <span
                  className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-amber-400/25 text-amber-200 border border-amber-400/30 font-semibold'
                      : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-300'
                  }`}
                >
                  {variety.categoryGroup === 'Criollas / Rosados' ? 'Criolla' : variety.categoryGroup.slice(0, -1)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
