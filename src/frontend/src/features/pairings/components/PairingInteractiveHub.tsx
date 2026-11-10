import {
  getWineVariety,
  getDishPairing,
  getFoodFamily,
} from '../../../data/pairingsData';
import { usePairingParams, type PairingHubMode } from '../hooks/usePairingParams';
import PairingModeSelector from './PairingModeSelector';
import PairingWineSelector from './PairingWineSelector';
import PairingFoodSelector from './PairingFoodSelector';
import PairingDossierView from './PairingDossierView';

export type HubMode = PairingHubMode;

interface PairingInteractiveHubProps {
  currentMode?: HubMode;
  onModeChange?: (mode: HubMode) => void;
}

/**
 * PairingInteractiveHub Component
 * Hub interactivo y bidireccional de maridaje de AyVino.
 *
 * Layout:
 *  1. Título editorial + descripción
 *  2. Selector de modo centrado (pill "Tengo un vino / Tengo un plato")
 *  3. Índice tipográfico de selección progresivo (cepas o categorías/platos)
 *  4. Ficha técnica del sommelier (PairingDossierView)
 */
export default function PairingInteractiveHub({
  currentMode: externalMode,
  onModeChange: externalOnModeChange,
}: PairingInteractiveHubProps = {}) {
  const {
    mode: hookMode,
    activeFamilyId,
    activeDishId,
    wineId,
    styleAnchor,
    sourceContext,
    setMode,
    selectCategory,
    selectDish,
    selectFood,
    selectWine,
    clearSourceContext,
  } = usePairingParams();

  // Compatibilidad si el padre pasa props
  const mode = externalMode ?? hookMode;
  const handleModeChange = (newMode: HubMode) => {
    setMode(newMode);
    externalOnModeChange?.(newMode);
  };

  // Entidades activas derivadas del dataset curado
  const activeWine = getWineVariety(wineId);
  const activeDishOrFamily = activeDishId
    ? getDishPairing(activeDishId)
    : getFoodFamily(activeFamilyId);

  return (
    <div className="flex flex-col gap-10 w-full max-w-6xl mx-auto">

      {/* 1. Cabecera Editorial Principal */}
      <div className="space-y-6 pb-6 border-b border-white/[0.06]">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#a18c8c] font-medium">
            Cuaderno Enogastronómico AyVino
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold tracking-tight text-[#e5e1e4] leading-tight">
            El Arte del Maridaje
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 font-sans leading-relaxed pt-1 max-w-2xl">
            El vino correcto cambia cualquier plato. Elegí qué vas a descorchar o qué vas a poner en la mesa y te mostramos las mejores combinaciones, por afinidad o contraste.
          </p>
        </div>

        {/* 2. Selector de Modo centrado — Pill de alto impacto */}
        <div className="flex justify-center">
          <PairingModeSelector
            currentMode={mode}
            onModeChange={handleModeChange}
          />
        </div>
      </div>

      {/* 3. Índice Tipográfico de Selección Progresivo */}
      <section
        id="pairing-panel"
        aria-label="Índice de selección tipográfico"
        className="w-full"
      >
        {mode === 'wine' ? (
          <PairingWineSelector
            selectedWineId={wineId}
            onSelectWine={(id) => selectWine(id)}
          />
        ) : (
          <PairingFoodSelector
            selectedFamilyId={activeFamilyId}
            selectedDishId={activeDishId}
            onSelectCategory={selectCategory}
            onSelectDish={selectDish}
          />
        )}
      </section>

      {/* 4. Ficha Técnica y Dossier del Sommelier */}
      <section
        id="pairing-dossier"
        aria-label="Ficha técnica de maridaje"
        className="pt-2"
      >
        <PairingDossierView
          key={mode === 'wine' ? (wineId ?? 'wine') : (activeDishId ?? activeFamilyId ?? 'food')}
          mode={mode}
          wine={activeWine}
          dish={activeDishOrFamily}
          styleAnchor={styleAnchor}
          sourceContext={sourceContext}
          onClearSourceContext={clearSourceContext}
          onSelectWine={selectWine}
          onSelectFood={selectFood}
        />
      </section>
    </div>
  );
}
