import type { BottleKind } from '../../types/wine';

export type VaultTab = 'all' | 'jewels' | 'optimal' | 'guard' | 'logbook';

export type WineSortOption = 'default' | 'vintage-desc' | 'vintage-asc';

export type BottleAgingState = 'optimal' | 'aging' | 'peak';

export interface VarietalSegment {
  name: string;
  percentage: number;
  bottleCount: number;
  wineType: string;
  color: string;
  opacity?: number;
}

export interface CellarVitals {
  totalBottles: number;
  redsCount: number;
  whitesCount: number;
  sparklingCount: number;
  othersCount?: number;
  optimalCount: number;
  dominantVarietal: string;
  dominantVarietalPercentage: number;
  undeclaredGrapeBottles: number;
  varietalSegments: VarietalSegment[];
  oldestVintage: number | null;
  oldestVintageAgingYears: number;
}

export interface CellarWine {
  id: string;
  wineId?: number;
  wineVintageId?: number;
  name: string;
  winery: string;
  region: string;
  varietal: string;
  grapeName?: string | null;
  wineType?: string | null;
  vintage: number;
  rating: number; // Critic score or user rating, e.g. 99, 100
  userRating?: number | null;
  averageRating?: number | null;
  criticBadge?: string; // e.g. "RP 99", "WA 100", "JS 98"
  units: number;
  location: string; // e.g. "A1 · ESTANTE SUP."
  temperatureConst?: string; // e.g. "16°C CONSTANTE"
  terroirNote?: string; // e.g. "Malbec Parcela Única · Calcáreo extremo a 1.450m"
  agingStatus: BottleAgingState;
  agingStatusLabel: string; // e.g. "En Guarda hasta 2028", "Ventana Óptima (2024–32)", "En Pleno Apogeo"
  isJewel: boolean;
  sourceType?: 'Community' | 'Official' | string;
  bottle: BottleKind;
  imageUrl?: string;
  imageId?: string | null;
  // Ficha técnica extendida
  altitude?: string; // e.g. "1.450 msnm"
  soilType?: string; // e.g. "Calcáreo de grava aluvional"
  oakAging?: string; // e.g. "18 meses en barricas de roble francés"
  alcoholContent?: string; // e.g. "14.5% ABV"
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
  id: string;
  wineName: string;
  criticScore: string; // "TU RESEÑA 4,5 ★"
  uncorkDate: string; // "DESCORCHADO EL 14 DE MARZO, 2025"
  notes: string;
  sight: string;
  agingRemaining: string;
  ratingValue: number;
}

export interface QuickAddBottlePayload {
  name: string;
  winery: string;
  region: string;
  varietal: string;
  vintage: number;
  units: number;
  location: string;
  isJewel?: boolean;
  bottle: BottleKind;
  matchedWineId?: number | null;
  wineType?: string;
  mainGrapeId?: number | null;
  imageFile?: File | null;
}

