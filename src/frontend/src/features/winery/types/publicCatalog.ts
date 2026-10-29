export interface WineryPublicLocationDto {
  stateName?: string | null;
  regionName?: string | null;
}

export interface WineryPublicTotalsDto {
  labels: number;
  vintages: number;
}

export interface WineryPublicProfileResponseDto {
  id: number;
  name: string;
  description?: string | null;
  foundationYear?: number | null;
  website?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  registerDate: string;
  latitude?: number | null;
  longitude?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  location?: WineryPublicLocationDto | null;
  followersCount: number;
  isFollowedByMe?: boolean | null;
  totals: WineryPublicTotalsDto;
  averageRating?: number | null;
  reviewCount: number;
  isPreview: boolean;
  isOwner?: boolean;
}

export interface WineryPublicGrapeFilterDto {
  id: number;
  name: string;
}

export interface WineryPublicCatalogFiltersDto {
  wineTypes: string[];
  grapes: WineryPublicGrapeFilterDto[];
  years: number[];
}

export interface WineryPublicCatalogGrapeDto {
  grapeId: number;
  grapeName: string;
  percentage?: number | null;
}

export interface WineryPublicCatalogVintageDto {
  id: number;
  year?: number | null;
  alcoholContent?: number | null;
  servingTemperature?: number | null;
  agingAdvice?: string | null;
  imageUrl?: string | null;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | string;
  averageRating?: number | null;
  reviewCount: number;
  grapes: WineryPublicCatalogGrapeDto[];
}

export interface WineryPublicCatalogWineDto {
  id: number;
  name: string;
  description?: string | null;
  wineType: string;
  sourceType: string;
  averageRating?: number | null;
  reviewCount: number;
  vintages: WineryPublicCatalogVintageDto[];
}

export interface WineryPublicCatalogResponseDto {
  items: WineryPublicCatalogWineDto[];
  wines?: WineryPublicCatalogWineDto[];
  filters: WineryPublicCatalogFiltersDto;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface WineryPublicCatalogQueryParams {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  wineType?: string;
  grapeId?: number;
  year?: number;
  sort?: 'name' | 'rating' | 'year' | string;
}
