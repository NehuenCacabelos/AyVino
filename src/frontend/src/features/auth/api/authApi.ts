import apiClient from '../../../services/apiClient';
import type {
  LoginRequestDto,
  LoginResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
  RevokeTokenRequestDto,
} from '../types';

/**
 * Inicia sesión con las credenciales de usuario y obtiene los tokens de acceso y perfil.
 */
export async function loginApi(data: LoginRequestDto): Promise<LoginResponseDto> {
  const response = await apiClient.post<LoginResponseDto>('/auth/login', data);
  return response.data;
}

/**
 * Solicita la renovación del token de acceso a partir de un token de refresco válido.
 */
export async function refreshApi(data: RefreshRequestDto): Promise<RefreshResponseDto> {
  const response = await apiClient.post<RefreshResponseDto>('/auth/refresh', data);
  return response.data;
}

/**
 * Revoca el token de refresco activo en el servidor para invalidar la sesión (logout).
 */
export async function revokeApi(data: RevokeTokenRequestDto): Promise<void> {
  await apiClient.post<void>('/auth/revoke', data);
}

