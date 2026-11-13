import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  Wine,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  QuickActions,
  Metrics,
  FilterChips,
  SectionHeading,
  WineryBlock,
  UncorkDialog,
  WineCardSkeleton,
} from '../features/dashboard';
import { searchCatalogWines } from '../features/dashboard/api/catalogApi';
import QuickAddBottleModal from '../features/cava/components/QuickAddBottleModal';
import { resolveWineTypeAndBottle } from '../features/cava/data/varietalsData';
import apiClient from '../services/apiClient';
import { useDebounce } from '../hooks/useDebounce';
import type { HeroFilterState } from '../features/dashboard/components/QuickActions';
import {
  catalogWineToDashboardWine,
  type DashboardWine,
  type UncorkSubmission,
} from '../types/wine';
import type { AppOutletContext } from '../components/layout/AppLayout';

interface WineryGroup {
  key: string;
  wineryId?: number;
  logoImageId?: string;
  name: string;
  region: string;
  initials: string;
  wines: DashboardWine[];
}

function getWineryInitials(name: string): string {
  if (!name) return 'B';
  const clean = name.replace(/^bodega\s+/i, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

/**
 * DashboardPage Component (/dashboard)
 * Vista principal enfocada en Exploración de Bodegas y Catálogo de etiquetas:
 * - Hero centrado con saludo, buscador reactivo en tiempo real con debounce y Segmented Filter Control.
 * - Barra de métricas "Cava Strip" horizontal como cierre de la primera pantalla.
 * - Catálogo unificado conectado a PostgreSQL vía API REST (.NET Minimal API / Dapper).
 * - Grilla unificada de cards con skeletons tenues durante la carga y Empty State editorial.
 */
export default function DashboardPage() {
  const { stockCount, setStockCount } = useOutletContext<AppOutletContext>();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroFilters, setHeroFilters] = useState<HeroFilterState>({
    query: '',
    varietal: 'Todos',
    region: 'Todas',
    winery: 'Todas',
  });
  const [catalogWines, setCatalogWines] = useState<DashboardWine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialName, setCreateInitialName] = useState('');

  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<DashboardWine | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isAutoScrollingRef = useRef(false);
  const lastScrollYRef = useRef(0);

  // Debounce de 350ms del término de búsqueda efectivo
  const effectiveQuery = searchQuery.trim() || heroFilters.query.trim();
  const debouncedQuery = useDebounce(effectiveQuery, 350);

  const [reloadKey, setReloadKey] = useState(0);

  // Carga reactiva de catálogo conectada al backend con cancelación de solicitudes obsoletas
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const wineryParam =
          heroFilters.wineryId === undefined && heroFilters.winery !== 'Todas'
            ? heroFilters.winery
            : undefined;
        let wineTypeParam: string | undefined = undefined;

        if (heroFilters.varietal === 'Blancos' || activeFilter === 'Blancos') {
          wineTypeParam = 'White';
        } else if (activeFilter === 'Espumantes') {
          wineTypeParam = 'Sparkling';
        }

        const items = await searchCatalogWines(
          {
            search: debouncedQuery || undefined,
            winery: wineryParam,
            wineryId: heroFilters.wineryId,
            grapeId: heroFilters.grapeId,
            stateId: heroFilters.stateId,
            wineType: wineTypeParam,
            pageSize: 48,
          },
          controller.signal,
        );

        if (isMounted) {
          const mapped = items.map(catalogWineToDashboardWine);
          setCatalogWines(mapped);
          setIsLoading(false);
          setFetchError(null);
        }
      } catch (err: unknown) {
        if (axios.isCancel(err) || (err instanceof DOMException && err.name === 'AbortError')) {
          return;
        }
        console.error('Error al cargar catálogo de vinos:', err);
        if (isMounted) {
          setFetchError('No se pudieron cargar las etiquetas del catálogo. Intentá nuevamente.');
          setIsLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    debouncedQuery,
    heroFilters.wineryId,
    heroFilters.winery,
    heroFilters.grapeId,
    heroFilters.stateId,
    heroFilters.varietal,
    activeFilter,
    reloadKey,
  ]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroEl = document.getElementById('hero-section');
      if (!heroEl) return;

      const heroHeight = heroEl.offsetHeight;
      const progress = Math.min(1, Math.max(0, scrollY / (heroHeight * 0.7)));
      setHeroScrollProgress(progress);

      const isScrollingDown = scrollY > lastScrollYRef.current;
      lastScrollYRef.current = scrollY;

      if (
        isScrollingDown &&
        scrollY >= heroHeight * 0.38 &&
        scrollY < heroHeight * 0.9 &&
        !isAutoScrollingRef.current
      ) {
        isAutoScrollingRef.current = true;
        window.scrollTo({ top: heroHeight, behavior: 'smooth' });
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 850);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(notificationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash === '#catalogo') {
      const timer = setTimeout(() => {
        const catalogEl = document.getElementById('catalogo');
        catalogEl?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  const showNotification = (msg: string) => {
    clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleUncorkSaved = (data: UncorkSubmission) => {
    setStockCount((prev) => Math.max(0, prev - 1));
    showNotification(`¡Descorche registrado! ${data.wine.name} calificado con ${data.rating} estrellas.`);
  };

  const handleAddToCellar = (wine: DashboardWine) => {
    setStockCount((prev) => prev + 1);
    showNotification(`"${wine.name}" fue agregado con éxito a tu Cava.`);
  };

  // Filtrado reactivo derivado en cliente exclusivamente para chips rápidos
  const filteredWines = useMemo(() => {
    return catalogWines.filter((wine) => {
      // Chips de filtros rápidos inferiores (se conservan intactos)
      if (activeFilter !== 'Todos') {
        if (activeFilter === 'Blancos') {
          const isWhite =
            wine.varietal.toLowerCase().includes('blanco') ||
            wine.varietal.toLowerCase().includes('chardonnay') ||
            wine.varietal.toLowerCase().includes('torrontés') ||
            wine.varietal.toLowerCase().includes('torrontes') ||
            wine.bottle === 'white' ||
            wine.bottle === 'white-flute';
          if (!isWhite) return false;
        } else if (activeFilter === 'Espumantes') {
          if (
            !wine.varietal.toLowerCase().includes('espumante') &&
            !wine.varietal.toLowerCase().includes('champagne') &&
            wine.bottle !== 'sparkling'
          ) {
            return false;
          }
        } else if (activeFilter === 'Malbec') {
          if (!wine.varietal.toLowerCase().includes('malbec')) return false;
        } else if (activeFilter === 'Cabernet Sauvignon') {
          if (!wine.varietal.toLowerCase().includes('cabernet')) return false;
        } else if (activeFilter === 'Mendoza') {
          if (!wine.region.toLowerCase().includes('mendoza')) return false;
        } else if (activeFilter === 'Salta') {
          if (!wine.region.toLowerCase().includes('salta')) return false;
        } else if (activeFilter === 'Patagonia') {
          const isPatagonia =
            wine.region.toLowerCase().includes('río negro') ||
            wine.region.toLowerCase().includes('rio negro') ||
            wine.region.toLowerCase().includes('patagonia') ||
            wine.region.toLowerCase().includes('neuquén') ||
            wine.region.toLowerCase().includes('neuquen');
          if (!isPatagonia) return false;
        }
      }

      return true;
    });
  }, [catalogWines, activeFilter]);

  // Agrupamiento dinámico por bodega a partir de los datos reales de la base de datos
  const wineryGroups = useMemo<WineryGroup[]>(() => {
    const map = new Map<
      string,
      {
        key: string;
        wineryId?: number;
        logoImageId?: string;
        name: string;
        region: string;
        wines: DashboardWine[];
      }
    >();

    filteredWines.forEach((wine) => {
      const wineryName = wine.winery?.trim() || 'Bodega Colección';
      const region = wine.region?.trim() || 'Mendoza, Argentina';
      const groupKey =
        wine.wineryId != null
          ? `winery-id-${wine.wineryId}`
          : `winery-text-${wineryName.toLowerCase()}`;

      const existing = map.get(groupKey);
      if (existing) {
        existing.wines.push(wine);
        if (!existing.logoImageId && wine.wineryLogoImageId) {
          existing.logoImageId = wine.wineryLogoImageId;
        }
      } else {
        map.set(groupKey, {
          key: groupKey,
          wineryId: wine.wineryId,
          logoImageId: wine.wineryLogoImageId,
          name: wineryName,
          region,
          wines: [wine],
        });
      }
    });

    return Array.from(map.values()).map((data) => ({
      key: data.key,
      wineryId: data.wineryId,
      logoImageId: data.logoImageId,
      name: data.name,
      region: data.region,
      initials: getWineryInitials(data.name),
      wines: data.wines,
    }));
  }, [filteredWines]);

  // Paginación de bodegas: máximo 4 bodegas visibles simultáneamente
  const WINERIES_PER_PAGE = 4;
  const [wineryPage, setWineryPage] = useState(1);
  const [prevDebouncedQuery, setPrevDebouncedQuery] = useState(debouncedQuery);

  // Ajuste de página durante renderizado cuando cambia la búsqueda con debounce (patrón oficial de React)
  if (prevDebouncedQuery !== debouncedQuery) {
    setPrevDebouncedQuery(debouncedQuery);
    setWineryPage(1);
  }

  const totalWineryPages = Math.max(1, Math.ceil(wineryGroups.length / WINERIES_PER_PAGE));
  const safeWineryPage = Math.min(wineryPage, totalWineryPages);

  const paginatedWineryGroups = useMemo(() => {
    const start = (safeWineryPage - 1) * WINERIES_PER_PAGE;
    return wineryGroups.slice(start, start + WINERIES_PER_PAGE);
  }, [wineryGroups, safeWineryPage]);

  const handleWineryPageChange = (newPage: number) => {
    setWineryPage(newPage);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setActiveFilter('Todos');
    setSearchQuery('');
    setHeroFilters({
      query: '',
      varietal: 'Todos',
      region: 'Todas',
      winery: 'Todas',
      grapeId: undefined,
      stateId: undefined,
      wineryId: undefined,
    });
    setWineryPage(1);
  };

  return (
    <div className="relative min-h-screen bg-[#0d0d0f] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
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

      {/* Hero Section Unificado con Cava Strip Horizontal cerrando el viewport */}
      <section
        id="hero-section"
        aria-labelledby="welcome-title"
        className="relative z-20 text-neutral-200 h-[100dvh] min-h-[560px] flex flex-col justify-between pt-16 sm:pt-18 pb-2 sm:pb-3 transition-colors duration-150 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,20,40,0.15),rgba(255,255,255,0))]"
        style={{
          backgroundColor: `rgba(13, 13, 15, ${Math.max(0, 1 - heroScrollProgress * 0.95)})`,
        }}
      >
        {/* Textura de lienzo técnica (Dot Pattern sutil con máscara elíptica estilo Landing) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_65%_55%_at_50%_45%,#000_60%,transparent_100%)]"
          style={{ opacity: Math.max(0, 0.2 * (1 - heroScrollProgress)) }}
        />

        {/* Resplandor radial suave enológico centrado detrás del título */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
          style={{ opacity: Math.max(0, 1 - heroScrollProgress) }}
        >
          <div className="h-[520px] w-[850px] rounded-full bg-gradient-to-b from-rose-950/25 via-rose-900/10 to-transparent blur-[130px] -translate-y-8" />
          <div className="absolute h-[320px] w-[500px] rounded-full bg-amber-900/10 blur-[100px] translate-y-12" />
        </div>

        {/* Contenedor reactivo con difuminado (fade & blur) del Hero al scrollear */}
        <div
          className="relative z-30 flex flex-col justify-between flex-1 w-full h-full transition-transform duration-75"
          style={{
            opacity: Math.max(0, 1 - heroScrollProgress * 1.3),
            filter: `blur(${heroScrollProgress * 8}px)`,
            transform: `translateY(-${heroScrollProgress * 28}px)`,
            pointerEvents: heroScrollProgress > 0.6 ? 'none' : 'auto',
          }}
        >
          {/* Contenido Central: Saludo, Titular, Subtítulo, Buscador y Filtros */}
          <div className="my-auto w-full py-1 sm:py-2 px-4 sm:px-6 lg:px-8">
            <QuickActions
              onSearch={(query) => {
                setSearchQuery(query);
                setWineryPage(1);
              }}
              onFilterChange={(filters) => {
                setHeroFilters(filters);
                setSearchQuery(filters.query);
                setWineryPage(1);
              }}
              onCreateWine={(name) => {
                setCreateInitialName(name);
                setIsCreateModalOpen(true);
              }}
              onRegisterBottle={() =>
                showNotification('Función de registro rápido abierta. Seleccioná una etiqueta del catálogo.')
              }
              onSelectSpotlightWine={(wineName) => {
                setSearchQuery(wineName);
                setWineryPage(1);
                showNotification(`Filtrando catálogo por "${wineName}".`);
                const catalogEl = document.getElementById('catalogo');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              onUncorkSpotlight={(wine) => setUncorkingWine(wine)}
            />
          </div>

          {/* Barra de Métricas "Cava Strip" Horizontal: Al pie del Hero cerrando la pantalla */}
          <div className="w-full mt-auto px-4 sm:px-6 lg:px-8 pb-1 sm:pb-2">
            <Metrics
              customStats={{
                bottles: stockCount,
                readyToDrink: 3,
                dominantVarietal: 'Malbec (58%)',
                topRated: '4.9 ★',
              }}
            />
          </div>
        </div>
      </section>

      {/* Contenido Principal: Catálogo Unificado */}
      <div className="relative z-10 w-full">
        <main className="relative z-20 mx-auto flex w-full max-w-7xl flex-col gap-12 sm:gap-16 px-4 sm:px-6 lg:px-8 pb-24 pt-24 sm:pt-32">
          {/* Sección de Catálogo Oficial por Bodegas */}
          <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-28 flex flex-col gap-12 sm:gap-16">
            {/* Contenedor superior de encabezado de catálogo */}
            <div className="relative flex flex-col items-center gap-6 text-center py-8 sm:py-12 px-4 rounded-3xl overflow-hidden">
              <SectionHeading
                id="catalog-title"
                align="center"
                eyebrow="CATÁLOGO EXCLUSIVO & TERROIR"
                title="Explorá por Bodegas"
                description="Etiquetas oficiales y colecciones organizadas por productor y región vitivinícola."
              />

              {/* Chips de Filtros Rápidos */}
              <FilterChips
                activeChip={activeFilter}
                onSelectChip={(chip) => {
                  setActiveFilter(chip);
                  setWineryPage(1);
                }}
              />
            </div>

            {/* Error State con botón de reintentar */}
            {fetchError && !isLoading && (
              <div className="rounded-2xl border border-rose-500/20 bg-[#141417]/80 backdrop-blur-md p-10 text-center flex flex-col items-center justify-center gap-3 shadow-xl shadow-black/40">
                <AlertCircle className="h-8 w-8 text-rose-400" />
                <h4 className="font-serif text-lg font-semibold text-neutral-100">
                  Ocurrió un error al cargar las etiquetas
                </h4>
                <p className="text-xs text-neutral-400 max-w-sm font-sans">{fetchError}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#1c1c22] hover:bg-white/[0.08] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            )}

            {/* Loading State: Grillas por Bodega con Skeletons */}
            {isLoading && (
              <div className="flex flex-col gap-14" aria-label="Cargando catálogo por bodegas...">
                {[1, 2].map((idx) => (
                  <div key={`skeleton-group-${idx}`} className="flex flex-col gap-6">
                    <div className="flex items-center gap-4 border-b border-white/[0.08] pb-5">
                      <div className="h-12 w-12 rounded-xl bg-white/[0.05] animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-28 bg-white/[0.05] rounded animate-pulse" />
                        <div className="h-6 w-48 bg-white/[0.08] rounded animate-pulse" />
                      </div>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {Array.from({ length: 4 }, (_, i) => (
                        <WineCardSkeleton key={i} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State: Búsqueda sin resultados */}
            {!isLoading && !fetchError && wineryGroups.length === 0 && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#141417]/80 backdrop-blur-md p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xl shadow-black/40">
                <Wine className="h-8 w-8 text-neutral-400" />
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  No se encontraron etiquetas
                </h4>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                  Probá ajustando los filtros o el término de búsqueda para ver más bodegas.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 rounded-xl border border-white/[0.08] bg-[#1c1c22] hover:bg-white/[0.08] hover:border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer transition-all"
                >
                  Restablecer filtros
                </button>
              </div>
            )}

            {/* Grillas Dinámicas por Bodega (Máximo 4 por vista) con Datos Reales de la BD */}
            {!isLoading && !fetchError && paginatedWineryGroups.length > 0 && (
              <div className="flex flex-col gap-14">
                {paginatedWineryGroups.map((group) => (
                  <WineryBlock
                    key={group.key}
                    wineryId={group.wineryId}
                    logoImageId={group.logoImageId}
                    name={group.name}
                    region={group.region}
                    initials={group.initials}
                    total={group.wines.length}
                    wines={group.wines}
                    onAddToCellar={handleAddToCellar}
                    onToggleFavorite={(wine, isFav) =>
                      showNotification(
                        `${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`
                      )
                    }
                  />
                ))}

                {/* Controles de paginación para desplazar / mostrar otras 4 bodegas */}
                {totalWineryPages > 1 && (
                  <nav
                    aria-label="Paginación de bodegas"
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.08]"
                  >
                    <div className="text-xs text-neutral-400 font-sans">
                      Mostrando bodegas{' '}
                      <span className="font-mono text-neutral-200">
                        {(safeWineryPage - 1) * WINERIES_PER_PAGE + 1}
                      </span>
                      –
                      <span className="font-mono text-neutral-200">
                        {Math.min(safeWineryPage * WINERIES_PER_PAGE, wineryGroups.length)}
                      </span>{' '}
                      de <span className="font-mono text-neutral-200">{wineryGroups.length}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeWineryPage <= 1}
                        onClick={() => handleWineryPageChange(safeWineryPage - 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] bg-[#141417] hover:bg-white/[0.06] text-xs font-semibold uppercase tracking-wider text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Anteriores</span>
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalWineryPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={`winery-page-${pageNum}`}
                            type="button"
                            onClick={() => handleWineryPageChange(pageNum)}
                            className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                              pageNum === safeWineryPage
                                ? 'bg-[#722F37] text-white border border-rose-500/30 shadow-md'
                                : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.05]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={safeWineryPage >= totalWineryPages}
                        onClick={() => handleWineryPageChange(safeWineryPage + 1)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/[0.08] bg-[#141417] hover:bg-white/[0.06] text-xs font-semibold uppercase tracking-wider text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                      >
                        <span>Siguientes</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </nav>
                )}
              </div>
            )}
          </section>
        </main>

        {/* Fundido suave de salida hacia el Footer */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/80 to-transparent z-10" />
      </div>

      {/* Modal Profesional de Descorche y Ficha Técnica */}
      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onSave={handleUncorkSaved}
      />

      {/* Modal de Alta Rápida desde el Buscador */}
      <QuickAddBottleModal
        isOpen={isCreateModalOpen}
        initialName={createInitialName}
        onClose={() => setIsCreateModalOpen(false)}
        onAddBottle={async (payload) => {
          const { wineType } = resolveWineTypeAndBottle(payload.varietal);
          let mainGrapeId: number | undefined = undefined;
          if (wineType === 'Red') mainGrapeId = 1;
          else if (wineType === 'White') mainGrapeId = 9;

          await apiClient.post('/cellars/me/quick-add', {
            name: payload.name,
            wineryName: payload.winery,
            wineType,
            year: payload.vintage,
            quantity: payload.units,
            location: payload.location,
            notes: payload.location,
            matchedWineId: payload.matchedWineId ?? null,
            mainGrapeId,
          });

          showNotification(`¡Etiqueta "${payload.name}" guardada con éxito!`);
          setReloadKey((prev) => prev + 1);
        }}
      />
    </div>
  );
}
