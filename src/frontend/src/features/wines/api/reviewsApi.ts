import apiClient from '../../../services/apiClient';
import type { ReviewResponseDto, CreateReviewRequestDto } from '../types/review';

/**
 * Obtiene el feed paginado de reseñas de una etiqueta de vino (todas sus cosechas).
 * Endpoint público: GET /api/wines/{wineId}/reviews
 */
export async function getWineReviews(
  wineId: number,
  pageNumber = 1,
  pageSize = 100
): Promise<ReviewResponseDto[]> {
  const response = await apiClient.get<ReviewResponseDto[]>(`/wines/${wineId}/reviews`, {
    params: { pageNumber, pageSize },
  });
  return response.data;
}

/**
 * Publica una reseña para una cosecha de vino puntual.
 * Endpoint autenticado: POST /api/reviews
 */
export async function createReview(data: CreateReviewRequestDto): Promise<ReviewResponseDto> {
  const response = await apiClient.post<ReviewResponseDto>('/reviews', data);
  return response.data;
}
