import { Wine, Clock, Layers, Award } from 'lucide-react';

export interface MetricsProps {
  customStats?: {
    bottles?: number;
    varietals?: string | number;
    topRated?: string | number;
    readyToDrink?: string | number;
    dominantVarietal?: string;
  };
}

/**
 * Metrics Component (Cava Strip - Barra de Métricas Horizontal Compacta)
 * Cierra la sección Hero con un diseño aireado, tipográfico y limpio:
 * - Total en Cava (Wine): 24 Botellas · Colección activa
 * - Listas para Descorchar (Clock): 3 Etiquetas · En ventana óptima (con punto verde)
 * - Varietal Insignia (Layers): Malbec (58%) · 8 cepas registradas
 * - Prestigio / Calificación (Award): 4.9 ★ · Nivel Gran Reserva
 */
export default function Metrics({ customStats }: MetricsProps) {
  const totalBottles = customStats?.bottles ?? 24;
  const readyToDrink = customStats?.readyToDrink ?? 3;
  const dominantVarietal = customStats?.dominantVarietal ?? 'Malbec (58%)';
  const rawRating = customStats?.topRated ? String(customStats.topRated) : '4.9';
  const cleanRating = rawRating.replace(' ★', '').split('/')[0].trim();

  return (
    <div className="w-full max-w-5xl mx-auto pt-6 border-t border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center text-left">
        {/* 1. Total en Cava */}
        <div>
          <div className="text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Wine className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span>Total en Cava</span>
          </div>
          <p className="text-xl font-serif text-white mt-1">
            {totalBottles} Botellas
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 font-sans">
            Colección activa
          </p>
        </div>

        {/* 2. Listas para Descorchar */}
        <div>
          <div className="text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span>Listas para Descorchar</span>
          </div>
          <p className="text-xl font-serif text-white mt-1">
            {readyToDrink} Etiquetas
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 flex items-center font-sans">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1 shrink-0"
              aria-hidden="true"
            />
            <span>En ventana óptima</span>
          </p>
        </div>

        {/* 3. Varietal Insignia */}
        <div>
          <div className="text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-400 shrink-0" aria-hidden="true" />
            <span>Varietal Insignia</span>
          </div>
          <p className="text-xl font-serif text-white mt-1">
            {dominantVarietal}
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 font-sans">
            8 cepas registradas
          </p>
        </div>

        {/* 4. Prestigio / Calificación */}
        <div>
          <div className="text-[11px] font-medium tracking-wider text-stone-400 uppercase flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400/80 shrink-0" aria-hidden="true" />
            <span>Prestigio / Calificación</span>
          </div>
          <p className="text-xl font-serif text-amber-200 mt-1">
            {cleanRating} ★
          </p>
          <p className="text-[11px] text-stone-400 mt-0.5 font-sans">
            Nivel Gran Reserva
          </p>
        </div>
      </div>
    </div>
  );
}
