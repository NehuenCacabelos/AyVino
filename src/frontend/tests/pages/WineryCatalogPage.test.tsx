import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryCatalogPage from '@/pages/WineryCatalogPage';
import * as wineryModule from '@/features/winery';
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
    WineCreateModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="wine-create-modal">Modal Alta Etiqueta</div> : null,
    WineVintagesModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div data-testid="wine-vintages-modal">Modal Cosechas</div> : null,
  };
});

describe('WineryCatalogPage', () => {
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
      labels: 2,
      vintages: 3,
      vintagesApproved: 2,
      vintagesPending: 1,
      vintagesRejected: 0,
    },
    hasMore: false,
    wines: [
      {
        id: 101,
        name: 'Enzo Bianchi Gran Corte',
        description: 'Ícono de San Rafael',
        wineType: 'Red',
        sourceType: 'Official',
        averageRating: 4.8,
        reviewCount: 50,
        vintages: [
          {
            id: 201,
            year: 2020,
            approvalStatus: 'Approved',
            averageRating: 4.8,
            reviewCount: 30,
            registerDate: '2026-01-01',
            grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 70 }],
          },
          {
            id: 202,
            year: 2018,
            approvalStatus: 'Approved',
            averageRating: 4.7,
            reviewCount: 20,
            registerDate: '2026-01-01',
            grapes: [{ grapeId: 2, grapeName: 'Cabernet Sauvignon', percentage: 30 }],
          },
        ],
      },
      {
        id: 102,
        name: 'Famiglia Bianchi Torrontés',
        description: 'Aromático y floral',
        wineType: 'White',
        sourceType: 'Official',
        averageRating: 4.3,
        reviewCount: 20,
        vintages: [
          {
            id: 203,
            year: 2022,
            approvalStatus: 'Pending',
            averageRating: 4.3,
            reviewCount: 20,
            registerDate: '2026-01-01',
            grapes: [{ grapeId: 3, grapeName: 'Torrontés', percentage: 100 }],
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
  });

  it('renders catalogue title, ribbon totals, and list of wines', () => {
    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /Mi catálogo/i })).toBeInTheDocument();
    expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    expect(screen.getByText('Famiglia Bianchi Torrontés')).toBeInTheDocument();
    expect(screen.getByText('2 añadas: 2018 a 2020')).toBeInTheDocument();
  });

  it('allows real-time filtering by search text', () => {
    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar etiqueta por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Enzo' } });

    expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    expect(screen.queryByText('Famiglia Bianchi Torrontés')).not.toBeInTheDocument();
  });

  it('filters by wine type and allows resetting filters', () => {
    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    const typeSelect = screen.getByLabelText(/Filtrar por tipo/i);
    fireEvent.change(typeSelect, { target: { value: 'White' } });

    expect(screen.getByText('Famiglia Bianchi Torrontés')).toBeInTheDocument();
    expect(screen.queryByText('Enzo Bianchi Gran Corte')).not.toBeInTheDocument();

    // Reset filters button
    const resetButton = screen.getByRole('button', { name: /Restablecer/i });
    fireEvent.click(resetButton);

    expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    expect(screen.getByText('Famiglia Bianchi Torrontés')).toBeInTheDocument();
  });

  it('displays pending banner when winery is pending', () => {
    vi.mocked(wineryModule.useWinery).mockReturnValue({
      ...mockUseWinery,
      isPending: true,
      winery: { ...mockWinery, status: 'Pending' },
    });
    vi.mocked(wineryModule.useWineryCatalog).mockReturnValue({
      ...mockUseCatalog,
      catalog: { ...mockCatalog, wineryStatus: 'Pending' },
    });

    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Tu bodega está en revisión/i)).toBeInTheDocument();
  });

  it('renders link to public profile view for users', () => {
    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    const publicLink = screen.getByRole('link', { name: /Ver cómo lo ven los usuarios/i });
    expect(publicLink).toHaveAttribute('href', '/bodegas/10');
  });

  it('shows empty filter state when no wines match criteria', () => {
    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Buscar etiqueta por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'TextoInexistente' } });

    expect(screen.getByText('No se encontraron etiquetas')).toBeInTheDocument();
  });

  it('opens new wine creation modal on button click', () => {
    render(
      <MemoryRouter>
        <WineryCatalogPage />
      </MemoryRouter>
    );

    const newWineBtn = screen.getByRole('button', { name: /Nueva etiqueta/i });
    fireEvent.click(newWineBtn);

    expect(screen.getByTestId('wine-create-modal')).toBeInTheDocument();
  });
});
