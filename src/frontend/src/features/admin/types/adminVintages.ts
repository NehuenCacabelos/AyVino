import type {
  ApprovalStatus,
  WineType,
  WineVintageResponseDto,
  UpdateWineVintageRequestDto,
} from '../../winery/types/wine';

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
  communityUsers: number;
}

export interface GetAdminVintagesParams {
  pageNumber: number;
  pageSize: number;
  status?: ApprovalStatus;
  sort?: 'users' | 'date';
}

export interface VintageContributionDto {
  userId: number;
  username: string;
  personalImageId: string | null;
  isUploader: boolean;
}

export interface PromoteVintageImageResponseDto {
  vintageId: number;
  imageId: string;
}

export type { WineVintageResponseDto, UpdateWineVintageRequestDto };
