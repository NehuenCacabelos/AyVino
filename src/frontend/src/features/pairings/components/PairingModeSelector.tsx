import { UtensilsCrossed, Wine } from 'lucide-react';
import type { PairingHubMode } from '../hooks/usePairingParams';

interface PairingModeSelectorProps {
  currentMode: PairingHubMode;
  onModeChange: (mode: PairingHubMode) => void;
}

export default function PairingModeSelector({
  currentMode,
  onModeChange,
}: PairingModeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Selector de punto de partida para el maridaje"
      className="inline-flex items-center p-1 rounded-lg bg-zinc-900/80 border border-zinc-700/60 shadow-sm"
    >
      <button
        type="button"
        role="tab"
        id="tab-food"
        aria-selected={currentMode === 'food'}
        aria-controls="pairing-panel"
        onClick={() => onModeChange('food')}
        className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
          currentMode === 'food'
            ? 'bg-[#4f131f] hover:bg-[#5e1725] text-rose-100 border border-rose-400/30 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
        }`}
      >
        <UtensilsCrossed
          className={`w-3.5 h-3.5 transition-colors ${
            currentMode === 'food' ? 'text-rose-200' : 'text-zinc-400 group-hover:text-zinc-300'
          }`}
        />
        <span className="font-serif tracking-tight text-neutral-100">Tengo un plato</span>
      </button>

      <button
        type="button"
        role="tab"
        id="tab-wine"
        aria-selected={currentMode === 'wine'}
        aria-controls="pairing-panel"
        onClick={() => onModeChange('wine')}
        className={`group relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
          currentMode === 'wine'
            ? 'bg-amber-950/60 hover:bg-amber-900/60 text-white border border-amber-400/70 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
        }`}
      >
        <Wine
          className={`w-3.5 h-3.5 transition-colors ${
            currentMode === 'wine' ? 'text-amber-400' : 'text-zinc-400 group-hover:text-zinc-300'
          }`}
        />
        <span className="font-serif tracking-tight text-neutral-100">Tengo un vino</span>
      </button>
    </div>
  );
}
