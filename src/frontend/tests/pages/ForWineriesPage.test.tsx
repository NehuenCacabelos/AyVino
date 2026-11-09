import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, createMemoryRouter, RouterProvider, Navigate } from 'react-router-dom';
import ForWineriesPage from '@/pages/ForWineriesPage';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: vi.fn(),
    register: vi.fn(),
    loginDemo: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

describe('ForWineriesPage (/bodegas/registro)', () => {
  it('renders landing page with headline, benefits and CTA links to register', () => {
    render(
      <MemoryRouter>
        <ForWineriesPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Espacio Oficial de Productores/i)).toBeInTheDocument();
    expect(screen.getByText('Ficha Técnica Oficial')).toBeInTheDocument();
    expect(screen.getByText('Reclamo de Vinos Comunitarios')).toBeInTheDocument();
    expect(screen.getByText('Perfil Público y Seguidores')).toBeInTheDocument();

    const registerLinks = screen.getAllByRole('link', { name: /Registrar mi bodega/i });
    expect(registerLinks.length).toBeGreaterThan(0);
    expect(registerLinks[0].getAttribute('href')).toBe('/bodega/registro');
  });

  it('redirects from legacy /para-bodegas to /bodegas/registro', () => {
    const router = createMemoryRouter(
      [
        {
          path: '/bodegas/registro',
          element: <ForWineriesPage />,
        },
        {
          path: '/para-bodegas',
          element: <Navigate to="/bodegas/registro" replace />,
        },
      ],
      { initialEntries: ['/para-bodegas'] }
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText(/Espacio Oficial de Productores/i)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/bodegas/registro');
  });
});
