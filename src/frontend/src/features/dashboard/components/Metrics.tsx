import { Wine, Clock, Layers, Award } from 'lucide-react';

export interface MetricsProps {
  customStats?: {
    bottles?: number;
    varietals?: string | number;
    topRated?: string | number | null;
    topRatedSubtitle?: string;
    readyToDrink?: string | number;
    dominantVarietal?: string;
    dominantVarietalSubtitle?: string;
  };
  onUncorkClick?: () => void;
}

/**
 * Metrics Component (Cava Strip - Barra de Métricas Horizontal Compacta)
 * Cierra la sección Hero con un diseño aireado, tipográfico y limpio:
 * - Total en Cava (Wine): Total de botellas físicas en colección activa
 * - Listas para Descorchar (Clock): Etiquetas en ventana óptima
 * - Varietal Insignia (Layers): Cepa más representativa de la cava
 * - Prestigio / Calificación (Award): Calificación real de catas o estado inicial
 */
export default function Metrics({ customStats }: MetricsProps) {
  const totalBottles = customStats?.bottles ?? 0;
  const readyToDrink = customStats?.readyToDrink ?? 0;
  const dominantVarietal = customStats?.dominantVarietal ?? '—';
  const dominantVarietalSubtitle = customStats?.dominantVarietalSubtitle ?? 'Cepas registradas';

  const rawRating = customStats?.topRated;
  const hasRating = rawRating !== null && rawRating !== undefined && rawRating !== '—' && rawRating !== '';
  const cleanRating = hasRating ? String(rawRating).replace(' ★', '').split('/')[0].trim() : '—';
  const ratingSubtitle = customStats?.topRatedSubtitle ?? (hasRating ? 'Promedio de catas' : 'Sin calificaciones aún');

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
            {readyToDrink} {readyToDrink === 1 ? 'Etiqueta' : 'Etiquetas'}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 flex items-center font-sans">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 shrink-0"
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
          <p className="text-lg sm:text-xl font-serif text-white mt-0.5 sm:mt-1">
            {dominantVarietal}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 font-sans">
            {dominantVarietalSubtitle}
          </p>
        </div>

        {/* 4. Prestigio / Calificación */}
        <div>
          <div className="text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
            <span>Prestigio / Calificación</span>
          </div>
          <p className="text-lg sm:text-xl font-serif text-amber-200 mt-0.5 sm:mt-1">
            {hasRating ? `${cleanRating} ★` : '—'}
          </p>
          <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5 font-sans">
            {ratingSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
