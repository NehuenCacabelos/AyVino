import { useState, useRef, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Wine,
  MapPin,
  Building2,
  ChevronDown,
  Check,
  Plus,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth';
import type { DashboardWine } from '../../../types/wine';
import { cn } from '../../../lib/utils';
import { imageUrl } from '../../../lib/image';
import {
  getCatalogFilters,
  getSearchSuggestions,
  type CatalogFiltersResponse,
  type CatalogFilterItem,
  type WineSuggestion,
  type WinerySuggestion,
  type SearchSuggestionsResponse,
} from '../api/catalogApi';

export interface HeroFilterState {
  query: string;
  varietal: string;
  region: string;
  winery: string;
  grapeId?: number;
  stateId?: number;
  wineryId?: number;
}

interface QuickActionsProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: HeroFilterState) => void;
  onRegisterBottle?: () => void;
  onSelectSpotlightWine?: (wineName: string) => void;
  onUncorkSpotlight?: (wine: DashboardWine) => void;
  onCreateWine?: (name: string) => void;
}

function getInitials(name: string): string {
  if (!name) return 'B';
  const clean = name.replace(/^bodega\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

type FlatSuggestion =
  | { type: 'wine'; item: WineSuggestion }
  | { type: 'winery'; item: WinerySuggestion }
  | { type: 'grape'; item: CatalogFilterItem }
  | { type: 'region'; item: CatalogFilterItem }
  | { type: 'create'; text: string };

/**
 * QuickActions Component (Hero de Dashboard / AyVino)
 * - Saludo contextual.
 * - Barra de búsqueda con autocompletado y sugerencias agrupadas (debounce 250ms, AbortSignal).
 * - Fila fija "Crear «texto escrito»".
 * - Segmented Filter Control con datos reales de la BD vía getCatalogFilters().
 */
export default function QuickActions({
  onSearch,
  onFilterChange,
  onCreateWine,
}: QuickActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVarietal, setSelectedVarietal] = useState('Todos');
  const [selectedGrapeId, setSelectedGrapeId] = useState<number | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [selectedStateId, setSelectedStateId] = useState<number | undefined>(undefined);
  const [selectedWinery, setSelectedWinery] = useState('Todas');
  const [selectedWineryId, setSelectedWineryId] = useState<number | undefined>(undefined);

  const [activeDropdown, setActiveDropdown] = useState<'varietal' | 'region' | 'winery' | null>(null);

  // Filtros reales de la API
  const [filtersData, setFiltersData] = useState<CatalogFiltersResponse | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);

  // Sugerencias de búsqueda
  const [suggestions, setSuggestions] = useState<SearchSuggestionsResponse | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Carga de filtros con caché de sesión
  const loadFilters = async (forceRefresh = false) => {
    setFiltersLoading(true);
    setFiltersError(null);
    try {
      const data = await getCatalogFilters(forceRefresh);
      setFiltersData(data);
    } catch {
      setFiltersError('No se pudieron cargar los filtros.');
    } finally {
      setFiltersLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getCatalogFilters()
      .then((data) => {
        if (isMounted) {
          setFiltersData(data);
          setFiltersLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFiltersError('No se pudieron cargar los filtros.');
          setFiltersLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Manejador de click-outside y Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (filterContainerRef.current && !filterContainerRef.current.contains(target)) {
        setActiveDropdown(null);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSuggestionsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setIsSuggestionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Debounce de 250ms y AbortSignal para sugerencias (envía filtros activos)
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const hasFilters = Boolean(selectedGrapeId || selectedStateId || selectedWineryId);
        const res = hasFilters
          ? await getSearchSuggestions(
              trimmed,
              {
                grapeId: selectedGrapeId,
                stateId: selectedStateId,
                wineryId: selectedWineryId,
              },
              controller.signal,
            )
          : await getSearchSuggestions(trimmed, controller.signal);
        setSuggestions(res);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        // En caso de fallo transitorio dejamos suggestions vacío
        setSuggestions({ wines: [], wineries: [], grapes: [], regions: [] });
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, selectedGrapeId, selectedStateId, selectedWineryId]);

  // Lista plana de sugerencias para navegación por teclado
  const flatSuggestions = useMemo<FlatSuggestion[]>(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];

    const list: FlatSuggestion[] = [];

    if (suggestions) {
      suggestions.wines.slice(0, 3).forEach((w) => list.push({ type: 'wine', item: w }));
      suggestions.wineries.slice(0, 3).forEach((wy) => list.push({ type: 'winery', item: wy }));
      suggestions.grapes.slice(0, 3).forEach((g) => list.push({ type: 'grape', item: g }));
      suggestions.regions.slice(0, 3).forEach((r) => list.push({ type: 'region', item: r }));
    }

    // Fila fija "Crear «texto escrito»" siempre al final
    list.push({ type: 'create', text: trimmed });

    return list;
  }, [suggestions, searchQuery]);

  // Cantidad de sugerencias reales de la API (excluyendo "Crear")
  const totalApiSuggestions = suggestions
    ? suggestions.wines.length +
      suggestions.wineries.length +
      suggestions.grapes.length +
      suggestions.regions.length
    : 0;

  // Saludo contextual
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return 'Buenos días';
    if (hour >= 13 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.username ? user.username.split(' ')[0] : 'Nehuen';

  const triggerFilterChange = (
    nextQuery: string,
    varietal = selectedVarietal,
    region = selectedRegion,
    winery = selectedWinery,
    grapeId = selectedGrapeId,
    stateId = selectedStateId,
    wineryId = selectedWineryId,
  ) => {
    onFilterChange?.({
      query: nextQuery,
      varietal,
      region,
      winery,
      grapeId,
      stateId,
      wineryId,
    });
  };

  const handleSelectVarietal = (item: CatalogFilterItem | null) => {
    const name = item ? item.name : 'Todos';
    const id = item ? item.id : undefined;
    setSelectedVarietal(name);
    setSelectedGrapeId(id);
    setActiveDropdown(null);
    triggerFilterChange(
      searchQuery,
      name,
      selectedRegion,
      selectedWinery,
      id,
      selectedStateId,
      selectedWineryId,
    );
  };

  const handleSelectRegion = (item: CatalogFilterItem | null) => {
    const name = item ? item.name : 'Todas';
    const id = item ? item.id : undefined;
    setSelectedRegion(name);
    setSelectedStateId(id);
    setActiveDropdown(null);
    triggerFilterChange(
      searchQuery,
      selectedVarietal,
      name,
      selectedWinery,
      selectedGrapeId,
      id,
      selectedWineryId,
    );
  };

  const handleSelectWinery = (item: CatalogFilterItem | null) => {
    const name = item ? item.name : 'Todas';
    const id = item ? item.id : undefined;
    setSelectedWinery(name);
    setSelectedWineryId(id);
    setActiveDropdown(null);
    triggerFilterChange(
      searchQuery,
      selectedVarietal,
      selectedRegion,
      name,
      selectedGrapeId,
      selectedStateId,
      id,
    );
  };

  const executeSuggestion = (suggestion: FlatSuggestion) => {
    setIsSuggestionsOpen(false);
    setHighlightedIndex(-1);

    switch (suggestion.type) {
      case 'wine':
        navigate(`/vinos/${suggestion.item.id}`);
        break;
      case 'winery':
        navigate(`/bodegas/${suggestion.item.id}`);
        break;
      case 'grape': {
        const grapeName = suggestion.item.name;
        setSelectedVarietal(grapeName);
        setSelectedGrapeId(suggestion.item.id);
        setSearchQuery('');
        onSearch?.('');
        triggerFilterChange(
          '',
          grapeName,
          selectedRegion,
          selectedWinery,
          suggestion.item.id,
          selectedStateId,
          selectedWineryId,
        );
        break;
      }
      case 'region': {
        const regionName = suggestion.item.name;
        setSelectedRegion(regionName);
        setSelectedStateId(suggestion.item.id);
        setSearchQuery('');
        onSearch?.('');
        triggerFilterChange(
          '',
          selectedVarietal,
          regionName,
          selectedWinery,
          selectedGrapeId,
          suggestion.item.id,
          selectedWineryId,
        );
        break;
      }
      case 'create':
        onCreateWine?.(suggestion.text);
        break;
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (highlightedIndex >= 0 && highlightedIndex < flatSuggestions.length) {
      executeSuggestion(flatSuggestions[highlightedIndex]);
      return;
    }

    // Sin ítem resaltado:
    // Si hay resultados de API: aplica el texto como búsqueda del catálogo
    // Si NO hay ninguno (o texto menor a 2 caracteres sin resultados): ejecuta "Crear"
    if (totalApiSuggestions > 0) {
      setIsSuggestionsOpen(false);
      onSearch?.(searchQuery);
      triggerFilterChange(searchQuery);
    } else if (searchQuery.trim().length > 0) {
      setIsSuggestionsOpen(false);
      onCreateWine?.(searchQuery.trim());
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestionsOpen || flatSuggestions.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % flatSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? flatSuggestions.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      setIsSuggestionsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const activeDescendantId =
    highlightedIndex >= 0 ? `suggestion-opt-${highlightedIndex}` : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
      {/* 1. Saludo sutil */}
      <p className="text-[11px] sm:text-xs tracking-[0.2em] text-stone-500 uppercase font-mono font-medium mb-0.5 sm:mb-1">
        {getGreeting().toUpperCase()}, {displayName.toUpperCase()}
      </p>

      {/* 2. Titular Principal con acento de gradiente */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
        <h1
          id="welcome-title"
          className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-neutral-100 tracking-tight leading-[1.14]"
        >
          ¿Qué vamos a{' '}
          <span className="bg-gradient-to-r from-stone-100 via-rose-200 to-amber-200 bg-clip-text text-transparent">
            descorchar
          </span>{' '}
          hoy?
        </h1>
        <div className="h-[1px] w-12 bg-neutral-700/80 mt-0.5" aria-hidden="true" />
      </div>

      {/* 3. Subtítulo */}
      <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-stone-400 max-w-lg mx-auto font-sans leading-relaxed">
        Tu cava, tu historial de cata y las mejores bodegas argentinas, reunidas en un solo lugar.
      </p>

      {/* Barra de Búsqueda Única con Desplegable de Sugerencias */}
      <div ref={searchContainerRef} className="relative w-full max-w-xl sm:max-w-2xl mx-auto z-50">
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="relative mt-3.5 sm:mt-4 flex w-full items-center rounded-full border border-white/10 bg-stone-900/50 backdrop-blur-md px-4 sm:px-5 py-1 focus-within:border-white/20 transition-all shadow-xl shadow-black/25 group"
        >
          <label htmlFor="wine-search" className="sr-only">
            Buscar vino, bodega, cepa o región...
          </label>

          <Search
            className="h-4 sm:h-5 w-4 sm:w-5 text-stone-400 shrink-0 mr-3 group-focus-within:text-stone-200 transition-colors"
            aria-hidden="true"
          />

          <input
            id="wine-search"
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isSuggestionsOpen}
            aria-controls="search-suggestions-dropdown"
            aria-activedescendant={activeDescendantId}
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim().length > 0) {
                setIsSuggestionsOpen(true);
              }
            }}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              onSearch?.(val);
              triggerFilterChange(val);
              const trimmed = val.trim();
              if (trimmed.length < 2) {
                setSuggestions(null);
                setIsSuggestionsLoading(false);
                setIsSuggestionsOpen(trimmed.length > 0);
                setHighlightedIndex(-1);
              } else {
                setIsSuggestionsLoading(true);
                setIsSuggestionsOpen(true);
                setHighlightedIndex(-1);
              }
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar vino, bodega, cepa o región..."
            className="h-10 sm:h-11 w-full bg-transparent text-xs sm:text-sm md:text-base text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-sans pr-10"
          />

          {isSuggestionsLoading && (
            <Loader2 className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-stone-400" />
          )}

          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </button>
        </form>

        {/* Desplegable de Sugerencias Agrupadas */}
        {isSuggestionsOpen && flatSuggestions.length > 0 && (
          <div
            id="search-suggestions-dropdown"
            role="listbox"
            aria-label="Sugerencias de búsqueda"
            className="absolute left-0 right-0 top-full mt-2 bg-stone-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2 z-50 text-left max-h-[420px] overflow-y-auto animate-in fade-in zoom-in-95"
          >
            {/* 1. Sección Vinos */}
            {suggestions && suggestions.wines.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 px-3 py-1 font-semibold">
                  Vinos
                </div>
                {suggestions.wines.slice(0, 3).map((wine) => {
                  const idx = flatSuggestions.findIndex(
                    (s) => s.type === 'wine' && s.item.id === wine.id,
                  );
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`sug-wine-${wine.id}`}
                      id={`suggestion-opt-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => executeSuggestion({ type: 'wine', item: wine })}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-rose-950/40 border border-rose-900/40 text-rose-100'
                          : 'hover:bg-white/5 text-stone-300',
                      )}
                    >
                      <Wine className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                          {wine.name}
                        </p>
                        <p className="text-[11px] text-stone-400 truncate">
                          {wine.wineryName || 'Bodega'} · {wine.vintage || 'S/A'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. Sección Bodegas */}
            {suggestions && suggestions.wineries.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 px-3 py-1 font-semibold">
                  Bodegas
                </div>
                {suggestions.wineries.slice(0, 3).map((winery) => {
                  const idx = flatSuggestions.findIndex(
                    (s) => s.type === 'winery' && s.item.id === winery.id,
                  );
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`sug-winery-${winery.id}`}
                      id={`suggestion-opt-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => executeSuggestion({ type: 'winery', item: winery })}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-rose-950/40 border border-rose-900/40 text-rose-100'
                          : 'hover:bg-white/5 text-stone-300',
                      )}
                    >
                      {winery.logoImageId ? (
                        <img
                          src={imageUrl(winery.logoImageId, 'logo') || ''}
                          alt={winery.name}
                          className="w-5 h-5 rounded-md object-contain shrink-0 bg-stone-800"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-md bg-stone-800 border border-white/10 flex items-center justify-center text-[10px] font-serif text-stone-300 shrink-0">
                          {getInitials(winery.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                          {winery.name}
                        </p>
                        {winery.location && (
                          <p className="text-[11px] text-stone-400 truncate">{winery.location}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Sección Uvas */}
            {suggestions && suggestions.grapes.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 px-3 py-1 font-semibold">
                  Uvas
                </div>
                {suggestions.grapes.slice(0, 3).map((grape) => {
                  const idx = flatSuggestions.findIndex(
                    (s) => s.type === 'grape' && s.item.id === grape.id,
                  );
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`sug-grape-${grape.id}`}
                      id={`suggestion-opt-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => executeSuggestion({ type: 'grape', item: grape })}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-rose-950/40 border border-rose-900/40 text-rose-100'
                          : 'hover:bg-white/5 text-stone-300',
                      )}
                    >
                      <Wine className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                          {grape.name}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {grape.wineCount} {grape.wineCount === 1 ? 'vino' : 'vinos'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 4. Sección Regiones */}
            {suggestions && suggestions.regions.length > 0 && (
              <div className="mb-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 px-3 py-1 font-semibold">
                  Regiones
                </div>
                {suggestions.regions.slice(0, 3).map((reg) => {
                  const idx = flatSuggestions.findIndex(
                    (s) => s.type === 'region' && s.item.id === reg.id,
                  );
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={`sug-region-${reg.id}`}
                      id={`suggestion-opt-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() => executeSuggestion({ type: 'region', item: reg })}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-rose-950/40 border border-rose-900/40 text-rose-100'
                          : 'hover:bg-white/5 text-stone-300',
                      )}
                    >
                      <MapPin className="w-4 h-4 text-stone-400 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                          {reg.name}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">
                          {reg.wineCount} {reg.wineCount === 1 ? 'vino' : 'vinos'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fila Fija al final: "Crear «texto escrito»" */}
            {searchQuery.trim().length > 0 && (
              <div className="pt-1 border-t border-white/10">
                {(() => {
                  const createIdx = flatSuggestions.length - 1;
                  const isHighlighted = createIdx === highlightedIndex;
                  return (
                    <button
                      id={`suggestion-opt-${createIdx}`}
                      type="button"
                      role="option"
                      aria-selected={isHighlighted}
                      onClick={() =>
                        executeSuggestion({ type: 'create', text: searchQuery.trim() })
                      }
                      onMouseEnter={() => setHighlightedIndex(createIdx)}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer',
                        isHighlighted
                          ? 'bg-rose-950/60 border border-rose-800/60 text-white'
                          : 'hover:bg-white/10 text-rose-200',
                      )}
                    >
                      <div className="h-6 w-6 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-neutral-100 truncate">
                          Crear «{searchQuery.trim()}»
                        </p>
                        <p className="text-[10px] text-stone-400">
                          Dar de alta una nueva etiqueta en la plataforma
                        </p>
                      </div>
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Segmented Filter Control Integrado con Datos Reales de la BD */}
      <div
        ref={filterContainerRef}
        className="w-full max-w-md sm:max-w-lg mx-auto flex items-center justify-between p-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-white/10 shadow-lg mt-2.5 sm:mt-3 relative z-40"
      >
        {/* 1. Varietal Trigger & Popover */}
        <div className="relative flex-1">
          <button
            type="button"
            disabled={filtersLoading}
            onClick={() => setActiveDropdown((prev) => (prev === 'varietal' ? null : 'varietal'))}
            aria-expanded={activeDropdown === 'varietal'}
            aria-haspopup="listbox"
            className={cn(
              'w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
              selectedVarietal !== 'Todos'
                ? 'bg-rose-950/40 border border-rose-900/40 text-rose-200 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent',
            )}
          >
            <Wine className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {selectedVarietal !== 'Todos' ? selectedVarietal : 'Varietal'}
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0',
                activeDropdown === 'varietal' && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'varietal' && (
            <div
              role="listbox"
              aria-label="Filtro por varietal"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-stone-900 border border-white/10 shadow-2xl rounded-xl p-2 min-w-[220px] max-h-[300px] overflow-y-auto z-50 text-left animate-in fade-in zoom-in-95"
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedVarietal === 'Todos'}
                onClick={() => handleSelectVarietal(null)}
                className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
              >
                <span className={selectedVarietal === 'Todos' ? 'text-rose-200 font-medium' : ''}>
                  Todos
                </span>
                {selectedVarietal === 'Todos' && (
                  <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
                )}
              </button>

              {filtersLoading && (
                <div className="px-3 py-3 text-xs text-stone-400 flex items-center gap-2 justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cargando opciones...</span>
                </div>
              )}

              {filtersError && !filtersLoading && (
                <div className="px-3 py-2 text-xs text-rose-300 flex flex-col gap-1 items-start">
                  <span>{filtersError}</span>
                  <button
                    type="button"
                    onClick={() => void loadFilters(true)}
                    className="inline-flex items-center gap-1 underline text-rose-200 hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                </div>
              )}

              {!filtersLoading && !filtersError && filtersData && filtersData.grapes.length === 0 && (
                <div className="px-3 py-2 text-xs text-stone-400">Sin opciones aún</div>
              )}

              {!filtersLoading &&
                filtersData?.grapes.map((grape) => {
                  const isSelected = selectedGrapeId === grape.id;
                  return (
                    <button
                      key={`varietal-${grape.id}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectVarietal(grape)}
                      className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                      <span className={cn('truncate', isSelected && 'text-rose-200 font-medium')}>
                        {grape.name} ({grape.wineCount})
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Separador vertical 1 */}
        <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

        {/* 2. Región Trigger & Popover */}
        <div className="relative flex-1">
          <button
            type="button"
            disabled={filtersLoading}
            onClick={() => setActiveDropdown((prev) => (prev === 'region' ? null : 'region'))}
            aria-expanded={activeDropdown === 'region'}
            aria-haspopup="listbox"
            className={cn(
              'w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
              selectedRegion !== 'Todas'
                ? 'bg-rose-950/40 border border-rose-900/40 text-rose-200 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent',
            )}
          >
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {selectedRegion !== 'Todas' ? selectedRegion : 'Región'}
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0',
                activeDropdown === 'region' && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'region' && (
            <div
              role="listbox"
              aria-label="Filtro por región"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-stone-900 border border-white/10 shadow-2xl rounded-xl p-2 min-w-[220px] max-h-[300px] overflow-y-auto z-50 text-left animate-in fade-in zoom-in-95"
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedRegion === 'Todas'}
                onClick={() => handleSelectRegion(null)}
                className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
              >
                <span className={selectedRegion === 'Todas' ? 'text-rose-200 font-medium' : ''}>
                  Todas
                </span>
                {selectedRegion === 'Todas' && (
                  <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
                )}
              </button>

              {filtersLoading && (
                <div className="px-3 py-3 text-xs text-stone-400 flex items-center gap-2 justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cargando opciones...</span>
                </div>
              )}

              {filtersError && !filtersLoading && (
                <div className="px-3 py-2 text-xs text-rose-300 flex flex-col gap-1 items-start">
                  <span>{filtersError}</span>
                  <button
                    type="button"
                    onClick={() => void loadFilters(true)}
                    className="inline-flex items-center gap-1 underline text-rose-200 hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                </div>
              )}

              {!filtersLoading &&
                !filtersError &&
                filtersData &&
                filtersData.provinces.length === 0 && (
                  <div className="px-3 py-2 text-xs text-stone-400">Sin opciones aún</div>
                )}

              {!filtersLoading &&
                filtersData?.provinces.map((prov) => {
                  const isSelected = selectedStateId === prov.id;
                  return (
                    <button
                      key={`region-${prov.id}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectRegion(prov)}
                      className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                      <span className={cn('truncate', isSelected && 'text-rose-200 font-medium')}>
                        {prov.name} ({prov.wineCount})
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Separador vertical 2 */}
        <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

        {/* 3. Bodega Trigger & Popover */}
        <div className="relative flex-1">
          <button
            type="button"
            disabled={filtersLoading}
            onClick={() => setActiveDropdown((prev) => (prev === 'winery' ? null : 'winery'))}
            aria-expanded={activeDropdown === 'winery'}
            aria-haspopup="listbox"
            className={cn(
              'w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
              selectedWinery !== 'Todas'
                ? 'bg-rose-950/40 border border-rose-900/40 text-rose-200 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent',
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {selectedWinery !== 'Todas' ? selectedWinery : 'Bodega'}
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0',
                activeDropdown === 'winery' && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'winery' && (
            <div
              role="listbox"
              aria-label="Filtro por bodega"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-stone-900 border border-white/10 shadow-2xl rounded-xl p-2 min-w-[220px] max-h-[300px] overflow-y-auto z-50 text-left animate-in fade-in zoom-in-95"
            >
              <button
                type="button"
                role="option"
                aria-selected={selectedWinery === 'Todas'}
                onClick={() => handleSelectWinery(null)}
                className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
              >
                <span className={selectedWinery === 'Todas' ? 'text-rose-200 font-medium' : ''}>
                  Todas
                </span>
                {selectedWinery === 'Todas' && (
                  <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
                )}
              </button>

              {filtersLoading && (
                <div className="px-3 py-3 text-xs text-stone-400 flex items-center gap-2 justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cargando opciones...</span>
                </div>
              )}

              {filtersError && !filtersLoading && (
                <div className="px-3 py-2 text-xs text-rose-300 flex flex-col gap-1 items-start">
                  <span>{filtersError}</span>
                  <button
                    type="button"
                    onClick={() => void loadFilters(true)}
                    className="inline-flex items-center gap-1 underline text-rose-200 hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" /> Reintentar
                  </button>
                </div>
              )}

              {!filtersLoading &&
                !filtersError &&
                filtersData &&
                filtersData.wineries.length === 0 && (
                  <div className="px-3 py-2 text-xs text-stone-400">Sin opciones aún</div>
                )}

              {!filtersLoading &&
                filtersData?.wineries.map((wy) => {
                  const isSelected = selectedWineryId === wy.id;
                  return (
                    <button
                      key={`winery-${wy.id}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectWinery(wy)}
                      className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between gap-2"
                    >
                      <span className={cn('truncate', isSelected && 'text-rose-200 font-medium')}>
                        {wy.name} ({wy.wineCount})
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
