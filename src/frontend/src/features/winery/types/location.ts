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
