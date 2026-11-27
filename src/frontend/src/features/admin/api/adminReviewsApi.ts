import apiClient from '../../../services/apiClient';
import type { AdminReviewListItemDto, GetAdminReviewsParams } from '../types/adminReviews';
import type { PagedResponse } from '../types/pagedResult';
import { parseTotalCountHeader } from '../utils/totalCount';

/**
 * Consulta la bandeja global de moderación de reseñas.
 * GET /api/reviews
 */
export async function getAdminReviews(
  params?: GetAdminReviewsParams
): Promise<PagedResponse<AdminReviewListItemDto>> {
  const response = await apiClient.get<AdminReviewListItemDto[]>('/reviews', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      wineId: params?.wineId || undefined,
      wineVintageId: params?.wineVintageId || undefined,
      userId: params?.userId || undefined,
      rating: params?.rating || undefined,
    },
  });
  return {
    items: response.data,
    totalCount: parseTotalCountHeader(response.headers),
  };
}

/**
 * Elimina una reseña (como autor o como administrador).
 * DELETE /api/reviews/{id}
 */
export async function deleteReviewByAdmin(id: number): Promise<void> {
  await apiClient.delete(`/reviews/${id}`);
}
