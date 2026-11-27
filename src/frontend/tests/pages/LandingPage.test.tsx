import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '@/pages/Landing';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

describe('Landing Page (/ - Espacio para Bodegas y Footer)', () => {
  it('renderiza la franja rediseñada para bodegas con jerarquía secundaria y enlaces correctos', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

    // Eyebrow y textos
    expect(screen.getByText(/Espacio para Bodegas y Productores/i)).toBeInTheDocument();
    expect(
      screen.getByText('¿Tenés una bodega o producís vinos en Argentina?')
    ).toBeInTheDocument();

    // Botón principal hacia /bodegas/registro
    const ctaButton = screen.getByRole('link', { name: /Registrar mi bodega/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton.getAttribute('href')).toBe('/bodegas/registro');

    // Enlace secundario hacia /login
    const loginLink = screen.getByRole('link', { name: /¿Ya tenés cuenta\? Ingresar/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');

    // Enlaces en navbar y footer hacia /bodegas/registro
    const wineryLinks = screen.getAllByRole('link', { name: /Para Bodegas/i });
    expect(wineryLinks.length).toBeGreaterThanOrEqual(2);
    wineryLinks.forEach((link) => {
      expect(link.getAttribute('href')).toBe('/bodegas/registro');
    });
  });
});
