/**
 * Categorías principales de vino (C# WineType).
 */
export type WineType = 'Red' | 'White' | 'Rose' | 'Sparkling' | 'Orange';

/**
 * Origen de la ficha del vino (C# SourceType).
 */
export type SourceType = 'Community' | 'Official';

/**
 * Estado de moderación de una añada de vino (C# ApprovalStatus).
 */
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';

/**
 * Contrato de respuesta de una etiqueta de vino (C# WineResponseDto).
 */
export interface WineResponseDto {
  id: number;
  wineryId: number | null;
  wineryNameText: string | null;
  name: string;
  description: string | null;
  wineType: WineType | string;
  locationId: number | null;
  sourceType: SourceType | string;
  duplicateOfWineId: number | null;
  averageRating: number | null;
  reviewCount: number;
}

/**
 * Contrato de porcentaje varietal por añada (C# WineGrapeResponseDto).
 */
export interface WineGrapeResponseDto {
  grapeId: number;
  percentage: number | null;
}

/**
 * Contrato de respuesta de una cosecha/añada puntual (C# WineVintageResponseDto).
 */
export interface WineVintageResponseDto {
  id: number;
  wineId: number;
  year: number | null;
  alcoholContent: number | null;
  servingTemperature: number | null;
  agingAdvice: string | null;
  imageUrl: string | null;
  approvalStatus: ApprovalStatus | string;
  uploadedByUserId: number;
  registerDate: string;
  averageRating: number | null;
  reviewCount: number;
  grapes: WineGrapeResponseDto[];
}

/**
 * DTO de entrada para asignación de cepa y porcentaje en corte (C# WineGrapeRequestDto).
 */
export interface WineGrapeRequestDto {
  grapeId: number;
  percentage?: number | null;
}

/**
 * DTO de entrada para dar de alta una nueva añada (C# CreateWineVintageRequestDto).
 */
export interface CreateWineVintageRequestDto {
  year?: number | null;
  alcoholContent?: number | null;
  servingTemperature?: number | null;
  agingAdvice?: string | null;
  imageUrl?: string | null;
  grapes?: WineGrapeRequestDto[] | null;
}

/**
 * DTO de entrada para crear una etiqueta de vino con su primera añada (C# CreateWineRequestDto).
 */
export interface CreateWineRequestDto {
  name: string;
  wineType: string;
  firstVintage: CreateWineVintageRequestDto;
  wineryId?: number | null;
  wineryNameText?: string | null;
  description?: string | null;
  locationId?: number | null;
}

/**
 * DTO de entrada para actualizar una etiqueta de vino (C# UpdateWineRequestDto).
 */
export interface UpdateWineRequestDto {
  name: string;
  wineType: string;
  wineryId?: number | null;
  wineryNameText?: string | null;
  description?: string | null;
  locationId?: number | null;
}

/**
 * DTO de entrada para actualizar una añada de vino (C# UpdateWineVintageRequestDto).
 */
export interface UpdateWineVintageRequestDto {
  year?: number | null;
  alcoholContent?: number | null;
  servingTemperature?: number | null;
  agingAdvice?: string | null;
  imageUrl?: string | null;
  grapes?: WineGrapeRequestDto[] | null;
}

/**
 * DTO para reclamar vinos comunitarios (C# ClaimWinesRequestDto).
 */
export interface ClaimWinesRequestDto {
  wineIds: number[];
}
