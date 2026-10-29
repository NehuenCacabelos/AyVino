export interface PublicUserProfileDto {
  id: number;
  username: string;
  photo?: string | null;
  bio?: string | null;
  registerDate: string;
  cellarWinesCount: number;
  followersCount: number;
  followingCount: number;
}

export interface PublicCellarItemDto {
  wineVintageId: number;
  wineId: number;
  name: string;
  wineType: string;
  wineryId?: number | null;
  wineryNameText?: string | null;
  year?: number | null;
  imageUrl?: string | null;
  averageRating?: number | null;
  reviewCount: number;
}

export interface UserWineListItemDto {
  wineId: number;
  name: string;
  wineType: string;
  wineryId?: number | null;
  wineryNameText?: string | null;
  averageRating?: number | null;
  reviewCount: number;
  isWanted: boolean;
  isTried: boolean;
  isFavorite: boolean;
  lastChangeAt: string;
}

export interface CellarDto {
  id: number;
  name: string;
  vintageCount: number;
  bottleCount: number;
  createdAt: string;
}

export interface CellarItemDto {
  wineVintageId: number;
  wineId: number;
  name: string;
  wineType: string;
  wineryId?: number | null;
  wineryNameText?: string | null;
  year?: number | null;
  imageUrl?: string | null;
  averageRating?: number | null;
  reviewCount: number;
  quantity: number;
  purchaseDate?: string | null;
  notes?: string | null;
  lastChangeAt: string;
}

