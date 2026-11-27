import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineriesRegionsMapCard from '@/features/admin/components/WineriesRegionsMapCard';
import { getWineriesByRegion } from '@/features/admin/api/adminStatsApi';

const mockFitBounds = vi.fn();
const mockFlyTo = vi.fn();
const mockMapInstance = {
  fitBounds: mockFitBounds,
  flyTo: mockFlyTo,
  getZoom: () => 8,
};

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
    zIndexOffset,
  }: {
    children: React.ReactNode;
    position: [number, number];
    zIndexOffset?: number;
  }) => (
    <div
      data-testid="mock-barrel-marker"
      data-position={position.join(',')}
      data-highlighted={String((zIndexOffset ?? 0) > 0)}
    >
      {children}
    </div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tooltip">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popup">{children}</div>
  ),
  useMap: () => mockMapInstance,
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

function renderCard() {
  return render(
    <MemoryRouter>
      <WineriesRegionsMapCard />
    </MemoryRouter>,
  );
}

describe('WineriesRegionsMapCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de carga mientras espera la respuesta de la API', () => {
    vi.mocked(getWineriesByRegion).mockReturnValueOnce(new Promise(() => {}));

    renderCard();

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
      wineries: [],
    });

    renderCard();

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
            stateId: 13,
          },
        ],
        wineries: [
          {
            id: 1,
            name: 'Bodega A',
            stateId: 13,
            cityName: 'Luján de Cuyo',
            foundationYear: 1998,
            hasCoordinates: true,
          },
        ],
      });

    renderCard();

    const retryButton = await screen.findByRole('button', { name: /Reintentar/i });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getAllByText('Mendoza').length).toBeGreaterThan(0);
    });

    expect(getWineriesByRegion).toHaveBeenCalledTimes(2);
  });

  it('muestra marcadores con tooltip hover, popup, epicentro, top 4 provincias y botón Ver más', async () => {
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
          stateId: 1,
        },
        {
          id: 2,
          name: 'Bodega Sin Ciudad',
          latitude: -26.0,
          longitude: -65.9,
          stateName: 'Salta',
          cityName: null,
          stateId: 2,
        },
      ],
      wineries: [],
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getByText('Epicentro vitivinícola')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Mendoza').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('10 bodegas / 50% del total')).toBeInTheDocument();
    expect(screen.getByText('4 bodegas / 20% del total')).toBeInTheDocument();
    expect(screen.getByText('2 bodegas / 10% del total')).toBeInTheDocument();
    expect(screen.getByText('1 bodega / 5% del total')).toBeInTheDocument();
    expect(screen.queryByText('Río Negro')).not.toBeInTheDocument();
    expect(screen.queryByText('Córdoba')).not.toBeInTheDocument();
    expect(screen.queryByText(/no tiene.? coordenadas/i)).not.toBeInTheDocument();

    const showMoreBtn = screen.getByRole('button', { name: /Ver 3 más/i });
    fireEvent.click(showMoreBtn);

    expect(screen.getByText('Río Negro')).toBeInTheDocument();
    expect(screen.getByText('Córdoba')).toBeInTheDocument();
    expect(screen.getByText('Tucumán')).toBeInTheDocument();
    expect(screen.getAllByText('1 bodega / 5% del total')).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: /Ver menos/i }));
    expect(screen.queryByText('Córdoba')).not.toBeInTheDocument();

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

  it('filtra el mapa, abre desplegable exclusivo por provincia, cambia a otra y vuelve a mostrar todas al cerrar', async () => {
    vi.mocked(getWineriesByRegion).mockResolvedValueOnce({
      totalWineries: 5,
      withoutCoordinates: 1,
      regions: [
        { stateId: 13, stateName: 'Mendoza', wineryCount: 3 },
        { stateId: 1, stateName: 'Buenos Aires', wineryCount: 2 },
      ],
      pins: [
        {
          id: 10,
          name: 'Catena Zapata',
          latitude: -33.1,
          longitude: -68.9,
          stateName: 'Mendoza',
          cityName: 'Luján de Cuyo',
          stateId: 13,
        },
        {
          id: 11,
          name: 'Zuccardi',
          latitude: -33.6,
          longitude: -69.1,
          stateName: 'Mendoza',
          cityName: 'Valle de Uco',
          stateId: 13,
        },
        {
          id: 20,
          name: 'Costa & Pampa',
          latitude: -38.1,
          longitude: -57.7,
          stateName: 'Buenos Aires',
          cityName: 'Chapadmalal',
          stateId: 1,
        },
      ],
      wineries: [
        {
          id: 10,
          name: 'Catena Zapata',
          stateId: 13,
          cityName: 'Luján de Cuyo',
          foundationYear: 1902,
          hasCoordinates: true,
        },
        {
          id: 11,
          name: 'Zuccardi',
          stateId: 13,
          cityName: 'Valle de Uco',
          foundationYear: 1963,
          hasCoordinates: true,
        },
        {
          id: 12,
          name: 'Bodega Sin Coordenadas',
          stateId: 13,
          cityName: 'Maipú',
          foundationYear: null,
          hasCoordinates: false,
        },
        {
          id: 20,
          name: 'Costa & Pampa',
          stateId: 1,
          cityName: 'Chapadmalal',
          foundationYear: 2009,
          hasCoordinates: true,
        },
        {
          id: 21,
          name: 'Gamboa',
          stateId: 1,
          cityName: 'Campana',
          foundationYear: null,
          hasCoordinates: true,
        },
      ],
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getAllByTestId('mock-barrel-marker')).toHaveLength(3);
    });

    const mendozaBtn = screen.getByRole('button', { name: /Mendoza/i });
    const bsAsBtn = screen.getByRole('button', { name: /Buenos Aires/i });

    // 1. Click en Mendoza: abre desplegable y deja solo los 2 pines de Mendoza en el mapa
    fireEvent.click(mendozaBtn);

    expect(mendozaBtn).toHaveAttribute('aria-expanded', 'true');
    expect(bsAsBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Provincia seleccionada')).toBeInTheDocument();

    const mendozaDropdown = screen.getByTestId('region-dropdown-13');
    expect(within(mendozaDropdown).getByRole('link', { name: /Catena Zapata/i })).toHaveAttribute(
      'href',
      '/bodegas/10',
    );
    expect(within(mendozaDropdown).getByText('Luján de Cuyo · Est. 1902')).toBeInTheDocument();
    expect(within(mendozaDropdown).getByText('Bodega Sin Coordenadas')).toBeInTheDocument();
    expect(within(mendozaDropdown).getByText('Sin mapa')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-barrel-marker')).toHaveLength(2);
    expect(mockFitBounds).toHaveBeenCalledTimes(2);

    // 2. Click en Buenos Aires: cierra Mendoza, abre Buenos Aires y enfoca solo pin de Bs As
    fireEvent.click(bsAsBtn);

    expect(mendozaBtn).toHaveAttribute('aria-expanded', 'false');
    expect(bsAsBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByTestId('region-dropdown-13')).not.toBeInTheDocument();

    const bsAsDropdown = screen.getByTestId('region-dropdown-1');
    expect(within(bsAsDropdown).getByRole('link', { name: /Costa & Pampa/i })).toHaveAttribute(
      'href',
      '/bodegas/20',
    );
    expect(within(bsAsDropdown).getByText('Chapadmalal · Est. 2009')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-barrel-marker')).toHaveLength(1);
    expect(mockFitBounds).toHaveBeenCalledTimes(3);

    // 3. Volver a clickear Buenos Aires: cierra desplegable y restaura todas las bodegas
    fireEvent.click(bsAsBtn);

    expect(bsAsBtn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('region-dropdown-1')).not.toBeInTheDocument();
    expect(screen.getByText('Epicentro vitivinícola')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-barrel-marker')).toHaveLength(3);
    expect(mockFitBounds).toHaveBeenCalledTimes(4);
  });

  it('hover sobre fila de bodega resalta el barril y click en zona vacía centra el mapa sin navegar', async () => {
    vi.mocked(getWineriesByRegion).mockResolvedValueOnce({
      totalWineries: 2,
      withoutCoordinates: 0,
      regions: [{ stateId: 13, stateName: 'Mendoza', wineryCount: 2 }],
      pins: [
        {
          id: 10,
          name: 'Trapiche',
          latitude: -33.0,
          longitude: -68.8,
          stateName: 'Mendoza',
          cityName: 'Maipú',
          stateId: 13,
        },
        {
          id: 11,
          name: 'Catena Zapata',
          latitude: -33.1,
          longitude: -68.9,
          stateName: 'Mendoza',
          cityName: 'Luján de Cuyo',
          stateId: 13,
        },
      ],
      wineries: [
        {
          id: 10,
          name: 'Trapiche',
          stateId: 13,
          cityName: 'Maipú',
          foundationYear: 1883,
          hasCoordinates: true,
        },
        {
          id: 11,
          name: 'Catena Zapata',
          stateId: 13,
          cityName: 'Luján de Cuyo',
          foundationYear: 1902,
          hasCoordinates: true,
        },
      ],
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getAllByTestId('mock-barrel-marker')).toHaveLength(2);
    });

    fireEvent.click(screen.getByRole('button', { name: /Mendoza/i }));

    const trapicheRow = screen.getByTestId('winery-row-10');
    fireEvent.mouseEnter(trapicheRow);

    const markersOnHover = screen.getAllByTestId('mock-barrel-marker');
    expect(markersOnHover[0]).toHaveAttribute('data-highlighted', 'true');
    expect(markersOnHover[1]).toHaveAttribute('data-highlighted', 'false');

    fireEvent.mouseLeave(trapicheRow);
    expect(screen.getAllByTestId('mock-barrel-marker')[0]).toHaveAttribute(
      'data-highlighted',
      'false',
    );

    // Click en el área de la fila enfoca el mapa en Trapiche
    fireEvent.click(trapicheRow);
    expect(mockFlyTo).toHaveBeenCalledWith([-33.0, -68.8], 12, { duration: 0.45 });
    expect(screen.getAllByTestId('mock-barrel-marker')[0]).toHaveAttribute(
      'data-highlighted',
      'true',
    );
    expect(within(trapicheRow).getByText('Enfocada')).toBeInTheDocument();

    // Segundo click vuelve al encuadre general de la provincia
    fireEvent.click(trapicheRow);
    expect(within(trapicheRow).getByText('En mapa')).toBeInTheDocument();
  });

  it('muestra aviso en lugar del mapa si la provincia seleccionada no tiene pines con coordenadas', async () => {
    vi.mocked(getWineriesByRegion).mockResolvedValueOnce({
      totalWineries: 3,
      withoutCoordinates: 1,
      regions: [
        { stateId: 13, stateName: 'Mendoza', wineryCount: 2 },
        { stateId: 2, stateName: 'Córdoba', wineryCount: 1 },
      ],
      pins: [
        {
          id: 1,
          name: 'Bodega Mendoza',
          latitude: -33.0,
          longitude: -68.8,
          stateName: 'Mendoza',
          cityName: 'Maipú',
          stateId: 13,
        },
      ],
      wineries: [
        {
          id: 2,
          name: 'Bodega Serrana',
          stateId: 2,
          cityName: 'Villa General Belgrano',
          foundationYear: null,
          hasCoordinates: false,
        },
      ],
    });

    renderCard();

    await waitFor(() => {
      expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Córdoba/i }));

    expect(screen.queryByTestId('mock-map-container')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Las bodegas de Córdoba no tienen coordenadas cargadas para mostrar en el mapa.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Mostrar todas las bodegas/i }));
    expect(screen.getByTestId('mock-map-container')).toBeInTheDocument();
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
            stateId: 1,
          },
        ],
        wineries: [],
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
            stateId: 1,
          },
        ],
        wineries: [],
      });

    const { unmount } = renderCard();

    await waitFor(() => {
      expect(
        screen.getByText('3 bodegas no tienen coordenadas y no aparecen en el mapa.'),
      ).toBeInTheDocument();
    });

    unmount();
    renderCard();

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
      wineries: [],
    });

    renderCard();

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
