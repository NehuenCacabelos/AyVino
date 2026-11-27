import apiClient from '../../../services/apiClient';

export type SensoryAxisKey = 'body' | 'tannins' | 'acidity' | 'fruit' | 'oak' | 'persistence';
export type SensorySource = 'Winery' | 'Calculated' | 'None';

export interface SensoryAxisDto {
  key: SensoryAxisKey | string;
  value: number | null;
  source: SensorySource | string;
  calculatedValue: number | null;
}

export interface VintageSensoryDto {
  axes: SensoryAxisDto[];
}

export interface UpdateVintageSensoryRequestDto {
  body?: number | null;
  tannins?: number | null;
  acidity?: number | null;
  fruit?: number | null;
  oak?: number | null;
  persistence?: number | null;
}

export interface SensoryPreviewGrapeItem {
  grapeId: number;
  percentage?: number | null;
}

export interface SensoryPreviewRequestDto {
  grapes: SensoryPreviewGrapeItem[];
}

export async function getVintageSensory(wineId: number, vintageId: number): Promise<VintageSensoryDto> {
  const response = await apiClient.get<VintageSensoryDto>(`/wines/${wineId}/vintages/${vintageId}/sensory`);
  return response.data;
}

export async function updateVintageSensory(
  wineId: number,
  vintageId: number,
  values: UpdateVintageSensoryRequestDto
): Promise<VintageSensoryDto> {
  const response = await apiClient.put<VintageSensoryDto>(`/wines/${wineId}/vintages/${vintageId}/sensory`, values);
  return response.data;
}

export async function previewSensory(
  grapes: SensoryPreviewGrapeItem[],
  signal?: AbortSignal
): Promise<VintageSensoryDto> {
  const response = await apiClient.post<VintageSensoryDto>(
    '/sensory/preview',
    { grapes },
    { signal }
  );
  return response.data;
}
