import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import Landing from '@/pages/Landing';

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

vi.mock('@/features/catalog/api/catalogShowcaseApi', () => ({
  getCatalogShowcaseApi: vi.fn().mockResolvedValue({
    showcaseWineries: [],
    spotlightWines: [],
    recentWines: [],
  }),
}));

describe('Bloque H - Landing y Login Polish', () => {
  it('LoginPage renders "Volver" button with >= 44px hit target and links to /', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const backLink = screen.getByRole('link', { name: /Volver/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink.getAttribute('href')).toBe('/');
    expect(backLink.className).toContain('min-h-[44px]');
    expect(backLink.className).toContain('min-w-[44px]');
    expect(backLink.className).toContain('cursor-pointer');
  });

  it('LoginPage renders "Registrá tu bodega" link pointing to /bodegas/registro', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    const wineryLink = screen.getByRole('link', { name: /Registrá tu bodega/i });
    expect(wineryLink).toBeInTheDocument();
    expect(wineryLink.getAttribute('href')).toBe('/bodegas/registro');
  });

  it('Landing renders refined "Para bodegas" section with "Registrar mi bodega" linking to /bodegas/registro', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Landing />
      </MemoryRouter>
    );

    const ctaButton = screen.getByRole('link', { name: /Registrar mi bodega/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton.getAttribute('href')).toBe('/bodegas/registro');

    const loginLink = screen.getByRole('link', { name: /¿Ya tenés cuenta\? Ingresar/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});
