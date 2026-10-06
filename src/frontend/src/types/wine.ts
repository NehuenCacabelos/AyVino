export type BottleKind =
  | 'red-cream'
  | 'red-black'
  | 'red-burgundy'
  | 'white'
  | 'white-flute'
  | 'sparkling';

export type WineTypeEnum =
  | 'Red'
  | 'White'
  | 'Rose'
  | 'Sparkling'
  | 'Fortified'
  | 'Dessert';

export type SourceTypeEnum = 'Official' | 'Community';

export type ApprovalStatusEnum = 'Pending' | 'Approved' | 'Rejected';

/**
 * DTOs exactos que expone la API REST de .NET en camelCase.
 * Todos con identificador entero estricto (id: number).
 */
export interface WineGrapeApiDto {
  grapeId: number;
  percentage: number | null;
}

export interface WineApiDto {
  id: number;
  wineryId: number | null;
  wineryNameText: string | null;
  name: string;
  description: string | null;
  wineType: WineTypeEnum | string;
  locationId: number | null;
  sourceType: SourceTypeEnum | string;
  duplicateOfWineId: number | null;
  averageRating: number | null;
  reviewCount: number;
}

export interface WineVintageApiDto {
  id: number;
  wineId: number;
  year: number | null;
  alcoholContent: number | null;
  servingTemperature: number | null;
  agingAdvice: string | null;
  imageUrl: string | null;
  approvalStatus: ApprovalStatusEnum | string;
  uploadedByUserId: number;
  registerDate: string;
  averageRating: number | null;
  reviewCount: number;
  grapes: WineGrapeApiDto[];
}

export interface WinePairingApiDto {
  id: number;
  name: string;
  category: string;
}

/**
 * Modelo de vino curado (ViewModel) para la Landing, catálogo público y modales de cata.
 * Alineado estrictamente con el contrato de la API:
 * - id: number estricto (entero de backend).
 * - rating: number | null (null cuando reviewCount == 0).
 * - alcoholContent y servingTemperature provistos por la cosecha.
 */
export interface CuratedWine {
  id: number;
  name: string;
  winery: string;
  grape: string;
  vintage: string;
  region: string;
  rating: number | null;
  reviewCount: number;
  imageUrl?: string;
  sourceType?: 'Official' | 'Community' | 'winery' | 'community';
  isOfficial?: boolean;

  // Datos de cosecha provistos por el backend
  aging?: string;
  alcoholContent?: number | null;
  servingTemperature?: number | null;

  // Datos extendidos opcionales (mock de muestra / notas de cata / maridaje)
  tastingNotes?: string;
  longDescription?: string;
  descriptors?: string[];
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
  imageUrl?: string;
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
