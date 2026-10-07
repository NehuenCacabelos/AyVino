/**
 * Feature Module: Wines
 * Exporta componentes, datos de muestra curada y utilidades de dominio vinícola.
 */
export { default as WineCard } from './components/WineCard';
export { default as WineDetailModal } from './components/WineDetailModal';
export { default as WineBottleSilhouette } from './components/WineBottleSilhouette';
export { default as WineBottleMock } from './components/WineBottleMock';
export { mapApiWineToCuratedWine } from './utils/wineMapper';
export { CURATED_WINES } from './data/curatedWines';

