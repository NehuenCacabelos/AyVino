import { useState, useRef, useEffect, type FormEvent } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../auth';
import type { DashboardWine } from '../../../types/wine';
import type { WineListItemDto } from '../../winery/types/wine';
import { searchWines } from '../../winery/api/wineApi';
import { imageUrl } from '../../../lib/image';
import { cn } from '../../../lib/utils';
import WineCreateModal from '../../winery/components/WineCreateModal';

export interface HeroFilterState {
  query: string;
  varietal: string;
  region: string;
  winery: string;
}

interface QuickActionsProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: HeroFilterState) => void;
  onRegisterBottle?: () => void;
  onSelectSpotlightWine?: (wineName: string) => void;
  onUncorkSpotlight?: (wine: DashboardWine) => void;
  onOpenCreateWine?: (initialName?: string) => void;
}

const varietalOptions = ['Todos', 'Malbec', 'Cabernet Franc', 'Blancos', 'Blends'];
const regionOptions = ['Todas', 'Mendoza', 'Salta', 'San Juan', 'Patagonia'];
const wineryOptions = ['Todas', 'Catena Zapata', 'Zuccardi', 'El Enemigo', 'Colomé'];

/**
 * QuickActions Component (Hero de Dashboard / AyVino)
 * Layout centrado, equilibrado y editorial:
 * - Titular con acento gradiente en la palabra "descorchar".
 * - Barra de búsqueda con autocompletado en vivo contra el catálogo real (/api/wines/search).
 * - Desplegable accesible con navegación por teclado (Enter, Escape, flechas).
 * - Modal integrado para "Agregar vino" colaborativo cuando no se encuentra la etiqueta.
 * - Segmented Filter Control integrado: Cápsula unificada con disparadores para Varietal, Región y Bodega.
 */
export default function QuickActions({
  onFilterChange,
  onOpenCreateWine,
}: QuickActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Texto del buscador
  const [searchQuery, setSearchQuery] = useState('');

  // Resultados de búsqueda en vivo
  const [searchResults, setSearchResults] = useState<WineListItemDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchRetryKey, setSearchRetryKey] = useState(0);

  // Modal para crear vino colaborativo
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialName, setCreateModalInitialName] = useState('');

  // Estados para los filtros del segmented control
  const [selectedVarietal, setSelectedVarietal] = useState('Todos');
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [selectedWinery, setSelectedWinery] = useState('Todas');
  const [activeDropdown, setActiveDropdown] = useState<'varietal' | 'region' | 'winery' | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Manejador de click-outside y tecla Escape para cerrar dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
        setActiveDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Búsqueda en paralelo por nombre y por bodega (debounce 350 ms, mín. 2 caracteres)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
        setIsDropdownOpen(false);
        setSearchError(null);
        setHighlightedIndex(-1);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const abortController = new AbortController();

    const timer = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);
      setHighlightedIndex(-1);

      Promise.all([
        searchWines({ name: trimmed, pageSize: 5 }, abortController.signal),
        searchWines({ winery: trimmed, pageSize: 5 }, abortController.signal),
      ])
        .then(([byName, byWinery]) => {
          if (abortController.signal.aborted) return;
          const map = new Map<number, WineListItemDto>();
          for (const item of byName) map.set(item.id, item);
          for (const item of byWinery) {
            if (!map.has(item.id)) map.set(item.id, item);
          }
          const combined = Array.from(map.values()).slice(0, 5);
          setSearchResults(combined);
          setIsDropdownOpen(true);
          setIsSearching(false);
        })
        .catch(() => {
          if (abortController.signal.aborted) return;
          setIsSearching(false);
          setSearchError('Error al buscar vinos en el catálogo.');
          setIsDropdownOpen(true);
        });
    }, 350);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery, searchRetryKey]);

  // Saludo contextual según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return 'Buenos días';
    if (hour >= 13 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.username ? user.username.split(' ')[0] : 'Nehuen';

  const handleOpenCreate = (initialText: string) => {
    setIsDropdownOpen(false);
    if (onOpenCreateWine) {
      onOpenCreateWine(initialText);
    } else {
      setCreateModalInitialName(initialText);
      setIsCreateModalOpen(true);
    }
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    if (highlightedIndex >= 0 && searchResults[highlightedIndex]) {
      navigate(`/vinos/${searchResults[highlightedIndex].id}`);
      setIsDropdownOpen(false);
      return;
    }

    if (searchResults.length === 1) {
      navigate(`/vinos/${searchResults[0].id}`);
      setIsDropdownOpen(false);
      return;
    }

    if (searchResults.length >= 2) {
      navigate(`/catalogo?q=${encodeURIComponent(trimmed)}`);
      setIsDropdownOpen(false);
      return;
    }

    if (searchResults.length === 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleSelectVarietal = (opt: string) => {
    setSelectedVarietal(opt);
    setActiveDropdown(null);
    onFilterChange?.({
      query: '',
      varietal: opt,
      region: selectedRegion,
      winery: selectedWinery,
    });
  };

  const handleSelectRegion = (opt: string) => {
    setSelectedRegion(opt);
    setActiveDropdown(null);
    onFilterChange?.({
      query: '',
      varietal: selectedVarietal,
      region: opt,
      winery: selectedWinery,
    });
  };

  const handleSelectWinery = (opt: string) => {
    setSelectedWinery(opt);
    setActiveDropdown(null);
    onFilterChange?.({
      query: '',
      varietal: selectedVarietal,
      region: selectedRegion,
      winery: opt,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
      {/* 1. Saludo sutil: BUENOS DÍAS, NEHUEN */}
      <p className="text-[11px] sm:text-xs tracking-[0.2em] text-stone-500 uppercase font-mono font-medium mb-0.5 sm:mb-1">
        {getGreeting().toUpperCase()}, {displayName.toUpperCase()}
      </p>

      {/* 2. Titular Principal con acento de gradiente en "descorchar" */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 mt-1 sm:mt-1.5">
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-neutral-100 font-normal tracking-tight max-w-2xl leading-snug">
          Elegí qué vino vas a{' '}
          <span className="font-italic bg-gradient-to-r from-amber-200 via-rose-300 to-amber-100 bg-clip-text text-transparent font-medium">
            descorchar
          </span>{' '}
          hoy
        </h1>
        <div className="h-[1px] w-12 bg-neutral-700/80 mt-0.5" aria-hidden="true" />
      </div>

      {/* 3. Subtítulo */}
      <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-stone-400 max-w-lg mx-auto font-sans leading-relaxed">
        Tu cava, tu historial de cata y las mejores bodegas argentinas, reunidas en un solo lugar.
      </p>

      {/* Barra de Búsqueda Única con Panel Desplegable */}
      <div ref={searchContainerRef} className="relative mt-3.5 sm:mt-4 w-full max-w-xl sm:max-w-2xl mx-auto z-50">
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="relative flex w-full items-center rounded-full border border-white/10 bg-stone-900/50 backdrop-blur-md px-4 sm:px-5 py-1 focus-within:border-white/20 transition-all shadow-xl shadow-black/25 group"
        >
          <label htmlFor="wine-search" className="sr-only">
            Buscar vino, bodega, cepa o maridaje...
          </label>

          <Search
            className="h-4 sm:h-5 w-4 sm:w-5 text-stone-400 shrink-0 mr-3 group-focus-within:text-stone-200 transition-colors"
            aria-hidden="true"
          />

          <input
            id="wine-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) setIsDropdownOpen(true);
            }}
            placeholder="Buscar vino, bodega, cepa o maridaje..."
            className="h-10 sm:h-11 w-full bg-transparent text-xs sm:text-sm md:text-base text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-sans pr-10"
          />

          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </button>
        </form>

        {/* Panel Desplegable de Resultados de Búsqueda */}
        {isDropdownOpen && searchQuery.trim().length >= 2 && (
          <div
            role="listbox"
            aria-label="Resultados de búsqueda de vinos"
            className="absolute left-0 right-0 top-full mt-2 bg-stone-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2 z-50 text-left animate-in fade-in zoom-in-95 overflow-hidden"
          >
            {isSearching && (
              <div className="p-4 text-center text-xs text-stone-400 font-sans flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                <span>Buscando vinos...</span>
              </div>
            )}

            {!isSearching && searchError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between">
                <span>{searchError}</span>
                <button
                  type="button"
                  onClick={() => setSearchRetryKey((prev) => prev + 1)}
                  className="inline-flex items-center gap-1 font-semibold text-rose-200 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            {!isSearching && !searchError && searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map((wine, idx) => (
                  <div
                    key={wine.id}
                    role="option"
                    aria-selected={highlightedIndex === idx}
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`/vinos/${wine.id}`);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors',
                      highlightedIndex === idx ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-stone-200'
                    )}
                  >
                    <div className="w-9 h-11 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {wine.thumbnailImageId ? (
                        <img
                          src={imageUrl(wine.thumbnailImageId, 'bottle')!}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Wine className="w-4 h-4 text-stone-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-100 truncate">{wine.name}</p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {wine.wineryNameText || 'Bodega'} · {wine.wineType} ·{' '}
                        {wine.referenceVintageYear ? wine.referenceVintageYear : 'Sin añada'}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Pie del Panel con Resultados */}
                <div className="pt-2 mt-1 border-t border-white/10 px-2 space-y-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate(`/catalogo?q=${encodeURIComponent(searchQuery.trim())}`);
                    }}
                    className="w-full text-xs text-rose-300 hover:text-rose-200 font-medium py-1 transition-colors cursor-pointer"
                  >
                    Ver todos los resultados
                  </button>
                  <p className="text-[11px] text-stone-400">
                    ¿No encontrás el tuyo?{' '}
                    <button
                      type="button"
                      onClick={() => handleOpenCreate(searchQuery.trim())}
                      className="text-stone-200 hover:text-white underline font-medium cursor-pointer"
                    >
                      Agregar vino
                    </button>
                  </p>
                </div>
              </div>
            )}

            {!isSearching && !searchError && searchResults.length === 0 && (
              <div className="p-4 text-center space-y-3">
                <p className="text-xs text-stone-400 font-sans">
                  No encontramos «<span className="text-stone-200 font-medium">{searchQuery.trim()}</span>»
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenCreate(searchQuery.trim())}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-semibold hover:brightness-110 transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar vino</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Segmented Filter Control Integrado (Cápsula Unificada) */}
      <div
        ref={filterContainerRef}
        className="w-full max-w-md sm:max-w-lg mx-auto flex items-center justify-between p-1 rounded-full bg-stone-900/80 backdrop-blur-md border border-white/10 shadow-lg mt-2.5 sm:mt-3 relative z-40"
      >
        {/* 1. Varietal Trigger & Popover */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'varietal' ? null : 'varietal'))}
            aria-expanded={activeDropdown === 'varietal'}
            aria-haspopup="listbox"
            className={cn(
              'w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all cursor-pointer',
              selectedVarietal !== 'Todos'
                ? 'bg-rose-950/40 border border-rose-900/40 text-rose-200 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            <Wine className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedVarietal !== 'Todos' ? selectedVarietal : 'Varietal'}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0',
                activeDropdown === 'varietal' && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'varietal' && (
            <div
              role="listbox"
              aria-label="Filtro por varietal"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-stone-900 border border-white/10 shadow-2xl rounded-xl p-2 min-w-[200px] z-50 text-left animate-in fade-in zoom-in-95"
            >
              {varietalOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selectedVarietal === opt}
                  onClick={() => handleSelectVarietal(opt)}
                  className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span className={opt === selectedVarietal ? 'text-rose-200 font-medium' : ''}>
                    {opt}
                  </span>
                  {selectedVarietal === opt && (
                    <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Separador vertical 1 */}
        <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

        {/* 2. Región Trigger & Popover */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'region' ? null : 'region'))}
            aria-expanded={activeDropdown === 'region'}
            aria-haspopup="listbox"
            className={cn(
              'w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all cursor-pointer',
              selectedRegion !== 'Todas'
                ? 'bg-rose-950/40 border border-rose-900/40 text-rose-200 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedRegion !== 'Todas' ? selectedRegion : 'Región'}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0',
                activeDropdown === 'region' && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'region' && (
            <div
              role="listbox"
              aria-label="Filtro por región"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-stone-900 border border-white/10 shadow-2xl rounded-xl p-2 min-w-[200px] z-50 text-left animate-in fade-in zoom-in-95"
            >
              {regionOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selectedRegion === opt}
                  onClick={() => handleSelectRegion(opt)}
                  className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span className={opt === selectedRegion ? 'text-rose-200 font-medium' : ''}>
                    {opt}
                  </span>
                  {selectedRegion === opt && (
                    <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Separador vertical 2 */}
        <div className="h-4 w-px bg-white/10 shrink-0" aria-hidden="true" />

        {/* 3. Bodega Trigger & Popover */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setActiveDropdown((prev) => (prev === 'winery' ? null : 'winery'))}
            aria-expanded={activeDropdown === 'winery'}
            aria-haspopup="listbox"
            className={cn(
              'w-full flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-medium tracking-wide rounded-full transition-all cursor-pointer',
              selectedWinery !== 'Todas'
                ? 'bg-rose-950/40 border border-rose-900/40 text-rose-200 shadow-sm'
                : 'text-stone-300 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{selectedWinery !== 'Todas' ? selectedWinery : 'Bodega'}</span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0',
                activeDropdown === 'winery' && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>

          {activeDropdown === 'winery' && (
            <div
              role="listbox"
              aria-label="Filtro por bodega"
              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-stone-900 border border-white/10 shadow-2xl rounded-xl p-2 min-w-[200px] z-50 text-left animate-in fade-in zoom-in-95"
            >
              {wineryOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selectedWinery === opt}
                  onClick={() => handleSelectWinery(opt)}
                  className="w-full px-3 py-2 text-sm rounded-lg text-stone-300 hover:text-white hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <span className={opt === selectedWinery ? 'text-rose-200 font-medium' : ''}>
                    {opt}
                  </span>
                  {selectedWinery === opt && (
                    <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal integrado de carga de vino en modo usuario */}
      <WineCreateModal
        mode="user"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialName={createModalInitialName}
        onResolved={(result) => {
          setIsCreateModalOpen(false);
          navigate(`/vinos/${result.wine.id}`);
        }}
      />
    </div>
  );
}
