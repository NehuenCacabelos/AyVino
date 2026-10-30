import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineryWineDetailPage from '@/pages/WineryWineDetailPage';
import * as wineryModule from '@/features/winery';
import * as pairingsModule from '@/features/winery/api/wineryWinePairingsApi';
import type {
  UseMyWineryReturn,
  WineryCatalogContextValue,
  WineryCatalogResponseDto,
} from '@/features/winery';

vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<typeof wineryModule>();
  return {
    ...actual,
    useWinery: vi.fn(),
    useWineryCatalog: vi.fn(),
    WineVintagesModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="wine-vintages-modal">Modal Cosechas</div> : null,
  };
});

vi.mock('@/features/winery/api/wineryWinePairingsApi', () => ({
  getWinePairings: vi.fn(),
}));

describe('WineryWineDetailPage', () => {
  const mockWinery = {
    id: 10,
    name: 'Bodega Bianchi',
    locationId: 1,
    status: 'Approved' as const,
    registerDate: '2026-01-01',
    description: null,
    foundationYear: null,
    website: null,
    userId: 1,
  };

  const mockUseWinery: UseMyWineryReturn = {
    winery: mockWinery,
    isLoading: false,
    error: null,
    isNotFound: false,
    isPending: false,
    isApproved: true,
    isRejected: false,
    reload: vi.fn().mockResolvedValue(undefined),
    updateLocalWinery: vi.fn(),
  };

  const mockCatalog: WineryCatalogResponseDto = {
    wineryId: 10,
    wineryStatus: 'Approved',
    totals: {
      labels: 1,
      vintages: 2,
      vintagesApproved: 2,
      vintagesPending: 0,
      vintagesRejected: 0,
    },
    hasMore: false,
    wines: [
      {
        id: 101,
        name: 'Enzo Bianchi Gran Corte',
        description: 'Vino icónico de corte mendocino.',
        wineType: 'Red',
        sourceType: 'Official',
        averageRating: 4.8,
        reviewCount: 42,
        vintages: [
          {
            id: 201,
            year: 2020,
            alcoholContent: 14.5,
            servingTemperature: 16,
            agingAdvice: 'Conservar en lugar oscuro hasta 2035.',
            imageUrl: null,
            approvalStatus: 'Approved',
            averageRating: 4.8,
            reviewCount: 30,
            registerDate: '2026-01-10T10:00:00Z',
            grapes: [
              { grapeId: 1, grapeName: 'Malbec', percentage: 70 },
              { grapeId: 2, grapeName: 'Cabernet Sauvignon', percentage: 30 },
            ],
          },
          {
            id: 202,
            year: 2018,
            alcoholContent: 14.2,
            servingTemperature: 16,
            agingAdvice: 'Listo para beber.',
            imageUrl: null,
            approvalStatus: 'Approved',
            averageRating: 4.7,
            reviewCount: 12,
            registerDate: '2026-01-05T10:00:00Z',
            grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
          },
        ],
      },
    ],
  };

  const mockUseCatalog: WineryCatalogContextValue = {
    catalog: mockCatalog,
    isLoading: false,
    error: null,
    reload: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryModule.useWinery).mockReturnValue(mockUseWinery);
    vi.mocked(wineryModule.useWineryCatalog).mockReturnValue(mockUseCatalog);
    vi.mocked(pairingsModule.getWinePairings).mockResolvedValue([]);
  });

  const renderComponent = (wineId = '101') => {
    return render(
      <MemoryRouter initialEntries={[`/bodega/vinos/${wineId}`]}>
        <Routes>
          <Route path="/bodega/vinos/:wineId" element={<WineryWineDetailPage />} />
          <Route path="/bodega/vinos" element={<div>Vista Catálogo</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders wine detail header, type, origin badge, and vintages', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Enzo Bianchi Gran Corte' })).toBeInTheDocument();
    });

    expect(screen.getByText('Tinto')).toBeInTheDocument();
    expect(screen.getByText('Oficial de tu bodega')).toBeInTheDocument();
    expect(screen.getByText('Vino icónico de corte mendocino.')).toBeInTheDocument();

    // Vintages rendered
    expect(screen.getByText('Cosecha 2020')).toBeInTheDocument();
    expect(screen.getByText('Cosecha 2018')).toBeInTheDocument();
    expect(screen.getByText('14.5% vol')).toBeInTheDocument();
    expect(screen.getByText('Conservar en lugar oscuro hasta 2035.')).toBeInTheDocument();
  });

  it('renders friendly 404 when wine is not found', () => {
    renderComponent('999');

    expect(screen.getByRole('heading', { level: 2, name: /Etiqueta no encontrada/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver al catálogo/i })).toBeInTheDocument();
  });

  it('shows empty pairings state when no pairings are registered', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByText('Todavía no tiene maridajes asociados')).toBeInTheDocument();
    });
  });

  it('shows pairings when returned from API', async () => {
    vi.mocked(pairingsModule.getWinePairings).mockResolvedValue([
      { id: 1, name: 'Ojo de bife a la leña', category: 'Carnes rojas' },
      { id: 2, name: 'Queso Parmesano estacionado', category: 'Quesos' },
    ]);

    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByText('Ojo de bife a la leña')).toBeInTheDocument();
      expect(screen.getByText('Carnes rojas')).toBeInTheDocument();
      expect(screen.getByText('Queso Parmesano estacionado')).toBeInTheDocument();
    });
  });

  it('opens vintages modal when clicking "Agregar añada"', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Enzo Bianchi Gran Corte' })).toBeInTheDocument();
    });

    const addVintageBtn = screen.getAllByRole('button', { name: /Agregar añada/i })[0];
    fireEvent.click(addVintageBtn);

    expect(screen.getByTestId('wine-vintages-modal')).toBeInTheDocument();
  });

  it('opens wine edit modal when clicking "Editar etiqueta"', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Enzo Bianchi Gran Corte' })).toBeInTheDocument();
    });

    const editBtn = screen.getByRole('button', { name: /Editar etiqueta/i });
    fireEvent.click(editBtn);

    expect(screen.getByRole('heading', { level: 2, name: 'Editar etiqueta' })).toBeInTheDocument();
  });
});
