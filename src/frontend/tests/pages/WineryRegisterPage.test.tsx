import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryRegisterPage from '@/pages/WineryRegisterPage';
import * as wineryApi from '@/features/winery/api/wineryApi';
import type { RegionPickerProps } from '@/features/winery/components/RegionPicker';

// Mock de useAuth
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    login: mockLogin,
    register: vi.fn(),
    loginDemo: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock de registerWinery
vi.mock('@/features/winery/api/wineryApi', () => ({
  registerWinery: vi.fn(),
  getMyWinery: vi.fn(),
  getWineryById: vi.fn(),
  getWineries: vi.fn(),
  updateWinery: vi.fn(),
  getWineryFollowers: vi.fn(),
  followWinery: vi.fn(),
  unfollowWinery: vi.fn(),
}));

// Mock de RegionPicker para simplificar la interacción en el test de integración de página
vi.mock('@/features/winery/components/RegionPicker', () => ({
  default: ({ value, onChange, error }: RegionPickerProps) => (
    <div data-testid="mock-region-picker">
      <span data-testid="selected-region-text">
        {value ? `${value.regionName}, ${value.stateName}` : 'Sin región'}
      </span>
      {error && <p data-testid="region-error">{error}</p>}
      <button
        type="button"
        data-testid="select-coords-btn"
        onClick={() =>
          onChange({
            mode: 'map',
            latitude: -32.8895,
            longitude: -68.8458,
            locationId: 10,
            regionName: 'Luján de Cuyo',
            stateName: 'Mendoza',
          })
        }
      >
        Elegir Coordenadas
      </button>
      <button
        type="button"
        data-testid="select-manual-btn"
        onClick={() =>
          onChange({
            mode: 'manual',
            locationId: 12,
            regionName: 'Tupungato',
            stateName: 'Mendoza',
          })
        }
      >
        Elegir Manual
      </button>
    </div>
  ),
}));

describe('WineryRegisterPage Stepper Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue({});
    vi.mocked(wineryApi.registerWinery).mockResolvedValue({
      winery: {
        id: 1,
        name: 'Bodega Test',
        description: null,
        locationId: 10,
        foundationYear: null,
        website: null,
        userId: 2,
        status: 'Pending',
        registerDate: '2026-01-01',
      },
      accessToken: 'test-token',
      tokenType: 'Bearer',
      expiresAt: '2026-01-02',
    });
  });

  it('renders Step 1 by default and validates required fields on advance attempt', async () => {
    render(
      <MemoryRouter>
        <WineryRegisterPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('Registrá tu bodega oficial')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre del responsable')).toBeInTheDocument();

    // Intentar avanzar con formulario vacío
    fireEvent.click(screen.getByRole('button', { name: /Continuar a ubicación/i }));

    expect(screen.getByText('El nombre del responsable es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El correo electrónico es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('Debés repetir la contraseña')).toBeInTheDocument();
    expect(screen.getByText('El nombre de la bodega es obligatorio')).toBeInTheDocument();
    expect(screen.queryByText('Paso 2 de 2')).not.toBeInTheDocument();
  });

  it('advances to Step 2 when Step 1 is valid, and allows returning to Step 1 preserving entered data', async () => {
    render(
      <MemoryRouter>
        <WineryRegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre del responsable'), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo institucional de contacto'), {
      target: { value: 'contacto@catena.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8)'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repetir clave'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Nombre oficial de la bodega (ej: Bodega Catena Zapata)'),
      {
        target: { value: 'Bodega Catena' },
      },
    );

    // Avanzar a Paso 2
    fireEvent.click(screen.getByRole('button', { name: /Continuar a ubicación/i }));

    expect(screen.getByText('Paso 2 de 2')).toBeInTheDocument();
    expect(screen.getByText('¿Dónde está tu bodega?')).toBeInTheDocument();
    expect(screen.getByTestId('mock-region-picker')).toBeInTheDocument();

    // Volver a Paso 1
    fireEvent.click(screen.getByRole('button', { name: /Volver al paso 1/i }));

    expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('contacto@catena.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bodega Catena')).toBeInTheDocument();
  });

  it('submits registration with coordinates when region is chosen via map and terms accepted', async () => {
    render(
      <MemoryRouter>
        <WineryRegisterPage />
      </MemoryRouter>,
    );

    // Llenar Paso 1
    fireEvent.change(screen.getByPlaceholderText('Nombre del responsable'), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo institucional de contacto'), {
      target: { value: 'contacto@catena.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8)'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repetir clave'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Nombre oficial de la bodega (ej: Bodega Catena Zapata)'),
      {
        target: { value: 'Bodega Catena' },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar a ubicación/i }));

    // En Paso 2, seleccionar coordenadas vía mock
    fireEvent.click(screen.getByTestId('select-coords-btn'));

    // Aceptar términos
    const termsCheckbox = screen.getByRole('checkbox');
    fireEvent.click(termsCheckbox);

    // Finalizar registro
    fireEvent.click(screen.getByRole('button', { name: /Finalizar registro de bodega/i }));

    await waitFor(() => {
      expect(wineryApi.registerWinery).toHaveBeenCalledWith({
        username: 'Juan Pérez',
        email: 'contacto@catena.com',
        password: 'Password123!',
        wineryName: 'Bodega Catena',
        latitude: -32.8895,
        longitude: -68.8458,
        locationId: null,
      });

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'contacto@catena.com',
        password: 'Password123!',
      });
    });
  });

  it('navigates back to Step 1 and displays error on email field when backend returns 409 conflict', async () => {
    const axios409Error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: { detail: 'El correo electrónico ya se encuentra registrado.' },
      },
    };
    vi.mocked(wineryApi.registerWinery).mockRejectedValueOnce(axios409Error);

    render(
      <MemoryRouter>
        <WineryRegisterPage />
      </MemoryRouter>,
    );

    // Llenar Paso 1
    fireEvent.change(screen.getByPlaceholderText('Nombre del responsable'), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo institucional de contacto'), {
      target: { value: 'repetido@catena.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8)'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repetir clave'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Nombre oficial de la bodega (ej: Bodega Catena Zapata)'),
      {
        target: { value: 'Bodega Catena' },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar a ubicación/i }));

    // Paso 2
    fireEvent.click(screen.getByTestId('select-manual-btn'));
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /Finalizar registro de bodega/i }));

    await waitFor(() => {
      // Regresa automáticamente al Paso 1
      expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
      expect(
        screen.getAllByText('El correo electrónico ya se encuentra registrado.').length,
      ).toBeGreaterThanOrEqual(1);
    });
  });

  it('navigates back to Step 1 and displays error on username field when backend returns 409 conflict for username', async () => {
    const axios409Error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: { detail: "El nombre de usuario 'Juan Pérez' ya está en uso." },
      },
    };
    vi.mocked(wineryApi.registerWinery).mockRejectedValueOnce(axios409Error);

    render(
      <MemoryRouter>
        <WineryRegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Nombre del responsable'), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByPlaceholderText('Correo institucional de contacto'), {
      target: { value: 'contacto@catena.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Contraseña (mín. 8)'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Repetir clave'), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Nombre oficial de la bodega (ej: Bodega Catena Zapata)'),
      {
        target: { value: 'Bodega Catena' },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar a ubicación/i }));

    fireEvent.click(screen.getByTestId('select-manual-btn'));
    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /Finalizar registro de bodega/i }));

    await waitFor(() => {
      expect(screen.getByText('Paso 1 de 2')).toBeInTheDocument();
      expect(
        screen.getAllByText("El nombre de usuario 'Juan Pérez' ya está en uso.").length,
      ).toBeGreaterThanOrEqual(1);
    });
  });
});
