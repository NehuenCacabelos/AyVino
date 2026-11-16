import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardWineCard from './DashboardWineCard';
import type { DashboardWine } from '../../../types/wine';
import { imageUrl } from '../../../lib/image';

export interface WineryBlockProps {
  wineryId?: number;
  logoImageId?: string;
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
  wineryId,
  logoImageId,
  name,
  region,
  initials,
  total,
  wines,
  onAddToCellar,
  onToggleFavorite,
}: WineryBlockProps) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [logoError, setLogoError] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<number>(getResponsiveItemsPerPage);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  const headingId = `winery-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const logoSrc = logoImageId ? imageUrl(logoImageId, 'logo') : null;
  const showLogoImage = Boolean(logoSrc && !logoError);

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

  const handleToggleFavorite = (targetWine: DashboardWine, nextState: boolean) => {
    const wineKey = targetWine.id || targetWine.name;
    setFavorites((prev) => ({ ...prev, [wineKey]: nextState }));
    onToggleFavorite?.(targetWine, nextState);
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
        {wineryId ? (
          <Link
            to={`/bodegas/${wineryId}`}
            className="group/winery flex items-center gap-4 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d10] transition-colors"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141417]/80 backdrop-blur-md font-serif text-lg font-semibold text-neutral-200 shadow-sm overflow-hidden group-hover/winery:border-white/20 transition-colors"
              aria-hidden={!showLogoImage ? 'true' : undefined}
            >
              {showLogoImage ? (
                <img
                  src={logoSrc!}
                  alt={`Logo de ${name}`}
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                initials
              )}
            </div>

            <div className="flex flex-col gap-0.5 text-left">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                {region}
              </p>
              <h3 id={headingId} className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight group-hover/winery:text-rose-200 transition-colors">
                {name}
              </h3>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141417]/80 backdrop-blur-md font-serif text-lg font-semibold text-neutral-200 shadow-sm overflow-hidden"
              aria-hidden={!showLogoImage ? 'true' : undefined}
            >
              {showLogoImage ? (
                <img
                  src={logoSrc!}
                  alt={`Logo de ${name}`}
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                initials
              )}
            </div>

            <div className="flex flex-col gap-0.5 text-left">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                {region}
              </p>
              <h3 id={headingId} className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
                {name}
              </h3>
            </div>
          </div>
        )}

        {wineryId ? (
          <Link
            to={`/bodegas/${wineryId}/catalogo`}
            className="group/link inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <span>Ver catálogo completo ({total})</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
          </Link>
        ) : null}
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

        {/* Grilla de Vinos (Key dinámico por página para animación limpia) */}
        <ul
          key={`page-${safePage}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {visibleWines.map((wine) => {
            const wineKey = wine.id || wine.name;
            const isFav = favorites[wineKey] ?? Boolean(wine.isFavorite);

            return (
              <DashboardWineCard
                key={wine.id ?? `${wine.winery}-${wine.name}-${wine.vintage}`}
                wine={{
                  ...wine,
                  isFavorite: isFav,
                }}
                onAddToCellar={onAddToCellar}
                onToggleFavorite={handleToggleFavorite}
              />
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
