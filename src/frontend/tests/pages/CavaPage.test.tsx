import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CavaPage from '@/pages/CavaPage';
import * as cellarApi from '@/features/cava/api/cellarApi';
import type { CellarDto, CellarItemDto } from '@/features/users/types';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { username: 'Brian' } }),
}));

vi.mock('@/features/cava/api/cellarApi', async () => {
  const actual = await vi.importActual<typeof cellarApi>('@/features/cava/api/cellarApi');
  return {
    ...actual,
    getCellarsApi: vi.fn(),
    getCellarItemsApi: vi.fn(),
    createCellarApi: vi.fn(),
    renameCellarApi: vi.fn(),
    deleteCellarApi: vi.fn(),
    updateCellarItemApi: vi.fn(),
    deleteCellarItemApi: vi.fn(),
  };
});

describe('CavaPage Component (Vista 3A: Cava Real)', () => {
  const sampleCellars: CellarDto[] = [
    {
      id: 10,
      name: 'Cava Principal',
      vintageCount: 3,
      bottleCount: 7,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 20,
      name: 'Heladera Cava',
      vintageCount: 1,
      bottleCount: 2,
      createdAt: '2026-01-02T00:00:00Z',
    },
  ];

  const sampleItemsCellar10: CellarItemDto[] = [
    {
      wineVintageId: 101,
      wineId: 1,
      name: 'Catena Alta Malbec',
      wineType: 'Red',
      wineryId: 5,
      wineryNameText: 'Catena Zapata',
      year: 2018,
      imageId: '11111111-1111-1111-1111-111111111111',
      imageUrl: null,
      averageRating: 4.8,
      reviewCount: 25,
      quantity: 3,
      purchaseDate: '2023-05-10',
      notes: 'Comprado en bodega',
      lastChangeAt: '2026-01-01T00:00:00Z',
    },
    {
      wineVintageId: 102,
      wineId: 2,
      name: 'Salentein Reserve Chardonnay',
      wineType: 'White',
      wineryId: 6,
      wineryNameText: 'Salentein',
      year: 2021,
      imageId: null,
      imageUrl: null,
      averageRating: 4.2,
      reviewCount: 10,
      quantity: 2,
      purchaseDate: null,
      notes: null,
      lastChangeAt: '2026-01-01T00:00:00Z',
    },
    {
      wineVintageId: 103,
      wineId: 3,
      name: 'Blend de la Casa',
      wineType: 'Red',
      wineryId: null,
      wineryNameText: 'Vino Garage',
      year: null, // Sin añada
      imageId: null,
      imageUrl: null,
      averageRating: null, // Sin puntaje
      reviewCount: 0,
      quantity: 2,
      purchaseDate: null,
      notes: null,
      lastChangeAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (initialEntries = ['/cava']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/cava" element={<CavaPage />} />
          <Route path="/vinos/:id" element={<div>Ficha Vino</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders empty state "Crear tu primera cava" when user has 0 cellars', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([]);

    renderComponent();

    expect(await screen.findByText('Crear tu primera cava')).toBeInTheDocument();
    expect(screen.getByText('Crear mi primera cava')).toBeInTheDocument();

    // Click opens creation modal
    fireEvent.click(screen.getByText('Crear mi primera cava'));
    expect(await screen.findByRole('heading', { name: 'Nueva Cava' })).toBeInTheDocument();
  });

  it('loads real cellars, respects ?cava=20 in URL, and renders its bottles', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue(sampleCellars);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue([
      {
        wineVintageId: 201,
        wineId: 99,
        name: 'Chandon Extra Brut',
        wineType: 'Sparkling',
        wineryId: 8,
        wineryNameText: 'Chandon',
        year: 2022,
        imageId: null,
        imageUrl: null,
        averageRating: 4.6,
        reviewCount: 5,
        quantity: 2,
        purchaseDate: null,
        notes: null,
        lastChangeAt: '2026-01-01T00:00:00Z',
      },
    ]);

    renderComponent(['/cava?cava=20']);

    // Check header and selector showing Heladera Cava
    expect(await screen.findByText('Bóveda Personal de Brian')).toBeInTheDocument();
    const select = screen.getByLabelText('Seleccionar cava') as HTMLSelectElement;
    expect(select.value).toBe('20');

    // Bottle in cellar 20 rendered
    expect(await screen.findByText('Chandon Extra Brut')).toBeInTheDocument();
    expect(screen.getByText('2 botellas')).toBeInTheDocument();
  });

  it('disables "Nueva cava" button when user reaches 3 cellars', async () => {
    const threeCellars: CellarDto[] = [
      ...sampleCellars,
      { id: 30, name: 'Cava Quincho', vintageCount: 0, bottleCount: 0, createdAt: '2026-01-03T00:00:00Z' },
    ];
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue(threeCellars);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue([]);

    renderComponent();

    const newCellarBtn = await screen.findByRole('button', { name: /Nueva cava/i });
    expect(newCellarBtn).toBeDisabled();
    expect(newCellarBtn).toHaveAttribute('title', 'Máximo 3 cavas');
    expect(screen.getByText('(Máximo 3 cavas)')).toBeInTheDocument();
  });

  it('displays backend 409 conflict message when creating cellar with repeated name or exceeding limit', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue(sampleCellars);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue([]);
    vi.mocked(cellarApi.createCellarApi).mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          detail: 'Ya tenés una cava llamada «Cava Principal». Elegí otro nombre.',
        },
      },
    });

    renderComponent();

    const openBtn = await screen.findByRole('button', { name: /Nueva cava/i });
    fireEvent.click(openBtn);

    const input = screen.getByPlaceholderText(/Ej: Cava Subterránea/i);
    fireEvent.change(input, { target: { value: 'Cava Principal' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear cava' }));

    expect(
      await screen.findByText('Ya tenés una cava llamada «Cava Principal». Elegí otro nombre.')
    ).toBeInTheDocument();
  });

  it('renames cellar and updates active cellar name', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue(sampleCellars);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue([]);
    vi.mocked(cellarApi.renameCellarApi).mockResolvedValueOnce({
      id: 10,
      name: 'Cava Master',
      vintageCount: 3,
      bottleCount: 7,
      createdAt: '2026-01-01T00:00:00Z',
    });

    renderComponent();

    const renameBtn = await screen.findByRole('button', { name: /Renombrar/i });
    fireEvent.click(renameBtn);

    expect(await screen.findByRole('heading', { name: 'Renombrar Cava' })).toBeInTheDocument();
    const input = screen.getByDisplayValue('Cava Principal');
    fireEvent.change(input, { target: { value: 'Cava Master' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar nombre' }));

    await waitFor(() => {
      expect(cellarApi.renameCellarApi).toHaveBeenCalledWith(10, { name: 'Cava Master' });
    });
  });

  it('deletes cellar and shows 409 error if cellar still has bottles', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue(sampleCellars);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue([]);
    vi.mocked(cellarApi.deleteCellarApi).mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          detail: 'La cava todavía tiene botellas. Vaciala antes de borrarla.',
        },
      },
    });

    renderComponent();

    const deleteBtn = await screen.findByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteBtn);

    expect(await screen.findByRole('heading', { name: '¿Eliminar esta cava?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cava' }));

    expect(
      await screen.findByText('La cava todavía tiene botellas. Vaciala antes de borrarla.')
    ).toBeInTheDocument();
  });

  it('calculates vitals correctly (total bottles, reds, whites, oldest vintage) and shows "—" for missing', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue([sampleCellars[0]]);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue(sampleItemsCellar10);

    renderComponent();

    // Total: 3 (Catena) + 2 (Salentein) + 2 (Blend) = 7 bottles
    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(screen.getByText('5 Tintos')).toBeInTheDocument();
    expect(screen.getByText('2 Blancos')).toBeInTheDocument();
    expect(screen.getByText('0 Esp.')).toBeInTheDocument();

    // Oldest vintage: min(2018, 2021) = 2018
    expect(screen.getByText('2018')).toBeInTheDocument();

    // Dominant varietal is not in backend item -> shows "—"
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('tabs "Óptimas" and "Guarda" show "Próximamente" message', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValue([sampleCellars[0]]);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValue(sampleItemsCellar10);

    renderComponent();

    await screen.findByText('Catena Alta Malbec');

    // Click Óptimas
    fireEvent.click(screen.getByRole('button', { name: /Óptimas/i }));
    expect(await screen.findByText(/Próximamente se mostrará la ventana óptima de consumo/i)).toBeInTheDocument();

    // Click En guarda
    fireEvent.click(screen.getByRole('button', { name: /En guarda/i }));
    expect(await screen.findByText(/Próximamente se mostrará la ventana óptima de consumo/i)).toBeInTheDocument();
  });

  it('displays error state on network error and recovers with retry', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    expect(await screen.findByText(/No se pudieron cargar tus cavas/i)).toBeInTheDocument();

    // Retry recovery
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce(sampleCellars);
    vi.mocked(cellarApi.getCellarItemsApi).mockResolvedValueOnce([]);

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    expect(await screen.findByText('Bóveda Personal de Brian')).toBeInTheDocument();
  });
});
