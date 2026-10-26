import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WineryLayout from '@/features/winery/components/WineryLayout';
import * as useMyWineryHook from '@/features/winery/hooks/useMyWinery';
import type { WineryResponseDto } from '@/features/winery/types';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: {
      username: 'don_alberto',
      email: 'alberto@bodegaelterruno.com',
      role: 'Winery',
    },
    logout: vi.fn(),
  }),
}));

const mockWinery: WineryResponseDto = {
  id: 42,
  name: 'Bodega El Terruño',
  description: 'Historia centenaria.',
  locationId: 10,
  foundationYear: 1910,
  website: 'https://elterruno.com.ar',
  userId: 5,
  status: 'Approved',
  registerDate: '2026-01-01',
  logoUrl: 'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo42.png',
};

describe('WineryLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga mientras se sincronizan los datos de bodega', () => {
    vi.spyOn(useMyWineryHook, 'useMyWinery').mockReturnValue({
      winery: null,
      isLoading: true,
      error: null,
      isNotFound: false,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter>
        <WineryLayout />
      </MemoryRouter>
    );

    expect(screen.getByText(/cargando panel de bodega/i)).toBeInTheDocument();
  });

  it('muestra estado 404 informativo cuando la cuenta no tiene bodega asociada', () => {
    vi.spyOn(useMyWineryHook, 'useMyWinery').mockReturnValue({
      winery: null,
      isLoading: false,
      error: null,
      isNotFound: true,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter>
        <WineryLayout />
      </MemoryRouter>
    );

    expect(screen.getByText(/tu cuenta no tiene una bodega asociada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registrar mi bodega/i })).toHaveAttribute(
      'href',
      '/bodega/registro'
    );
  });

  it('muestra estado de error cuando falla el servidor y no hay bodega en memoria', () => {
    vi.spyOn(useMyWineryHook, 'useMyWinery').mockReturnValue({
      winery: null,
      isLoading: false,
      error: 'Error 500: Database connection failure',
      isNotFound: false,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter>
        <WineryLayout />
      </MemoryRouter>
    );

    expect(screen.getByText(/no se pudo sincronizar el panel de bodega/i)).toBeInTheDocument();
  });

  it('renderiza el layout completo con WineryNavbar, Outlet hijo y footer editorial legal', () => {
    vi.spyOn(useMyWineryHook, 'useMyWinery').mockReturnValue({
      winery: mockWinery,
      isLoading: false,
      error: null,
      isNotFound: false,
      reload: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/bodega/dashboard']}>
        <Routes>
          <Route path="/bodega" element={<WineryLayout />}>
            <Route path="dashboard" element={<div>Contenido del Panel Hijo</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Contenido del hijo en el Outlet
    expect(screen.getByText('Contenido del Panel Hijo')).toBeInTheDocument();

    // Footer editorial institucional
    expect(
      screen.getByText(/beber con moderación · prohibida su venta a menores de 18 años/i)
    ).toBeInTheDocument();
  });
});
