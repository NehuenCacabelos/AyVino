import apiClient from '../../../services/apiClient';
import type { ReviewResponseDto, CreateReviewRequestDto, UpdateReviewRequestDto } from '../types/review';

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
 * Obtiene la reseña propia del usuario autenticado para una cosecha puntual.
 * Retorna null si el backend responde 404 (aún sin reseña).
 * Endpoint autenticado: GET /api/wine-vintages/{vintageId}/reviews/me
 */
export async function getMyVintageReview(vintageId: number): Promise<ReviewResponseDto | null> {
  try {
    const response = await apiClient.get<ReviewResponseDto>(`/wine-vintages/${vintageId}/reviews/me`);
    return response.data;
  } catch (err: unknown) {
    const maybeAxios = err as { response?: { status?: number } };
    if (maybeAxios?.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

/**
 * Publica una reseña para una cosecha de vino puntual.
 * Endpoint autenticado: POST /api/reviews
 */
export async function createReview(data: CreateReviewRequestDto): Promise<ReviewResponseDto> {
  const response = await apiClient.post<ReviewResponseDto>('/reviews', data);
  return response.data;
}

/**
 * Actualiza la calificación y/o comentario de una reseña propia.
 * Endpoint autenticado: PUT /api/reviews/{id}
 */
export async function updateReview(id: number, data: UpdateReviewRequestDto): Promise<ReviewResponseDto> {
  const response = await apiClient.put<ReviewResponseDto>(`/reviews/${id}`, data);
  return response.data;
}
