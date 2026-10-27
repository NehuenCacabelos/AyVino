import React from 'react';
import { Star, ShieldAlert } from 'lucide-react';
import type { WineryPublicCatalogWineDto } from '../types';
import WineryCatalogBottleSilhouette from './WineryCatalogBottleSilhouette';
import { cn } from '../../../lib/utils';

export interface WineryPublicCatalogCardProps {
  wine: WineryPublicCatalogWineDto;
  onSelectWine: (wine: WineryPublicCatalogWineDto) => void;
  isPreview?: boolean;
}

function getWineTypeSpanish(type?: string | null): string {
  switch (type?.toLowerCase()) {
    case 'red':
      return 'Tinto';
    case 'white':
      return 'Blanco';
    case 'rose':
      return 'Rosado';
    case 'sparkling':
      return 'Espumoso';
    case 'orange':
      return 'Naranjo';
    default:
      return type || 'Vino';
  }
}

/**
 * WineryPublicCatalogCard Component
 * Tarjeta de presentación pública de una etiqueta en el catálogo de la bodega.
 * Cumple con el patrón de punto de entrada único: todo clic invoca a onSelectWine(wine).
 */
export default function WineryPublicCatalogCard({
  wine,
  onSelectWine,
  isPreview = false,
}: WineryPublicCatalogCardProps) {
  // 1. Cosecha más reciente con fotografía
  const vintageWithImage = wine.vintages.find(
    (v) => v.imageUrl && v.imageUrl.trim().length > 0,
  );
  const primaryVintage = wine.vintages[0];

  // 2. Rango de años
  const years = wine.vintages
    .map((v) => v.year)
    .filter((y): y is number => typeof y === 'number' && !isNaN(y));

  let yearRangeLabel = 'Añada s/d';
  if (years.length === 1) {
    yearRangeLabel = `Cosecha ${years[0]}`;
  } else if (years.length > 1) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    yearRangeLabel = minYear === maxYear ? `Cosecha ${minYear}` : `${minYear} – ${maxYear}`;
  }

  // 3. Uva principal
  const primaryGrape = primaryVintage?.grapes?.[0];
  const grapeLabel = primaryGrape
    ? `${primaryGrape.grapeName}${
        typeof primaryGrape.percentage === 'number' ? ` (${primaryGrape.percentage}%)` : ''
      }`
    : 'Varietal s/d';

  // 4. Marca de borrador en vista previa
  const hasUnapprovedVintages = wine.vintages.some((v) => v.approvalStatus !== 'Approved');
  const showDraftBadge = isPreview && hasUnapprovedVintages;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectWine(wine);
    }
  };

  return (
    <article
      data-testid={`catalog-card-${wine.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelectWine(wine)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col rounded-2xl bg-[#121015] border border-white/5 hover:border-white/20 overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-rose-500/50',
      )}
    >
      {/* Insignia de Borrador (en vista previa) */}
      {showDraftBadge && (
        <div className="absolute top-3 left-3 z-20">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-900/60 px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
            <ShieldAlert className="w-3 h-3" />
            Borrador
          </span>
        </div>
      )}

      {/* Tipo de Vino (badge superior derecho) */}
      <div className="absolute top-3 right-3 z-20">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 bg-black/60 border border-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {getWineTypeSpanish(wine.wineType)}
        </span>
      </div>

      {/* Área Visual de la Botella / Fotografía */}
      <div className="relative w-full h-52 sm:h-56 bg-gradient-to-b from-[#17151a] to-[#0f0e13] flex items-center justify-center p-4 overflow-hidden">
        {vintageWithImage?.imageUrl ? (
          <img
            src={vintageWithImage.imageUrl}
            alt={wine.name}
            className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="transition-transform duration-500 group-hover:scale-105">
            <WineryCatalogBottleSilhouette
              className="w-16 h-36 text-neutral-600 opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#121015] to-transparent pointer-events-none" />
      </div>

      {/* Contenido Descriptivo e Información Técnica */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-mono text-zinc-500 tracking-wider uppercase">
            {yearRangeLabel}
          </p>
          <h3 className="font-serif text-lg sm:text-xl font-medium text-white group-hover:text-rose-200 transition-colors line-clamp-1">
            {wine.name}
          </h3>
          <p className="text-xs text-zinc-400 font-sans truncate">
            {grapeLabel}
          </p>
        </div>

        {/* Pie de tarjeta: Valoración y botón de apertura */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {typeof wine.averageRating === 'number' ? (
              <span className="flex items-center gap-1 text-amber-300 font-mono font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>{wine.averageRating.toFixed(1)}</span>
                <span className="text-zinc-500 text-[11px]">
                  ({wine.reviewCount} {wine.reviewCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </span>
            ) : (
              <span className="text-zinc-500 font-sans text-[11px]">
                Sin valoraciones
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono text-rose-300/80 group-hover:text-rose-200 group-hover:underline transition-colors">
            Ficha técnica →
          </span>
        </div>
      </div>
    </article>
  );
}
