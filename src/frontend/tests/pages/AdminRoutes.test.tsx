import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import AdminLayout from '@/features/admin/components/AdminLayout';
import * as authModule from '@/features/auth';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

describe('AdminRoutes & AdminLayout access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('permite el acceso a un usuario con rol Admin, muestra los 10 enlaces en orden y sin badge Admin en el logo', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'superadmin',
        email: 'admin@ayvino.com',
        role: 'Admin',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<h1>Panel de Inicio Admin</h1>} />
          </Route>
          <Route path="/dashboard" element={<h1>Dashboard de Usuario</h1>} />
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /navegación del panel de administración/i });
    const navLinks = within(nav).getAllByRole('link');
    expect(navLinks).toHaveLength(10);
    expect(navLinks.map((link) => link.textContent?.trim())).toEqual([
      'Inicio',
      'Bodegas',
      'Cosechas',
      'Vinos',
      'Reseñas',
      'Usuarios',
      'Uvas',
      'Maridajes',
      'Ciudades',
      'Auditoría',
    ]);

    const logoLink = screen.getByRole('link', { name: /ayvino/i });
    expect(logoLink).toHaveAttribute('href', '/admin');
    expect(within(logoLink).queryByText('Admin')).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: /volver al sitio/i })).toBeInTheDocument();
    expect(screen.getByText('superadmin')).toBeInTheDocument();
    expect(screen.getByText('Panel de Inicio Admin')).toBeInTheDocument();
  });

  it('redirige a /dashboard a un usuario común (rol User) que intente ingresar a /admin', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 2,
        username: 'juanperez',
        email: 'juan@example.com',
        role: 'User',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<h1>Panel de Inicio Admin</h1>} />
          </Route>
          <Route path="/dashboard" element={<h1>Dashboard de Usuario</h1>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard de Usuario')).toBeInTheDocument();
      expect(screen.queryByText('Panel de Inicio Admin')).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /bodegas/i })).not.toBeInTheDocument();
    });
  });
});
