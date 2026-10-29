import { useState } from 'react';
import {
  getFoodPairing,
  getWineVariety,
  getCuratedWinesForPairing,
} from '../../../data/pairingsData';
import { WineDetailModal } from '../../wines';
import type { CuratedWine } from '../../../types/wine';
import { usePairingParams } from '../hooks/usePairingParams';
import type { PairingHubMode } from '../hooks/usePairingParams';

import PairingModeSelector from './PairingModeSelector';
import PairingFoodSelector from './PairingFoodSelector';
import PairingWineSelector from './PairingWineSelector';
import PairingDossierHeader from './PairingDossierHeader';
import PairingBottleHero from './PairingBottleHero';
import PairingAffinities from './PairingAffinities';
import PairingCavaAction from './PairingCavaAction';

export type HubMode = PairingHubMode;

interface PairingInteractiveHubProps {
  currentMode?: HubMode;
  onModeChange?: (mode: HubMode) => void;
}

export default function PairingInteractiveHub({
  currentMode: externalMode,
  onModeChange: externalOnModeChange,
}: PairingInteractiveHubProps = {}) {
  const {
    mode: hookMode,
    foodId,
    wineId,
    sourceContext,
    setMode,
    selectFood,
    selectWine,
    clearSourceContext,
  } = usePairingParams();

  // Compatibilidad hacia atrás si el padre pasa props
  const mode = externalMode ?? hookMode;
  const handleModeChange = (newMode: HubMode) => {
    setMode(newMode);
    externalOnModeChange?.(newMode);
  };

  const [selectedModalWine, setSelectedModalWine] = useState<CuratedWine | null>(null);

  // Entidades activas según la URL
  const activeFood = getFoodPairing(foodId);
  const activeWine = getWineVariety(wineId);

  // Botellas curadas para la sección hero
  const activeWineIds = mode === 'food' ? activeFood?.curatedWineIds : activeWine?.curatedWineIds;
  const heroWines = getCuratedWinesForPairing(activeWineIds || []);

  const activeTitle = mode === 'food' ? activeFood?.title : activeWine?.title;
  const activeTip = mode === 'food' ? activeFood?.serviceTip : activeWine?.serviceTip;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 1. Cabecera Editorial Principal & Switcher de Modo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div className="flex flex-col gap-3 max-w-3xl">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-100 leading-tight">
            El Arte del Maridaje
          </h1>
          <p className="text-base sm:text-lg text-zinc-300 font-sans font-light leading-relaxed">
            Explorá combinaciones ideales inspiradas en la gastronomía criolla y los terruños de Argentina.
            Elegí si partís desde lo que vas a comer o desde la botella que tenés a mano.
          </p>
        </div>

        {/* Segmented Control Minimalista */}
        <div className="shrink-0">
          <PairingModeSelector
            currentMode={mode}
            onModeChange={handleModeChange}
          />
        </div>
      </div>

      {/* 2. Selector de Entradas según modo (Chips Horizontales / Buscador de Cepas) */}
      <section
        id="pairing-panel"
        aria-label="Panel de selección de maridaje"
        className="py-1"
      >
        {mode === 'food' ? (
          <PairingFoodSelector
            selectedFoodId={foodId}
            onSelectFood={selectFood}
          />
        ) : (
          <PairingWineSelector
            selectedWineId={wineId}
            onSelectWine={(id) => selectWine(id)}
          />
        )}
      </section>

      {/* 3. Dossier Sommelier: Cabecera y Métricas de Servicio Técnicas */}
      <PairingDossierHeader
        mode={mode}
        food={activeFood}
        wine={activeWine}
        sourceContext={sourceContext}
        onClearSourceContext={clearSourceContext}
      />

      {/* 4. 1°: Cepas enológicas sugeridas (armonización y perfil ideal primero) */}
      <PairingAffinities
        mode={mode}
        food={activeFood}
        wine={activeWine}
        onSelectWine={(varId, fromTitle) => selectWine(varId, fromTitle)}
        onSelectFood={selectFood}
        section="suggested"
      />

      {/* 5. 2°: Botellas recomendadas en catálogo (etiquetas concretas para explorar o comprar) */}
      <PairingBottleHero
        wines={heroWines}
        onOpenWineModal={setSelectedModalWine}
        pairingTitle={activeTitle || ''}
      />

      {/* 6. 3°: Platos representativos afines / Perfil organoléptico */}
      <PairingAffinities
        mode={mode}
        food={activeFood}
        wine={activeWine}
        onSelectWine={(varId, fromTitle) => selectWine(varId, fromTitle)}
        onSelectFood={selectFood}
        section="secondary"
      />

      {/* 7. Bloque de servicio y acciones de Cava */}
      {activeTip && (
        <PairingCavaAction serviceTip={activeTip} />
      )}

      {/* Modal de Detalle de Vino */}
      <WineDetailModal
        wine={selectedModalWine}
        onClose={() => setSelectedModalWine(null)}
      />
    </div>
  );
}
