export type AdminUserRole = 'Admin' | 'Winery' | 'User';

/**
 * Representación de usuario para el panel de administración.
 * Contrato: GET /api/users
 */
export interface AdminUserListItemDto {
  id: number;
  username: string;
  email: string;
  role: AdminUserRole | string;
  registerDate: string;
  isActive: boolean;
  photo?: string | null;
  bio?: string | null;
}

