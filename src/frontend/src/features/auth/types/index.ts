/**
 * Roles del sistema según AppRoles en el backend de AyVino (Admin, Winery, User).
 */
export type UserRole = 'Admin' | 'Winery' | 'User';

/**
 * Modos de formulario de autenticación para la UI.
 */
export type AuthMode = 'login' | 'register';

/**
 * Estado del formulario local de autenticación.
 */
export interface AuthFormData {
  name?: string;
  email: string;
  password: string;
}

/**
 * Contrato de solicitud de inicio de sesión (C# LoginRequestDto).
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * Contrato de solicitud de registro de nuevo usuario (C# RegisterUserRequestDto).
 */
export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
  bio?: string | null;
  photo?: string | null;
}

/**
 * Perfil / DTO de respuesta de usuario (C# UserResponseDto).
 */
export interface UserProfileDto {
  id: number;
  username: string;
  email: string;
  role: UserRole | string;
  registerDate: string;
  isActive: boolean;
  photo?: string | null;
  bio?: string | null;
}

/**
 * Contrato de respuesta exitosa de login (C# LoginResponseDto).
 */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  user: UserProfileDto;
}

/**
 * Contrato de solicitud para refrescar token (C# RefreshRequestDto).
 */
export interface RefreshRequestDto {
  refreshToken: string;
}

/**
 * Contrato de respuesta de refresco de sesión (C# RefreshResponseDto).
 */
export interface RefreshResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
}

/**
 * Contrato de solicitud para revocar token / logout (C# RevokeTokenRequestDto).
 */
export interface RevokeTokenRequestDto {
  refreshToken: string;
}

/**
 * Payload decodificado del JWT emitido por JwtTokenGenerator.
 */
export interface UserTokenPayload {
  sub: string;
  email: string;
  role: UserRole | string;
  name?: string;
  jti?: string;
  exp?: number;
  iat?: number;
}

