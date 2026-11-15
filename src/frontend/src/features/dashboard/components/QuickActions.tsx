import { useState, useRef, useEffect, type FormEvent } from 'react';
import {
  Search,
  ArrowRight,
  Wine,
  MapPin,
  Building2,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useAuth } from '../../auth';
import type { DashboardWine } from '../../../types/wine';
import { cn } from '../../../lib/utils';

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
}

const varietalOptions = ['Todos', 'Malbec', 'Cabernet Franc', 'Blancos', 'Blends'];
const regionOptions = ['Todas', 'Mendoza', 'Salta', 'San Juan', 'Patagonia'];
const wineryOptions = ['Todas', 'Catena Zapata', 'Zuccardi', 'El Enemigo', 'Colomé'];

/**
 * QuickActions Component (Hero de Dashboard / AyVino)
 * Layout centrado, equilibrado y editorial:
 * - Titular con acento gradiente en la palabra "descorchar".
 * - Barra de búsqueda única centrada con botón de acción circular ArrowRight (sin atajo ⌘K ni textos sueltos).
 * - Segmented Filter Control integrado: Cápsula unificada con disparadores para Varietal, Región y Bodega.
 */
export default function QuickActions({
  onSearch,
  onFilterChange,
}: QuickActionsProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para los filtros del segmented control
  const [selectedVarietal, setSelectedVarietal] = useState('Todos');
  const [selectedRegion, setSelectedRegion] = useState('Todas');
  const [selectedWinery, setSelectedWinery] = useState('Todas');
  const [activeDropdown, setActiveDropdown] = useState<'varietal' | 'region' | 'winery' | null>(null);

  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Manejador de click-outside y tecla Escape para cerrar dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterContainerRef.current && !filterContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
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

  // Saludo contextual según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 13) return 'Buenos días';
    if (hour >= 13 && hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const displayName = user?.username ? user.username.split(' ')[0] : 'Nehuen';

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
    onFilterChange?.({
      query: searchQuery,
      varietal: selectedVarietal,
      region: selectedRegion,
      winery: selectedWinery,
    });
  };

  const handleSelectVarietal = (opt: string) => {
    setSelectedVarietal(opt);
    setActiveDropdown(null);
    onFilterChange?.({
      query: searchQuery,
      varietal: opt,
      region: selectedRegion,
      winery: selectedWinery,
    });
  };

  const handleSelectRegion = (opt: string) => {
    setSelectedRegion(opt);
    setActiveDropdown(null);
    onFilterChange?.({
      query: searchQuery,
      varietal: selectedVarietal,
      region: opt,
      winery: selectedWinery,
    });
  };

  const handleSelectWinery = (opt: string) => {
    setSelectedWinery(opt);
    setActiveDropdown(null);
    onFilterChange?.({
      query: searchQuery,
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

      {/* 3. Subtítulo con contraste suave y ancho centrado equilibrado */}
      <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-stone-400 max-w-lg mx-auto font-sans leading-relaxed">
        Tu cava, tu historial de cata y las mejores bodegas argentinas, reunidas en un solo lugar.
      </p>

      {/* Barra de Búsqueda Única Centrada tipo Píldora */}
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="relative mt-3.5 sm:mt-4 flex w-full max-w-xl sm:max-w-2xl mx-auto items-center rounded-full border border-white/10 bg-stone-900/50 backdrop-blur-md px-4 sm:px-5 py-1 focus-within:border-white/20 transition-all shadow-xl shadow-black/25 group"
      >
        <label htmlFor="wine-search" className="sr-only">
          Buscar vino, bodega, cepa o maridaje...
        </label>

        {/* Ícono de Lupa a la izquierda */}
        <Search
          className="h-4 sm:h-5 w-4 sm:w-5 text-stone-400 shrink-0 mr-3 group-focus-within:text-stone-200 transition-colors"
          aria-hidden="true"
        />

        <input
          id="wine-search"
          type="search"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            onSearch?.(val);
            onFilterChange?.({
              query: val,
              varietal: selectedVarietal,
              region: selectedRegion,
              winery: selectedWinery,
            });
          }}
          placeholder="Buscar vino, bodega, cepa o maridaje..."
          className="h-10 sm:h-11 w-full bg-transparent text-xs sm:text-sm md:text-base text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-sans pr-10"
        />

        {/* Botón circular de acción ArrowRight en el extremo derecho */}
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 sm:h-8 w-7 sm:w-8 rounded-full bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
        >
          <ArrowRight className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
        </button>
      </form>

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
    </div>
  );
}
