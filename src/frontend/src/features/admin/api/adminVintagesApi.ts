import apiClient from '../../../services/apiClient';
import type { ApprovalStatus, WineVintageResponseDto } from '../../winery/types/wine';
import type {
  AdminWineVintageListItem,
  GetAdminVintagesParams,
  VintageContributionDto,
  PromoteVintageImageResponseDto,
  UpdateWineVintageRequestDto,
} from '../types/adminVintages';
import { updateWineVintage } from '../../winery/api/wineApi';
import { uploadVintageImage, deleteVintageImage } from '../../winery/api/imageApi';

export const getAdminVintages = async (
  params: GetAdminVintagesParams,
): Promise<AdminWineVintageListItem[]> => {
  const queryParams: Record<string, string | number> = {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
  };

  if (params.status) {
    queryParams.status = params.status;
  }

  if (params.sort) {
    queryParams.sort = params.sort;
  }

  const response = await apiClient.get<AdminWineVintageListItem[]>('/wine-vintages', {
    params: queryParams,
  });
  return response.data;
};

export const changeVintageStatus = async (
  wineId: number,
  vintageId: number,
  status: ApprovalStatus,
): Promise<void> => {
  await apiClient.patch(`/wines/${wineId}/vintages/${vintageId}/status`, { status });
};

export const deleteVintage = async (wineId: number, vintageId: number): Promise<void> => {
  await apiClient.delete(`/wines/${wineId}/vintages/${vintageId}`);
};

export const getVintageDetail = async (
  wineId: number,
  vintageId: number,
): Promise<WineVintageResponseDto> => {
  const response = await apiClient.get<WineVintageResponseDto>(
    `/wines/${wineId}/vintages/${vintageId}`,
  );
  return response.data;
};

export const getVintageContributions = async (
  vintageId: number,
): Promise<VintageContributionDto[]> => {
  const response = await apiClient.get<VintageContributionDto[]>(
    `/wine-vintages/${vintageId}/contributions`,
  );
  return response.data;
};

export const promoteVintageImage = async (
  vintageId: number,
  userId: number,
): Promise<PromoteVintageImageResponseDto> => {
  const response = await apiClient.post<PromoteVintageImageResponseDto>(
    `/wine-vintages/${vintageId}/promote-image`,
    { userId },
  );
  return response.data;
};

// Reutilización directa de clientes existentes según regla 7 de la vista
export { updateWineVintage as updateVintage, uploadVintageImage, deleteVintageImage };
export type { UpdateWineVintageRequestDto };
