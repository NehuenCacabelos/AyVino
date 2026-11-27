import type { CellarVitals } from '../types';

interface VaultVitalsProps {
  vitals: CellarVitals;
}

export default function VaultVitals({ vitals }: VaultVitalsProps) {
  const hasBottles = vitals.totalBottles > 0;
  const hasSegments = hasBottles && vitals.varietalSegments && vitals.varietalSegments.length > 0;

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
          <span className="text-xs sm:text-sm text-neutral-400 font-sans">botellas</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-neutral-500 font-mono text-[10px] sm:text-[11px] pt-0.5">
          <span className="text-[#ffb2b8] font-medium">{vitals.redsCount} Tintos</span>
          <span>·</span>
          <span className="text-[#fbbf24] font-medium">{vitals.whitesCount} Blancos</span>
          <span>·</span>
          <span className="text-neutral-300 font-medium">{vitals.sparklingCount} Esp.</span>
          {vitals.othersCount !== undefined && vitals.othersCount > 0 && (
            <>
              <span>·</span>
              <span className="text-stone-400 font-medium">{vitals.othersCount} Otros</span>
            </>
          )}
        </div>
      </div>

      {/* Stat 2: Varietal Dominante */}
      <div className="bg-[#121216] border border-neutral-800/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-colors">
        <span className="font-mono text-[11px] tracking-widest text-neutral-400 block uppercase">
          Varietal Dominante
        </span>
        <div className="flex items-baseline justify-between gap-1.5 min-w-0">
          <span
            className="font-serif text-2xl sm:text-3xl text-neutral-100 font-medium truncate"
            title={vitals.dominantVarietal}
          >
            {vitals.dominantVarietal}
          </span>
          <span className="font-mono text-xs sm:text-sm text-[#ffb2b8] font-bold shrink-0">
            {hasBottles && vitals.dominantVarietal !== '—'
              ? `${vitals.dominantVarietalPercentage}%`
              : '—'}
          </span>
        </div>

        {/* Barra Segmentada Real */}
        <div className="w-full bg-[#201f25] rounded-full h-1.5 overflow-hidden flex mt-2">
          {hasSegments ? (
            vitals.varietalSegments.map((seg, idx) => (
              <div
                key={`${seg.name}-${idx}`}
                className="h-full transition-all duration-500"
                style={{
                  width: `${seg.percentage}%`,
                  backgroundColor: seg.color,
                  opacity: seg.opacity ?? 1,
                }}
                title={`${seg.name}: ${seg.percentage}% (${seg.bottleCount} botellas)`}
              />
            ))
          ) : (
            <div className="bg-neutral-800 h-full w-full" />
          )}
        </div>

        {/* Leyenda Real de Tramos */}
        {hasSegments && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[10px] font-mono text-neutral-400">
            {vitals.varietalSegments.map((seg, idx) => (
              <div key={`legend-${seg.name}-${idx}`} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{
                    backgroundColor: seg.color,
                    opacity: seg.opacity ?? 1,
                  }}
                />
                <span>{seg.name} {seg.percentage} %</span>
              </div>
            ))}
          </div>
        )}

        {/* Nota chica para botellas sin uva declarada */}
        {hasBottles && vitals.undeclaredGrapeBottles > 0 && (
          <p className="text-[10px] font-mono text-neutral-500 pt-0.5">
            {vitals.undeclaredGrapeBottles}{' '}
            {vitals.undeclaredGrapeBottles === 1
              ? 'botella sin uva declarada'
              : 'botellas sin uva declarada'}
          </p>
        )}
      </div>

      {/* Stat 3: Añada Más Antigua */}
      <div className="bg-[#121216] border border-neutral-800/70 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 relative overflow-hidden group hover:border-neutral-700/80 transition-colors sm:col-span-2 md:col-span-1">
        <span className="font-mono text-[11px] tracking-widest text-neutral-400 block uppercase">
          Añada Más Antigua
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl sm:text-4xl text-neutral-100 font-semibold tracking-tight">
            {vitals.oldestVintage ? vitals.oldestVintage : '—'}
          </span>
          {vitals.oldestVintage && (
            <span className="font-mono text-[10px] text-[#ffb2b8] font-semibold tracking-wider">
              GRAN RESERVA
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-400 font-sans">
          {vitals.oldestVintage
            ? `${vitals.oldestVintageAgingYears} años de estiba impecable`
            : 'Sin botellas en estiba'}
        </p>
      </div>
    </section>
  );
}
