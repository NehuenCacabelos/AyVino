export interface AdminReviewListItemDto {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: number | null;
  username: string | null;
  wineVintageId: number;
  wineId: number;
  wineName: string;
  year: number | null;
}

export interface GetAdminReviewsParams {
  pageNumber?: number;
  pageSize?: number;
  wineId?: number;
  wineVintageId?: number;
  userId?: number;
  rating?: number;
}
