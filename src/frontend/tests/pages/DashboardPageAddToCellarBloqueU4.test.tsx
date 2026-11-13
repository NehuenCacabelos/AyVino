import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import { apiClient } from '@/services/apiClient';

const { mockClient } = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
  };
  return { mockClient: client };
});

vi.mock('@/services/apiClient', () => ({
  default: mockClient,
  apiClient: mockClient,
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/features/dashboard/api/catalogApi', () => ({
  getCatalogFilters: vi.fn().mockResolvedValue({
    grapes: [],
    provinces: [],
    wineries: [],
  }),
  getSearchSuggestions: vi.fn().mockResolvedValue({
    wines: [],
    wineries: [],
    grapes: [],
    regions: [],
  }),
  searchCatalogWines: vi.fn().mockResolvedValue([
    {
      id: 101,
      wineryId: 10,
      wineryName: 'Bodega Catena Zapata',
      name: 'Catena Zapata Malbec Argentino',
      description: 'Gran vino',
      wineType: 'Red',
      grapeName: 'Malbec',
      regionName: 'Mendoza, Argentina',
      defaultVintageYear: 2020,
      ratingAverage: 4.8,
      ratingsCount: 15,
      bottleKind: 'bordeaux',
    },
  ]),
}));

function DashboardTestHarness({ initialStock = 5 }: { initialStock?: number }) {
  const [stockCount, setStockCount] = [initialStock, vi.fn()];
  const refreshStock = vi.fn().mockResolvedValue(undefined);

  return (
    <Routes>
      <Route
        element={
          <Outlet
            context={{
              stockCount,
              setStockCount,
              refreshStock,
            }}
          />
        }
      >
        <Route path="/" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}

describe('Bloque U4 - Dashboard Add to Cellar & Cellar Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
  });

  it('el botón "Añadir a Cava" abre el modal en modo vino existente con matchedWineId', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <DashboardTestHarness />
      </MemoryRouter>,
    );

    // Esperamos que cargue la tarjeta del catálogo
    const addBtn = await screen.findByRole('button', { name: /Añadir a Cava/i });
    fireEvent.click(addBtn);

    // Debe abrir el modal con el vino bloqueado y precompletado
    expect(await screen.findByText('Ingresar Botella de Vino Existente')).toBeInTheDocument();
    const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
    expect(nameInput).toHaveValue('Catena Zapata Malbec Argentino');
    expect(nameInput).toBeDisabled();
  });

  it('guarda con POST /api/cellars/me/quick-add y muestra toast de éxito tras respuesta positiva', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        wineVintageId: 501,
        wineId: 101,
        name: 'Catena Zapata Malbec Argentino',
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <DashboardTestHarness />
      </MemoryRouter>,
    );

    const addBtn = await screen.findByRole('button', { name: /Añadir a Cava/i });
    fireEvent.click(addBtn);

    const submitBtn = await screen.findByRole('button', { name: /Guardar en Bóveda/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/cellars/me/quick-add',
        expect.objectContaining({
          matchedWineId: 101,
          name: 'Catena Zapata Malbec Argentino',
        }),
      );
    });

    // Toast de éxito visible
    expect(
      await screen.findByText(/"Catena Zapata Malbec Argentino" fue agregado con éxito a tu Cava\./i),
    ).toBeInTheDocument();
  });

  it('no muestra éxito y muestra el mensaje de error del backend cuando la API rechaza el guardado', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        data: {
          detail: 'El estante seleccionado está completo.',
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <DashboardTestHarness />
      </MemoryRouter>,
    );

    const addBtn = await screen.findByRole('button', { name: /Añadir a Cava/i });
    fireEvent.click(addBtn);

    const submitBtn = await screen.findByRole('button', { name: /Guardar en Bóveda/i });
    fireEvent.click(submitBtn);

    // Debe mostrar el error del backend (puede aparecer en toast y/o en el modal de alerta)
    await waitFor(() => {
      const errorElements = screen.getAllByText('El estante seleccionado está completo.');
      expect(errorElements.length).toBeGreaterThan(0);
    });

    // NUNCA debe mostrar el toast de éxito
    expect(
      screen.queryByText(/"Catena Zapata Malbec Argentino" fue agregado con éxito a tu Cava\./i),
    ).toBeNull();
  });
});
