/**
 * DTO de respuesta de una reseña organoléptica (C# ReviewResponseDto).
 */
export interface ReviewResponseDto {
  id: number;
  userId: number;
  userName: string;
  wineVintageId: number;
  vintageYear: number | null;
  rating: number; // 1 a 5 entero
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * DTO para crear una reseña (C# CreateReviewRequestDto).
 */
export interface CreateReviewRequestDto {
  wineVintageId: number;
  rating: number; // 1 a 5 entero
  comment?: string | null;
}

/**
 * DTO para actualizar una reseña existente (C# UpdateReviewRequestDto).
 */
export interface UpdateReviewRequestDto {
  rating: number; // 1 a 5 entero
  comment?: string | null;
}

