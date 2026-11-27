import { Link } from 'react-router-dom';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useRealWine } from '../hooks/useRealWine';
import WineDetailView from './WineDetailView';

export interface RealWineEditViewProps {
  wineId: string | undefined;
  backTo: string;
  ownerCheckWineryId?: number | null;
}

/**
 * Contenedor compartido de edición completa de vinos reales.
 * Reutilizado tanto por el portal de Bodegas (`/bodega/vinos/:wineId`, con guarda de propiedad)
 * como por el panel de Administración (`/admin/vinos/:wineId`, sin guarda de bodega).
 */
export default function RealWineEditView({
  wineId,
  backTo,
  ownerCheckWineryId,
}: RealWineEditViewProps) {
  const {
    wine,
    rawWine,
    rawVintages,
    isLoading,
    isNotFound,
    error,
    reload,
    reloadReviews,
  } = useRealWine(wineId);

  if (isLoading) {
    return (
      <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] flex items-center justify-center pt-24 pb-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            Cargando etiqueta enológica...
          </span>
        </div>
      </main>
    );
  }

  if (isNotFound || error || !wine) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121015] border border-white/5 space-y-4 shadow-sm animate-in fade-in my-8">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-neutral-400 w-fit mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            Etiqueta no encontrada
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            La etiqueta solicitada no existe o no se encuentra disponible.
          </p>
        </div>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-md"
        >
          <span>Volver al catálogo</span>
        </Link>
      </div>
    );
  }

  if (
    ownerCheckWineryId != null &&
    rawWine?.wineryId &&
    rawWine.wineryId !== ownerCheckWineryId
  ) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121015] border border-rose-500/20 space-y-4 shadow-sm animate-in fade-in my-8">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 w-fit mx-auto">
          <ShieldAlert className="w-8 h-8 text-rose-400" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            Acceso denegado
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Esta etiqueta enológica pertenece a otra bodega y no tenés permisos para gestionarla.
          </p>
        </div>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-md"
        >
          <span>Volver al catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <WineDetailView
      wine={wine}
      reviews={wine.reviews}
      ownerMode={true}
      ownerBackTo={backTo}
      isRealWine={true}
      rawWine={rawWine}
      rawVintages={rawVintages}
      onReload={reload}
      onReviewPublished={reloadReviews}
    />
  );
}
