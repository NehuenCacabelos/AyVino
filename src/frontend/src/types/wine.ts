export type BottleKind =
  | 'red-cream'
  | 'red-black'
  | 'red-burgundy'
  | 'white'
  | 'white-flute'
  | 'sparkling';

export interface CuratedWine {
  id: string;
  name: string;
  winery: string;
  grape: string;
  vintage: string;
  region: string;
  tastingNotes: string;
  longDescription: string;
  descriptors: string[];
  price: number;
  rating: number;
  reviewCount: number;
  isOfficial: boolean;
  aging?: string;
  pairing?: string;
  altitude?: string;
  colorAccent?: string;
}

/**
 * Modelo de vino para el inventario de la cava y catálogo del dashboard autenticado.
 */
export interface DashboardWine {
  id?: string;
  name: string;
  winery: string;
  region: string;
  varietal: string;
  vintage: number;
  rating: number;
  bottle: BottleKind;
  units?: number;
  location?: string;
  isFavorite?: boolean;
}

/**
 * Agrupación de vinos por bodega para la vista de catálogo en el dashboard.
 */
export interface WineryGroup {
  name: string;
  region: string;
  initials: string;
  total: number;
  wines: DashboardWine[];
}

/**
 * Métricas consolidadas de la cava personal.
 */
export interface CellarMetrics {
  bottlesInCellar: number;
  tastedInHistory: number;
  wishlistCount: number;
  locationsCount: number;
}

/**
 * Registro de cata / descorche de una botella.
 */
export interface UncorkSubmission {
  wine: DashboardWine;
  rating: number;
  date: string;
  occasion: string;
  tastingNotes: string;
}
