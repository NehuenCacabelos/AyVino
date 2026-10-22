import apiClient from '../../../services/apiClient';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  CreateWineRequestDto,
  UpdateWineRequestDto,
  CreateWineVintageRequestDto,
  UpdateWineVintageRequestDto,
  ClaimWinesRequestDto,
} from '../types';

export interface WineQueryParams {
  pageNumber?: number;
  pageSize?: number;
  wineryId?: number;
  grapeId?: number;
  yearFrom?: number;
  yearTo?: number;
}

export interface WineSearchParams {
  name?: string;
  winery?: string;
  year?: number;
  wineType?: string;
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Lista paginada de etiquetas de vino con filtros opcionales por bodega, cepa o rango de años.
 */
export async function getWines(params?: WineQueryParams): Promise<WineResponseDto[]> {
  const response = await apiClient.get<WineResponseDto[]>('/wines', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 10,
      wineryId: params?.wineryId,
      grapeId: params?.grapeId,
      yearFrom: params?.yearFrom,
      yearTo: params?.yearTo,
    },
  });
  return response.data;
}

/**
 * Obtiene el detalle de una etiqueta de vino con su calificación agregada.
 */
export async function getWineById(id: number): Promise<WineResponseDto> {
  const response = await apiClient.get<WineResponseDto>(`/wines/${id}`);
  return response.data;
}

/**
 * Registra una nueva etiqueta de vino junto con su primera añada.
 * Si incluye WineryId queda asociada a la bodega oficial (SourceType.Official).
 */
export async function createWine(data: CreateWineRequestDto): Promise<WineResponseDto> {
  const response = await apiClient.post<WineResponseDto>('/wines', data);
  return response.data;
}

/**
 * Actualiza los metadatos de la etiqueta (nombre, tipo, bodega, ubicación, descripción).
 */
export async function updateWine(id: number, data: UpdateWineRequestDto): Promise<WineResponseDto> {
  const response = await apiClient.put<WineResponseDto>(`/wines/${id}`, data);
  return response.data;
}

/**
 * Elimina una etiqueta de vino y sus cosechas asociadas en cascada (Admin).
 */
export async function deleteWine(id: number): Promise<void> {
  await apiClient.delete<void>(`/wines/${id}`);
}

/**
 * Lista vinos comunitarios sin bodega asignada cuyo nombre textual coincide con la bodega indicada.
 * Requiere que la bodega esté aprobada.
 */
export async function getClaimCandidates(wineryId: number): Promise<WineResponseDto[]> {
  const response = await apiClient.get<WineResponseDto[]>(`/wines/claim-candidates/${wineryId}`);
  return response.data;
}

/**
 * Reclama y certifica los vinos comunitarios especificados para la bodega oficial.
 */
export async function claimWines(
  wineryId: number,
  data: ClaimWinesRequestDto,
): Promise<WineResponseDto[]> {
  const response = await apiClient.post<WineResponseDto[]>(`/wines/claim/${wineryId}`, data);
  return response.data;
}

/**
 * Búsqueda difusa de vinos por nombre, bodega, año o tipo.
 */
export async function searchWines(params: WineSearchParams): Promise<WineResponseDto[]> {
  const response = await apiClient.get<WineResponseDto[]>('/wines/search', {
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 10,
      name: params.name,
      winery: params.winery,
      year: params.year,
      wineType: params.wineType,
    },
  });
  return response.data;
}

/**
 * Lista todas las añadas de una etiqueta de vino con su corte de uvas y calificación.
 */
export async function getWineVintages(wineId: number): Promise<WineVintageResponseDto[]> {
  const response = await apiClient.get<WineVintageResponseDto[]>(`/wines/${wineId}/vintages`);
  return response.data;
}

/**
 * Obtiene una cosecha puntual con su desglose de varietales y estado de moderación.
 */
export async function getWineVintageById(
  wineId: number,
  vintageId: number,
): Promise<WineVintageResponseDto> {
  const response = await apiClient.get<WineVintageResponseDto>(
    `/wines/${wineId}/vintages/${vintageId}`,
  );
  return response.data;
}

/**
 * Agrega una nueva cosecha a una etiqueta existente (inicia en Pending).
 */
export async function createWineVintage(
  wineId: number,
  data: CreateWineVintageRequestDto,
): Promise<WineVintageResponseDto> {
  const response = await apiClient.post<WineVintageResponseDto>(`/wines/${wineId}/vintages`, data);
  return response.data;
}

/**
 * Actualiza los datos de una cosecha y reemplaza su corte de uvas.
 */
export async function updateWineVintage(
  wineId: number,
  vintageId: number,
  data: UpdateWineVintageRequestDto,
): Promise<WineVintageResponseDto> {
  const response = await apiClient.put<WineVintageResponseDto>(
    `/wines/${wineId}/vintages/${vintageId}`,
    data,
  );
  return response.data;
}

