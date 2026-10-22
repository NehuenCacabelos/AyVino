import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryWinesPage from '@/pages/WineryWinesPage';
import * as wineryModule from '@/pages/../features/winery';
import type { WineResponseDto, UseMyWineryReturn } from '@/pages/../features/winery';

vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<typeof wineryModule>();
  return {
    ...actual,
    useWinery: vi.fn(),
    getWines: vi.fn(),
    WineCreateModal: () => <div data-testid="wine-create-modal">Modal Alta Etiqueta</div>,
    WineVintagesModal: () => <div data-testid="wine-vintages-modal">Modal Cosechas</div>,
  };
});

describe('WineryWinesPage', () => {
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

  const mockWines: WineResponseDto[] = [
    {
      id: 1,
      name: 'Enzo Bianchi Gran Corte',
      wineryId: 10,
      wineryNameText: 'Bodega Bianchi',
      description: 'Ícono de San Rafael',
      wineType: 'Red',
      locationId: 1,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.8,
      reviewCount: 50,
    },
    {
      id: 2,
      name: 'Famiglia Bianchi Torrontés',
      wineryId: 10,
      wineryNameText: 'Bodega Bianchi',
      description: 'Aromático y floral',
      wineType: 'White',
      locationId: 1,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.3,
      reviewCount: 20,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryModule.useWinery).mockReturnValue(mockUseWinery);
    vi.mocked(wineryModule.getWines).mockResolvedValue(mockWines);
  });

  it('renders catalogue of labels and allows real-time text searching', async () => {
    render(
      <MemoryRouter>
        <WineryWinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(wineryModule.getWines).toHaveBeenCalledWith({
        wineryId: 10,
        pageNumber: 1,
        pageSize: 9,
      });
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
      expect(screen.getByText('Famiglia Bianchi Torrontés')).toBeInTheDocument();
    });

    // Search for "Enzo"
    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o descripción/i);
    fireEvent.change(searchInput, { target: { value: 'Enzo' } });

    expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    expect(screen.queryByText('Famiglia Bianchi Torrontés')).not.toBeInTheDocument();
  });

  it('filters labels by wine type category chips', async () => {
    render(
      <MemoryRouter>
        <WineryWinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    // Click "Blancos" filter chip
    const blancosChip = screen.getByRole('button', { name: /Blancos/i });
    fireEvent.click(blancosChip);

    expect(screen.getByText('Famiglia Bianchi Torrontés')).toBeInTheDocument();
    expect(screen.queryByText('Enzo Bianchi Gran Corte')).not.toBeInTheDocument();
  });

  it('displays pagination controls and handles page navigation', async () => {
    render(
      <MemoryRouter>
        <WineryWinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    // Anterior should be disabled on first page
    const prevButton = screen.getByRole('button', { name: /Página anterior/i });
    expect(prevButton).toBeDisabled();

    // Since mockWines has 2 items (< PAGE_SIZE 9), Siguiente is disabled
    const nextButton = screen.getByRole('button', { name: /Página siguiente/i });
    expect(nextButton).toBeDisabled();
  });

  it('renders pending banner, enables new label button, and displays draft badges when winery is pending', async () => {
    vi.mocked(wineryModule.useWinery).mockReturnValue({
      ...mockUseWinery,
      winery: { ...mockWinery, status: 'Pending' },
      isPending: true,
      isApproved: false,
    });

    render(
      <MemoryRouter>
        <WineryWinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    // Check banner
    expect(screen.getByText('Tu bodega está en revisión')).toBeInTheDocument();
    expect(
      screen.getByText(/Podés cargar tus vinos: serán visibles para los usuarios cuando te aprueben/i)
    ).toBeInTheDocument();

    // Check new label button is present
    expect(screen.getByRole('button', { name: /Nueva etiqueta/i })).toBeInTheDocument();

    // Check draft badge
    const draftBadges = screen.getAllByText('Borrador, solo lo ves vos');
    expect(draftBadges.length).toBeGreaterThan(0);
  });

  it('renders rejected banner and hides new label button when winery is rejected', async () => {
    vi.mocked(wineryModule.useWinery).mockReturnValue({
      ...mockUseWinery,
      winery: { ...mockWinery, status: 'Rejected' },
      isRejected: true,
      isApproved: false,
    });

    render(
      <MemoryRouter>
        <WineryWinesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    expect(screen.getByText('Bodega con observaciones pendientes')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nueva etiqueta/i })).not.toBeInTheDocument();
  });
});
