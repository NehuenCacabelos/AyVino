import apiClient from '../../../services/apiClient';
import type { ApprovalStatus, WineVintageResponseDto } from '../../winery/types/wine';
import type { AdminWineVintageListItem, GetAdminVintagesParams } from '../types/adminVintages';
import type { PagedResponse } from '../types/pagedResult';
import { parseTotalCountHeader } from '../utils/totalCount';

export const getAdminVintages = async (
  params: GetAdminVintagesParams & { search?: string }
): Promise<PagedResponse<AdminWineVintageListItem>> => {
  const queryParams: Record<string, string | number> = {
    pageNumber: params.pageNumber,
    pageSize: params.pageSize,
  };

  if (params.status) {
    queryParams.status = params.status;
  }

  if (params.search?.trim()) {
    queryParams.search = params.search.trim();
  }

  const response = await apiClient.get<AdminWineVintageListItem[]>('/wine-vintages', {
    params: queryParams,
  });
  return {
    items: response.data,
    totalCount: parseTotalCountHeader(response.headers),
  };
};

export const changeVintageStatus = async (
  wineId: number,
  vintageId: number,
  status: ApprovalStatus
): Promise<void> => {
  await apiClient.patch(`/wines/${wineId}/vintages/${vintageId}/status`, { status });
};

export const deleteVintage = async (wineId: number, vintageId: number): Promise<void> => {
  await apiClient.delete(`/wines/${wineId}/vintages/${vintageId}`);
};

export const getVintageDetail = async (wineId: number, vintageId: number): Promise<WineVintageResponseDto> => {
  const response = await apiClient.get<WineVintageResponseDto>(`/wines/${wineId}/vintages/${vintageId}`);
  return response.data;
};
