import { Star, ArrowRight } from 'lucide-react';
import type { CuratedWine } from '../../../types/wine';
import WineBottleSilhouette from './WineBottleSilhouette';

interface WineCardProps {
  wine: CuratedWine;
  onSelect?: (wine: CuratedWine) => void;
}

/**
 * WineCard Component
 * Tarjeta de vino minimalista a dos columnas optimizada para escaneo visual rápido.
 * Exclusivamente: botella, varietal/añada, nombre/bodega, puntuación/notas y botón sobrio.
 * Sin precios, sin notas de cata largas ni descriptores redundantes.
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

  const isWineryOfficial = sourceType === 'winery' || isOfficial;

  return (
    <article
      onClick={() => onSelect?.(wine)}
      className="group relative bg-[#141416] rounded-sm border border-neutral-800 hover:border-neutral-700 transition-colors duration-200 flex flex-col sm:flex-row overflow-hidden cursor-pointer"
    >
      {/* Columna Izquierda: Espacio para botella (foto o silueta SVG sobria) */}
      <div className="w-full sm:w-36 h-48 sm:h-auto bg-neutral-900/60 sm:border-r border-b sm:border-b-0 border-neutral-800 flex items-center justify-center p-4 shrink-0 transition-colors group-hover:bg-neutral-900/80">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="max-h-36 sm:max-h-44 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <WineBottleSilhouette className="w-14 h-36 sm:w-16 sm:h-40 text-neutral-400 transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>

      {/* Columna Derecha: Información técnica esencial y escaneo rápido */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          {/* Cabecera: Varietal, Añada y Tag sobrio de procedencia */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
              {grape} · {vintage}
            </span>

            <span className="bg-neutral-900 border border-neutral-800 text-neutral-300 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-sm">
              {isWineryOfficial ? 'Ficha Oficial' : 'Comunidad'}
            </span>
          </div>

          {/* Nombre del vino */}
          <h4 className="font-serif text-lg sm:text-xl font-semibold text-neutral-100 group-hover:text-white transition-colors leading-tight">
            {name}
          </h4>

          {/* Bodega y Región */}
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            {winery} <span className="text-neutral-600">—</span> {region}
          </p>
        </div>

        {/* Pie: Calificación y Botón Sobrio "Ver ficha" */}
        <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-neutral-200 font-mono">
              {rating.toFixed(1)}
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              ({reviewCount})
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(wine);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-300 group-hover:text-white hover:text-white transition-colors py-1 px-2 -mr-2 cursor-pointer"
          >
            <span>Ver ficha</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
