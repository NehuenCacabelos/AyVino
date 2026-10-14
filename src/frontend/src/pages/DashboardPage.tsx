import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Wine, CheckCircle2 } from 'lucide-react';
import {
  DashboardNavbar,
  QuickActions,
  Metrics,
  FilterChips,
  SectionHeading,
  WineryBlock,
  UncorkDialog,
} from '../features/dashboard';
import corksBackground from '../assets/corchos-vinos.webp';
import type { HeroFilterState } from '../features/dashboard/components/QuickActions';
import type { DashboardWine, UncorkSubmission } from '../types/wine';

const catenaWines: DashboardWine[] = [
  {
    name: 'Catena Zapata Malbec Argentino',
    winery: 'Catena Zapata',
    region: 'Luján de Cuyo, Mendoza',
    varietal: 'Malbec',
    vintage: 2019,
    rating: 4.8,
    units: 2,
    location: 'Cava Principal · Estante A1',
    bottle: 'red-cream',
  },
  {
    name: 'Nicolás Catena Zapata',
    winery: 'Catena Zapata',
    region: 'Mendoza',
    varietal: 'Cabernet Sauvignon',
    vintage: 2018,
    rating: 4.9,
    units: 2,
    location: 'Cava Principal · Estante A2',
    bottle: 'red-black',
  },
  {
    name: 'Catena Alta Chardonnay',
    winery: 'Catena Zapata',
    region: 'Tupungato, Mendoza',
    varietal: 'Blancos',
    vintage: 2021,
    rating: 4.4,
    units: 1,
    location: 'Heladera Cava · Nivel 2',
    bottle: 'white',
  },
  {
    name: 'Angélica Zapata Cabernet Franc',
    winery: 'Catena Zapata',
    region: 'Gualtallary, Mendoza',
    varietal: 'Cabernet Franc',
    vintage: 2020,
    rating: 4.6,
    units: 2,
    location: 'Cava Principal · Estante A3',
    bottle: 'red-burgundy',
  },
];

const zuccardiWines: DashboardWine[] = [
  {
    name: 'Finca Piedra Infinita',
    winery: 'Zuccardi',
    region: 'Paraje Altamira, Mendoza',
    varietal: 'Malbec',
    vintage: 2019,
    rating: 4.9,
    units: 3,
    location: 'Cava Principal · Estante B1',
    bottle: 'red-black',
  },
  {
    name: 'Aluvional Paraje Altamira',
    winery: 'Zuccardi',
    region: 'Paraje Altamira, Mendoza',
    varietal: 'Malbec',
    vintage: 2018,
    rating: 4.7,
    units: 1,
    location: 'Cava Principal · Estante B2',
    bottle: 'red-burgundy',
  },
  {
    name: 'Fósil Chardonnay',
    winery: 'Zuccardi',
    region: 'San Pablo, Mendoza',
    varietal: 'Blancos',
    vintage: 2022,
    rating: 4.5,
    units: 2,
    location: 'Heladera Cava · Nivel 1',
    bottle: 'white',
  },
  {
    name: 'Zuccardi Q Cabernet Sauvignon',
    winery: 'Zuccardi',
    region: 'Valle de Uco, Mendoza',
    varietal: 'Cabernet Sauvignon',
    vintage: 2020,
    rating: 4.3,
    units: 2,
    location: 'Departamento · Estante C1',
    bottle: 'red-cream',
  },
];

const elEnemigoWines: DashboardWine[] = [
  {
    name: 'El Enemigo Cabernet Franc',
    winery: 'El Enemigo',
    region: 'Gualtallary, Mendoza',
    varietal: 'Cabernet Franc',
    vintage: 2019,
    rating: 4.9,
    units: 2,
    location: 'Cava Principal · Estante A1',
    bottle: 'red-burgundy',
  },
  {
    name: 'Gran Enemigo Gualtallary Single Vineyard',
    winery: 'El Enemigo',
    region: 'Gualtallary, Mendoza',
    varietal: 'Cabernet Franc',
    vintage: 2018,
    rating: 5.0,
    units: 1,
    location: 'Cava Principal · Estante A1',
    bottle: 'red-black',
  },
  {
    name: 'El Enemigo Chardonnay',
    winery: 'El Enemigo',
    region: 'Gualtallary, Mendoza',
    varietal: 'Blancos',
    vintage: 2021,
    rating: 4.6,
    units: 2,
    location: 'Heladera Cava · Nivel 1',
    bottle: 'white',
  },
  {
    name: 'El Enemigo Malbec',
    winery: 'El Enemigo',
    region: 'Gualtallary, Mendoza',
    varietal: 'Malbec',
    vintage: 2020,
    rating: 4.7,
    units: 2,
    location: 'Cava Principal · Estante A2',
    bottle: 'red-cream',
  },
];

const colomeWines: DashboardWine[] = [
  {
    name: 'Colomé Altura Máxima Malbec',
    winery: 'Colomé',
    region: 'Molinos, Salta',
    varietal: 'Malbec',
    vintage: 2018,
    rating: 4.9,
    units: 1,
    location: 'Cava Principal · Estante C1',
    bottle: 'red-black',
  },
  {
    name: 'Colomé Estate Malbec',
    winery: 'Colomé',
    region: 'Valle Calchaquí, Salta',
    varietal: 'Malbec',
    vintage: 2020,
    rating: 4.6,
    units: 2,
    location: 'Cava Principal · Estante C2',
    bottle: 'red-cream',
  },
  {
    name: 'Colomé Torrontés del Valle',
    winery: 'Colomé',
    region: 'Cafayate, Salta',
    varietal: 'Blancos',
    vintage: 2022,
    rating: 4.5,
    units: 2,
    location: 'Heladera Cava · Nivel 2',
    bottle: 'white',
  },
  {
    name: 'Colomé Auténtico Malbec Blend',
    winery: 'Colomé',
    region: 'Molinos, Salta',
    varietal: 'Blends',
    vintage: 2021,
    rating: 4.8,
    units: 2,
    location: 'Cava Principal · Estante C3',
    bottle: 'red-burgundy',
  },
];

/**
 * DashboardPage Component (/dashboard)
 * Vista principal enfocada en Exploración de Bodegas y Catálogo de etiquetas:
 * - Hero centrado con saludo, buscador simétrico y Segmented Filter Control.
 * - Barra de métricas "Cava Strip" horizontal como cierre de la primera pantalla.
 * - Catálogo "Explorá por Bodegas" inmediatamente debajo, responsivo a los filtros superiores.
 */
export default function DashboardPage() {
  const [stockCount, setStockCount] = useState(24);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [heroFilters, setHeroFilters] = useState<HeroFilterState>({
    query: '',
    varietal: 'Todos',
    region: 'Todas',
    winery: 'Todas',
  });
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<DashboardWine | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isAutoScrollingRef = useRef(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroEl = document.getElementById('hero-section');
      if (!heroEl) return;

      const heroHeight = heroEl.offsetHeight;
      // Progreso de difuminado del Hero (0 a 1 en el primer 70% del scroll del hero)
      const progress = Math.min(1, Math.max(0, scrollY / (heroHeight * 0.7)));
      setHeroScrollProgress(progress);

      const isScrollingDown = scrollY > lastScrollYRef.current;
      lastScrollYRef.current = scrollY;

      // Auto-scroll al scrollear el 38% del Hero hacia abajo: tope exacto en heroHeight
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

  // Filtrado reactivo de vinos conectando filtros del Hero, chips y búsqueda
  const filterWineList = useCallback(
    (list: DashboardWine[], wineryLabel?: string) => {
      // Si hay un filtro de bodega activo en el Hero y la bodega no coincide, retornar vacío
      if (heroFilters.winery !== 'Todas' && wineryLabel) {
        if (!wineryLabel.toLowerCase().includes(heroFilters.winery.toLowerCase())) {
          return [];
        }
      }

      return list.filter((wine) => {
        // 1. Filtro de bodega del Hero
        if (heroFilters.winery !== 'Todas') {
          if (!wine.winery.toLowerCase().includes(heroFilters.winery.toLowerCase())) {
            return false;
          }
        }

        // 2. Filtro de región del Hero
        if (heroFilters.region !== 'Todas') {
          if (!wine.region.toLowerCase().includes(heroFilters.region.toLowerCase())) {
            return false;
          }
        }

        // 3. Filtro de varietal del Hero
        if (heroFilters.varietal !== 'Todos') {
          if (heroFilters.varietal === 'Blancos') {
            const isWhite =
              wine.varietal.toLowerCase().includes('blanco') ||
              wine.varietal.toLowerCase().includes('chardonnay') ||
              wine.varietal.toLowerCase().includes('torrontés') ||
              wine.bottle === 'white';
            if (!isWhite) return false;
          } else if (heroFilters.varietal === 'Blends') {
            if (!wine.varietal.toLowerCase().includes('blend')) return false;
          } else {
            if (!wine.varietal.toLowerCase().includes(heroFilters.varietal.toLowerCase())) {
              return false;
            }
          }
        }

        // 4. Búsqueda por texto (query)
        const effectiveQuery = searchQuery.trim() || heroFilters.query.trim();
        if (effectiveQuery !== '') {
          const q = effectiveQuery.toLowerCase();
          const matches =
            wine.name.toLowerCase().includes(q) ||
            wine.winery.toLowerCase().includes(q) ||
            wine.varietal.toLowerCase().includes(q) ||
            wine.region.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // 5. Chips de filtros rápidos inferiores
        if (activeFilter !== 'Todos') {
          if (activeFilter === 'Blancos') {
            const isWhite =
              wine.varietal.toLowerCase().includes('blanco') ||
              wine.varietal.toLowerCase().includes('chardonnay') ||
              wine.varietal.toLowerCase().includes('torrontés') ||
              wine.bottle === 'white';
            if (!isWhite) return false;
          } else if (activeFilter === 'Espumantes') {
            if (wine.varietal.toLowerCase().includes('espumante') || wine.bottle === 'sparkling') return false;
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
              wine.region.toLowerCase().includes('patagonia');
            if (!isPatagonia) return false;
          }
        }

        return true;
      });
    },
    [heroFilters, searchQuery, activeFilter],
  );

  const filteredCatena = useMemo(
    () => filterWineList(catenaWines, 'Catena Zapata'),
    [filterWineList],
  );
  const filteredZuccardi = useMemo(
    () => filterWineList(zuccardiWines, 'Zuccardi'),
    [filterWineList],
  );
  const filteredElEnemigo = useMemo(
    () => filterWineList(elEnemigoWines, 'El Enemigo'),
    [filterWineList],
  );
  const filteredColome = useMemo(
    () => filterWineList(colomeWines, 'Colomé'),
    [filterWineList],
  );

  return (
    <div className="relative min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
      {/* Capa Fija Escenográfica de Corchos: Fondo infinito que se revela en el catálogo */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <img
          src={corksBackground}
          alt=""
          className="h-full w-full object-cover object-center filter blur-[2px] sm:blur-[3px] scale-105 opacity-50"
        />
        {/* Overlay de penumbra y contraste para mantener legibilidad editorial */}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f11]/85 via-transparent to-[#0c0c0e]/85" />
      </div>

      {/* Toast de Notificación Flotante */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#161619] text-neutral-100 px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium font-sans">{notification}</p>
        </aside>
      )}

      {/* 1. Navbar Superior */}
      <DashboardNavbar stockCount={stockCount} />

      {/* 2. Hero Section Unificado con Cava Strip Horizontal cerrando el viewport */}
      <section
        id="hero-section"
        aria-labelledby="welcome-title"
        className="relative z-20 text-neutral-200 h-[100dvh] min-h-[560px] flex flex-col justify-between pt-16 sm:pt-18 pb-2 sm:pb-3 transition-colors duration-150"
        style={{
          backgroundColor: `rgba(15, 15, 17, ${Math.max(0, 1 - heroScrollProgress * 0.95)})`,
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
          {/* Resplandor radial vino/borgoña suave */}
          <div className="h-[520px] w-[850px] rounded-full bg-gradient-to-b from-rose-950/25 via-rose-900/10 to-transparent blur-[130px] -translate-y-8" />
          {/* Halo cálido ámbar de soporte */}
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
              onSearch={(query) => setSearchQuery(query)}
              onFilterChange={(filters) => {
                setHeroFilters(filters);
                setSearchQuery(filters.query);
              }}
              onRegisterBottle={() =>
                showNotification('Función de registro rápido abierta. Seleccioná una etiqueta del catálogo.')
              }
              onSelectSpotlightWine={(wineName) => {
                setSearchQuery(wineName);
                showNotification(`Filtrando catálogo por "${wineName}".`);
                const catalogEl = document.getElementById('catalogo');
                catalogEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              onUncorkSpotlight={(wine) => setUncorkingWine(wine)}
            />
          </div>

          {/* 3. Barra de Métricas "Cava Strip" Horizontal: Al pie del Hero cerrando la pantalla */}
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

      {/* 4. Contenido Principal: Explorá por Bodegas (flota transparentemente sobre la textura fija de corchos) */}
      <div className="relative z-10 w-full">
        <main className="relative z-20 mx-auto flex w-full max-w-7xl flex-col gap-12 sm:gap-16 px-4 sm:px-6 lg:px-8 pb-24 pt-24 sm:pt-32">
          {/* Sección de Catálogo Oficial por Bodegas */}
          <section id="catalogo" aria-labelledby="catalog-title" className="scroll-mt-28 flex flex-col gap-12 sm:gap-16">
            <div className="flex flex-col items-center gap-6 text-center">
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
                onSelectChip={(chip) => setActiveFilter(chip)}
              />
            </div>

            {/* Grillas por Bodega */}
            <div className="flex flex-col gap-14">
              {filteredCatena.length > 0 && (
                <WineryBlock
                  name="Bodega Catena Zapata"
                  region="Mendoza, Argentina"
                  initials="CZ"
                  total={filteredCatena.length}
                  wines={filteredCatena}
                  onAddToCellar={handleAddToCellar}
                  onToggleFavorite={(wine, isFav) =>
                    showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                  }
                />
              )}

              {filteredZuccardi.length > 0 && (
                <WineryBlock
                  name="Bodega Zuccardi"
                  region="Valle de Uco, Mendoza"
                  initials="Z"
                  total={filteredZuccardi.length}
                  wines={filteredZuccardi}
                  onAddToCellar={handleAddToCellar}
                  onToggleFavorite={(wine, isFav) =>
                    showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                  }
                />
              )}

              {filteredElEnemigo.length > 0 && (
                <WineryBlock
                  name="Bodega El Enemigo"
                  region="Gualtallary, Mendoza"
                  initials="EE"
                  total={filteredElEnemigo.length}
                  wines={filteredElEnemigo}
                  onAddToCellar={handleAddToCellar}
                  onToggleFavorite={(wine, isFav) =>
                    showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                  }
                />
              )}

              {filteredColome.length > 0 && (
                <WineryBlock
                  name="Bodega Colomé"
                  region="Molinos, Salta"
                  initials="C"
                  total={filteredColome.length}
                  wines={filteredColome}
                  onAddToCellar={handleAddToCellar}
                  onToggleFavorite={(wine, isFav) =>
                    showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                  }
                />
              )}

              {filteredCatena.length === 0 &&
                filteredZuccardi.length === 0 &&
                filteredElEnemigo.length === 0 &&
                filteredColome.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#121215]/85 backdrop-blur-md p-12 text-center flex flex-col items-center justify-center gap-3 shadow-xl shadow-black/40">
                    <Wine className="h-8 w-8 text-neutral-400" />
                    <h4 className="font-serif text-xl font-semibold text-neutral-100">
                      No se encontraron etiquetas
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                      Probá ajustando los filtros o el término de búsqueda para ver más bodegas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFilter('Todos');
                        setSearchQuery('');
                        setHeroFilters({
                          query: '',
                          varietal: 'Todos',
                          region: 'Todas',
                          winery: 'Todas',
                        });
                      }}
                      className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer transition-all"
                    >
                      Restablecer filtros
                    </button>
                  </div>
                )}
            </div>
          </section>
        </main>

        {/* Fundido suave de salida hacia el Footer */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/80 to-transparent z-10" />
      </div>

      {/* Modal Profesional de Descorche y Ficha Técnica */}
      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onSave={handleUncorkSaved}
      />

      {/* 5. Footer Editorial */}
      <footer className="relative z-20 border-t border-neutral-800 bg-[#0c0c0e] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
            </span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>
    </div>
  );
}
