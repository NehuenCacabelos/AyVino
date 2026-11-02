import type { CellarVitals } from '../types';

interface VaultVitalsProps {
  vitals: CellarVitals;
}

export default function VaultVitals({ vitals }: VaultVitalsProps) {
  const hasOldestVintage = vitals.oldestVintage != null;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-4">
      {/* Stat 1: Total en Cava */}
      <div className="bg-[#121216] border border-neutral-800/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-colors">
        <span className="font-mono text-[11px] tracking-widest text-neutral-400 block uppercase">
          Total en Cava
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-3xl sm:text-4xl text-neutral-100 font-semibold tracking-tight">
            {vitals.totalBottles}
          </span>
          <span className="text-xs sm:text-sm text-neutral-400 font-sans">
            {vitals.totalBottles === 1 ? 'botella' : 'botellas'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-500 font-mono text-[10px] sm:text-[11px] pt-0.5">
          <span className="text-[#ffb2b8] font-medium">{vitals.redsCount} Tintos</span>
          <span>·</span>
          <span className="text-[#fbbf24] font-medium">{vitals.whitesCount} Blancos</span>
          <span>·</span>
          <span className="text-neutral-300 font-medium">{vitals.sparklingCount} Esp.</span>
        </div>
      </div>

      {/* Stat 2: Varietal Dominante (No presente en el backend -> Muestra "—") */}
      <div className="bg-[#121216] border border-neutral-800/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-colors">
        <span className="font-mono text-[11px] tracking-widest text-neutral-400 block uppercase">
          Varietal Dominante
        </span>
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="font-serif text-2xl sm:text-3xl text-neutral-100 font-medium">
            {vitals.dominantVarietal ?? '—'}
          </span>
          <span className="font-mono text-xs sm:text-sm text-neutral-500 font-bold">
            {vitals.dominantVarietalPercentage != null ? `${vitals.dominantVarietalPercentage}%` : '—'}
          </span>
        </div>
        <p className="text-xs text-neutral-500 font-sans">
          Varietal no provisto en el archivo de estiba
        </p>
      </div>

      {/* Stat 3: Añada Más Antigua */}
      <div className="bg-[#121216] border border-neutral-800/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-colors sm:col-span-2 md:col-span-1">
        <span className="font-mono text-[11px] tracking-widest text-neutral-400 block uppercase">
          Añada Más Antigua
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl sm:text-4xl text-neutral-100 font-semibold tracking-tight">
            {hasOldestVintage ? vitals.oldestVintage : '—'}
          </span>
          {hasOldestVintage && (
            <span className="font-mono text-[10px] text-[#ffb2b8] font-semibold tracking-wider">
              ESTIBA
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 font-sans">
          {hasOldestVintage && vitals.oldestVintageAgingYears != null
            ? `${vitals.oldestVintageAgingYears} ${vitals.oldestVintageAgingYears === 1 ? 'año' : 'años'} de estiba registrada`
            : 'Sin cosechas fechadas en esta cava'}
        </p>
      </div>
    </section>
  );
}
