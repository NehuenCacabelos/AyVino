/**
 * Estados de moderación de una bodega oficial (WineryStatus en C#).
 */
export type WineryStatus = 'Pending' | 'Approved' | 'Rejected';

/**
 * Resumen geográfico oficial anidado en el perfil de bodega.
 */
export interface WineryLocationSummaryDto {
  stateName: string;
  regionName: string;
}

/**
 * Contrato de respuesta de una bodega (C# WineryResponseDto).
 */
export interface WineryResponseDto {
  id: number;
  name: string;
  description: string | null;
  locationId: number;
  foundationYear: number | null;
  website: string | null;
  userId: number | null;
  status: WineryStatus | string;
  registerDate: string;
  latitude?: number | null;
  longitude?: number | null;
  logoImageId?: string | null;
  bannerImageId?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  location?: WineryLocationSummaryDto | null;
}

/**
 * Contrato de solicitud de registro unificado de bodega + usuario dueño (C# RegisterWineryRequestDto).
 * Permite ubicación por coordenadas oficiales (lat/lon) o por locationId manual (excluyentes).
 */
export interface RegisterWineryRequestDto {
  username: string;
  email: string;
  password: string;
  wineryName: string;
  locationId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  foundationYear?: number | null;
  website?: string | null;
}

/**
 * Contrato de respuesta tras registrar una bodega (C# RegisterWineryResponseDto).
 * Nota: El backend emite AccessToken pero NO refreshToken.
 */
export interface RegisterWineryResponseDto {
  winery: WineryResponseDto;
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

/**
 * Contrato de actualización de perfil de bodega (C# UpdateWineryRequestDto).
 */
export interface UpdateWineryRequestDto {
  name: string;
  locationId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  foundationYear?: number | null;
  website?: string | null;
}

/**
 * Contrato de respuesta de seguidor de bodega (C# FollowUserResponseDto).
 */
export interface WineryFollowerDto {
  userId: number;
  username: string;
  followedAt: string;
}
