import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryConfigPage from '@/pages/WineryConfigPage';
import * as wineryApi from '@/features/winery/api/wineryApi';
import type { RegionPickerProps } from '@/features/winery/components/RegionPicker';
import type { WineryResponseDto } from '@/features/winery/types';

// Mock de useAuth
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
  uploadImage: vi.fn(),
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

// Mock de userApi
vi.mock('@/features/users/api/userApi', () => ({
  getCurrentUserApi: vi.fn().mockResolvedValue({
    id: 5,
    username: 'don_alberto',
    email: 'alberto@bodegaelterruno.com',
    role: 'Winery',
    registerDate: '2026-01-15T10:00:00Z',
  }),
  changePasswordApi: vi.fn().mockResolvedValue(undefined),
}));

describe('WineryConfigPage (/bodega/configuracion)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <WineryConfigPage />
      </MemoryRouter>
    );

  it('renderiza la identidad de la bodega y sus 4 pestañas de configuración', async () => {
    renderComponent();

    // Esperar a que se resuelva la carga del usuario y el montaje
    await waitFor(() => {
      expect(screen.getByText('Volver al panel')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Bodega El Terruño').length).toBeGreaterThan(0);
    expect(screen.getByText('Bodega Oficial')).toBeInTheDocument();

    // Botones de pestañas
    expect(screen.getByRole('button', { name: /^datos de la bodega$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^región y terruño$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^cuenta del responsable$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^seguridad y contraseña$/i })).toBeInTheDocument();
  });

  it('permite actualizar los datos de la bodega y despacha updateWinery', async () => {
    const updateSpy = vi.spyOn(wineryApi, 'updateWinery').mockResolvedValueOnce({
      ...mockWinery,
      name: 'Bodega El Terruño Renombrada',
    });

    renderComponent();

    const nameInput = screen.getByPlaceholderText(/Catena Zapata/i);
    expect(nameInput).toHaveValue('Bodega El Terruño');

    fireEvent.change(nameInput, { target: { value: 'Bodega El Terruño Renombrada' } });

    const submitBtn = screen.getByRole('button', { name: /guardar datos de la bodega/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          name: 'Bodega El Terruño Renombrada',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/¡Datos de la bodega actualizados con éxito!/i)).toBeInTheDocument();
    });
  });

  it('permite alternar a la pestaña de seguridad y validar coincidencia de contraseñas', async () => {
    renderComponent();

    // Cambiar a pestaña seguridad
    const secTab = screen.getByRole('button', { name: /seguridad y contraseña/i });
    fireEvent.click(secTab);

    expect(screen.getByText(/Seguridad y Acceso a la Cuenta/i)).toBeInTheDocument();

    // Rellenar contraseñas no coincidentes
    const curPassInput = screen.getByPlaceholderText(/Ingresá tu contraseña vigente/i);
    const newPassInput = screen.getByPlaceholderText(/Mínimo 8 caracteres/i);
    const confirmPassInput = screen.getByPlaceholderText(/Repetí la nueva contraseña/i);

    fireEvent.change(curPassInput, { target: { value: 'ClaveVieja123!' } });
    fireEvent.change(newPassInput, { target: { value: 'NuevaClaveSegura1' } });
    fireEvent.change(confirmPassInput, { target: { value: 'DiferenteClave2' } });

    const submitBtn = screen.getByRole('button', { name: /actualizar contraseña/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/La confirmación de la contraseña no coincide/i)).toBeInTheDocument();
    });
  });

  it('permite alternar a la pestaña de cuenta del responsable y muestra usuario y correo en solo lectura', async () => {
    renderComponent();

    const accTab = screen.getByRole('button', { name: /cuenta del responsable/i });
    fireEvent.click(accTab);

    expect(screen.getByText(/Cuenta del Responsable Institucional/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('don_alberto')).toBeInTheDocument();
      expect(screen.getByDisplayValue('alberto@bodegaelterruno.com')).toBeInTheDocument();
    });
  });

  it('permite actualizar el terruño mediante el RegionPicker', async () => {
    const updateSpy = vi.spyOn(wineryApi, 'updateWinery').mockResolvedValueOnce({
      ...mockWinery,
      latitude: -34.1111,
      longitude: -69.2222,
    });

    renderComponent();

    const regionTab = screen.getByRole('button', { name: /región y terruño/i });
    fireEvent.click(regionTab);

    expect(screen.getByText(/Ubicación Geográfica y Terruño/i)).toBeInTheDocument();

    const changeCoordsBtn = screen.getByTestId('change-to-map-coords-btn');
    fireEvent.click(changeCoordsBtn);

    const submitBtn = screen.getByRole('button', { name: /actualizar región y terruño/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          latitude: -34.1111,
          longitude: -69.2222,
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/¡Ubicación y terruño actualizados correctamente!/i)).toBeInTheDocument();
    });
  });

  it('permite hacer clic directamente en la imagen del logo institucional para seleccionar y subir un nuevo logo', async () => {
    const uploadSpy = vi.spyOn(wineryApi, 'uploadImage').mockResolvedValueOnce({
      url: 'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/newlogo.webp',
    });
    const updateSpy = vi.spyOn(wineryApi, 'updateWinery').mockResolvedValueOnce({
      ...mockWinery,
      logoUrl: 'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/newlogo.webp',
    });

    renderComponent();

    const logoButton = screen.getByRole('button', { name: /cambiar logo institucional/i });
    expect(logoButton).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/cargar logo de bodega/i);
    const newFile = new File(['mock-image-bytes'], 'nuevo-logo.webp', { type: 'image/webp' });

    fireEvent.change(fileInput, { target: { files: [newFile] } });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(newFile, 'wineries');
      expect(updateSpy).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          logoUrl: 'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/newlogo.webp',
        })
      );
      expect(mockReload).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/¡Logo institucional actualizado con éxito!/i)).toBeInTheDocument();
    });
  });
});
