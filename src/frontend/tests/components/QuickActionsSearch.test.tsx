import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickActions from '@/features/dashboard/components/QuickActions';
import * as wineApi from '@/features/winery/api/wineApi';
import type { WineListItemDto } from '@/features/winery/types/wine';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/winery/api/wineApi', () => ({
  searchWines: vi.fn(),
  createWine: vi.fn(),
  getWineVintages: vi.fn(),
  createWineVintage: vi.fn(),
  matchWine: vi.fn(),
  putMyVintageImage: vi.fn(),
  extractConflictWineExtensions: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({ user: { username: 'Brian Botta' } }),
}));

describe('QuickActions Search Dropdown (Vista 4)', () => {
  const sampleWines: WineListItemDto[] = [
    {
      id: 1,
      name: 'Catena Zapata Malbec Argentino',
      wineryId: 10,
      wineryNameText: 'Catena Zapata',
      wineType: 'Red',
      description: null,
      locationId: null,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.8,
      reviewCount: 15,
      referenceVintageYear: 2019,
      thumbnailImageId: null,
    },
    {
      id: 2,
      name: 'Nicolás Catena Zapata',
      wineryId: 10,
      wineryNameText: 'Catena Zapata',
      wineType: 'Red',
      description: null,
      locationId: null,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.9,
      reviewCount: 22,
      referenceVintageYear: 2018,
      thumbnailImageId: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i)).toBeInTheDocument();
  });

  it('performs parallel search and renders dropdown with results', async () => {
    vi.mocked(wineApi.searchWines).mockImplementation(async (params) => {
      if (params.name) return [sampleWines[0]];
      if (params.winery) return [sampleWines[1]];
      return [];
    });

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i);
    fireEvent.change(input, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(wineApi.searchWines).toHaveBeenCalledWith(
        { name: 'Catena', pageSize: 5 },
        expect.any(AbortSignal)
      );
      expect(wineApi.searchWines).toHaveBeenCalledWith(
        { winery: 'Catena', pageSize: 5 },
        expect.any(AbortSignal)
      );
    });

    expect(await screen.findByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();
    expect(await screen.findByText('Nicolás Catena Zapata')).toBeInTheDocument();
    expect(screen.getByText('Ver todos los resultados')).toBeInTheDocument();
  });

  it('navigates to /catalogo?q= when clicking "Ver todos los resultados"', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i);
    fireEvent.change(input, { target: { value: 'Catena' } });

    const viewAllBtn = await screen.findByText('Ver todos los resultados');
    fireEvent.click(viewAllBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/catalogo?q=Catena');
  });

  it('pressing Enter with exactly 1 result navigates to /vinos/:id', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue([sampleWines[0]]);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i);
    fireEvent.change(input, { target: { value: 'Malbec Argentino' } });

    await screen.findByText('Catena Zapata Malbec Argentino');

    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/vinos/1');
  });

  it('pressing Enter with multiple results navigates to /catalogo?q=...', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i);
    fireEvent.change(input, { target: { value: 'Catena' } });

    await screen.findByText('Catena Zapata Malbec Argentino');

    const form = input.closest('form')!;
    fireEvent.submit(form);

    expect(mockNavigate).toHaveBeenCalledWith('/catalogo?q=Catena');
  });

  it('shows empty state "No encontramos «...»" with "Agregar vino" when 0 results', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i);
    fireEvent.change(input, { target: { value: 'Inexistente' } });

    expect(await screen.findByText(/No encontramos «/i)).toBeInTheDocument();
    expect(screen.getByText('Inexistente')).toBeInTheDocument();

    const addWineBtn = screen.getByRole('button', { name: /Agregar vino/i });
    fireEvent.click(addWineBtn);

    // WineCreateModal opens in user mode
    expect(await screen.findByText('Cargar un vino')).toBeInTheDocument();
  });

  it('closes dropdown when Escape key is pressed', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText(/Buscar vino, bodega, cepa o maridaje/i);
    fireEvent.change(input, { target: { value: 'Catena' } });

    expect(await screen.findByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Catena Zapata Malbec Argentino')).not.toBeInTheDocument();
    });
  });
});
