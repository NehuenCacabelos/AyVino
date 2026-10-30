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
 * Diseño minimalista y progresivo:
 * - En Platos: A primera vista solo se selecciona por Categoría (6 familias gastronómicas)
 *   y se despliega la recomendación general enológica, con opción sutil de afinar por plato específico.
 * - En Cepas: A primera vista se presentan las cepas más comunes / insignia, con filtros tipográficos
 *   (Principales, Todas, Tintos, Blancos, Rosados/Naranjos).
 * - Sincronización continua en URL SearchParams sin tarjetas infladas.
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
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      {/* 1. Cabecera Editorial Principal & Switcher de Modo */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-neutral-800/80">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400 font-medium">
            Cuaderno Enogastronómico AyVino
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
            El Arte del Maridaje
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 font-sans leading-relaxed pt-1">
            Armonización técnica basada en principios bioquímicos, pesos sápidos y terruños argentinos.
            Seleccioná una cepa o una categoría gastronómica para explorar afinidades, contrastes y alertas.
          </p>
        </div>

        {/* Conmutador de Modo Tipográfico */}
        <div className="shrink-0 sm:pb-1">
          <PairingModeSelector
            currentMode={mode}
            onModeChange={handleModeChange}
          />
        </div>
      </div>

      {/* 2. Índice Tipográfico de Selección Progresivo */}
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

      {/* 3. Ficha Técnica y Dossier del Sommelier */}
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
