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

let currentWinery: WineryResponseDto = {
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
    winery: currentWinery,
    reload: vi.fn(),
    isLoading: false,
    error: null,
    isNotFound: false,
  }),
}));

describe('WineryNavbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentWinery = {
      ...currentWinery,
      status: 'Approved',
    };
  });

  const renderComponent = (initialEntries = ['/bodega/dashboard']) =>
    render(
      <MemoryRouter initialEntries={initialEntries}>
        <WineryNavbar />
      </MemoryRouter>
    );

  it('renderiza la marca AyVino. y los 4 enlaces institucionales, y NO muestra "Oficial" con estado Approved', () => {
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

    // En estado Approved, el badge de escritorio ya no debe mostrar "Oficial"
    expect(screen.queryByText('Oficial')).not.toBeInTheDocument();
  });

  it('muestra el badge "En revisión" en desktop cuando la bodega está en estado Pending', () => {
    currentWinery = { ...currentWinery, status: 'Pending' };
    renderComponent();

    expect(screen.getByText('En revisión')).toBeInTheDocument();
    expect(screen.queryByText('Oficial')).not.toBeInTheDocument();
  });

  it('muestra el badge "Rechazada" en desktop cuando la bodega está en estado Rejected', () => {
    currentWinery = { ...currentWinery, status: 'Rejected' };
    renderComponent();

    expect(screen.getByText('Rechazada')).toBeInTheDocument();
    expect(screen.queryByText('Oficial')).not.toBeInTheDocument();
  });

  it('abre el menú desplegable institucional con exactamente 3 opciones y sin "Explorar como usuario"', async () => {
    renderComponent();

    const menuTrigger = screen.getByRole('button', { name: /abrir menú de bodega/i });
    fireEvent.click(menuTrigger);

    await waitFor(() => {
      expect(screen.getByText('Bodega El Terruño')).toBeInTheDocument();
      expect(screen.getByText('alberto@bodegaelterruno.com')).toBeInTheDocument();
    });

    // Enlaces permitidos dentro del dropdown
    expect(screen.getByRole('link', { name: /configuración de bodega/i })).toHaveAttribute(
      'href',
      '/bodega/configuracion'
    );
    expect(screen.getByRole('link', { name: /ver perfil público/i })).toHaveAttribute(
      'href',
      '/bodegas/42'
    );
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();

    // Debe haberse eliminado "Explorar como usuario"
    expect(screen.queryByText('Explorar como usuario')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /explorar como usuario/i })).not.toBeInTheDocument();
  });

  it('el menú móvil no contiene "Explorar catálogo" ni "Explorar como usuario"', async () => {
    renderComponent();

    const mobileToggle = screen.getByRole('button', { name: /abrir navegación móvil/i });
    fireEvent.click(mobileToggle);

    await waitFor(() => {
      expect(screen.getByText('don_alberto · Winery')).toBeInTheDocument();
    });

    expect(screen.queryByText('Explorar catálogo')).not.toBeInTheDocument();
    expect(screen.queryByText('Explorar como usuario')).not.toBeInTheDocument();
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
});
