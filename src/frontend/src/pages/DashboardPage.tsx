import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  QuickActions,
  Metrics,
  FilterChips,
  SectionHeading,
} from '../features/dashboard';
import type { HeroFilterState } from '../features/dashboard/components/QuickActions';
import type { AppOutletContext } from '../components/layout/AppLayout';
import type { WineListItemDto } from '../features/winery/types/wine';
import {
  WineryShowcaseBlock,
  WineryShowcaseSkeleton,
  WineryShowcaseEmpty,
  WineryShowcaseError,
  getCatalogShowcaseApi,
  type CatalogShowcaseWinery,
} from '../features/catalog';
import {
  getCellarGlobalSummaryApi,
  type CellarGlobalSummaryDto,
} from '../features/cava';

/**
 * DashboardPage Component (/dashboard)
 * Vista principal enfocada en Exploración de Bodegas y Catálogo de etiquetas:
 * - Hero centrado con saludo, buscador simétrico y Segmented Filter Control.
 * - Barra de métricas "Cava Strip" horizontal calculada con datos vivos de cava.
 * - Catálogo "Explorá por Bodegas" inmediatamente debajo, alimentado desde /api/catalog/showcase.
 */
export default function DashboardPage() {
  const { stockCount, setStockCount } = useOutletContext<AppOutletContext>();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [heroFilters, setHeroFilters] = useState<HeroFilterState>({
    query: '',
    varietal: 'Todos',
    region: 'Todas',
    winery: 'Todas',
  });
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Estados de datos de resumen de cava del usuario (C1)
  const [cellarSummary, setCellarSummary] = useState<CellarGlobalSummaryDto | null>(null);

  // Estados de datos vivos de catálogo showcase (C3)
  const [showcaseWineries, setShowcaseWineries] = useState<CatalogShowcaseWinery[]>([]);
  const [isLoadingShowcase, setIsLoadingShowcase] = useState(true);
  const [showcaseError, setShowcaseError] = useState<string | null>(null);
  const [reloadShowcaseKey, setReloadShowcaseKey] = useState(0);

  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isAutoScrollingRef = useRef(false);
  const lastScrollYRef = useRef(0);

  // Carga de métricas reales de la cava del usuario
  useEffect(() => {
    let isMounted = true;
    async function loadCellarSummary() {
      try {
        const summary = await getCellarGlobalSummaryApi();
        if (isMounted) {
          setCellarSummary(summary);
          setStockCount(summary.totalBottles);
        }
      } catch (err) {
        console.warn('No se pudieron obtener las métricas de cava:', err);
      }
    }

    void loadCellarSummary();
    return () => {
      isMounted = false;
    };
  }, [setStockCount]);

  // Carga reactiva de bodegas y vinos reales del catálogo showcase
  useEffect(() => {
    let isMounted = true;
    async function loadShowcase() {
      setIsLoadingShowcase(true);
      setShowcaseError(null);

      let q: string | undefined = undefined;
      if (heroFilters.query.trim()) {
        q = heroFilters.query.trim();
      } else if (heroFilters.winery !== 'Todas') {
        q = heroFilters.winery;
      } else if (heroFilters.region !== 'Todas') {
        q = heroFilters.region;
      } else if (heroFilters.varietal !== 'Todos') {
        q = heroFilters.varietal;
      } else if (activeFilter !== 'Todos') {
        q = activeFilter;
      }

      try {
        const data = await getCatalogShowcaseApi({
          q,
          pageNumber: 1,
          pageSize: 6,
          winesPerWinery: 8,
        });

        if (isMounted) {
          setShowcaseWineries(data.items);
        }
      } catch {
        if (isMounted) {
          setShowcaseError('No pudimos cargar los vinos del catálogo.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingShowcase(false);
        }
      }
    }

    void loadShowcase();
    return () => {
      isMounted = false;
    };
  }, [heroFilters, activeFilter, reloadShowcaseKey]);

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

  // Si se ingresa con el ancla #catalogo, desplazar directamente al catálogo de bodegas
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

  const handleAddToCellar = (wine: WineListItemDto) => {
    setStockCount((prev) => prev + 1);
    showNotification(`"${wine.name}" fue agregado con éxito a tu Cava.`);
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
        {/* Textura de lienzo técnica */}
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
              onFilterChange={(filters) => {
                setHeroFilters(filters);
              }}
              onRegisterBottle={() =>
                showNotification('Función de registro rápido abierta. Seleccioná una etiqueta del catálogo.')
              }
              onSelectSpotlightWine={(wineName) => {
                showNotification(`Etiqueta seleccionada: "${wineName}".`);
                const catalogEl = document.getElementById('catalogo');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>

          {/* 3. Barra de Métricas "Cava Strip" Horizontal con datos vivos de cava */}
          <div className="w-full mt-auto px-4 sm:px-6 lg:px-8 pb-1 sm:pb-2">
            <Metrics
              customStats={{
                bottles: cellarSummary?.totalBottles ?? stockCount ?? 0,
                readyToDrink: '--',
                dominantVarietal: cellarSummary?.dominantVarietal ?? null,
                dominantVarietalPercentage: cellarSummary?.dominantVarietalPercentage ?? null,
                topRated: '--',
              }}
            />
          </div>
        </div>
      </section>

      {/* 4. Contenido Principal: Explorá por Bodegas */}
      <div className="relative z-10 w-full">
        <main className="relative z-20 mx-auto flex w-full max-w-7xl flex-col gap-12 sm:gap-16 px-4 sm:px-6 lg:px-8 pb-24 pt-24 sm:pt-32">
          {/* Sección de Catálogo Oficial por Bodegas */}
          <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-28 flex flex-col gap-12 sm:gap-16">
            {/* Contenedor superior con Ambient Glow en tono vino */}
            <div className="relative flex flex-col items-center gap-6 text-center py-8 sm:py-12 px-4 rounded-3xl overflow-hidden bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(160,20,50,0.12),transparent)]">
              <SectionHeading
                id="catalog-title"
                align="center"
                eyebrow="CATÁLOGO EXCLUSIVO & TERRUÑOS"
                title="Explorá por Bodegas"
                description="Etiquetas oficiales y comunitarias organizadas por productor y región vitivinícola."
              />

              {/* Chips de Filtros Rápidos */}
              <FilterChips
                activeChip={activeFilter}
                onSelectChip={(chip) => setActiveFilter(chip)}
              />
            </div>

            {/* Grillas por Bodega con datos reales de /api/catalog/showcase */}
            {isLoadingShowcase ? (
              <WineryShowcaseSkeleton count={2} />
            ) : showcaseError ? (
              <WineryShowcaseError
                message={showcaseError}
                onRetry={() => setReloadShowcaseKey((k) => k + 1)}
              />
            ) : showcaseWineries.length === 0 ? (
              <WineryShowcaseEmpty message="Todavía no hay vinos en el catálogo" />
            ) : (
              <div className="flex flex-col gap-14">
                {showcaseWineries.map((winery) => (
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
            )}
          </section>
        </main>

        {/* Fundido suave de salida hacia el Footer */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/80 to-transparent z-10" />
      </div>
    </div>
  );
}
