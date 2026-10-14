import { useState } from 'react';
import { ArrowRight, Heart, Plus, Star } from 'lucide-react';
import BottleVector from './BottleVector';
import type { DashboardWine } from '../../../types/wine';

export interface WineryBlockProps {
  name: string;
  region: string;
  initials: string;
  total: number;
  wines: DashboardWine[];
  onAddToCellar?: (wine: DashboardWine) => void;
  onToggleFavorite?: (wine: DashboardWine, isFav: boolean) => void;
}

/**
 * WineryBlock Component (Estética Oscura Mate)
 * Grilla de botellas por productor con acabado oscuro mate (#121214), bordes sutiles
 * border-neutral-800 y tipografía editorial Fraunces.
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
  const headingId = `winery-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const toggleFav = (wineName: string, wine: DashboardWine) => {
    const nextState = !favorites[wineName];
    setFavorites((prev) => ({ ...prev, [wineName]: nextState }));
    onToggleFavorite?.(wine, nextState);
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-6">
      
      {/* Cabecera de Bodega */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-stone-900/60 backdrop-blur-md font-serif text-lg font-semibold text-neutral-200 shadow-sm"
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

        <a
          href="#catalogo"
          className="group/link inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          <span>Ver catálogo completo ({total})</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" aria-hidden="true" />
        </a>
      </header>

      {/* Grilla de Vinos */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {wines.map((wine) => {
          const isFav = !!favorites[wine.name];

          return (
            <li key={wine.name} className="flex">
              <article className="group relative w-full flex flex-col justify-between rounded-2xl bg-stone-950/40 backdrop-blur-xl p-5 hover:bg-stone-900/55 hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 shadow-xl shadow-black/50">
                
                {/* Botón de Favorito Flotante Esmerilado */}
                <button
                  type="button"
                  aria-label={isFav ? `Quitar ${wine.name} de deseados` : `Añadir ${wine.name} a deseados`}
                  onClick={() => toggleFav(wine.name, wine)}
                  className={`absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-stone-950/40 backdrop-blur-xl transition-all cursor-pointer ${
                    isFav
                      ? 'text-rose-400 bg-rose-950/60'
                      : 'text-neutral-400 hover:text-white hover:bg-stone-900/80'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-400' : ''}`} />
                </button>

                {/* Escaparate Central de Botella Flotante (Limpio, sin marcos ni recuadros) */}
                <div className="relative mb-3 flex h-52 w-full items-center justify-center p-2 overflow-hidden">
                  {wine.imageUrl ? (
                    <img
                      src={wine.imageUrl}
                      alt={wine.name}
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <BottleVector
                      kind={wine.bottle}
                      className="h-44 w-auto max-h-full"
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
                <div className="mt-4 pt-1">
                  <button
                    type="button"
                    onClick={() => onAddToCellar?.(wine)}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.07] hover:bg-[#722F37] hover:text-white text-xs font-semibold uppercase tracking-wider text-neutral-200 transition-all cursor-pointer backdrop-blur-md"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Añadir a Cava</span>
                  </button>
                </div>

              </article>
            </li>
          );
        })}
      </ul>

    </section>
  );
}
