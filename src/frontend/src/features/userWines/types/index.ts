/**
 * DTO con el estado de las marcas del usuario para una etiqueta (C# UserWineMarksResponseDto).
 */
export interface UserWineMarksResponseDto {
  wineId: number;
  isWanted: boolean;
  isTried: boolean;
  isFavorite: boolean;
}

/**
 * DTO de fila para listas personales del usuario (C# UserWineListItemDto).
 */
export interface UserWineListItemDto {
  wineId: number;
  name: string;
  wineType: string;
  wineryId: number | null;
  wineryNameText: string | null;
  averageRating: number | null;
  reviewCount: number;
  isWanted: boolean;
  isTried: boolean;
  isFavorite: boolean;
  lastChangeAt: string;
}

/**
 * Parámetros de consulta para el listado de vinos personales.
 */
export interface UserWineQueryParams {
  pageNumber?: number;
  pageSize?: number;
  wanted?: boolean;
  tried?: boolean;
  favorite?: boolean;
}
