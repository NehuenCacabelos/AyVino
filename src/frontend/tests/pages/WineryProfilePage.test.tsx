import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryProfilePage from '@/pages/WineryProfilePage';
import * as wineryApi from '@/features/winery/api/wineryApi';
import type { RegionPickerProps } from '@/features/winery/components/RegionPicker';
import type { ImageUploadFieldProps } from '@/features/winery/components/ImageUploadField';
import type { WineryResponseDto } from '@/features/winery/types';

// Mock de useWinery
const mockReload = vi.fn();
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

vi.mock('@/features/winery/context/WineryContext', () => ({
  useWinery: () => ({
    winery: mockWinery,
    reload: mockReload,
    isLoading: false,
    error: null,
    isNotFound: false,
  }),
}));

vi.mock('@/features/winery/api/wineryApi', () => ({
  updateWinery: vi.fn(),
  getMyWinery: vi.fn(),
  getWineryById: vi.fn(),
  getWineries: vi.fn(),
  registerWinery: vi.fn(),
  getWineryFollowers: vi.fn(),
  followWinery: vi.fn(),
  unfollowWinery: vi.fn(),
}));

// Mock de RegionPicker
vi.mock('@/features/winery/components/RegionPicker', () => ({
  default: ({ onChange, initialLocationText }: RegionPickerProps) => (
    <div data-testid="mock-region-picker">
      <span data-testid="initial-location-text">{initialLocationText}</span>
      <button
        type="button"
        data-testid="change-to-map-coords-btn"
        onClick={() =>
          onChange({
            mode: 'map',
            latitude: -34.1111,
            longitude: -69.2222,
            regionName: 'Valle de Uco',
            stateName: 'Mendoza',
          })
        }
      >
        Cambiar a Coordenadas
      </button>
    </div>
  ),
}));

// Mock de ImageUploadField
vi.mock('@/features/winery/components/ImageUploadField', () => ({
  default: ({ value, onChange, onUploadingChange }: ImageUploadFieldProps) => (
    <div data-testid="mock-image-upload-field">
      <span data-testid="current-logo-value">{value}</span>
      <button
        type="button"
        data-testid="upload-new-logo-btn"
        onClick={() => {
          onUploadingChange?.(true);
          onChange('https://storage.com/new-logo.png');
          onUploadingChange?.(false);
        }}
      >
        Subir nuevo logo
      </button>
      <button
        type="button"
        data-testid="remove-logo-btn"
        onClick={() => onChange('')}
      >
        Quitar logo
      </button>
    </div>
  ),
}));

describe('WineryProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReload.mockResolvedValue({});
    vi.mocked(wineryApi.updateWinery).mockResolvedValue({
      ...mockWinery,
    });
  });

  it('renders winery profile with current values and preview', () => {
    render(
      <MemoryRouter>
        <WineryProfilePage />
      </MemoryRouter>,
    );

    expect(screen.getByDisplayValue('Bodega El Terruño')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1910')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://elterruno.com.ar')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Historia noble de un viñedo familiar centenario.'),
    ).toBeInTheDocument();

    expect(screen.getByTestId('initial-location-text')).toHaveTextContent(
      'Luján de Cuyo, Mendoza',
    );
    expect(screen.getByTestId('current-logo-value')).toHaveTextContent(
      'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo42.png',
    );
  });

  it('does NOT send location or logo in PUT payload if they were not touched by the user', async () => {
    render(
      <MemoryRouter>
        <WineryProfilePage />
      </MemoryRouter>,
    );

    // Solo modificar el nombre de la bodega
    const nameInput = screen.getByLabelText('Nombre de la bodega');
    fireEvent.change(nameInput, { target: { value: 'Bodega El Terruño Renombrada' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(wineryApi.updateWinery).toHaveBeenCalledWith(42, {
        name: 'Bodega El Terruño Renombrada',
        foundationYear: 1910,
        website: 'https://elterruno.com.ar',
        description: 'Historia noble de un viñedo familiar centenario.',
      });
      expect(mockReload).toHaveBeenCalled();
    });
  });

  it('sends updated coordinates when user modifies location via RegionPicker', async () => {
    render(
      <MemoryRouter>
        <WineryProfilePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('change-to-map-coords-btn'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(wineryApi.updateWinery).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          name: 'Bodega El Terruño',
          latitude: -34.1111,
          longitude: -69.2222,
          locationId: null,
        }),
      );
    });
  });

  it('sends logoUrl as empty string "" when user clicks "Quitar logo"', async () => {
    render(
      <MemoryRouter>
        <WineryProfilePage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByTestId('remove-logo-btn'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      expect(wineryApi.updateWinery).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          name: 'Bodega El Terruño',
          logoUrl: '',
        }),
      );
    });
  });
});
