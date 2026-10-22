import apiClient from '../../../services/apiClient';
import type { StateResponseDto, CityResponseDto, LocationResponseDto, ResolvedLocationResponseDto } from '../types';

/**
 * Obtiene todas las provincias vitivinícolas argentinas registradas.
 */
export async function getStates(): Promise<StateResponseDto[]> {
  const response = await apiClient.get<StateResponseDto[]>('/states');
  return response.data;
}

/**
 * Obtiene una provincia por su ID.
 */
export async function getStateById(id: number): Promise<StateResponseDto> {
  const response = await apiClient.get<StateResponseDto>(`/states/${id}`);
  return response.data;
}

/**
 * Lista ciudades vitivinícolas, con filtro opcional por provincia y estado de moderación.
 */
export async function getCities(params?: {
  pageNumber?: number;
  pageSize?: number;
  stateId?: number;
  status?: string;
}): Promise<CityResponseDto[]> {
  const response = await apiClient.get<CityResponseDto[]>('/cities', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 100,
      stateId: params?.stateId,
      status: params?.status,
    },
  });
  return response.data;
}

/**
 * Obtiene una ciudad por su ID.
 */
export async function getCityById(id: number): Promise<CityResponseDto> {
  const response = await apiClient.get<CityResponseDto>(`/cities/${id}`);
  return response.data;
}

/**
 * Lista ubicaciones / terruños con nombres geográficos resueltos.
 */
export async function getLocations(params?: {
  pageNumber?: number;
  pageSize?: number;
}): Promise<LocationResponseDto[]> {
  const response = await apiClient.get<LocationResponseDto[]>('/locations', {
    params: {
      pageNumber: params?.pageNumber ?? 1,
      pageSize: params?.pageSize ?? 100,
    },
  });
  return response.data;
}

/**
 * Obtiene una ubicación resuelta por ID.
 */
export async function getLocationById(id: number): Promise<LocationResponseDto> {
  const response = await apiClient.get<LocationResponseDto>(`/locations/${id}`);
  return response.data;
}

/**
 * Resuelve coordenadas geográficas contra el servicio oficial de Georef (/api/locations/resolve).
 */
export async function resolveLocation(
  latitude: number,
  longitude: number,
): Promise<ResolvedLocationResponseDto> {
  const response = await apiClient.get<ResolvedLocationResponseDto>('/locations/resolve', {
    params: { lat: latitude, lon: longitude },
  });
  return response.data;
}

