export interface PublicUserProfileDto {
  id: number;
  username: string;
  avatarImageId?: string | null;
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
  imageId?: string | null;
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
  imageId?: string | null;
  imageUrl?: string | null;
  averageRating?: number | null;
  reviewCount: number;
  quantity: number;
  purchaseDate?: string | null;
  notes?: string | null;
  lastChangeAt: string;
}

/**
 * Entidades para el historial de actividad de usuario (C# HistoryItemDto).
 */
export interface HistoryWineDto {
  id: number;
  name: string;
  wineryName?: string | null;
  wineType: string;
}

export interface HistoryVintageDto {
  id: number;
  year?: number | null;
  imageId?: string | null;
}

export interface HistoryItemDto {
  id: number;
  type: 'Uncorked' | 'Reviewed' | 'AddedToCellar' | 'WineContributed' | string;
  occurredAt: string;
  wine: HistoryWineDto;
  vintage?: HistoryVintageDto | null;
  personalImageId?: string | null;
  rating?: number | null;
  comment?: string | null;
}

/**
 * Entidad de bodega seguida por el usuario (C# FollowWineryResponseDto ampliado en Bloque 12).
 */
export interface FollowingWineryDto {
  wineryId: number;
  name: string;
  followedAt: string;
  logoImageId?: string | null;
  stateName?: string | null;
  regionName?: string | null;
  labelsCount: number;
  followersCount: number;
}
