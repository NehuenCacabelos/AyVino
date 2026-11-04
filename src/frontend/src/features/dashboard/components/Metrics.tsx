import { Wine, Clock, Layers, Award } from 'lucide-react';

export interface MetricsProps {
  customStats?: {
    bottles?: number | null;
    varietals?: string | number | null;
    topRated?: string | number | null;
    readyToDrink?: string | number | null;
    dominantVarietal?: string | null;
    dominantVarietalPercentage?: number | null;
  };
}

/**
 * Metrics Component (Cava Strip - Barra de Métricas Horizontal Compacta)
 * Cierra la sección Hero con un diseño aireado, tipográfico y limpio:
 * - Total en Cava (Wine): Total real de botellas del usuario
 * - Listas para Descorchar (Clock): -- (No definido aún)
 * - Varietal Insignia (Layers): Uva más presente con porcentaje real, o -- si no hay
 * - Prestigio / Calificación (Award): -- (No definido aún)
 */
export default function Metrics({ customStats }: MetricsProps) {
  const totalBottles = customStats?.bottles ?? 0;
  const readyToDrink = customStats?.readyToDrink ?? '--';

  const dominantVarietal = customStats?.dominantVarietal
    ? customStats.dominantVarietalPercentage != null
      ? `${customStats.dominantVarietal} (${customStats.dominantVarietalPercentage}%)`
      : customStats.dominantVarietal
    : '--';

  const cleanRating = customStats?.topRated
    ? String(customStats.topRated).replace(' ★', '').split('/')[0].trim()
    : '--';

  return (
    <div className="w-full max-w-5xl mx-auto pt-3 sm:pt-3.5 border-t border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-center text-left">
        {/* 1. Total en Cava */}
        <div>
          <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Wine className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span>Total en Cava</span>
          </div>
          <p className="text-lg sm:text-xl font-serif text-white mt-0.5 sm:mt-1">
            {totalBottles} {totalBottles === 1 ? 'Botella' : 'Botellas'}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 font-sans">
            Colección activa
          </p>
        </div>

        {/* 2. Listas para Descorchar */}
        <div>
          <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span>Listas para Descorchar</span>
          </div>
          <p className="text-lg sm:text-xl font-serif text-white mt-0.5 sm:mt-1">
            {readyToDrink === '--' ? '--' : `${readyToDrink} Etiquetas`}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 flex items-center font-sans">
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block mr-1 shrink-0 ${
                readyToDrink === '--' ? 'bg-stone-500' : 'bg-emerald-500'
              }`}
              aria-hidden="true"
            />
            <span>En ventana óptima</span>
          </p>
        </div>

        {/* 3. Varietal Insignia */}
        <div>
          <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span>Varietal Insignia</span>
          </div>
          <p className="text-lg sm:text-xl font-serif text-white mt-0.5 sm:mt-1 truncate">
            {dominantVarietal}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 font-sans">
            {dominantVarietal === '--' ? '--' : 'Mayor presencia en estiba'}
          </p>
        </div>

        {/* 4. Prestigio / Calificación */}
        <div>
          <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
            <span>Prestigio / Calificación</span>
          </div>
          <p className="text-lg sm:text-xl font-serif text-amber-200 mt-0.5 sm:mt-1">
            {cleanRating === '--' ? '--' : `${cleanRating} ★`}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 font-sans">
            {cleanRating === '--' ? '--' : 'Calificación promedio'}
          </p>
        </div>
      </div>
    </div>
  );
}
