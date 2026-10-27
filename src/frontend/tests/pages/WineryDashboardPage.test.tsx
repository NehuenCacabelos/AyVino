import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryDashboardPage from '@/pages/WineryDashboardPage';
import type { WineryResponseDto, WineryPublicProfileResponseDto } from '@/features/winery/types';
import * as wineryApi from '@/features/winery/api';

let currentWineryStatus: 'Approved' | 'Pending' | 'Rejected' = 'Approved';

const mockWinery: WineryResponseDto = {
  id: 42,
  name: 'Bodega El Terruño',
  description: 'Historia noble de un viñedo familiar centenario.',
  locationId: 10,
  foundationYear: 1910,
  website: 'https://elterruno.com.ar',
  userId: 5,
  status: 'Approved',
  registerDate: '2026-01-01',
  latitude: -33.1234,
  longitude: -68.5678,
  logoUrl: 'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo42.png',
  location: {
    stateName: 'Mendoza',
    regionName: 'Luján de Cuyo',
  },
};

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 5, username: 'donpedro', role: 'Winery' },
  }),
}));

vi.mock('@/features/winery/context/WineryContext', () => ({
  useWinery: () => ({
    winery: {
      ...mockWinery,
      status: currentWineryStatus,
    },
    reload: vi.fn(),
    isLoading: false,
    error: null,
    isNotFound: false,
  }),
}));

vi.mock('@/features/winery/api', () => ({
  getWines: vi.fn().mockResolvedValue([
    {
      id: 101,
      name: 'Gran Terruño Malbec',
      wineType: 'Red',
      averageRating: 4.8,
      reviewCount: 14,
    },
    {
      id: 102,
      name: 'Terruño Torrontés de Altura',
      wineType: 'White',
      averageRating: 4.5,
      reviewCount: 8,
    },
  ]),
  getWineVintages: vi.fn().mockResolvedValue([]),
  getWineryFollowers: vi.fn().mockResolvedValue([]),
  getLocationById: vi.fn().mockResolvedValue({
    id: 10,
    regionName: 'Luján de Cuyo',
    cityName: 'Luján de Cuyo',
    stateName: 'Mendoza',
  }),
  getWineryPublicProfile: vi.fn().mockResolvedValue({
    id: 42,
    name: 'Bodega El Terruño',
    status: 'Approved',
    followersCount: 37,
    averageRating: 4.6,
    reviewCount: 15,
    totals: { labels: 2, vintages: 4 },
    isPreview: false,
  }),
}));

describe('WineryDashboardPage (/bodega/dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentWineryStatus = 'Approved';
    vi.mocked(wineryApi.getWineryPublicProfile).mockResolvedValue({
      id: 42,
      name: 'Bodega El Terruño',
      status: 'Approved',
      followersCount: 37,
      averageRating: 4.6,
      reviewCount: 15,
      totals: { labels: 2, vintages: 4 },
      isPreview: false,
    } as WineryPublicProfileResponseDto);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <WineryDashboardPage />
      </MemoryRouter>
    );

  it('renderiza la cabecera del panel con nombre de bodega y saludo de usuario', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Bodega El Terruño')).toBeInTheDocument();
      expect(screen.getByText('Bodega Oficial')).toBeInTheDocument();
      expect(screen.getByText(/Panel Oficial de Cava/i)).toBeInTheDocument();
      expect(screen.getByText('donpedro')).toBeInTheDocument();
    });
  });

  it('muestra seguidores mayores a 1 (ej: 37) en la cinta de KPIs cuando está aprobada', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('37')).toBeInTheDocument();
      expect(screen.getByText('Seguidores')).toBeInTheDocument();
      expect(screen.getByText(/miembros siguiendo tu bodega/i)).toBeInTheDocument();
    });
  });

  it('muestra la calificación con datos (4.6) y total de reseñas de la comunidad', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('4.6')).toBeInTheDocument();
      expect(screen.getByText(/15 reseñas de la comunidad/i)).toBeInTheDocument();
    });
  });

  it('renderiza texto sobrio "Aún sin valoración" cuando averageRating es null', async () => {
    vi.mocked(wineryApi.getWineryPublicProfile).mockResolvedValueOnce({
      id: 42,
      name: 'Bodega El Terruño',
      status: 'Approved',
      followersCount: 37,
      averageRating: null,
      reviewCount: 2,
      totals: { labels: 2, vintages: 4 },
      isPreview: false,
    } as WineryPublicProfileResponseDto);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Aún sin valoración')).toBeInTheDocument();
      expect(screen.getByText(/2 reseñas registradas/i)).toBeInTheDocument();
    });
  });

  it('muestra "—" y "Disponible al aprobarse" para seguidores cuando la bodega está en estado Pending', async () => {
    currentWineryStatus = 'Pending';
    vi.mocked(wineryApi.getWineryPublicProfile).mockResolvedValueOnce({
      id: 42,
      name: 'Bodega El Terruño',
      status: 'Pending',
      followersCount: 0,
      averageRating: null,
      reviewCount: 0,
      totals: { labels: 2, vintages: 4 },
      isPreview: true,
    } as WineryPublicProfileResponseDto);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('En Verificación')).toBeInTheDocument();
      expect(screen.getByText('Disponible al aprobarse')).toBeInTheDocument();
    });
  });

  it('maneja el fallo de consulta del perfil público sin romper la pantalla', async () => {
    vi.mocked(wineryApi.getWineryPublicProfile).mockRejectedValueOnce(new Error('500 Internal Server Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Bodega El Terruño')).toBeInTheDocument();
      expect(screen.getByText('Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('Nueva etiqueta')).toBeInTheDocument();
    });
  });
});
