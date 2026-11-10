import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star } from 'lucide-react';
import BottleVector from './BottleVector';
import type { DashboardWine } from '../../../types/wine';
import { normalizeWineSlug } from '../../wines';

export interface DashboardWineCardProps {
  wine: DashboardWine;
  onAddToCellar?: (wine: DashboardWine) => void;
  onToggleFavorite?: (wine: DashboardWine, isFav: boolean) => void;
}

/**
 * DashboardWineCard Component
 * Card de vino con estética editorial mate (#131316), bordes esmerilados border-white/[0.07],
 * spotlight de botella (con fallback determinista a BottleVector), rating con estrellas y acciones.
 */
export default function DashboardWineCard({
  wine,
  onAddToCellar,
  onToggleFavorite,
}: DashboardWineCardProps) {
  const [isFav, setIsFav] = useState(Boolean(wine.isFavorite));
  const wineSlug = wine.id || normalizeWineSlug(wine.name);

  const handleToggleFav = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isFav;
    setIsFav(nextState);
    onToggleFavorite?.(wine, nextState);
  };

  const handleAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCellar?.(wine);
  };

  return (
    <li className="flex list-none">
      <Link
        to={`/vinos/${wineSlug}`}
        className="group relative w-full flex flex-col justify-between rounded-2xl bg-[#131316] border border-white/[0.07] backdrop-blur-xl p-5 hover:border-white/[0.18] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 shadow-xl shadow-black/50 cursor-pointer block text-left"
      >
        {/* Botón de Favorito Flotante Esmerilado */}
        <button
          type="button"
          aria-label={isFav ? `Quitar ${wine.name} de deseados` : `Añadir ${wine.name} a deseados`}
          onClick={handleToggleFav}
          className={`absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[#1c1c22]/80 border border-white/[0.08] backdrop-blur-xl transition-all cursor-pointer ${
            isFav
              ? 'text-rose-400 bg-rose-950/60 border-rose-500/30'
              : 'text-neutral-400 hover:text-white hover:bg-[#1c1c22]'
          }`}
        >
          <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-400' : ''}`} />
        </button>

        {/* Spotlight dedicado para la botella */}
        <div className="relative bg-gradient-to-b from-white/[0.02] to-transparent rounded-lg mx-2.5 mt-2.5 py-6 flex items-center justify-center overflow-hidden mb-3">
          {wine.imageUrl ? (
            <img
              src={wine.imageUrl}
              alt={wine.name}
              className="h-44 w-auto max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <BottleVector
              kind={wine.bottle}
              className="h-44 w-auto max-h-full transition-transform duration-300 group-hover:scale-105"
              alt={wine.name}
            />
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
                    wine.rating > 0 && i < Math.round(wine.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-neutral-200 tabular-nums">
              {wine.rating > 0 ? wine.rating.toFixed(1) : 'S/C'}
            </span>
          </div>
        </div>

        {/* Botón de Acción Añadir a Cava Esmerilado */}
        <div className="mt-4 pt-1 relative z-20">
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.07] hover:bg-[#722F37] hover:text-white text-xs font-semibold uppercase tracking-wider text-neutral-200 transition-all cursor-pointer backdrop-blur-md"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Añadir a Cava</span>
          </button>
        </div>
      </Link>
    </li>
  );
}

