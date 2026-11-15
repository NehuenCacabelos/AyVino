import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryOverviewPage from '@/pages/WineryOverviewPage';
import type { WineryResponseDto, WineryPublicProfileResponseDto } from '@/features/winery/types';
import * as wineryApi from '@/features/winery/api';

// Mock de Leaflet para evitar problemas de canvas en jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: () => <div data-testid="mock-marker" />,
}));

let currentWineryStatus: 'Approved' | 'Pending' | 'Rejected' = 'Approved';

const mockWinery: WineryResponseDto = {
  id: 42,
  name: 'Bodega El Terruño',
  description: 'Historia noble de un viñedo familiar centenario en el corazón de Mendoza.',
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
  getWineVintages: vi.fn().mockResolvedValue([
    { id: 1, year: 2020, averageRating: 4.8, reviewCount: 7 },
    { id: 2, year: 2021, averageRating: 4.8, reviewCount: 7 },
  ]),
  getWineryFollowers: vi.fn().mockResolvedValue([{ id: 1, username: 'sommelier1' }]),
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

describe('WineryOverviewPage (/bodega/perfil)', () => {
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
        <WineryOverviewPage />
      </MemoryRouter>
    );

  it('renderiza la cabecera institucional con el nombre en serif, terruño y badge oficial', async () => {
    renderComponent();

    expect(screen.getByText('Bodega El Terruño')).toBeInTheDocument();
    expect(screen.getByText('Bodega Oficial')).toBeInTheDocument();
    expect(screen.getByText('Fundada en 1910')).toBeInTheDocument();
    expect(screen.getByText(/Historia noble de un viñedo familiar centenario/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Luján de Cuyo, Mendoza').length).toBeGreaterThan(0);
    });
  });

  it('renderiza los botones de acción hacia configuración y vidriera pública externa', async () => {
    renderComponent();

    await waitFor(() => {
      const configBtn = screen.getByRole('link', { name: /editar configuración/i });
      expect(configBtn).toHaveAttribute('href', '/bodega/configuracion');

      const viewPublicBtn = screen.getByRole('link', { name: /ver cómo lo ven los usuarios/i });
      expect(viewPublicBtn).toHaveAttribute('href', '/bodegas/42');
    });
  });

  it('muestra la cinta de métricas con etiquetas, cosechas y seguidores mayores a 1 (ej: 37)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('Cosechas')).toBeInTheDocument();
      expect(screen.getByText('Seguidores')).toBeInTheDocument();
      expect(screen.getByText('37')).toBeInTheDocument();
      expect(screen.getByText('4.6')).toBeInTheDocument();
    });
  });

  it('renderiza texto sobrio "Aún sin valoración" cuando el promedio es null', async () => {
    vi.mocked(wineryApi.getWineryPublicProfile).mockResolvedValueOnce({
      id: 42,
      name: 'Bodega El Terruño',
      status: 'Approved',
      followersCount: 12,
      averageRating: null,
      reviewCount: 3,
      totals: { labels: 2, vintages: 4 },
      isPreview: false,
    } as WineryPublicProfileResponseDto);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/3 reseñas · aún sin valoración/i)).toBeInTheDocument();
    });
  });

  it('muestra "—" para seguidores cuando la bodega está en estado Pending', async () => {
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
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  it('no rompe la pantalla cuando la consulta del perfil público falla', async () => {
    vi.mocked(wineryApi.getWineryPublicProfile).mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Bodega El Terruño')).toBeInTheDocument();
      expect(screen.getByText('Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('Gran Terruño Malbec')).toBeInTheDocument();
    });
  });

  it('renderiza el mapa de terruño de solo lectura y el resumen de etiquetas', async () => {
    renderComponent();

    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Gran Terruño Malbec')).toBeInTheDocument();
      expect(screen.getByText('Terruño Torrontés de Altura')).toBeInTheDocument();
    });
  });
});
