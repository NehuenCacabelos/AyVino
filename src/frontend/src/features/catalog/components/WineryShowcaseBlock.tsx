import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Heart, Plus, Star, Wine, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { CatalogShowcaseWinery } from '../types';
import type { WineListItemDto } from '../../winery/types/wine';
import BottleVector from '../../dashboard/components/BottleVector';
import { mapWineTypeToBottleKind } from '../../cava/api/cellarApi';
import { translateWineType } from '../../wines/utils/wineMapper';
import { imageUrl } from '../../../lib/image';

export interface WineryShowcaseBlockProps {
  winery: CatalogShowcaseWinery;
  onAddToCellar?: (wine: WineListItemDto) => void;
  onToggleFavorite?: (wine: WineListItemDto, isFav: boolean) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'B';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * WineryShowcaseBlock Component
 * Bloque unificado y compartido: Cabecera de Bodega + Carrusel horizontal de etiquetas.
 * Utilizado de manera idéntica en Dashboard (dashboard#catalogo) y en /catalogo.
 */
export default function WineryShowcaseBlock({
  winery,
  onAddToCellar,
  onToggleFavorite,
}: WineryShowcaseBlockProps) {
  const [favorites, setFavorites] = useState<Record<number, boolean>>({});
  const trackRef = useRef<HTMLUListElement>(null);

  const headingId = `winery-${(winery.wineryName || 'bodega').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const initials = getInitials(winery.wineryName);

  const scroll = (direction: 'left' | 'right') => {
    if (!trackRef.current) return;
    const distance = 320;
    trackRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const toggleFav = (wine: WineListItemDto) => {
    const nextState = !favorites[wine.id];
    setFavorites((prev) => ({ ...prev, [wine.id]: nextState }));
    onToggleFavorite?.(wine, nextState);
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      {/* Cabecera de Bodega */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3.5">
          {winery.logoImageId ? (
            <img
              src={imageUrl(winery.logoImageId) ?? undefined}
              alt={winery.wineryName}
              className="h-12 w-12 rounded-xl object-cover border border-white/10 shadow-sm shrink-0 bg-[#141417]"
            />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#141417]/80 backdrop-blur-md font-serif text-lg font-semibold text-neutral-200 shadow-sm"
              aria-hidden="true"
            >
              {initials}
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                {winery.location || 'Argentina'}
              </p>
              {winery.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Oficial
                </span>
              )}
            </div>
            <h3 id={headingId} className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
              {winery.wineryName}
            </h3>
          </div>
        </div>

        {/* Controles de Navegación del Carrusel */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label={`Desplazar vinos de ${winery.wineryName} a la izquierda`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-[#141417] text-neutral-400 hover:border-neutral-700 hover:text-white transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label={`Desplazar vinos de ${winery.wineryName} a la derecha`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-[#141417] text-neutral-400 hover:border-neutral-700 hover:text-white transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Riel de Carrusel de Vinos */}
      <ul
        ref={trackRef}
        aria-label={`Vinos de ${winery.wineryName}`}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {winery.wines.map((wine) => {
          const isFav = !!favorites[wine.id];
          const bottleKind = mapWineTypeToBottleKind(wine.wineType);
          const typeLabel = translateWineType(wine.wineType);
          const avgRating = wine.averageRating ? Number(wine.averageRating).toFixed(1) : null;

          return (
            <li
              key={wine.id}
              className="w-[260px] sm:w-[280px] shrink-0 snap-start flex flex-col"
            >
              <article className="group relative h-full flex flex-col justify-between rounded-2xl bg-[#131316] border border-white/[0.07] backdrop-blur-xl p-5 hover:border-white/[0.18] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 shadow-xl shadow-black/50 text-left">
                {/* Botón de Favorito Flotante */}
                <button
                  type="button"
                  aria-label={isFav ? `Quitar ${wine.name} de deseados` : `Añadir ${wine.name} a deseados`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFav(wine);
                  }}
                  className={`absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c22]/80 border border-white/[0.08] backdrop-blur-xl transition-all cursor-pointer ${
                    isFav
                      ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
                      : 'text-neutral-400 hover:text-white hover:bg-[#1c1c22]'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-400' : ''}`} />
                </button>

                <Link to={`/vinos/${wine.id}`} className="block flex-1 flex flex-col justify-between">
                  {/* Spotlight dedicado para la botella */}
                  <div className="relative bg-gradient-to-b from-white/[0.02] to-transparent rounded-lg mx-1 mt-1 py-5 flex items-center justify-center overflow-hidden mb-3 h-44">
                    {wine.thumbnailImageId ? (
                      <img
                        src={imageUrl(wine.thumbnailImageId) ?? undefined}
                        alt={wine.name}
                        className="h-40 w-auto max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <BottleVector
                        kind={bottleKind}
                        className="h-40 w-auto max-h-full transition-transform duration-300 group-hover:scale-105"
                        alt={wine.name}
                      />
                    )}
                  </div>

                  {/* Información */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="inline-flex items-center rounded-md bg-white/[0.08] backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-neutral-200">
                        {typeLabel}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        {wine.referenceVintageYear ?? 'Sin añada'}
                      </span>
                    </div>

                    <h4 className="font-serif text-base sm:text-lg font-semibold text-neutral-100 leading-snug tracking-tight group-hover:text-amber-200 transition-colors line-clamp-2">
                      {wine.name}
                    </h4>

                    <p className="text-xs text-neutral-400 font-sans mt-1 truncate">
                      {winery.wineryName} {winery.location ? `· ${winery.location}` : ''}
                    </p>
                  </div>
                </Link>

                {/* Pie de Card: Calificación y Botón Cava */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-neutral-200">
                      {avgRating ?? '—'}
                    </span>
                    {wine.reviewCount > 0 && (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        ({wine.reviewCount})
                      </span>
                    )}
                  </div>

                  {onAddToCellar && (
                    <button
                      type="button"
                      onClick={() => onAddToCellar(wine)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Cava</span>
                    </button>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Skeleton para estado de carga de Showcase de Bodegas
 */
export function WineryShowcaseSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-12 animate-pulse" role="status" aria-label="Cargando catálogo">
      {Array.from({ length: count }, (_, idx) => (
        <div key={idx} className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-neutral-800/60" />
              <div className="space-y-2">
                <div className="h-3 w-28 bg-neutral-800/60 rounded" />
                <div className="h-6 w-48 bg-neutral-800/80 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-lg bg-neutral-800/60" />
              <div className="h-8 w-8 rounded-lg bg-neutral-800/60" />
            </div>
          </div>
          <div className="flex gap-5 overflow-hidden">
            {Array.from({ length: 4 }, (_, cardIdx) => (
              <div
                key={cardIdx}
                className="w-[260px] sm:w-[280px] shrink-0 h-80 rounded-2xl bg-[#131316] border border-white/[0.05] p-5 flex flex-col justify-between"
              >
                <div className="h-36 bg-neutral-800/40 rounded-lg" />
                <div className="space-y-2 mt-4">
                  <div className="h-3 w-20 bg-neutral-800/60 rounded" />
                  <div className="h-5 w-full bg-neutral-800/70 rounded" />
                </div>
                <div className="h-4 w-16 bg-neutral-800/40 rounded mt-4" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Estado vacío cuando no hay vinos en el catálogo
 */
export function WineryShowcaseEmpty({ message = 'Todavía no hay vinos en el catálogo' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-3xl bg-[#131316]/50 border border-white/5 my-6">
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-4">
        <Wine className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-1">
        {message}
      </h3>
      <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
        Pronto se sumarán nuevas bodegas y etiquetas a la plataforma. Podés colaborar registrando una botella.
      </p>
    </div>
  );
}

/**
 * Estado de error con reintento para Showcase
 */
export function WineryShowcaseError({
  message = 'No pudimos cargar los vinos del catálogo.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-3xl bg-rose-950/20 border border-rose-900/30 my-6">
      <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-lg sm:text-xl text-rose-200 font-medium mb-1">
        {message}
      </h3>
      <p className="text-xs text-rose-300/80 max-w-md mb-4">
        Ocurrió un problema de conexión al consultar el servidor.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reintentar</span>
        </button>
      )}
    </div>
  );
}
