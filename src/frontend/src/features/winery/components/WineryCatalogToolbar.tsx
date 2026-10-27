import { Search, X, LayoutGrid, List, RotateCcw } from 'lucide-react';
import type { CatalogSortOption } from '../utils/catalogUtils';
import { cn } from '../../../lib/utils';

export interface WineryCatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  wineType: string;
  onWineTypeChange: (value: string) => void;
  grape: string;
  onGrapeChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  vintageStatus: string;
  onVintageStatusChange: (value: string) => void;
  sortBy: CatalogSortOption;
  onSortByChange: (value: CatalogSortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (value: 'grid' | 'list') => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  availableGrapes: string[];
  availableYears: number[];
  isWineryPending?: boolean;
}

const WINE_TYPE_OPTIONS = [
  { value: 'All', label: 'Todos los tipos' },
  { value: 'Red', label: 'Tintos' },
  { value: 'White', label: 'Blancos' },
  { value: 'Rose', label: 'Rosados' },
  { value: 'Sparkling', label: 'Espumosos' },
  { value: 'Orange', label: 'Naranjos' },
];

const SORT_OPTIONS: { value: CatalogSortOption; label: string }[] = [
  { value: 'name_asc', label: 'Nombre (A-Z)' },
  { value: 'name_desc', label: 'Nombre (Z-A)' },
  { value: 'rating_desc', label: 'Mejor valorados' },
  { value: 'year_desc', label: 'Añada más reciente' },
];

export default function WineryCatalogToolbar({
  searchQuery,
  onSearchChange,
  wineType,
  onWineTypeChange,
  grape,
  onGrapeChange,
  year,
  onYearChange,
  vintageStatus,
  onVintageStatusChange,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
  onResetFilters,
  hasActiveFilters,
  availableGrapes,
  availableYears,
  isWineryPending = false,
}: WineryCatalogToolbarProps) {
  return (
    <div className="bg-[#121015] rounded-2xl border border-white/5 p-4 space-y-4 shadow-sm">
      {/* Fila 1: Búsqueda, Vista (Grilla/Lista) y Orden */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar etiqueta por nombre..."
            className="w-full pl-10 pr-10 py-2 rounded-xl bg-[#0a0a0c] border border-white/10 text-xs text-zinc-100 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controles de Vista y Orden */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {/* Selector de Orden */}
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as CatalogSortOption)}
            className="px-3 py-2 rounded-xl bg-[#0a0a0c] border border-white/10 text-xs text-neutral-300 focus:outline-none focus:border-rose-500/50 cursor-pointer"
            aria-label="Ordenar etiquetas"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Toggle Grilla / Lista */}
          <div
            role="group"
            aria-label="Alternar vista"
            className="flex items-center p-1 rounded-xl bg-[#0a0a0c] border border-white/10"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white'
              )}
              title="Vista en cuadrícula"
              aria-label="Vista en cuadrícula"
              aria-pressed={viewMode === 'grid'}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 rounded-lg transition-colors cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white'
              )}
              title="Vista en lista"
              aria-label="Vista en lista"
              aria-pressed={viewMode === 'list'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Fila 2: Selectores de Filtro (Tipo, Uva, Año, Estado) y Botón Restablecer */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-white/5 text-xs">
        {/* Filtro: Tipo de vino */}
        <select
          value={wineType}
          onChange={(e) => onWineTypeChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-neutral-300 focus:outline-none focus:border-rose-500/50 cursor-pointer text-xs"
          aria-label="Filtrar por tipo"
        >
          {WINE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Filtro: Uva */}
        <select
          value={grape}
          onChange={(e) => onGrapeChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-neutral-300 focus:outline-none focus:border-rose-500/50 cursor-pointer text-xs max-w-[160px] truncate"
          aria-label="Filtrar por uva"
        >
          <option value="All">Todas las uvas</option>
          {availableGrapes.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* Filtro: Año */}
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-neutral-300 focus:outline-none focus:border-rose-500/50 cursor-pointer text-xs"
          aria-label="Filtrar por año"
        >
          <option value="All">Todos los años</option>
          {availableYears.map((y) => (
            <option key={y} value={y.toString()}>
              {y}
            </option>
          ))}
        </select>

        {/* Filtro: Estado de la añada */}
        <select
          value={vintageStatus}
          onChange={(e) => onVintageStatusChange(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-[#0a0a0c] border border-white/10 text-neutral-300 focus:outline-none focus:border-rose-500/50 cursor-pointer text-xs"
          aria-label="Filtrar por estado de añada"
        >
          <option value="All">Todos los estados</option>
          {isWineryPending ? (
            <>
              <option value="Draft">Borradores</option>
              <option value="Rejected">Rechazadas</option>
            </>
          ) : (
            <>
              <option value="Approved">Publicadas</option>
              <option value="Pending">En revisión</option>
              <option value="Rejected">Rechazadas</option>
            </>
          )}
        </select>

        {/* Botón Restablecer Filtros */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs ml-auto"
            title="Restablecer filtros"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Restablecer</span>
          </button>
        )}
      </div>
    </div>
  );
}
