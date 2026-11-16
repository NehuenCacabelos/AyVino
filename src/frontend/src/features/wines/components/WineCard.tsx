import { Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CuratedWine } from '../../../types/wine';
import WineBottleSilhouette from './WineBottleSilhouette';

export interface WineCardData {
  id?: string | number;
  name: string;
  winery: string;
  grape?: string;
  vintage?: string;
  region?: string;
  rating?: number | null;
  reviewCount?: number;
  imageUrl?: string;
  sourceType?: string;
  isOfficial?: boolean;
}

export interface WineCardProps<T extends CuratedWine | WineCardData = CuratedWine | WineCardData> {
  wine: T;
  variant?: 'editorial' | 'pairing';
  badgeText?: string;
  to?: string;
  onSelect?: (wine: T) => void;
  className?: string;
}

/**
 * WineCard Component
 * Tarjeta de vino editorial polimórfica y composicional a dos columnas.
 * Soporta variantes:
 * - 'editorial' (por defecto): modo ficha completa con rating de estrellas y reviews (ej. Landing).
 * - 'pairing': modo sommelier para maridajes y etiquetas testigo con badge personalizado y navegación fluida.
 */
export default function WineCard<T extends CuratedWine | WineCardData = CuratedWine | WineCardData>({
  wine,
  variant = 'editorial',
  badgeText,
  to,
  onSelect,
  className = '',
}: WineCardProps<T>) {
  const {
    name,
    winery,
    grape,
    vintage,
    region,
    rating,
    reviewCount,
    imageUrl,
    sourceType,
    isOfficial,
  } = wine;

  const isWineryOfficial =
    sourceType === 'Official' || sourceType === 'winery' || isOfficial;

  const resolvedBadgeText =
    badgeText ||
    (variant === 'pairing'
      ? 'Etiqueta Testigo'
      : isWineryOfficial
        ? 'Ficha Oficial'
        : 'Comunidad');

  const cardContent = (
    <>
      {/* Columna Izquierda: Espacio para botella con imagen real o silueta */}
      <div className="w-full sm:w-36 md:w-40 h-48 sm:h-auto bg-[#0d0d0f] sm:border-r border-b sm:border-b-0 border-white/[0.08] flex items-center justify-center p-4 shrink-0 transition-colors group-hover:bg-[#141417] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            width={160}
            height={192}
            className="max-h-36 sm:max-h-44 w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <WineBottleSilhouette className="w-12 h-32 sm:w-14 sm:h-36 text-neutral-400 transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>

      {/* Columna Derecha: Información técnica y tipografía editorial */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          {/* Cabecera: Varietal, Añada y Badge */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-sans font-medium uppercase tracking-wider text-neutral-400 truncate">
              {grape ? (vintage ? `${grape} · ${vintage}` : grape) : vintage || ''}
            </span>

            <span
              className={
                variant === 'pairing'
                  ? 'text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[#fbbf24] shrink-0'
                  : isWineryOfficial
                    ? 'text-xs font-sans font-medium uppercase tracking-[0.2em] text-amber-200/70 shrink-0'
                    : 'text-xs font-sans font-medium uppercase tracking-[0.2em] text-neutral-400 shrink-0'
              }
            >
              {resolvedBadgeText}
            </span>
          </div>

          {/* Nombre del vino en tipografía serif */}
          <h4 className="font-serif text-xl sm:text-2xl text-neutral-100 font-semibold tracking-tight leading-tight group-hover:text-white transition-colors truncate">
            {name}
          </h4>

          {/* Bodega y Región */}
          <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed mt-1 truncate">
            {winery} {region ? <><span className="text-neutral-500">·</span> {region}</> : null}
          </p>
        </div>

        {/* Pie: Rating (si aplica) y Enlace / Acción "Ver ficha →" */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
          {variant !== 'pairing' && rating !== undefined && rating !== null ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-sm font-medium text-neutral-200">
                {rating.toFixed(1)}
              </span>
              {reviewCount !== undefined && (
                <span className="text-xs font-medium text-neutral-400">
                  ({reviewCount})
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              Selección Sommelier
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium uppercase tracking-wider text-neutral-200 group-hover:text-white transition-colors py-1 px-1">
            <span>Ver ficha</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-amber-400" />
          </div>
        </div>
      </div>
    </>
  );

  const containerBaseClasses =
    'group relative bg-[#141417]/80 rounded-xl border border-white/[0.08] hover:bg-[#1c1c22] hover:border-white/[0.16] transition-all duration-200 flex flex-col sm:flex-row overflow-hidden shadow-lg hover:shadow-xl text-left block w-full';

  if (to) {
    return (
      <Link
        to={to}
        onClick={() => onSelect?.(wine)}
        className={`${containerBaseClasses} cursor-pointer ${className}`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article
      onClick={() => onSelect?.(wine)}
      className={`${containerBaseClasses} ${onSelect ? 'cursor-pointer' : ''} ${className}`}
    >
      {cardContent}
    </article>
  );
}
