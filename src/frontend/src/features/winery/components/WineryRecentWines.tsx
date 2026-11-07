import { Link, useNavigate } from 'react-router-dom';
import { Wine, Plus, ArrowRight } from 'lucide-react';
import type { WineryPublicCatalogWineDto } from '../types';
import WineryPublicCatalogCard from './WineryPublicCatalogCard';

export interface WineryRecentWinesProps {
  wines: WineryPublicCatalogWineDto[];
  isLoading: boolean;
  totalCount?: number;
  onOpenCreateModal?: () => void;
}

/**
 * WineryRecentWines Component
 * Sección que resume las últimas etiquetas registradas por la bodega usando WineryPublicCatalogCard.
 * Muestra hasta 8 etiquetas en una grilla responsive idéntica a la del catálogo público.
 */
export default function WineryRecentWines({
  wines,
  isLoading,
  totalCount,
  onOpenCreateModal,
}: WineryRecentWinesProps) {
  const navigate = useNavigate();

  // Asegurar que cada vino cumpla el contrato de WineryPublicCatalogWineDto (en caso de datos legacy)
  const safeWines: WineryPublicCatalogWineDto[] = (wines || []).map((w) => ({
    ...w,
    vintages: Array.isArray(w.vintages) ? w.vintages : [],
  }));

  // Mostrar hasta 8 etiquetas (dos filas de cuatro)
  const previewWines = safeWines.slice(0, 8);
  const totalLabels = totalCount ?? safeWines.length;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-neutral-100 tracking-tight">
            Etiquetas Registradas
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5 font-sans">
            Últimas botellas oficiales incorporadas al catálogo de AyVino.
          </p>
        </div>
      </div>

      {isLoading ? (
        /* Skeletons de Carga */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-80 rounded-2xl bg-[#121015] border border-white/5 animate-pulse flex flex-col p-4 space-y-4"
            >
              <div className="w-full h-44 bg-zinc-900/60 rounded-xl" />
              <div className="h-5 w-3/4 bg-zinc-900 rounded" />
              <div className="h-3 w-1/2 bg-zinc-900/50 rounded" />
            </div>
          ))}
        </div>
      ) : previewWines.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-[#121015] border border-white/10 p-8 sm:p-10 text-center shadow-lg space-y-4">
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
            {onOpenCreateModal ? (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Cargar primera etiqueta</span>
              </button>
            ) : (
              <Link
                to="/bodega/vinos"
                className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Cargar primera etiqueta</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Grilla de Vinos Recientes */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {previewWines.map((wine) => (
              <WineryPublicCatalogCard
                key={wine.id}
                wine={wine}
                onSelectWine={() => navigate('/bodega/vinos')}
                isPreview={true}
              />
            ))}
          </div>

          {/* "Ver todas (n)" debajo de la grilla, alineado a la derecha, solo si hay etiquetas */}
          <div className="flex justify-end pt-2">
            <Link
              to="/bodega/vinos"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 transition-colors font-medium"
            >
              <span>Ver todas ({totalLabels})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
