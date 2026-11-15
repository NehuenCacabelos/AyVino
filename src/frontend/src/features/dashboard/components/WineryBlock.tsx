import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Plus, Star } from 'lucide-react';
import BottleVector from './BottleVector';
import type { DashboardWine } from '../../../types/wine';
import { normalizeWineSlug } from '../../wines';

export interface WineryBlockProps {
  name: string;
  region: string;
  initials: string;
  total: number;
  wines: DashboardWine[];
  onAddToCellar?: (wine: DashboardWine) => void;
  onToggleFavorite?: (wine: DashboardWine, isFav: boolean) => void;
}

const getResponsiveItemsPerPage = (): number => {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 640) return 2;
  return 1;
};

/**
 * WineryBlock Component (Estética Oscura Mate & Carrusel Editorial)
 * Bloque de bodega con carrusel paginado interactivo:
 * - 4 vinos por vista en pantallas grandes (adaptativo a 2 en tablet y 1 en mobile)
 * - Flechas de navegación flotantes en los márgenes laterales
 * - Indicadores discretos de página (dots) interactivos
 * - Soporte para gestos táctiles (swipe)
 * - Acabado oscuro mate (#131316), bordes sutiles y tipografía Fraunces/Plus Jakarta Sans
 */
export default function WineryBlock({
  name,
  region,
  initials,
  total,
  wines,
  onAddToCellar,
  onToggleFavorite,
}: WineryBlockProps) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [itemsPerPage, setItemsPerPage] = useState<number>(getResponsiveItemsPerPage);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  const headingId = `winery-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  useEffect(() => {
    const handleResize = () => {
      const next = getResponsiveItemsPerPage();
      setItemsPerPage((prev) => (prev !== next ? next : prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(wines.length / itemsPerPage));
  // Derivación segura del índice actual sin almacenar estado duplicado
  const safePage = Math.min(currentPage, totalPages - 1);
  const startIndex = safePage * itemsPerPage;
  const visibleWines = wines.slice(startIndex, startIndex + itemsPerPage);

  const toggleFav = (wineName: string, wine: DashboardWine) => {
    const nextState = !favorites[wineName];
    setFavorites((prev) => ({ ...prev, [wineName]: nextState }));
    onToggleFavorite?.(wine, nextState);
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchDeltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (touchDeltaX > 50 && safePage > 0) {
      handlePrev();
    } else if (touchDeltaX < -50 && safePage < totalPages - 1) {
      handleNext();
    }
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      
      {/* Cabecera de Bodega */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141417]/80 backdrop-blur-md font-serif text-lg font-semibold text-neutral-200 shadow-sm"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="flex flex-col gap-0.5">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              {region}
            </p>
            <h3 id={headingId} className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
              {name}
            </h3>
          </div>
        </div>

        <Link
          to="/dashboard#catalogo"
          className="group/link inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          <span>Ver catálogo completo ({total})</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
        </Link>
      </header>

      {/* Contenedor Relativo del Carrusel con Flechas Flotantes */}
      <div
        className="relative group/carousel px-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Flecha Flotante Izquierda */}
        {safePage > 0 && (
          <button
            type="button"
            aria-label={`Ver vinos anteriores de ${name}`}
            onClick={handlePrev}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#1c1c22]/90 border border-white/20 text-neutral-200 hover:text-white hover:bg-neutral-800 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {/* Grilla de Vinos (4 vinos por vista en desktop) */}
        <ul
          key={`winery-page-${name}-${safePage}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300"
        >
          {visibleWines.map((wine) => {
            const isFav = !!favorites[wine.name];
            const wineSlug = wine.id || normalizeWineSlug(wine.name);

            return (
              <li key={wine.id ?? `${wine.winery}-${wine.name}-${wine.vintage}`} className="flex">
                <Link
                  to={`/vinos/${wineSlug}`}
                  className="group relative w-full flex flex-col justify-between rounded-2xl bg-[#131316] border border-white/[0.07] backdrop-blur-xl p-5 hover:border-white/[0.18] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 shadow-xl shadow-black/50 cursor-pointer block text-left"
                >
                  {/* Botón de Favorito Flotante Esmerilado */}
                  <button
                    type="button"
                    aria-label={isFav ? `Quitar ${wine.name} de deseados` : `Añadir ${wine.name} a deseados`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFav(wine.name, wine);
                    }}
                    className={`absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c22]/80 border border-white/[0.08] backdrop-blur-xl transition-all cursor-pointer ${
                      isFav
                        ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                        : 'text-neutral-400 hover:text-white hover:bg-[#1c1c22]'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-400' : ''}`} />
                  </button>

                  {/* Contenedor Rectangular Editorial (3:4) para la Imagen del Vino */}
                  <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden mb-3.5 bg-[#18181b]/80 border border-white/[0.06] flex items-center justify-center">
                    {wine.imageUrl ? (
                      <img
                        src={wine.imageUrl}
                        alt={wine.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full py-4 flex items-center justify-center bg-gradient-to-b from-white/[0.02] to-transparent">
                        <BottleVector
                          kind={wine.bottle}
                          className="h-full w-auto max-h-full transition-transform duration-500 group-hover:scale-105"
                          alt={wine.name}
                        />
                      </div>
                    )}
                  </div>

                  {/* Información y Puntuación */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="inline-flex items-center rounded-md bg-white/[0.08] backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-neutral-200">
                          {wine.varietal}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">
                          {wine.vintage}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-semibold text-neutral-100 leading-snug tracking-tight group-hover:text-amber-200 transition-colors line-clamp-2">
                        {wine.name}
                      </h4>

                      <p className="text-xs text-neutral-400 font-sans mt-1">
                        {wine.winery} · {wine.region}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-amber-400">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.round(wine.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono font-bold text-neutral-200 tabular-nums">
                        {wine.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Botón de Acción Añadir a Cava Esmerilado */}
                  <div className="mt-4 pt-1 relative z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCellar?.(wine);
                      }}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.07] hover:bg-[#722F37] hover:text-white text-xs font-semibold uppercase tracking-wider text-neutral-200 transition-all cursor-pointer backdrop-blur-md"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Añadir a Cava</span>
                    </button>
                  </div>

                </Link>
              </li>
            );
          })}
        </ul>

        {/* Flecha Flotante Derecha */}
        {safePage < totalPages - 1 && (
          <button
            type="button"
            aria-label={`Ver vinos siguientes de ${name}`}
            onClick={handleNext}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#1c1c22]/90 border border-white/20 text-neutral-200 hover:text-white hover:bg-neutral-800 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Indicadores de Página (Dots) */}
      {totalPages > 1 && (
        <div
          role="tablist"
          aria-label={`Páginas de vinos de ${name}`}
          className="flex items-center justify-center gap-1.5 pt-1"
        >
          {Array.from({ length: totalPages }, (_, index) => {
            const isActive = index === safePage;
            return (
              <button
                key={`page-dot-${name}-${index}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir a la página ${index + 1} de ${totalPages} de ${name}`}
                onClick={() => setCurrentPage(index)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'w-6 bg-amber-400'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
              />
            );
          })}
        </div>
      )}

    </section>
  );
}
