import { Star, Wine as WineBottleIcon } from 'lucide-react';
import type { WineResponseDto } from '../types';

interface WineryPublicWineCardProps {
  wine: WineResponseDto;
  wineryName?: string;
  locationLabel?: string;
  onSelect?: (wine: WineResponseDto) => void;
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
 * WineryPublicWineCard Component
 * Tarjeta de presentación de etiqueta oficial en la vidriera pública de bodega.
 * Implementación 100% aislada de features/wines para preservar la independencia de módulos.
 */
export default function WineryPublicWineCard({
  wine,
  wineryName,
  locationLabel = 'Argentina',
  onSelect,
}: WineryPublicWineCardProps) {
  const typeLabel = getWineTypeSpanish(wine.wineType);

  return (
    <article
      onClick={() => onSelect?.(wine)}
      className="group relative bg-[#121214] rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200 flex flex-col sm:flex-row overflow-hidden cursor-pointer shadow-lg hover:shadow-xl"
    >
      {/* Columna Izquierda: Silueta o espacio de botella */}
      <div className="w-full sm:w-36 h-48 sm:h-auto bg-[#0a0a0c] sm:border-r border-b sm:border-b-0 border-white/5 flex items-center justify-center p-4 shrink-0 transition-colors group-hover:bg-[#0c0c0e] relative overflow-hidden">
        <WineBottleIcon className="w-12 h-28 text-neutral-600 transition-transform duration-300 group-hover:scale-110" />
      </div>

      {/* Columna Derecha: Información de la etiqueta */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-neutral-400">
            <span>{typeLabel}</span>
            <span>{locationLabel}</span>
          </div>

          <h3 className="font-serif text-lg sm:text-xl font-semibold text-neutral-100 group-hover:text-rose-200 transition-colors leading-snug">
            {wine.name}
          </h3>

          {wineryName && (
            <p className="text-xs text-neutral-400 font-sans">{wineryName}</p>
          )}

          {wine.description && (
            <p className="text-xs text-neutral-500 font-sans line-clamp-2 leading-relaxed">
              {wine.description}
            </p>
          )}
        </div>

        {/* Footer de Tarjeta con Rating y Sello Oficial */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
          {wine.averageRating ? (
            <div className="flex items-center gap-1.5 text-amber-300 font-mono">
              <Star className="w-3.5 h-3.5 fill-amber-300" />
              <span className="font-semibold">{wine.averageRating.toFixed(1)}</span>
              <span className="text-neutral-500">({wine.reviewCount ?? 0})</span>
            </div>
          ) : (
            <span className="text-neutral-500 font-mono text-[11px]">Etiqueta Oficial</span>
          )}

          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-300/80 group-hover:text-rose-200 transition-colors">
            Ver ficha →
          </span>
        </div>
      </div>
    </article>
  );
}
