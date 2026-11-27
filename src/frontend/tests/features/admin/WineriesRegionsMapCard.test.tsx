import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import WineriesRegionsMapCard from '@/features/admin/components/WineriesRegionsMapCard';
import { getWineriesByRegion } from '@/features/admin/api/adminStatsApi';

const mockFitBounds = vi.fn();

vi.mock('react-leaflet', () => ({
  MapContainer: ({
    children,
    attributionControl,
  }: {
    children: React.ReactNode;
    attributionControl?: boolean;
  }) => (
    <div
      data-testid="mock-map-container"
      data-attribution-control={String(attributionControl)}
    >
      {children}
    </div>
  ),
  TileLayer: ({ attribution }: { attribution?: string }) => (
    <div data-testid="mock-tile-layer" data-attribution={attribution ?? ''} />
  ),
  Marker: ({
    children,
    position,
  }: {
    children: React.ReactNode;
    position: [number, number];
  }) => (
    <div data-testid="mock-barrel-marker" data-position={position.join(',')}>
      {children}
    </div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tooltip">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popup">{children}</div>
  ),
  useMap: () => ({
    fitBounds: mockFitBounds,
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    latLngBounds: vi.fn((coords: [number, number][]) => coords),
    divIcon: vi.fn((options: { html?: string }) => options),
  },
}));

vi.mock('@/features/admin/api/adminStatsApi', () => ({
  getWineriesByRegion: vi.fn(),
}));

describe('WineriesRegionsMapCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga mientras espera la respuesta de la API', () => {
    vi.mocked(getWineriesByRegion).mockReturnValueOnce(new Promise(() => {}));

    render(<WineriesRegionsMapCard />);

    expect(screen.getByText('Geografía enológica')).toBeInTheDocument();
    expect(screen.getByText('Regiones y Terruños')).toBeInTheDocument();
    expect(screen.getByTestId('wineries-regions-loading')).toBeInTheDocument();
  });

  it('muestra estado vacío cuando no hay bodegas aprobadas', async () => {
    vi.mocked(getWineriesByRegion).mockResolvedValueOnce({
      totalWineries: 0,
      withoutCoordinates: 0,
      regions: [],
      pins: [],
    });

    render(<WineriesRegionsMapCard />);

    await waitFor(() => {
      expect(screen.getByText('Todavía no hay bodegas aprobadas.')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('mock-map-container')).not.toBeInTheDocument();
  });

  it('muestra estado de error y permite reintentar cargando los datos', async () => {
    vi.mocked(getWineriesByRegion)
      .mockRejectedValueOnce(new Error('Error de red'))
      .mockResolvedValueOnce({
        totalWineries: 2,
        withoutCoordinates: 0,
        regions: [{ stateId: 13, stateName: 'Mendoza', wineryCount: 2 }],
        pins: [
          {
            id: 1,
            name: 'Bodega A',
            latitude: -33.0,
            longitude: -68.8,
            stateName: 'Mendoza',
            cityName: 'Luján de Cuyo',
          },
        ],
      });

    render(<WineriesRegionsMapCard />);

    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getAllByText('Mendoza').length).toBeGreaterThan(0);
    });

    expect(getWineriesByRegion).toHaveBeenCalledTimes(2);
  });

  it('muestra marcadores con tooltip hover, popup, epicentro y barras por provincia', async () => {
    vi.mocked(getWineriesByRegion).mockResolvedValueOnce({
      totalWineries: 20,
      withoutCoordinates: 0,
      regions: [
        { stateId: 1, stateName: 'Mendoza', wineryCount: 10 },
        { stateId: 2, stateName: 'Salta', wineryCount: 4 },
        { stateId: 3, stateName: 'San Juan', wineryCount: 2 },
        { stateId: 4, stateName: 'Neuquén', wineryCount: 1 },
        { stateId: 5, stateName: 'Río Negro', wineryCount: 1 },
        { stateId: 6, stateName: 'Córdoba', wineryCount: 1 },
        { stateId: 7, stateName: 'Tucumán', wineryCount: 1 },
      ],
      pins: [
        {
          id: 1,
          name: 'Bodega Catena',
          latitude: -33.1,
          longitude: -68.9,
          stateName: 'Mendoza',
          cityName: 'Agrelo',
        },
        {
          id: 2,
          name: 'Bodega Sin Ciudad',
          latitude: -26.0,
          longitude: -65.9,
          stateName: 'Salta',
          cityName: null,
        },
      ],
    });

    render(<WineriesRegionsMapCard />);

    await waitFor(() => {
      expect(screen.getByText('Epicentro vitivinícola')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Mendoza').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('10 bodegas / 50% del total')).toBeInTheDocument();
    expect(screen.getByText('4 bodegas / 20% del total')).toBeInTheDocument();
    expect(screen.getByText('2 bodegas / 10% del total')).toBeInTheDocument();
    expect(screen.getAllByText('1 bodega / 5% del total')).toHaveLength(2);
    expect(screen.getByText('y 2 provincias más')).toBeInTheDocument();
    expect(screen.queryByText('Córdoba')).not.toBeInTheDocument();
    expect(screen.queryByText(/no tiene.? coordenadas/i)).not.toBeInTheDocument();

    expect(screen.getByTestId('mock-map-container')).toHaveAttribute(
      'data-attribution-control',
      'true',
    );
    expect(screen.getByTestId('mock-tile-layer')).toHaveAttribute(
      'data-attribution',
      expect.stringContaining('OpenStreetMap'),
    );
    expect(screen.getAllByTestId('mock-barrel-marker')).toHaveLength(2);

    const tooltips = screen.getAllByTestId('mock-tooltip');
    expect(within(tooltips[0]).getByText('Bodega Catena')).toBeInTheDocument();
    expect(within(tooltips[0]).getByText('Agrelo, Mendoza')).toBeInTheDocument();
    expect(within(tooltips[1]).getByText('Bodega Sin Ciudad')).toBeInTheDocument();
    expect(within(tooltips[1]).getByText('Salta')).toBeInTheDocument();

    const popups = screen.getAllByTestId('mock-popup');
    expect(within(popups[0]).getByText('Bodega Catena')).toBeInTheDocument();
    expect(mockFitBounds).toHaveBeenCalledTimes(1);
  });

  it('muestra nota en plural cuando faltan coordenadas y en singular cuando falta 1', async () => {
    vi.mocked(getWineriesByRegion)
      .mockResolvedValueOnce({
        totalWineries: 5,
        withoutCoordinates: 3,
        regions: [{ stateId: 1, stateName: 'Mendoza', wineryCount: 5 }],
        pins: [
          {
            id: 1,
            name: 'Bodega Uno',
            latitude: -33.0,
            longitude: -68.8,
            stateName: 'Mendoza',
            cityName: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        totalWineries: 2,
        withoutCoordinates: 1,
        regions: [{ stateId: 1, stateName: 'Mendoza', wineryCount: 2 }],
        pins: [
          {
            id: 1,
            name: 'Bodega Uno',
            latitude: -33.0,
            longitude: -68.8,
            stateName: null,
            cityName: 'Maipú',
          },
        ],
      });

    const { unmount } = render(<WineriesRegionsMapCard />);

    await waitFor(() => {
      expect(
        screen.getByText('3 bodegas no tienen coordenadas y no aparecen en el mapa.'),
      ).toBeInTheDocument();
    });

    unmount();
    render(<WineriesRegionsMapCard />);

    await waitFor(() => {
      expect(
        screen.getByText('1 bodega no tiene coordenadas y no aparece en el mapa.'),
      ).toBeInTheDocument();
    });
  });

  it('sin pines no renderiza el mapa y muestra la nota de coordenadas faltantes', async () => {
    vi.mocked(getWineriesByRegion).mockResolvedValueOnce({
      totalWineries: 4,
      withoutCoordinates: 4,
      regions: [{ stateId: 1, stateName: 'Mendoza', wineryCount: 4 }],
      pins: [],
    });

    render(<WineriesRegionsMapCard />);

    await waitFor(() => {
      expect(
        screen.getByText('4 bodegas no tienen coordenadas y no aparecen en el mapa.'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByTestId('mock-map-container')).not.toBeInTheDocument();
    expect(screen.getByText('Mendoza')).toBeInTheDocument();
    expect(screen.getByText('4 bodegas / 100% del total')).toBeInTheDocument();
  });
});
