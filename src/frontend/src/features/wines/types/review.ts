export interface ReviewResponseDto {
  id: number;
  userId: number;
  userName: string;
  wineVintageId: number;
  vintageYear: number | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateReviewRequestDto {
  wineVintageId: number;
  rating: number;
  comment?: string;
}
