import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { WineTypeFilterChips } from '../features/wines';
import WineCreationFlow from '../features/wines/components/WineCreationFlow';
import {
  WineryShowcaseBlock,
  WineryShowcaseSkeleton,
  WineryShowcaseEmpty,
  WineryShowcaseError,
  getCatalogShowcaseApi,
  type CatalogShowcaseWinery,
} from '../features/catalog';
import type { WineListItemDto } from '../features/winery/types/wine';

const PAGE_SIZE = 6;
const WINES_PER_WINERY = 8;

/**
 * CatalogPage Component (/catalogo)
 * Vista de catálogo general rediseñada:
 * 1. Arriba: filtros rápidos preestablecidos como chips (Todos, Tinto, Blanco, Rosado, Espumoso, Naranjo).
 * 2. Debajo: buscador reactivo con debounce para nombre de vino o de bodega.
 * 3. Debajo: bloques repetidos de "bodega + carrusel de vinos" compartidos con el dashboard,
 *    con paginación "Cargar más bodegas" y sincronización bidireccional con la URL (?tipo=&q=).
 */
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtros inicializados desde los query parameters de la URL (?tipo=&q=)
  const initialType = searchParams.get('tipo') || '';
  const initialQ = searchParams.get('q') || '';

  const [activeType, setActiveType] = useState(initialType);
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);

  // Estados de datos
  const [wineries, setWineries] = useState<CatalogShowcaseWinery[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Modal para agregar vino colaborativo
  const [isCreateWineModalOpen, setIsCreateWineModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce de 350 ms sobre el input de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sincronización continua de filtros con la URL (?tipo=&q=)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeType) params.set('tipo', activeType);
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

    setSearchParams(params, { replace: true });
  }, [activeType, debouncedSearch, setSearchParams]);

  // Carga reactiva de bodegas y vinos de la primera página
  useEffect(() => {
    let isMounted = true;

    const loadInitialShowcase = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCatalogShowcaseApi({
          q: debouncedSearch.trim() || undefined,
          wineType: activeType || undefined,
          pageNumber: 1,
          pageSize: PAGE_SIZE,
          winesPerWinery: WINES_PER_WINERY,
        });

        if (!isMounted) return;
        setWineries(data.items);
        setPageNumber(1);
        setHasNextPage(data.hasNextPage);
      } catch {
        if (!isMounted) return;
        setError('No pudimos cargar los vinos del catálogo. Por favor, verificá tu conexión e intentá de nuevo.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialShowcase();

    return () => {
      isMounted = false;
    };
  }, [activeType, debouncedSearch, reloadKey]);

  // Paginación: Cargar más bodegas (página siguiente)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNextPage) return;

    setIsLoadingMore(true);
    const nextPage = pageNumber + 1;

    try {
      const data = await getCatalogShowcaseApi({
        q: debouncedSearch.trim() || undefined,
        wineType: activeType || undefined,
        pageNumber: nextPage,
        pageSize: PAGE_SIZE,
        winesPerWinery: WINES_PER_WINERY,
      });

      setWineries((prev) => [...prev, ...data.items]);
      setPageNumber(nextPage);
      setHasNextPage(data.hasNextPage);
    } catch {
      setError('Error al cargar la página siguiente de bodegas. Intentá de nuevo.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const showNotification = (msg: string) => {
    clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleAddToCellar = (wine: WineListItemDto) => {
    showNotification(`"${wine.name}" fue agregado con éxito a tu Cava.`);
  };

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen bg-[#0e0e11] text-neutral-100 font-sans selection:bg-[#722F37] selection:text-white pb-24 pt-20">
      {/* Toast de Notificación Flotante */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-white/[0.12] bg-[#1c1c22] text-neutral-100 px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium font-sans">{notification}</p>
        </aside>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Cabecera Editorial */}
        <header className="space-y-2 border-b border-white/[0.08] pb-6">
          <div className="inline-flex items-center gap-2 text-rose-300 font-mono text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Colección & Terruños Argentinos</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white">
            Catálogo General
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-light">
            Explorá bodegas, etiquetas y cosechas colaborativas organizadas por productor vitivinícola y región.
          </p>
        </header>

        {/* 1. Arriba: Filtros rápidos preestablecidos como chips */}
        <section aria-label="Filtro rápido por tipo de vino" className="space-y-2">
          <span className="block text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
            Categoría de vino
          </span>
          <WineTypeFilterChips
            activeType={activeType}
            onSelectType={(type) => {
              setActiveType(type);
            }}
          />
        </section>

        {/* 2. Debajo: Buscador reactivo por vino o bodega con botón para cargar vino */}
        <section aria-label="Búsqueda de vinos y bodegas" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              role="searchbox"
              placeholder="Buscar por nombre de vino o bodega..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141417] border border-neutral-800 text-neutral-100 pl-10 pr-10 py-2.5 rounded-xl text-sm placeholder:text-neutral-500 focus:outline-none focus:border-rose-700/70 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 transition-colors p-1"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCreateWineModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cargar un vino</span>
          </button>
        </section>

        {/* 3. Debajo: Bloques de bodega + carrusel de vinos repetidos por bodega */}
        <section aria-label="Listado de bodegas y etiquetas">
          {isLoading ? (
            <WineryShowcaseSkeleton count={3} />
          ) : error && wineries.length === 0 ? (
            <WineryShowcaseError message={error} onRetry={handleRetry} />
          ) : wineries.length === 0 ? (
            <WineryShowcaseEmpty message="No encontramos bodegas ni vinos con esos filtros" />
          ) : (
            <div className="space-y-14">
              <div className="flex flex-col gap-14">
                {wineries.map((winery) => (
                  <WineryShowcaseBlock
                    key={winery.wineryId ?? winery.wineryName}
                    winery={winery}
                    onAddToCellar={handleAddToCellar}
                    onToggleFavorite={(wine, isFav) =>
                      showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                    }
                  />
                ))}
              </div>

              {/* Botón Cargar más bodegas */}
              {hasNextPage && (
                <div className="flex justify-center pt-8">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 rounded-full border border-neutral-700 bg-[#141417] hover:bg-[#1f1f24] hover:border-neutral-500 text-xs sm:text-sm font-medium text-neutral-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Cargando más bodegas...' : 'Cargar más bodegas'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Modal integrado de creación de vino colaborativo */}
      <WineCreationFlow
        isOpen={isCreateWineModalOpen}
        onClose={() => setIsCreateWineModalOpen(false)}
        initialName={searchTerm.trim()}
      />
    </div>
  );
}
