import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryOverviewPage from '@/pages/WineryOverviewPage';
import type { WineryResponseDto } from '@/features/winery/types';

// Mock de Leaflet para evitar problemas de canvas en jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: () => <div data-testid="mock-marker" />,
}));

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
    winery: mockWinery,
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
}));

describe('WineryOverviewPage (/bodega/perfil)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('muestra la cinta de métricas con etiquetas, cosechas y seguidores', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('Cosechas')).toBeInTheDocument();
      expect(screen.getByText('Seguidores')).toBeInTheDocument();
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
