import type {
  FoodPairingEntity,
  WineVarietyEntity,
  FoodCategoryId,
  WineVarietyId,
} from '../../../data/pairingsData';
import { getCuratedWinesForPairing } from '../../../data/pairingsData';
import type { CuratedWine } from '../../../types/wine';

import PairingDossierHeader from './PairingDossierHeader';
import PairingBottleHero from './PairingBottleHero';
import PairingAffinities from './PairingAffinities';
import PairingCavaAction from './PairingCavaAction';

interface PairingDetailViewProps {
  mode: 'food' | 'wine';
  food: FoodPairingEntity;
  wine: WineVarietyEntity;
  onSelectFood: (id: FoodCategoryId) => void;
  onSelectWine: (id: WineVarietyId) => void;
  onOpenWineModal: (wine: CuratedWine) => void;
  sourceContext?: string | null;
  onClearSourceContext?: () => void;
}

/**
 * PairingDetailView Component
 * Vista de detalle desacoplada y libre de anidamiento de tarjetas (anti-card-nesting).
 * Flujo vertical optimizado:
 * 1°: Cabecera técnica y métricas
 * 2°: Cepas enológicas sugeridas
 * 3°: Botellas recomendadas en catálogo
 * 4°: Platos representativos afines y consejo del sommelier
 */
export default function PairingDetailView({
  mode,
  food,
  wine,
  onSelectFood,
  onSelectWine,
  onOpenWineModal,
  sourceContext,
  onClearSourceContext,
}: PairingDetailViewProps) {
  const isFood = mode === 'food';
  const activeWineIds = isFood ? food.curatedWineIds : wine.curatedWineIds;
  const heroWines = getCuratedWinesForPairing(activeWineIds);
  const activeTitle = isFood ? food.title : wine.title;
  const activeTip = isFood ? food.serviceTip : wine.serviceTip;

  return (
    <div className="flex flex-col gap-8 w-full animate-fadeIn">
      {/* 1. Dossier Sommelier: Cabecera y Métricas de Servicio Técnicas */}
      <PairingDossierHeader
        mode={mode}
        food={food}
        wine={wine}
        sourceContext={sourceContext}
        onClearSourceContext={onClearSourceContext}
      />

      {/* 2. 1°: Cepas enológicas sugeridas (perfil y variedad ideal primero) */}
      <PairingAffinities
        mode={mode}
        food={food}
        wine={wine}
        onSelectWine={onSelectWine}
        onSelectFood={onSelectFood}
        section="suggested"
      />

      {/* 3. 2°: Botellas recomendadas en catálogo */}
      <PairingBottleHero
        wines={heroWines}
        onOpenWineModal={onOpenWineModal}
        pairingTitle={activeTitle}
      />

      {/* 4. 3°: Platos representativos afines */}
      <PairingAffinities
        mode={mode}
        food={food}
        wine={wine}
        onSelectWine={onSelectWine}
        onSelectFood={onSelectFood}
        section="secondary"
      />

      {/* 5. Consejo del Sommelier y Guardado */}
      {activeTip && <PairingCavaAction serviceTip={activeTip} />}
    </div>
  );
}
