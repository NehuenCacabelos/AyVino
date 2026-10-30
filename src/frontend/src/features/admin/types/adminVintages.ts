import type { ApprovalStatus, WineType, WineVintageResponseDto } from '../../winery/types/wine';

export interface AdminWineVintageListItem {
  vintageId: number;
  wineId: number;
  wineName: string;
  wineType: WineType | string;
  wineryId: number | null;
  wineryName: string | null;
  year: number | null;
  alcoholContent: number | null;
  imageId?: string | null;
  imageUrl: string | null;
  approvalStatus: ApprovalStatus | string;
  uploadedByUserId: number;
  uploadedByUsername: string | null;
  registerDate: string;
}

export interface GetAdminVintagesParams {
  pageNumber: number;
  pageSize: number;
  status?: ApprovalStatus;
}

export type { WineVintageResponseDto };
