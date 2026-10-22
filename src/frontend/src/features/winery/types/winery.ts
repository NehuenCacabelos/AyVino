/**
 * Estados de moderación de una bodega oficial (WineryStatus en C#).
 */
export type WineryStatus = 'Pending' | 'Approved' | 'Rejected';

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
}

/**
 * Contrato de solicitud de registro unificado de bodega + usuario dueño (C# RegisterWineryRequestDto).
 */
export interface RegisterWineryRequestDto {
  username: string;
  email: string;
  password: string;
  wineryName: string;
  locationId: number;
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
  locationId: number;
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

