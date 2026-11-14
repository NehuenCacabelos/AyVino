export interface TastingResponseDto {
  id: number;
  userId: number;
  wineVintageId: number;
  cellarId?: number | null;
  rating: number;
  comment?: string | null;
  tastedAt: string;
  createdAt: string;
}

export interface CreateTastingRequestDto {
  wineVintageId: number;
  cellarId?: number | null;
  rating?: number | null;
  comment?: string | null;
  tastedAt?: string | null;
}

export interface TastingListItemDto {
  id: number;
  wineVintageId: number;
  wineId: number;
  wineName: string;
  wineryName: string;
  vintageYear?: number | null;
  imageId?: string | null;
  imageUrl?: string | null;
  cellarId?: number | null;
  rating: number;
  comment?: string | null;
  tastedAt: string;
  createdAt: string;
}
