import { Link } from 'react-router-dom';
import { Wine, Plus, Star, ArrowRight } from 'lucide-react';
import type { WineResponseDto } from '../types';

export interface WineryRecentWinesProps {
  wines: WineResponseDto[];
  isLoading: boolean;
}

function getWineTypeLabel(wineType?: string): string {
  switch (wineType?.toLowerCase()) {
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
      return wineType || 'Vino';
  }
}

function getWineTypeColor(wineType?: string): string {
  switch (wineType?.toLowerCase()) {
    case 'red':
      return 'bg-rose-950/40 text-rose-300 border-rose-900/40';
    case 'white':
      return 'bg-amber-950/30 text-amber-200 border-amber-900/40';
    case 'rose':
      return 'bg-pink-950/30 text-pink-300 border-pink-900/40';
    case 'sparkling':
      return 'bg-yellow-950/30 text-yellow-200 border-yellow-900/40';
    case 'orange':
      return 'bg-orange-950/30 text-orange-300 border-orange-900/40';
    default:
      return 'bg-stone-900 text-neutral-300 border-white/10';
  }
}

/**
 * WineryRecentWines Component
 * Sección que resume las últimas etiquetas oficiales registradas por la bodega.
 * Incluye empty state integrado cuando aún no se han publicado vinos.
 */
export default function WineryRecentWines({ wines, isLoading }: WineryRecentWinesProps) {
  // Tomar hasta 4 vinos para el preview de inicio
  const previewWines = wines.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-neutral-100 tracking-tight">
            Etiquetas Registradas
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-sans">
            Últimas botellas oficiales incorporadas al catálogo de AyVino.
          </p>
        </div>

        <Link
          to="/bodega/vinos"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 transition-colors font-medium"
        >
          <span>Ver todas ({wines.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-[#141416] border border-white/5 p-5 animate-pulse"
            />
          ))}
        </div>
      ) : previewWines.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-[#141416] border border-white/5 p-8 sm:p-10 text-center shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-white/10 text-rose-300 mx-auto flex items-center justify-center shadow-sm">
            <Wine className="w-6 h-6" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif text-lg font-semibold text-neutral-100">
              Todavía no publicaste ninguna etiqueta
            </h3>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Comenzá cargando tu primer vino oficial para que la comunidad de aficionados y
              sommeliers pueda descubrirlo, agregarlo a su cava y compartir sus notas de cata.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/bodega/vinos"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar primera etiqueta</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Grilla de Vinos Recientes */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {previewWines.map((wine) => (
            <div
              key={wine.id}
              className="rounded-2xl bg-[#141416] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${getWineTypeColor(
                      typeof wine.wineType === 'string' ? wine.wineType : 'Vino',
                    )}`}
                  >
                    {getWineTypeLabel(typeof wine.wineType === 'string' ? wine.wineType : undefined)}
                  </span>

                  <div className="flex items-center gap-1 text-xs text-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-300/30 text-amber-300" />
                    <span className="font-mono font-medium">
                      {wine.averageRating ? wine.averageRating.toFixed(1) : '—'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ({wine.reviewCount})
                    </span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-semibold text-neutral-100 group-hover:text-rose-200 transition-colors truncate">
                  {wine.name}
                </h3>

                {wine.description && (
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2 font-sans leading-relaxed">
                    {wine.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-500">
                  {wine.sourceType === 'Official' ? 'Ficha Oficial' : 'Comunitaria'}
                </span>

                <Link
                  to="/bodega/vinos"
                  className="text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                >
                  Gestionar →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
