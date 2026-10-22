import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import RegionPicker from '@/features/winery/components/RegionPicker';
import * as locationApi from '@/features/winery/api/locationApi';
import type { StateResponseDto, CityResponseDto, ResolvedLocationResponseDto } from '@/features/winery/types';

// Variable para capturar el clickHandler de useMapEvents
let mapClickHandler: ((e: { latlng: { lat: number; lng: number } }) => void) | null = null;

// Mock de react-leaflet para entorno JSDOM
vi.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children }: { children: ReactNode }) => (
      <div data-testid="map-container">
        {children}
        <button
          type="button"
          data-testid="mock-map-click-trigger"
          onClick={() => mapClickHandler?.({ latlng: { lat: -32.8895, lng: -68.8458 } })}
        >
          Click Map
        </button>
      </div>
    ),
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({
      position,
      eventHandlers,
    }: {
      position: [number, number];
      eventHandlers?: { dragend?: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => void };
    }) => (
      <div
        data-testid="marker"
        data-lat={position[0]}
        data-lng={position[1]}
        onClick={() => {
          if (eventHandlers?.dragend) {
            eventHandlers.dragend({
              target: { getLatLng: () => ({ lat: position[0], lng: position[1] }) },
            });
          }
        }}
      />
    ),
    useMap: () => ({
      panTo: vi.fn(),
      setView: vi.fn(),
      getZoom: () => 10,
    }),
    useMapEvents: (handlers: { click?: (e: { latlng: { lat: number; lng: number } }) => void }) => {
      mapClickHandler = handlers.click ?? null;
      return null;
    },
  };
});

// Mock de la API de ubicaciones
vi.mock('@/features/winery/api/locationApi', () => ({
  resolveLocation: vi.fn(),
  getStates: vi.fn(),
  getCities: vi.fn(),
  getLocations: vi.fn(),
  getStateById: vi.fn(),
  getCityById: vi.fn(),
  getLocationById: vi.fn(),
}));

describe('RegionPicker Component', () => {
  const mockStates: StateResponseDto[] = [
    { id: 1, name: 'Mendoza' },
    { id: 2, name: 'San Juan' },
  ];

  const mockCitiesMendoza: CityResponseDto[] = [
    { id: 10, name: 'Luján de Cuyo', stateId: 1, status: 'Approved' },
    { id: 11, name: 'Maipú', stateId: 1, status: 'Approved' },
    { id: 12, name: 'Tupungato', stateId: 1, status: 'Approved' },
  ];

  const mockResolved: ResolvedLocationResponseDto = {
    locationId: 10,
    stateId: 1,
    stateName: 'Mendoza',
    regionId: 10,
    regionName: 'Luján de Cuyo',
    municipalityName: 'Mayor Drummond',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mapClickHandler = null;
    vi.mocked(locationApi.getStates).mockResolvedValue(mockStates);
    vi.mocked(locationApi.getCities).mockResolvedValue(mockCitiesMendoza);
    vi.mocked(locationApi.resolveLocation).mockResolvedValue(mockResolved);
  });

  it('renders map mode by default and displays map container and action buttons', () => {
    const onChangeMock = vi.fn();
    render(<RegionPicker value={null} onChange={onChangeMock} />);

    expect(screen.getByText('Mapa de ubicación oficial')).toBeInTheDocument();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByLabelText(/Usar mi ubicación/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cambiar a selección manual por lista/i)).toBeInTheDocument();
  });

  it('resolves coordinates via API when map is clicked and calls onChange with editorial details', async () => {
    const onChangeMock = vi.fn();
    render(<RegionPicker value={null} onChange={onChangeMock} />);

    const mapClickTrigger = screen.getByTestId('mock-map-click-trigger');
    fireEvent.click(mapClickTrigger);

    await waitFor(() => {
      expect(locationApi.resolveLocation).toHaveBeenCalledWith(-32.8895, -68.8458);
      expect(onChangeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'map',
          latitude: -32.8895,
          longitude: -68.8458,
          locationId: 10,
          regionName: 'Luján de Cuyo',
          stateName: 'Mendoza',
          municipalityName: 'Mayor Drummond',
        }),
      );
    });
  });

  it('displays error message when coordinates are outside Argentina (HTTP 422)', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: { detail: 'Las coordenadas se encuentran fuera del territorio nacional.' },
      },
    };
    vi.mocked(locationApi.resolveLocation).mockRejectedValueOnce(axiosError);

    render(<RegionPicker value={null} onChange={vi.fn()} />);

    const mapClickTrigger = screen.getByTestId('mock-map-click-trigger');
    fireEvent.click(mapClickTrigger);

    await waitFor(() => {
      expect(
        screen.getByText('Las coordenadas se encuentran fuera del territorio nacional.'),
      ).toBeInTheDocument();
    });
  });

  it('displays service unavailable error and allows switching to manual mode on HTTP 503', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { detail: 'Georef indisponible' },
      },
    };
    vi.mocked(locationApi.resolveLocation).mockRejectedValueOnce(axiosError);

    render(<RegionPicker value={null} onChange={vi.fn()} />);

    const mapClickTrigger = screen.getByTestId('mock-map-click-trigger');
    fireEvent.click(mapClickTrigger);

    await waitFor(() => {
      expect(
        screen.getByText(/El servicio oficial de resolución geográfica no se encuentra disponible/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Ir al selector manual/i })).toBeInTheDocument();
    });

    // Click switch to manual
    fireEvent.click(screen.getByRole('button', { name: /Ir al selector manual/i }));
    await waitFor(() => {
      expect(screen.getByText('Selección manual de región')).toBeInTheDocument();
    });
  });

  it('displays rate limiting notice and retry button on HTTP 429', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 429,
        data: {},
      },
    };
    vi.mocked(locationApi.resolveLocation).mockRejectedValueOnce(axiosError);

    render(<RegionPicker value={null} onChange={vi.fn()} />);

    const mapClickTrigger = screen.getByTestId('mock-map-click-trigger');
    fireEvent.click(mapClickTrigger);

    await waitFor(() => {
      expect(
        screen.getByText(/Llegaste al límite de consultas por minuto/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();
    });
  });

  it('toggles to manual mode, loads states and cities with pageSize 250, and filters by text', async () => {
    const onChangeMock = vi.fn();
    render(<RegionPicker value={null} onChange={onChangeMock} />);

    // Switch to manual mode
    fireEvent.click(screen.getByLabelText(/Cambiar a selección manual por lista/i));

    await waitFor(() => {
      expect(locationApi.getStates).toHaveBeenCalled();
      expect(screen.getByText('Mendoza')).toBeInTheDocument();
      expect(screen.getByText('San Juan')).toBeInTheDocument();
    });

    // Select Mendoza
    const stateSelect = screen.getByLabelText('Provincia vitivinícola');
    fireEvent.change(stateSelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(locationApi.getCities).toHaveBeenCalledWith({ stateId: 1, pageSize: 250 });
      expect(screen.getByText('Luján de Cuyo')).toBeInTheDocument();
      expect(screen.getByText('Maipú')).toBeInTheDocument();
      expect(screen.getByText('Tupungato')).toBeInTheDocument();
    });

    // Select Tupungato
    const citySelect = screen.getByLabelText('Región oficial');
    fireEvent.change(citySelect, { target: { value: '12' } });

    expect(onChangeMock).toHaveBeenCalledWith({
      mode: 'manual',
      locationId: 12,
      regionName: 'Tupungato',
      stateName: 'Mendoza',
    });
  });

  it('renders editorial confirmation card when value is provided', () => {
    render(
      <RegionPicker
        value={{
          mode: 'map',
          latitude: -32.8895,
          longitude: -68.8458,
          locationId: 10,
          regionName: 'Luján de Cuyo',
          stateName: 'Mendoza',
          municipalityName: 'Mayor Drummond',
        }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Región confirmada')).toBeInTheDocument();
    expect(screen.getByText(/Tu bodega está en:/i)).toBeInTheDocument();
    expect(screen.getByText(/Luján de Cuyo, Mendoza/i)).toBeInTheDocument();
    expect(screen.getByText(/Mayor Drummond/i)).toBeInTheDocument();
  });
});
