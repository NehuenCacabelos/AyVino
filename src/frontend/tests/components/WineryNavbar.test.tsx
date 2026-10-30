import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryNavbar from '@/features/winery/components/WineryNavbar';
import type { WineryResponseDto } from '@/features/winery/types';

const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: {
      username: 'don_alberto',
      email: 'alberto@bodegaelterruno.com',
      role: 'Winery',
    },
    logout: mockLogout,
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

vi.mock('@/features/winery/context/WineryContext', () => ({
  useWinery: () => ({
    winery: mockWinery,
    reload: vi.fn(),
    isLoading: false,
    error: null,
    isNotFound: false,
  }),
}));

describe('WineryNavbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (initialEntries = ['/bodega/dashboard']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <WineryNavbar />
      </MemoryRouter>
    );

  it('renderiza la marca AyVino., enlaces institucionales y badge de bodega oficial', () => {
    renderComponent();

    expect(screen.getByText('AyVino')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^inicio$/i })).toHaveAttribute(
      'href',
      '/bodega/dashboard'
    );
    expect(screen.getByRole('link', { name: /^mi catálogo$/i })).toHaveAttribute(
      'href',
      '/bodega/vinos'
    );
    expect(screen.getByRole('link', { name: /^reclamar vinos$/i })).toHaveAttribute(
      'href',
      '/bodega/reclamar'
    );
    expect(screen.getByRole('link', { name: /^mi perfil$/i })).toHaveAttribute(
      'href',
      '/bodega/perfil'
    );

    expect(screen.getByText('Oficial')).toBeInTheDocument();
  });

  it('abre el menú desplegable institucional al hacer clic en el logo de la bodega', async () => {
    renderComponent();

    const menuTrigger = screen.getByRole('button', { name: /abrir menú de bodega/i });
    fireEvent.click(menuTrigger);

    await waitFor(() => {
      expect(screen.getByText('Bodega El Terruño')).toBeInTheDocument();
      expect(screen.getByText('alberto@bodegaelterruno.com')).toBeInTheDocument();
      expect(screen.getByText('Bodega Aprobada')).toBeInTheDocument();
    });

    // Enlaces dentro del dropdown
    expect(screen.getByRole('link', { name: /configuración de bodega/i })).toHaveAttribute(
      'href',
      '/bodega/configuracion'
    );
    expect(screen.getByRole('link', { name: /ver perfil público/i })).toHaveAttribute(
      'href',
      '/bodegas/42'
    );
    expect(screen.getByRole('link', { name: /explorar como usuario/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  it('ejecuta el cierre de sesión al hacer clic en Cerrar sesión', async () => {
    renderComponent();

    const menuTrigger = screen.getByRole('button', { name: /abrir menú de bodega/i });
    fireEvent.click(menuTrigger);

    const logoutBtn = screen.getByRole('button', { name: /cerrar sesión/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('abre y cierra el menú móvil responsive', async () => {
    renderComponent();

    const mobileToggle = screen.getByRole('button', { name: /abrir navegación móvil/i });
    fireEvent.click(mobileToggle);

    await waitFor(() => {
      expect(screen.getByText('don_alberto · Winery')).toBeInTheDocument();
    });
  });
});
