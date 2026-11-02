import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickAddBottleModal from '@/features/cava/components/QuickAddBottleModal';
import * as wineApi from '@/features/winery/api/wineApi';

import type { WineListItemDto, WineVintageResponseDto } from '@/features/winery/types/wine';

vi.mock('@/features/winery/api/wineApi', () => ({
  searchWines: vi.fn(),
  getWineVintages: vi.fn(),
  createWine: vi.fn(),
  createWineVintage: vi.fn(),
  matchWine: vi.fn(),
  putMyVintageImage: vi.fn(),
  extractConflictWineExtensions: vi.fn(),
}));

vi.mock('@/features/cava/api/cellarApi', async () => {
  const actual = await vi.importActual('@/features/cava/api/cellarApi');
  return {
    ...actual,
    getCellarsApi: vi.fn().mockResolvedValue([
      { id: 1, userId: 1, name: 'Cava Casa', vintageCount: 2, bottleCount: 5, createdAt: '2026-01-01' },
    ]),
    createCellarApi: vi.fn(),
    getCellarItemApi: vi.fn().mockRejectedValue({ response: { status: 404 } }),
    addCellarItemApi: vi.fn().mockResolvedValue({}),
    updateCellarItemApi: vi.fn().mockResolvedValue({}),
  };
});

describe('QuickAddBottleModal Component (Vista 3B)', () => {
  const sampleWines: WineListItemDto[] = [
    {
      id: 1,
      name: 'Catena Zapata Malbec',
      wineryId: 10,
      wineryNameText: 'Catena Zapata',
      wineType: 'Red',
      description: null,
      locationId: null,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.8,
      reviewCount: 15,
      referenceVintageYear: 2020,
      thumbnailImageId: null,
    },
  ];

  const sampleVintages: WineVintageResponseDto[] = [
    {
      id: 101,
      wineId: 1,
      year: 2018,
      alcoholContent: 14.0,
      servingTemperature: 16,
      agingAdvice: null,
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: 4.5,
      reviewCount: 5,
      grapes: [],
    },
    {
      id: 102,
      wineId: 1,
      year: 2021,
      alcoholContent: 14.5,
      servingTemperature: 16,
      agingAdvice: null,
      imageId: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    },
    {
      id: 103,
      wineId: 1,
      year: null,
      alcoholContent: null,
      servingTemperature: null,
      agingAdvice: null,
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Step 1 search, searches wines with debounce, and shows results', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);

    render(
      <MemoryRouter>
        <QuickAddBottleModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Buscar Vino para la Cava')).toBeInTheDocument();
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre de vino o bodega/i);

    fireEvent.change(searchInput, { target: { value: 'Catena' } });

    await waitFor(
      () => {
        expect(screen.getByText('Catena Zapata Malbec')).toBeInTheDocument();
        expect(screen.getByText('2020')).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });

  it('advances to Step 2 upon selecting a wine, ordering vintages descending with "Sin añada" last', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(sampleVintages);

    render(
      <MemoryRouter>
        <QuickAddBottleModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre de vino o bodega/i);
    fireEvent.change(searchInput, { target: { value: 'Catena' } });

    const wineCard = await screen.findByText('Catena Zapata Malbec', {}, { timeout: 2500 });
    fireEvent.click(wineCard);

    expect(await screen.findByText('Seleccionar Cosecha')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2021')).toBeInTheDocument();
      expect(screen.getByText('2018')).toBeInTheDocument();
      expect(screen.getByText('Sin añada')).toBeInTheDocument();
      expect(screen.getByText('Sin verificar')).toBeInTheDocument();
    });
  });

  it('advances to Step 3 upon choosing a vintage and renders AddToCellarForm', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(sampleVintages);

    render(
      <MemoryRouter>
        <QuickAddBottleModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre de vino o bodega/i);
    fireEvent.change(searchInput, { target: { value: 'Catena' } });

    const wineCard = await screen.findByText('Catena Zapata Malbec', {}, { timeout: 2500 });
    fireEvent.click(wineCard);

    const vintage2021 = await screen.findByText('2021');
    fireEvent.click(vintage2021);

    expect(await screen.findByText('Guardar en mi Cava')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar y Guardar/i })).toBeInTheDocument();
  });

  it('shows empty search state with "Agregar vino" when 0 results', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <QuickAddBottleModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre de vino o bodega/i);
    fireEvent.change(searchInput, { target: { value: 'VinoInexistenteXYZ' } });

    await waitFor(
      () => {
        expect(screen.getByText(/No encontramos «VinoInexistenteXYZ»/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Agregar vino/i })).toBeInTheDocument();
      },
      { timeout: 2500 }
    );
  });

  it('when wine has no vintages, shows message and "Agregar una cosecha" button', async () => {
    vi.mocked(wineApi.searchWines).mockResolvedValue(sampleWines);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <QuickAddBottleModal
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre de vino o bodega/i);
    fireEvent.change(searchInput, { target: { value: 'Catena' } });

    const wineCard = await screen.findByText('Catena Zapata Malbec', {}, { timeout: 2500 });
    fireEvent.click(wineCard);

    expect(
      await screen.findByText('Este vino no tiene cosechas visibles disponibles.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar una cosecha/i })).toBeInTheDocument();
  });
});
