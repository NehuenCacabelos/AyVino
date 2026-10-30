import type { PairingHubMode } from '../hooks/usePairingParams';

interface PairingModeSelectorProps {
  currentMode: PairingHubMode;
  onModeChange: (mode: PairingHubMode) => void;
}

/**
 * PairingModeSelector Component
 * Conmutador tipográfico sobrio estilo índice editorial.
 * Mayormente texto y líneas divisorias, libre de píldoras pesadas.
 */
export default function PairingModeSelector({
  currentMode,
  onModeChange,
}: PairingModeSelectorProps) {
  return (
    <nav
      role="tablist"
      aria-label="Selector de punto de partida para el maridaje"
      className="inline-flex items-center gap-4 text-xs font-mono uppercase tracking-widest"
    >
      <button
        type="button"
        role="tab"
        id="tab-wine"
        aria-selected={currentMode === 'wine'}
        aria-controls="pairing-panel"
        onClick={() => onModeChange('wine')}
        className={`pb-1 transition-colors cursor-pointer border-b-2 ${
          currentMode === 'wine'
            ? 'text-rose-300 border-rose-500 font-semibold'
            : 'text-neutral-500 hover:text-neutral-300 border-transparent'
        }`}
      >
        Por Cepa y Varietal
      </button>

      <span className="text-neutral-700 select-none" aria-hidden="true">
        /
      </span>

      <button
        type="button"
        role="tab"
        id="tab-food"
        aria-selected={currentMode === 'food'}
        aria-controls="pairing-panel"
        onClick={() => onModeChange('food')}
        className={`pb-1 transition-colors cursor-pointer border-b-2 ${
          currentMode === 'food'
            ? 'text-rose-300 border-rose-500 font-semibold'
            : 'text-neutral-500 hover:text-neutral-300 border-transparent'
        }`}
      >
        Por Plato Típico
      </button>
    </nav>
  );
}
