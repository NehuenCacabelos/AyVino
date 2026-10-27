import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Wine,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import type { WineryPublicOutletContext } from './WineryPublicProfileLayout';
import {
  getWineryPublicCatalog,
  WineryPublicCatalogCard,
  WineryPublicWineDetailModal,
  type WineryPublicCatalogWineDto,
  type WineryPublicCatalogResponseDto,
  type WineResponseDto,
} from '../features/winery';

function adaptCatalogWineToDetail(
  catalogWine: WineryPublicCatalogWineDto,
  wineryName: string,
): WineResponseDto {
  return {
    id: catalogWine.id,
    wineryId: null,
    wineryNameText: wineryName,
    name: catalogWine.name,
    description: catalogWine.description ?? null,
    wineType: catalogWine.wineType,
    locationId: null,
    sourceType: catalogWine.sourceType,
    duplicateOfWineId: null,
    averageRating: catalogWine.averageRating ?? null,
    reviewCount: catalogWine.reviewCount,
  };
}

function getWineTypeSpanish(type: string): string {
  switch (type.toLowerCase()) {
    case 'red':
      return 'Tinto';
    case 'white':
      return 'Blanco';
    case 'rose':
      return 'Rosado';
    case 'sparkling':
      return 'Espumoso';
    case 'orange':
      return 'Naranjo';
    default:
      return type;
  }
}

/**
 * WineryPublicCatalogPage Component
 * Catálogo público de la bodega en /bodegas/:id/catalogo
 * Servidor filtra y pagina; estado sincronizado en URL searchParams.
 * Punto de entrada único para selección de vinos (onSelectWine).
 */
export default function WineryPublicCatalogPage() {
  const { profile, locationLabel } = useOutletContext<WineryPublicOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Extraer filtros primitivos de la URL
  const searchParam = searchParams.get('search') ?? '';
  const wineTypeParam = searchParams.get('wineType') ?? '';
  const grapeIdParam = searchParams.get('grapeId') ?? '';
  const yearParam = searchParams.get('year') ?? '';
  const sortParam = searchParams.get('sort') ?? 'name';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  // 2. Input de búsqueda local con sincronización durante render (sin effect)
  const [searchInput, setSearchInput] = useState<string>(searchParam);
  const [prevSearchParam, setPrevSearchParam] = useState<string>(searchParam);

  if (prevSearchParam !== searchParam) {
    setPrevSearchParam(searchParam);
    setSearchInput(searchParam);
  }

  // Debounce para aplicar búsqueda a searchParams (con limpieza)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput.trim() !== searchParam) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput, searchParam, setSearchParams]);

  // 3. Estado de datos del catálogo
  const [catalogData, setCatalogData] = useState<WineryPublicCatalogResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 4. Vino seleccionado para el modal provisorio (punto de entrada único)
  const [selectedWine, setSelectedWine] = useState<WineryPublicCatalogWineDto | null>(null);

  const wineryId = profile.id;

  // Carga de catálogo con filtros de servidor
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchCatalog() {
      try {
        const queryParams = {
          pageNumber: pageParam,
          pageSize: 12,
          search: searchParam || undefined,
          wineType: wineTypeParam || undefined,
          grapeId: grapeIdParam ? parseInt(grapeIdParam, 10) : undefined,
          year: yearParam ? parseInt(yearParam, 10) : undefined,
          sort: sortParam || 'name',
        };

        const data = await getWineryPublicCatalog(wineryId, queryParams, controller.signal);
        if (isMounted) {
          setCatalogData(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (isMounted) {
          if (isAxiosError(err)) {
            setError(
              (err.response?.data as { detail?: string })?.detail ||
                'No se pudo cargar el catálogo de vinos.',
            );
          } else {
            setError('Error de conexión al cargar el catálogo.');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchCatalog();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [wineryId, searchParam, wineTypeParam, grapeIdParam, yearParam, sortParam, pageParam]);

  // Handler único de selección de vino (requerimiento de producto)
  const handleSelectWine = useCallback((wine: WineryPublicCatalogWineDto) => {
    setSelectedWine(wine);
  }, []);

  // Actualizador genérico de filtros en URL
  const updateFilter = (key: string, value: string) => {
    setIsLoading(true);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const clearAllFilters = () => {
    setIsLoading(true);
    setSearchInput('');
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      const sort = prev.get('sort');
      if (sort) next.set('sort', sort);
      return next;
    });
  };

  const hasActiveFilters = Boolean(
    searchParam || wineTypeParam || grapeIdParam || yearParam,
  );

  const wineList = useMemo(() => {
    return catalogData?.items ?? [];
  }, [catalogData]);

  const filtersMeta = catalogData?.filters;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. BARRA DE HERRAMIENTAS Y FILTROS */}
      <section
        aria-label="Filtros del catálogo"
        className="p-5 rounded-2xl bg-[#121015] border border-white/5 shadow-lg space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Buscador de texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre de vino..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#17151a] border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors"
            />
          </div>

          {/* Selector de Orden */}
          <div className="w-full sm:w-52">
            <select
              value={sortParam}
              onChange={(e) => updateFilter('sort', e.target.value)}
              aria-label="Ordenar por"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#17151a] border border-white/10 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors cursor-pointer"
            >
              <option value="name">Nombre (A - Z)</option>
              <option value="rating">Mejor valorados</option>
              <option value="year">Añada más reciente</option>
            </select>
          </div>
        </div>

        {/* Filtros secundarios: Tipo, Uva, Año */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1 border-t border-white/5">
          {/* Tipo de Vino */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Tipo de vino
            </label>
            <select
              value={wineTypeParam}
              onChange={(e) => updateFilter('wineType', e.target.value)}
              aria-label="Filtrar por tipo de vino"
              className="w-full px-3 py-2 rounded-lg bg-[#17151a] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors cursor-pointer"
            >
              <option value="">Todos los tipos</option>
              {filtersMeta?.wineTypes.map((type) => (
                <option key={type} value={type}>
                  {getWineTypeSpanish(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Varietal / Uva */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Varietal
            </label>
            <select
              value={grapeIdParam}
              onChange={(e) => updateFilter('grapeId', e.target.value)}
              aria-label="Filtrar por varietal"
              className="w-full px-3 py-2 rounded-lg bg-[#17151a] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors cursor-pointer"
            >
              <option value="">Todas las uvas</option>
              {filtersMeta?.grapes.map((grape) => (
                <option key={grape.id} value={grape.id.toString()}>
                  {grape.name}
                </option>
              ))}
            </select>
          </div>

          {/* Añada / Año */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Cosecha
            </label>
            <select
              value={yearParam}
              onChange={(e) => updateFilter('year', e.target.value)}
              aria-label="Filtrar por año"
              className="w-full px-3 py-2 rounded-lg bg-[#17151a] border border-white/10 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors cursor-pointer"
            >
              <option value="">Todos los años</option>
              {filtersMeta?.years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Botón de Limpiar filtros */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. REJILLA DE VINOS CON ESTADOS */}
      {isLoading ? (
        /* Skeletons de Carga */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-80 rounded-2xl bg-[#121015] border border-white/5 animate-pulse flex flex-col p-4 space-y-4"
            >
              <div className="w-full h-44 bg-zinc-900/60 rounded-xl" />
              <div className="h-5 w-3/4 bg-zinc-900 rounded" />
              <div className="h-3 w-1/2 bg-zinc-900/50 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* Estado de Error */
        <div className="p-12 rounded-2xl bg-[#121015] border border-white/5 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="font-serif text-lg text-white">Error al cargar vinos</h3>
          <p className="text-xs text-zinc-400 font-sans">{error}</p>
        </div>
      ) : wineList.length === 0 ? (
        /* Estado Vacío */
        <div
          data-testid="catalog-empty-state"
          className="p-12 sm:p-16 rounded-2xl bg-[#121015] border border-white/5 text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-500">
            <Wine className="w-6 h-6 text-zinc-400" />
          </div>
          <h3 className="font-serif text-xl font-medium text-white">
            {hasActiveFilters
              ? 'No se encontraron vinos'
              : 'Esta bodega todavía no tiene vinos publicados'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            {hasActiveFilters
              ? 'Probá modificando o limpiando los criterios de búsqueda para ver más etiquetas.'
              : 'Los vinos que la bodega vaya elaborando y aprobando se listarán automáticamente en esta sección.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-white transition-colors cursor-pointer mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer filtros</span>
            </button>
          )}
        </div>
      ) : (
        /* Lista de Tarjetas */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wineList.map((wine) => (
              <WineryPublicCatalogCard
                key={wine.id}
                wine={wine}
                onSelectWine={handleSelectWine}
                isPreview={profile.isPreview}
              />
            ))}
          </div>

          {/* 3. PAGINACIÓN DEL LADO DEL SERVIDOR */}
          {catalogData && catalogData.totalPages > 1 && (
            <nav
              aria-label="Paginación del catálogo"
              className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <p className="text-xs font-mono text-zinc-400">
                Página <strong className="text-white">{catalogData.pageNumber}</strong> de{' '}
                <strong className="text-white">{catalogData.totalPages}</strong> (
                {catalogData.totalCount} {catalogData.totalCount === 1 ? 'etiqueta' : 'etiquetas'})
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!catalogData.hasPreviousPage}
                  onClick={() => {
                    setIsLoading(true);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('page', String(catalogData.pageNumber - 1));
                      return next;
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#17151a] hover:bg-[#1f1d24] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  disabled={!catalogData.hasNextPage}
                  onClick={() => {
                    setIsLoading(true);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('page', String(catalogData.pageNumber + 1));
                      return next;
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#17151a] hover:bg-[#1f1d24] border border-white/10 text-xs font-mono text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* 4. MODAL PROVISORIO DE DETALLE DE VINO (Punto de entrada único) */}
      {selectedWine && (
        <WineryPublicWineDetailModal
          wine={adaptCatalogWineToDetail(selectedWine, profile.name)}
          wineryName={profile.name}
          locationLabel={locationLabel}
          onClose={() => setSelectedWine(null)}
        />
      )}
    </div>
  );
}
