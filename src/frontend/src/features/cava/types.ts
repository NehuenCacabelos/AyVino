import type { BottleKind } from '../../types/wine';

export type VaultTab = 'all' | 'jewels' | 'optimal' | 'guard' | 'logbook';

export type WineSortOption = 'default' | 'vintage-desc' | 'vintage-asc';

export type BottleAgingState = 'optimal' | 'aging' | 'peak';

export interface CellarVitals {
  totalBottles: number;
  redsCount: number;
  whitesCount: number;
  sparklingCount: number;
  optimalCount?: number | null;
  dominantVarietal?: string | null;
  dominantVarietalPercentage?: number | null;
  oldestVintage?: number | null;
  oldestVintageAgingYears?: number | null;
}

export interface CellarWine {
  id: string;
  cellarId?: number;
  wineId?: number;
  wineVintageId?: number;
  name: string;
  winery: string;
  region?: string;
  varietal?: string;
  vintage: number | null;
  rating?: number | null; // Promedio de 1 a 5, o null si no hay
  criticBadge?: string;
  units: number;
  location?: string;
  temperatureConst?: string;
  terroirNote?: string;
  agingStatus?: BottleAgingState;
  agingStatusLabel?: string;
  isJewel: boolean;
  bottle: BottleKind;
  imageUrl?: string;
  purchaseDate?: string | null;
  notes?: string | null;
  lastChangeAt?: string;
  // Ficha técnica extendida (opcional)
  altitude?: string;
  soilType?: string;
  oakAging?: string;
  alcoholContent?: string;
  tastingNotes?: {
    sight: string;
    nose: string;
    mouth: string;
    pairing: string;
  };
}

export interface CellarTelemetry {
  averageTemperature: number; // e.g. 14.5
  idealTempRange: string; // "14°C - 16°C"
  relativeHumidity: number; // e.g. 72
  corkProtectionLabel: string; // "Corcho protegido: > 70%"
  vibrationIsolation: string; // "ÓPTIMO · 0.02 Hz"
  uvExposure: string; // "NULA · PENUMBRA TOTAL"
  lastSync: string; // "Hoy · 18:42 hs"
}

export interface SommelierRecommendation {
  badge: string; // "Recomendación del Sommelier · Fin de Semana"
  wineTitle: string; // "Cobos Chañares 2017"
  sommelierRationale: string; // "El análisis de la curva de evolución indica que los taninos del lote B2..."
  decantingAdvice: string; // "Abrir con 45 minutos de decantación previa."
  pairingTitle: string; // "Asado a la leña de quebracho & mollejas crocantes al limón"
  pairingRationale: string; // "La acidez vibrante y el cuerpo glicérico limpian la untuosidad y..."
  intelTag: string; // "SOMMELIER INTEL: AAS / MASTER ARCHIVE"
}

export interface TastingLogEntry {
  id: string | number;
  wineId?: number;
  wineName: string;
  wineryName?: string | null;
  vintageYear?: number | null;
  uncorkDate: string;
  notes?: string | null;
  ratingValue?: number | null;
  personalImageId?: string | null;
  vintageImageId?: string | null;
}

export interface QuickAddBottlePayload {
  name: string;
  winery: string;
  region: string;
  varietal: string;
  vintage: number;
  units: number;
  location: string;
  isJewel: boolean;
  bottle: BottleKind;
}
