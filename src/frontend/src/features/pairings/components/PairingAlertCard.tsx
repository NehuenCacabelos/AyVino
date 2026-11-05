import { Ban, ArrowRight } from 'lucide-react';
import type { EnrichedChemicalClash } from '../../../data/pairingsData';

interface PairingAlertCardProps {
  clash: EnrichedChemicalClash;
  onSelectWine?: (id: string, anchor?: string, fromLabel?: string) => void;
}

/**
 * PairingAlertCard Component
 * Tarjeta de colisión química organoléptica ("Combinaciones a Evitar").
 * Muestra la reacción molecular perjudicial y ofrece un enlace rápido hacia la cepa sugerida.
 */
export function PairingAlertCard({
  clash,
  onSelectWine,
}: PairingAlertCardProps) {
  const handleWineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clash.suggestedWineId && onSelectWine) {
      onSelectWine(clash.suggestedWineId, undefined, `Alerta: ${clash.target}`);
    }
  };

  return (
    <article className="p-4 sm:p-5 rounded-xl bg-[#171415] border border-rose-950/60 hover:border-rose-800/60 transition-all duration-200 space-y-3 shadow-lg">
      <div className="flex items-center gap-2 text-rose-400">
        <Ban className="w-4 h-4 shrink-0 text-rose-500" />
        <h4 className="font-serif text-lg sm:text-xl text-white font-semibold leading-snug">
          {clash.target}
        </h4>
      </div>

      <p className="font-sans text-xs sm:text-sm text-zinc-300 leading-relaxed">
        <strong className="text-rose-400 font-medium">
          {clash.chemicalTitle}:
        </strong>{' '}
        {clash.reason}
      </p>

      {clash.suggestedWineLabel && (
        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
          <span className="text-zinc-500">Sugerencia:</span>
          {clash.suggestedWineId && onSelectWine ? (
            <button
              type="button"
              onClick={handleWineClick}
              className="inline-flex items-center gap-1 text-[#ffb2b8] hover:text-white transition-colors cursor-pointer group focus:outline-none"
              title={`Ver maridaje para ${clash.suggestedWineLabel}`}
            >
              <span>{clash.suggestedWineLabel}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <span className="text-[#ffb2b8]">{clash.suggestedWineLabel}</span>
          )}
        </div>
      )}
    </article>
  );
}

export default PairingAlertCard;

