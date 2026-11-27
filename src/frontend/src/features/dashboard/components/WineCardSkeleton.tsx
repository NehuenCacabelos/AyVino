/**
 * WineCardSkeleton Component
 * Esqueleto de carga con pulso tenue (#1c1c22 / white/[0.07]) que replica exactamente
 * las proporciones, altura y bordes de la card de vino editorial mate.
 */
export default function WineCardSkeleton() {
  return (
    <li
      aria-hidden="true"
      className="list-none h-full"
    >
      <div
        className="relative flex flex-col h-full rounded-2xl bg-[#131316] border border-white/[0.07] backdrop-blur-xl p-3 shadow-xl shadow-black/50 animate-pulse select-none justify-between"
      >
        {/* Botón flotante simulado */}
        <div className="absolute right-4 top-4 h-8 w-8 rounded-full bg-white/[0.05] border border-white/[0.06]" />

        {/* Escenario con aspect-[4/5] */}
        <div className="relative mx-1 mt-1 mb-3 shrink-0">
          <div className="w-full aspect-[4/5] bg-white/[0.04] rounded-lg overflow-hidden flex items-center justify-center relative shadow-sm">
            <div className="h-36 w-10 rounded-full bg-white/[0.06]" />
          </div>
        </div>

        {/* Metadatos y Textos */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            {/* Badge varietal y año */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-4 w-16 rounded-md bg-white/[0.07]" />
              <div className="h-3.5 w-8 rounded bg-white/[0.04]" />
            </div>

            {/* Nombre del vino (2 líneas simuladas con altura mínima min-h-[3.25rem]) */}
            <div className="min-h-[3.25rem] space-y-1.5">
              <div className="h-4.5 w-4/5 rounded bg-white/[0.08]" />
              <div className="h-4.5 w-3/5 rounded bg-white/[0.06]" />
            </div>

            {/* Bodega y Región */}
            <div className="h-3 w-1/2 rounded bg-white/[0.04] mt-1" />
          </div>

          {/* Puntuación */}
          <div className="mt-3 flex items-center gap-1.5">
            <div className="h-3 w-20 rounded bg-white/[0.06]" />
            <div className="h-3 w-6 rounded bg-white/[0.04]" />
          </div>
        </div>

        {/* Botón de Añadir a Cava */}
        <div className="mt-4 pt-1">
          <div className="h-10 w-full rounded-xl bg-white/[0.06]" />
        </div>
      </div>
    </li>
  );
}

