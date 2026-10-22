import { Star, ArrowRight } from 'lucide-react';
import type { CuratedWine } from '../../../types/wine';
import WineBottleSilhouette from './WineBottleSilhouette';

interface WineCardProps {
  wine: CuratedWine;
  onSelect?: (wine: CuratedWine) => void;
}

/**
 * WineCard Component
 * Tarjeta de vino editorial a dos columnas para escaneo visual rápido en la Landing.
 * Escala tipográfica generosa, alto contraste y sin cápsulas/badges.
 */
export default function WineCard({ wine, onSelect }: WineCardProps) {
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

  const isWineryOfficial = sourceType === 'Official' || sourceType === 'winery' || isOfficial;

  return (
    <article
      onClick={() => onSelect?.(wine)}
      className="group relative bg-[#121214] rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200 flex flex-col sm:flex-row overflow-hidden cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Columna Izquierda: Espacio para botella con imagen real */}
      <div className="w-full sm:w-40 h-52 sm:h-auto bg-[#0a0a0c] sm:border-r border-b sm:border-b-0 border-white/5 flex items-center justify-center p-4 shrink-0 transition-colors group-hover:bg-[#0c0c0e] relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            width={160}
            height={192}
            className="max-h-40 sm:max-h-48 w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)] transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <WineBottleSilhouette className="w-14 h-36 sm:w-16 sm:h-40 text-neutral-400 transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>

      {/* Columna Derecha: Información técnica esencial y escaneo rápido */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
        <div>
          {/* Cabecera: Varietal, Añada y Leyenda tipográfica pura sin píldoras */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-sans font-medium uppercase tracking-wider text-neutral-400">
              {grape} · {vintage}
            </span>

            <span
              className={
                isWineryOfficial
                  ? 'text-xs font-sans font-medium uppercase tracking-[0.2em] text-amber-200/70'
                  : 'text-xs font-sans font-medium uppercase tracking-[0.2em] text-neutral-400'
              }
            >
              {isWineryOfficial ? 'Ficha Oficial' : 'Comunidad'}
            </span>
          </div>

          {/* Nombre del vino con mayor escala */}
          <h4 className="font-serif text-2xl text-neutral-100 font-semibold tracking-tight leading-tight">
            {name}
          </h4>

          {/* Bodega y Región con mayor jerarquía */}
          <p className="text-sm text-neutral-300 font-normal leading-relaxed mt-1">
            {winery} <span className="text-neutral-500">·</span> {region}
          </p>
        </div>

        {/* Pie: Calificación y Enlace "VER FICHA →" */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
            <span className="text-sm font-medium text-neutral-200">
              {rating !== null ? rating.toFixed(1) : 'S/C'}
            </span>
            <span className="text-xs font-medium text-neutral-400">
              ({reviewCount})
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(wine);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-neutral-200 hover:text-white transition-colors py-1 px-2 -mr-2 cursor-pointer"
          >
            <span>Ver ficha</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
