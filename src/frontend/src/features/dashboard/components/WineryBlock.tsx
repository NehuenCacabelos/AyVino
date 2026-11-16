import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

/**
 * WineryBlock Component (Estética Oscura Mate)
 * Grilla de botellas por productor con acabado oscuro mate (#121214), bordes sutiles
 * border-neutral-800 y tipografía editorial Fraunces.
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
  const headingId = `winery-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const logoSrc = logoImageId ? imageUrl(logoImageId, 'logo') : null;
  const showLogoImage = Boolean(logoSrc && !logoError);

  const handleToggleFavorite = (targetWine: DashboardWine, nextState: boolean) => {
    const wineKey = targetWine.id || targetWine.name;
    setFavorites((prev) => ({ ...prev, [wineKey]: nextState }));
    onToggleFavorite?.(targetWine, nextState);
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

      {/* Grilla de Vinos */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {wines.map((wine) => {
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

    </section>
  );
}
