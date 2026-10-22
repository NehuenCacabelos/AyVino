import { Wine, Layers, Users, Star } from 'lucide-react';

export interface WineryKpiRibbonProps {
  winesCount: number;
  vintagesCount: number;
  approvedVintagesCount: number;
  pendingVintagesCount: number;
  followersCount: number | null;
  averageRating: number | null;
  totalReviews: number;
  isWineryApproved: boolean;
  isLoading?: boolean;
}

/**
 * WineryKpiRibbon Component
 * Cinta de 4 tarjetas métricas sobrias para el inicio del panel de bodega.
 * Estilo Clean Dark con fondo #141416, bordes milimétricos y acentos dorados/bordó.
 */
export default function WineryKpiRibbon({
  winesCount,
  vintagesCount,
  approvedVintagesCount,
  pendingVintagesCount,
  followersCount,
  averageRating,
  totalReviews,
  isWineryApproved,
  isLoading = false,
}: WineryKpiRibbonProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-[#141416] border border-white/5 p-5 animate-pulse flex flex-col justify-between"
          >
            <div className="h-4 w-24 bg-white/5 rounded" />
            <div className="h-7 w-16 bg-white/10 rounded" />
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Etiquetas Oficiales */}
      <div className="rounded-2xl bg-[#141416] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Etiquetas
          </span>
          <div className="w-8 h-8 rounded-xl bg-stone-900 border border-white/10 text-rose-300 flex items-center justify-center shadow-sm group-hover:border-rose-900/40 transition-colors">
            <Wine className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="font-serif text-3xl font-semibold text-neutral-100 tracking-tight">
            {winesCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 font-sans">
            {winesCount === 1 ? 'etiqueta en catálogo' : 'etiquetas en catálogo'}
          </p>
        </div>
      </div>

      {/* 2. Cosechas y Añadas */}
      <div className="rounded-2xl bg-[#141416] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Cosechas
          </span>
          <div className="w-8 h-8 rounded-xl bg-stone-900 border border-white/10 text-amber-300 flex items-center justify-center shadow-sm group-hover:border-amber-900/40 transition-colors">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="font-serif text-3xl font-semibold text-neutral-100 tracking-tight">
            {vintagesCount}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 font-sans">
            {pendingVintagesCount > 0
              ? `${approvedVintagesCount} activas · ${pendingVintagesCount} en revisión`
              : `${approvedVintagesCount} añadas activas`}
          </p>
        </div>
      </div>

      {/* 3. Seguidores */}
      <div className="rounded-2xl bg-[#141416] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Seguidores
          </span>
          <div className="w-8 h-8 rounded-xl bg-stone-900 border border-white/10 text-neutral-300 flex items-center justify-center shadow-sm group-hover:border-white/20 transition-colors">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {isWineryApproved ? (
            <>
              <p className="font-serif text-3xl font-semibold text-neutral-100 tracking-tight">
                {followersCount ?? 0}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                miembros siguiendo tu bodega
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-2xl font-light text-neutral-500 tracking-tight">
                —
              </p>
              <p className="text-[11px] text-amber-200/70 mt-1 font-sans">
                Disponible al aprobarse
              </p>
            </>
          )}
        </div>
      </div>

      {/* 4. Calificación Promedio */}
      <div className="rounded-2xl bg-[#141416] border border-white/5 p-5 flex flex-col justify-between hover:border-white/10 transition-colors shadow-lg group">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Puntaje Global
          </span>
          <div className="w-8 h-8 rounded-xl bg-stone-900 border border-white/10 text-amber-300 flex items-center justify-center shadow-sm group-hover:border-amber-900/40 transition-colors">
            <Star className="w-4 h-4 fill-amber-300/20" />
          </div>
        </div>
        <div className="mt-3">
          {averageRating && averageRating > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-serif text-3xl font-semibold text-amber-200 tracking-tight">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-amber-200/60 font-mono">/ 5.0</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1 font-sans">
                {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'} de la comunidad
              </p>
            </>
          ) : (
            <>
              <p className="font-serif text-2xl font-light text-neutral-400 tracking-tight">
                Sin notas
              </p>
              <p className="text-[11px] text-neutral-500 mt-1 font-sans">
                Aguardando primeras catas
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

