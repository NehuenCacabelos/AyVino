import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Search, SlidersHorizontal, RotateCcw, AlertTriangle, X, Plus } from 'lucide-react';
import WineCreationFlow from '../features/wines/components/WineCreationFlow';
import axios from 'axios';
import { searchWines } from '../features/winery/api/wineApi';
import type { WineListItemDto } from '../features/winery/types/wine';
import { WineCard, WineTypeFilterChips, mapWineListItemToCuratedWine } from '../features/wines';

const PAGE_SIZE = 12;

/**
 * Skeleton para tarjetas de vino en estado de carga.
 */
function WineCardSkeleton() {
  return (
    <div className="bg-[#141417]/80 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row overflow-hidden animate-pulse">
      <div className="w-full sm:w-40 h-52 sm:h-48 bg-[#0d0d0f] sm:border-r border-b sm:border-b-0 border-white/[0.08] flex items-center justify-center p-4 shrink-0">
        <div className="w-12 h-36 bg-neutral-800/60 rounded" />
      </div>
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="h-3 w-24 bg-neutral-800 rounded" />
            <div className="h-3 w-16 bg-neutral-800 rounded" />
          </div>
          <div className="h-6 w-3/4 bg-neutral-800 rounded mb-2" />
          <div className="h-4 w-1/2 bg-neutral-800/70 rounded" />
        </div>
        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="h-4 w-16 bg-neutral-800 rounded" />
          <div className="h-4 w-20 bg-neutral-800 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * CatalogPage Component
 * Página de catálogo integral general para miembros registrados de AyVino.
 * Búsqueda difusa por nombre, filtros avanzados, orden por cosecha de referencia y paginación con "Cargar más".
 */
export default function CatalogPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtros controlados inicializados desde URL
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [wineryFilter, setWineryFilter] = useState(() => searchParams.get('winery') || '');
  const [yearFilter, setYearFilter] = useState(() => searchParams.get('year') || '');
  const [wineTypeFilter, setWineTypeFilter] = useState(() => searchParams.get('type') || '');

  // Estado del panel plegable de filtros
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(() => {
    return Boolean(searchParams.get('winery') || searchParams.get('year') || searchParams.get('type'));
  });

  // Valores debounced para inputs de texto
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [debouncedWinery, setDebouncedWinery] = useState(wineryFilter);
  const [debouncedYear, setDebouncedYear] = useState(yearFilter);

  // Estados de datos
  const [isCreateWineModalOpen, setIsCreateWineModalOpen] = useState(false);
  const [createWineInitialName, setCreateWineInitialName] = useState('');
  const [wines, setWines] = useState<WineListItemDto[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Ref para cancelar peticiones pendientes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce de 400 ms sobre los inputs de texto
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setDebouncedWinery(wineryFilter);
      setDebouncedYear(yearFilter);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm, wineryFilter, yearFilter]);

  // Sincronización de filtros aplicados con la query string de la URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (debouncedWinery.trim()) params.set('winery', debouncedWinery.trim());
    if (debouncedYear.trim()) params.set('year', debouncedYear.trim());
    if (wineTypeFilter) params.set('type', wineTypeFilter);

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, debouncedWinery, debouncedYear, wineTypeFilter, setSearchParams]);

  // Carga asíncrona de datos reactiva a los filtros y clave de recarga
  useEffect(() => {
    let isMounted = true;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const loadData = async () => {
      try {
        const yearNum = debouncedYear.trim() ? parseInt(debouncedYear.trim(), 10) : undefined;
        const data = await searchWines(
          {
            name: debouncedSearch.trim() || undefined,
            winery: debouncedWinery.trim() || undefined,
            year: !isNaN(yearNum as number) ? yearNum : undefined,
            wineType: wineTypeFilter || undefined,
            pageNumber: 1,
            pageSize: PAGE_SIZE,
          },
          controller.signal
        );

        if (!isMounted) return;
        setWines(data);
        setPageNumber(1);
        setHasMore(data.length === PAGE_SIZE);
        setError(null);
      } catch (err: unknown) {
        if (!isMounted || axios.isCancel(err) || (err as { name?: string })?.name === 'CanceledError') {
          return;
        }
        setError('No pudimos cargar los vinos del catálogo. Por favor, verificá tu conexión e intentá de nuevo.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [debouncedSearch, debouncedWinery, debouncedYear, wineTypeFilter, reloadKey]);

  // Acción: Cargar más vinos (página siguiente)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = pageNumber + 1;

    try {
      const yearNum = debouncedYear.trim() ? parseInt(debouncedYear.trim(), 10) : undefined;
      const data = await searchWines({
        name: debouncedSearch.trim() || undefined,
        winery: debouncedWinery.trim() || undefined,
        year: !isNaN(yearNum as number) ? yearNum : undefined,
        wineType: wineTypeFilter || undefined,
        pageNumber: nextPage,
        pageSize: PAGE_SIZE,
      });

      setWines((prev) => [...prev, ...data]);
      setPageNumber(nextPage);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err: unknown) {
      if (axios.isCancel(err)) return;
      setError('Error al cargar la página siguiente. Intentá de nuevo.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Limpiar todos los filtros aplicados
  const handleClearFilters = () => {
    setIsLoading(true);
    setSearchTerm('');
    setWineryFilter('');
    setYearFilter('');
    setWineTypeFilter('');
    setDebouncedSearch('');
    setDebouncedWinery('');
    setDebouncedYear('');
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() || wineryFilter.trim() || yearFilter.trim() || wineTypeFilter
  );

  // Mapeo puro a CuratedWine para renderizar en WineCard
  const curatedWines = useMemo(() => {
    return wines.map((wine) => mapWineListItemToCuratedWine(wine));
  }, [wines]);

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-16 w-full">
      {/* Encabezado Editorial Preservado */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300 bg-neutral-900 px-3 py-1 rounded-sm border border-neutral-800">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          Catálogo General Protegido
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-3 text-neutral-100 leading-tight">
          Colección & Terruños Argentinos
        </h1>

        <p className="mt-2 text-sm text-zinc-300 max-w-2xl font-sans leading-relaxed">
          Explorá el archivo completo de etiquetas certificadas, notas sensoriales de añadas y maridajes propuestos por la comunidad.
        </p>
      </div>

      {/* Barra de Búsqueda y Control de Filtros */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Buscador principal por nombre */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre de vino (ej: Gran Malbec, Angélica)..."
              value={searchTerm}
              onChange={(e) => {
                setIsLoading(true);
                setSearchTerm(e.target.value);
              }}
              className="w-full bg-[#141416] border border-neutral-800 text-neutral-100 pl-10 pr-10 py-2.5 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-rose-700/70 focus:ring-1 focus:ring-rose-700/70 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                aria-label="Limpiar búsqueda por nombre"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Botón para alternar filtros avanzados */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            aria-expanded={showAdvancedFilters}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-colors cursor-pointer ${
              showAdvancedFilters || hasActiveFilters
                ? 'bg-rose-950/40 border-rose-700/60 text-rose-200'
                : 'bg-[#141416] border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ml-0.5" />
            )}
          </button>

          {/* Botón discreto para cargar un vino colaborativo */}
          <button
            type="button"
            onClick={() => {
              setCreateWineInitialName('');
              setIsCreateWineModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cargar un vino</span>
          </button>
        </div>

        {/* Panel Plegable de Filtros Adicionales */}
        {showAdvancedFilters && (
          <div className="p-5 rounded-xl bg-[#141417]/60 border border-neutral-800/80 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Filtro Bodega */}
              <div>
                <label htmlFor="filter-winery" className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Bodega
                </label>
                <input
                  id="filter-winery"
                  type="text"
                  placeholder="Ej: Catena Zapata, Zuccardi..."
                  value={wineryFilter}
                  onChange={(e) => {
                    setIsLoading(true);
                    setWineryFilter(e.target.value);
                  }}
                  className="w-full bg-[#0e0e10] border border-neutral-800 text-neutral-100 px-3.5 py-2 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-rose-700/70 transition-colors"
                />
              </div>

              {/* Filtro Año */}
              <div>
                <label htmlFor="filter-year" className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Año de añada
                </label>
                <input
                  id="filter-year"
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="Ej: 2021..."
                  value={yearFilter}
                  onChange={(e) => {
                    setIsLoading(true);
                    setYearFilter(e.target.value);
                  }}
                  className="w-full bg-[#0e0e10] border border-neutral-800 text-neutral-100 px-3.5 py-2 rounded-lg text-sm placeholder:text-neutral-500 focus:outline-none focus:border-rose-700/70 transition-colors"
                />
              </div>
            </div>

            {/* Filtro Tipo de Vino (Chips) */}
            <div>
              <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Tipo de vino
              </span>
              <WineTypeFilterChips
                activeType={wineTypeFilter}
                onSelectType={(type) => {
                  setIsLoading(true);
                  setWineTypeFilter(type);
                }}
              />
            </div>

            {/* Acción de restablecer filtros si alguno está activo */}
            {hasActiveFilters && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar todos los filtros</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estados del Catálogo */}

      {/* Estado: Error con reintento */}
      {error && !isLoading && (
        <div className="p-8 rounded-xl bg-rose-950/20 border border-rose-900/50 text-center my-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-neutral-200 max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((prev) => prev + 1);
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-900/60 border border-rose-700/60 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Estado: Carga inicial con esqueletos */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <WineCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Estado: Vacío (sin resultados) */}
      {!isLoading && !error && wines.length === 0 && (
        <div className="p-12 rounded-xl bg-[#141416] border border-neutral-800 text-center flex flex-col items-center justify-center space-y-4 my-6">
          <div className="w-12 h-12 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 flex items-center justify-center">
            <Search className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-neutral-100">
            No encontramos vinos con esos filtros
          </h2>
          <p className="text-sm text-neutral-400 max-w-md font-sans">
            Probá ajustando o quitando los términos de búsqueda, la bodega o la añada seleccionada.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setCreateWineInitialName(searchTerm);
                setIsCreateWineModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-rose-700 to-rose-900 text-white text-xs font-semibold uppercase tracking-wider hover:brightness-110 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar vino</span>
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-700 text-neutral-200 text-xs font-semibold uppercase tracking-wider hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estado: Listado con Tarjetas */}
      {!isLoading && !error && wines.length > 0 && (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curatedWines.map((wine) => (
              <WineCard
                key={wine.id}
                wine={wine}
                onSelect={() => navigate(`/vinos/${wine.id}`)}
              />
            ))}
          </div>

          {/* Botón Cargar Más */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#141417] border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isLoadingMore ? (
                  <>
                    <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                    <span>Cargando más vinos...</span>
                  </>
                ) : (
                  <span>Cargar más</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
      {/* Flujo colaborativo de creación de vino */}
      <WineCreationFlow
        isOpen={isCreateWineModalOpen}
        onClose={() => setIsCreateWineModalOpen(false)}
        initialName={createWineInitialName}
      />
    </main>
  );
}
