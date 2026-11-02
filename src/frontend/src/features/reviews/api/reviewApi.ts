import apiClient from '../../../services/apiClient';
import type {
  ReviewResponseDto,
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
} from '../types';

/**
 * Obtiene las reseñas públicas de una cosecha paginadas (ordenadas por created_at DESC).
 * GET /api/wine-vintages/{vintageId}/reviews
 */
export async function getVintageReviews(
  vintageId: number,
  params?: { pageNumber?: number; pageSize?: number }
): Promise<ReviewResponseDto[]> {
  const response = await apiClient.get<ReviewResponseDto[]>(`/wine-vintages/${vintageId}/reviews`, {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 100,
    },
  });
  return response.data;
}

/**
 * Publica una nueva reseña organoléptica para una cosecha puntual.
 * POST /api/reviews
 */
export async function createReview(data: CreateReviewRequestDto): Promise<ReviewResponseDto> {
  const response = await apiClient.post<ReviewResponseDto>('/reviews', data);
  return response.data;
}

/**
 * Actualiza la calificación o comentario de una reseña propia.
 * PUT /api/reviews/{id}
 */
export async function updateReview(
  id: number,
  data: UpdateReviewRequestDto
): Promise<ReviewResponseDto> {
  const response = await apiClient.put<ReviewResponseDto>(`/reviews/${id}`, data);
  return response.data;
}

/**
 * Elimina una reseña propia.
 * DELETE /api/reviews/{id}
 */
export async function deleteReview(id: number): Promise<void> {
  await apiClient.delete<void>(`/reviews/${id}`);
}

