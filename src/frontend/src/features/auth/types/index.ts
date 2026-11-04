/**
 * Roles del sistema según AppRoles en el backend de AyVino (Admin, Winery, User).
 */
export type UserRole = 'Admin' | 'Winery' | 'User';

/**
 * Géneros disponibles en la plataforma.
 */
export type GenderType = 'Female' | 'Male' | 'Other' | 'PreferNotToSay';

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
  birthDate?: string | null;
  gender?: GenderType | string | null;
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
  avatarImageId?: string | null;
  photo?: string | null;
  bio?: string | null;
  birthDate?: string | null;
  gender?: string | null;
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
 * Contrato de solicitud para actualizar el perfil del usuario autenticado (C# UpdateUserProfileRequestDto).
 */
export interface UpdateUserProfileRequestDto {
  username: string;
  bio?: string | null;
  photo?: string | null;
  birthDate?: string | null;
  gender?: GenderType | string | null;
}

/**
 * Contrato de solicitud para cambio de contraseña (C# ChangePasswordRequestDto).
 */
export interface ChangePasswordRequestDto {
  currentPassword: string;
  newPassword: string;
}
