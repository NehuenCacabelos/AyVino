/**
 * Feature Module: Wines
 * Exporta componentes, datos de muestra curada y utilidades de dominio vinícola.
 */
export { default as WineCard } from './components/WineCard';
export { default as WineTypeFilterChips } from './components/WineTypeFilterChips';
export { default as WineDetailModal } from './components/WineDetailModal';
export { default as WineBottleSilhouette } from './components/WineBottleSilhouette';
export { default as WineBottleMock } from './components/WineBottleMock';
export { default as WineCreationFlow } from './components/WineCreationFlow';
export type { WineCreationFlowProps, FlowStep } from './components/WineCreationFlow';
export {
  mapApiWineToCuratedWine,
  mapWineListItemToCuratedWine,
  translateWineType,
  WINE_TYPE_LABELS,
} from './utils/wineMapper';
export { CURATED_WINES } from './data/curatedWines';
export {
  getEditorialWine,
  normalizeWineSlug,
  generateEditorialFallback,
  type EditorialWine,
  type WineVintageDetail,
  type WineGrapeRatio,
  type WineReviewItem,
  type WinePairingItem,
  type WineWineryInfo,
} from './data/editorialWines';
export * from './api/userVintageImageApi';
