import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CatalogPage from '@/pages/CatalogPage';
import * as catalogApiModule from '@/features/catalog/api/catalogApi';
import type { CatalogShowcaseResponse } from '@/features/catalog';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/catalog/api/catalogApi', () => ({
  getCatalogShowcaseApi: vi.fn(),
  getCatalogFiltersApi: vi.fn(),
}));

describe('CatalogPage Component (Vista 2: Catálogo Rediseñado - Bloque C)', () => {
  const mockGetCatalogShowcase = vi.mocked(catalogApiModule.getCatalogShowcaseApi);

  const sampleShowcase: CatalogShowcaseResponse = {
    items: [
      {
        wineryId: 10,
        wineryName: 'Catena Zapata',
        location: 'Mendoza, Argentina',
        logoImageId: null,
        isVerified: true,
        wines: [
          {
            id: 1,
            wineryId: 10,
            wineryNameText: 'Catena Zapata',
            name: 'Catena Alta Malbec',
            description: 'Gran vino de altura',
            wineType: 'Red',
            locationId: 1,
            sourceType: 'Official',
            duplicateOfWineId: null,
            averageRating: 4.8,
            reviewCount: 15,
            thumbnailImageId: null,
            referenceVintageYear: 2020,
          },
        ],
      },
      {
        wineryId: null,
        wineryName: 'Vinos de Autor',
        location: 'Salta, Argentina',
        logoImageId: null,
        isVerified: false,
        wines: [
          {
            id: 2,
            wineryId: null,
            wineryNameText: 'Vinos de Autor',
            name: 'Torrontés Salteño',
            description: 'Vino blanco aromático',
            wineType: 'White',
            locationId: 2,
            sourceType: 'Community',
            duplicateOfWineId: null,
            averageRating: null,
            reviewCount: 0,
            thumbnailImageId: null,
            referenceVintageYear: null,
          },
        ],
      },
    ],
    pageNumber: 1,
    pageSize: 6,
    totalCount: 2,
    totalPages: 1,
    hasNextPage: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const renderCatalogPage = (initialEntries = ['/catalogo']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/catalogo" element={<CatalogPage />} />
          <Route path="/vinos/:id" element={<div>Ficha de Vino</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders preserved editorial header and loads showcase wineries', async () => {
    mockGetCatalogShowcase.mockResolvedValueOnce(sampleShowcase);

    renderCatalogPage();

    expect(screen.getByText('Colección & Terruños Argentinos')).toBeInTheDocument();
    expect(screen.getByText('Catálogo General')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
      expect(screen.getByText('Catena Alta Malbec')).toBeInTheDocument();
      expect(screen.getByText('Vinos de Autor')).toBeInTheDocument();
      expect(screen.getByText('Torrontés Salteño')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Tinto').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('Sin añada')).toBeInTheDocument();
  });

  it('filters by wine type chip and calls getCatalogShowcaseApi with wineType', async () => {
    mockGetCatalogShowcase.mockResolvedValue(sampleShowcase);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });

    const tintoChip = screen.getByRole('button', { name: 'Tinto' });
    fireEvent.click(tintoChip);

    await waitFor(() => {
      expect(mockGetCatalogShowcase).toHaveBeenCalledWith(
        expect.objectContaining({
          wineType: 'Red',
          pageNumber: 1,
        })
      );
    });
  });

  it('searches with debounce and calls getCatalogShowcaseApi with q', async () => {
    mockGetCatalogShowcase.mockResolvedValue(sampleShowcase);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'Malbec' } });

    await waitFor(() => {
      expect(mockGetCatalogShowcase).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'Malbec',
          pageNumber: 1,
        })
      );
    });
  });

  it('displays empty state when no wineries match filters', async () => {
    mockGetCatalogShowcase.mockResolvedValueOnce({
      items: [],
      pageNumber: 1,
      pageSize: 6,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('No encontramos bodegas ni vinos con esos filtros')).toBeInTheDocument();
    });
  });

  it('displays error state on network error and recovers with retry button', async () => {
    mockGetCatalogShowcase.mockRejectedValueOnce(new Error('Network error'));

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText(/No pudimos cargar los vinos del catálogo/i)).toBeInTheDocument();
    });

    mockGetCatalogShowcase.mockResolvedValueOnce(sampleShowcase);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });
  });

  it('loads more wineries when "Cargar más bodegas" is clicked and hasNextPage is true', async () => {
    const page1: CatalogShowcaseResponse = {
      items: [sampleShowcase.items[0]],
      pageNumber: 1,
      pageSize: 1,
      totalCount: 2,
      totalPages: 2,
      hasNextPage: true,
    };

    const page2: CatalogShowcaseResponse = {
      items: [sampleShowcase.items[1]],
      pageNumber: 2,
      pageSize: 1,
      totalCount: 2,
      totalPages: 2,
      hasNextPage: false,
    };

    mockGetCatalogShowcase
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más bodegas/i });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Vinos de Autor')).toBeInTheDocument();
    });

    // Como hasNextPage es false en página 2, el botón se oculta
    expect(screen.queryByRole('button', { name: /Cargar más bodegas/i })).not.toBeInTheDocument();
  });
});
