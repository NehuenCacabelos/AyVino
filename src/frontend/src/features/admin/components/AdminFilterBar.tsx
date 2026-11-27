import { useState, useEffect } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface FilterChipOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterSelectOption {
  label: string;
  value: string;
}

export interface FilterSelectConfig {
  id?: string;
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface AdminFilterBarProps {
  chips?: FilterChipOption[];
  activeChip?: string;
  onChipChange?: (value: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  searchDebounceMs?: number;
  selects?: FilterSelectConfig[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  clearLabel?: string;
}

/**
 * Barra reutilizable de filtros para el panel de administración.
 * Incluye chips de estado (estilo AdminWineriesPage), búsqueda con debounce de 300ms,
 * selects opcionales y botón "Limpiar filtros".
 */
export default function AdminFilterBar({
  chips,
  activeChip,
  onChipChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchLabel = 'Buscar',
  searchDebounceMs = 300,
  selects,
  onClearFilters,
  hasActiveFilters = true,
  clearLabel = 'Limpiar filtros',
}: AdminFilterBarProps) {
  const normalizedPropSearch = searchValue ?? '';
  const [localSearch, setLocalSearch] = useState<string>(normalizedPropSearch);
  const [prevPropSearch, setPrevPropSearch] = useState<string>(normalizedPropSearch);

  if (prevPropSearch !== normalizedPropSearch) {
    setPrevPropSearch(normalizedPropSearch);
    setLocalSearch(normalizedPropSearch);
  }

  useEffect(() => {
    if (!onSearchChange) return;
    if (localSearch === normalizedPropSearch) return;

    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, searchDebounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [localSearch, normalizedPropSearch, searchDebounceMs, onSearchChange]);

  const handleClear = () => {
    setLocalSearch('');
    onClearFilters?.();
  };

  const hasControlsRow = Boolean(onSearchChange || (selects && selects.length > 0) || (onClearFilters && hasActiveFilters));

  return (
    <div className="space-y-3">
      {/* Chips de estado */}
      {chips && chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => {
            const isActive = activeChip === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => onChipChange?.(chip.value)}
                aria-pressed={isActive}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border inline-flex items-center gap-1.5',
                  isActive
                    ? 'bg-[#6b1d28] border-rose-700/60 text-white shadow-sm'
                    : 'bg-[#141416] border-white/10 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                )}
              >
                <span>{chip.label}</span>
                {chip.count !== undefined && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                      isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-neutral-400'
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Búsqueda, selects y botón limpiar */}
      {hasControlsRow && (
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.08] flex flex-wrap items-end gap-3">
          {onSearchChange && (
            <div className="flex-1 min-w-[200px] space-y-1">
              <label
                htmlFor="admin-filter-search"
                className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
              >
                {searchLabel}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-filter-search"
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchLabel}
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500/60"
                />
              </div>
            </div>
          )}

          {selects?.map((sel) => {
            const selectId = sel.id ?? `admin-filter-${sel.label.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <div key={selectId} className="min-w-[160px] space-y-1">
                <label
                  htmlFor={selectId}
                  className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400"
                >
                  {sel.label}
                </label>
                <select
                  id={selectId}
                  aria-label={sel.label}
                  value={sel.value}
                  onChange={(e) => sel.onChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-white/10 text-xs text-neutral-200 focus:outline-none focus:border-rose-500/60 cursor-pointer"
                >
                  {sel.placeholder !== undefined && (
                    <option value="">{sel.placeholder}</option>
                  )}
                  {sel.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          {onClearFilters && hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="h-9 px-3.5 rounded-lg border border-white/10 bg-[#141416] hover:bg-white/[0.06] text-xs font-medium text-neutral-300 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{clearLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
