/**
 * Feature Module: Wines
 * Exporta componentes, datos de muestra curada y utilidades de dominio vinícola.
 */
export { default as WineCard } from './components/WineCard';
export { default as WineDetailModal } from './components/WineDetailModal';
export { default as WineBottleSilhouette } from './components/WineBottleSilhouette';
export { default as WineBottleMock } from './components/WineBottleMock';
export { default as WineDetailView } from './components/WineDetailView';
export { mapApiWineToCuratedWine } from './utils/wineMapper';
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
export { apiWineToEditorial, mapPairingCategoryToIcon } from './adapters/apiWineToEditorial';
export { useRealWine, type UseRealWineReturn } from './hooks/useRealWine';
export { getWineReviews, createReview } from './api/reviewsApi';
export type { ReviewResponseDto, CreateReviewRequestDto } from './types/review';



