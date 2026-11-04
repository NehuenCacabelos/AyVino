import type { WineListItemDto } from '../winery/types/wine';

export interface CatalogFilterOption {
  id: number;
  name: string;
  count?: number | null;
}

export interface CatalogFiltersResponse {
  varietals: CatalogFilterOption[];
  regions: CatalogFilterOption[];
  wineries: CatalogFilterOption[];
}

export interface CatalogShowcaseWinery {
  wineryId: number | null;
  wineryName: string;
  location: string | null;
  logoImageId: string | null;
  isVerified: boolean;
  wines: WineListItemDto[];
}

export interface CatalogShowcaseResponse {
  items: CatalogShowcaseWinery[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface CatalogShowcaseParams {
  q?: string;
  wineType?: string;
  grapeId?: number;
  locationId?: number;
  pageNumber?: number;
  pageSize?: number;
  winesPerWinery?: number;
}
