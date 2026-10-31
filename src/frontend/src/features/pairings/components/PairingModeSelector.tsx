import { Wine, UtensilsCrossed } from 'lucide-react';
import type { PairingHubMode } from '../hooks/usePairingParams';

interface PairingModeSelectorProps {
  currentMode: PairingHubMode;
  onModeChange: (mode: PairingHubMode) => void;
}

const MODES: {
  id: PairingHubMode;
  label: string;
  shortLabel: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'wine', label: '¿Qué vas a tomar?', shortLabel: 'Tomar', Icon: Wine },
  { id: 'food', label: '¿Qué vas a comer?', shortLabel: 'Comer', Icon: UtensilsCrossed },
];

/**
 * PairingModeSelector Component
 * Interruptor tipo pastilla (pill) centrado horizontalmente.
 * Alto impacto visual; acentos cromáticos diferenciados por modo (vino/plato).
 */
export default function PairingModeSelector({
  currentMode,
  onModeChange,
}: PairingModeSelectorProps) {
  return (
    <nav
      role="tablist"
      aria-label="Selector de punto de partida para el maridaje"
      className="inline-flex w-3/4 p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-inner"
    >
      {MODES.map(({ id, label, shortLabel, Icon }) => {
        const isActive = currentMode === id;
        const activeWine = id === 'wine' && isActive;
        const activeFood = id === 'food' && isActive;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={isActive}
            aria-controls="pairing-panel"
            onClick={() => onModeChange(id)}
            className={[
              'flex flex-1 items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border',
              activeWine
                ? 'bg-rose-950/80 text-rose-200 border-rose-800/60 shadow-sm'
                : activeFood
                ? 'bg-amber-950/80 text-amber-200 border-amber-800/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-800/50',
            ].join(' ')}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'opacity-90' : 'opacity-50'}`} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}
