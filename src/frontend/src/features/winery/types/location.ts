/**
 * Provincia vitivinícola argentina (C# StateResponseDto).
 */
export interface StateResponseDto {
  id: number;
  name: string;
}

/**
 * Estado de moderación de una ciudad (C# CityStatus).
 */
export type CityStatus = 'Approved' | 'Pending' | 'Rejected';

/**
 * Ciudad o municipio vitivinícola (C# CityResponseDto).
 */
export interface CityResponseDto {
  id: number;
  name: string;
  stateId: number;
  status: CityStatus | string;
}

/**
 * Ubicación / Terruño resuelto con nombres de ciudad y provincia (C# LocationResponseDto).
 */
export interface LocationResponseDto {
  id: number;
  cityId: number;
  cityName: string;
  stateId: number;
  stateName: string;
}

/**
 * Ubicación geográfica oficial resuelta mediante coordenadas con Georef (C# ResolvedLocationResponseDto).
 */
export interface ResolvedLocationResponseDto {
  locationId: number;
  stateId: number;
  stateName: string;
  regionId: number;
  regionName: string;
  municipalityName?: string | null;
}

/**
 * Valor estructurado emitido por el selector de región (mapa o lista manual).
 */
export interface RegionPickerValue {
  mode: 'map' | 'manual';
  latitude?: number | null;
  longitude?: number | null;
  locationId?: number | null;
  regionName: string;
  stateName: string;
  municipalityName?: string | null;
}

/**
 * DTO para crear una ciudad (C# CreateCityRequestDto).
 */
export interface CreateCityRequestDto {
  name: string;
  stateId: number;
}

/**
 * DTO para crear una ubicación desde una ciudad (C# CreateLocationRequestDto).
 */
export interface CreateLocationRequestDto {
  cityId: number;
}

