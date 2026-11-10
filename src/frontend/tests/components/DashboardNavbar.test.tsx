import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardNavbar from '@/features/dashboard/components/DashboardNavbar';

let mockUser: { username: string; email: string; role: string } | null = null;

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: !!mockUser,
    logout: vi.fn(),
  }),
}));

describe('DashboardNavbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza enlace "Panel Admin" hacia /admin cuando el usuario es Administrador', () => {
    mockUser = { username: 'admin', email: 'admin@admin.com', role: 'Admin' };

    render(
      <MemoryRouter>
        <DashboardNavbar />
      </MemoryRouter>
    );

    const adminLink = screen.getByRole('link', { name: /panel admin/i });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: /^bodega$/i })).not.toBeInTheDocument();
  });

  it('renderiza enlace "Bodega" hacia /bodega/dashboard cuando el usuario tiene rol Winery', () => {
    mockUser = { username: 'don_alberto', email: 'alberto@bodega.com', role: 'Winery' };

    render(
      <MemoryRouter>
        <DashboardNavbar />
      </MemoryRouter>
    );

    const wineryLink = screen.getByRole('link', { name: /^bodega$/i });
    expect(wineryLink).toBeInTheDocument();
    expect(wineryLink).toHaveAttribute('href', '/bodega/dashboard');
    expect(screen.queryByRole('link', { name: /panel admin/i })).not.toBeInTheDocument();
  });

  it('no muestra accesos de gestión institucional cuando el usuario es común (User)', () => {
    mockUser = { username: 'mariano', email: 'mariano@gmail.com', role: 'User' };

    render(
      <MemoryRouter>
        <DashboardNavbar />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: /panel admin/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^bodega$/i })).not.toBeInTheDocument();
  });
});
