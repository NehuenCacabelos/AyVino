export interface UncorkListItemDto {
  id: number;
  wineId: number;
  wineVintageId: number;
  wineName: string;
  wineryName: string | null;
  year: number | null;
  imageId: string | null;
  cellarName: string | null;
  uncorkedAt: string;
  rating: number | null;
  comment: string | null;
}

export interface CreateUncorkRequestDto {
  wineVintageId: number;
  rating?: number | null;
  comment?: string | null;
  uncorkedAt?: string | null;
}

export interface UncorkResponseDto {
  id: number;
  userId: number;
  wineId: number;
  wineVintageId: number;
  cellarId: number | null;
  rating: number | null;
  comment: string | null;
  uncorkedAt: string;
  createdAt: string;
}
