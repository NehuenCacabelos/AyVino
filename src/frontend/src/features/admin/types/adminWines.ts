import type { WineResponseDto } from '../../winery/types/wine';

export type { WineResponseDto };

export interface GetAdminWinesParams {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
  winery?: string;
  wineType?: string;
}

export interface UpdateWineAdminRequest {
  name: string;
  wineType: string;
  wineryId?: number | null;
  wineryNameText?: string | null;
  description?: string | null;
  locationId?: number | null;
}

export interface MergeWinesResultDto {
  targetId: number;
  duplicateId: number;
  movedVintages: number;
  mergedVintages: number;
  movedReviews: number;
  discardedReviews: number;
  movedCellarItems: number;
}
