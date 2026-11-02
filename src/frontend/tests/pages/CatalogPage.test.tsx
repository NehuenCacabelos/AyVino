import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import CatalogPage from '@/pages/CatalogPage';
import * as wineApiModule from '@/features/winery/api/wineApi';
import type { WineListItemDto } from '@/features/winery/types/wine';

const mockNavigate = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/winery/api/wineApi', () => ({
  searchWines: vi.fn(),
  getWines: vi.fn(),
}));

describe('CatalogPage Component (Vista 2: Catálogo)', () => {
  const mockSearchWines = vi.mocked(wineApiModule.searchWines);

  const sampleWines: WineListItemDto[] = [
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
      averageRating: null,
      reviewCount: 15,
      thumbnailImageId: '11111111-1111-1111-1111-111111111111',
      referenceVintageYear: 2020,
    },
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
  ];

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

  it('renders preserved editorial header and loads initial wines', async () => {
    mockSearchWines.mockResolvedValueOnce(sampleWines);

    renderCatalogPage();

    expect(screen.getByText('Colección & Terruños Argentinos')).toBeInTheDocument();
    expect(screen.getByText('Catálogo General Protegido')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Catena Alta Malbec')).toBeInTheDocument();
      expect(screen.getByText('Torrontés Salteño')).toBeInTheDocument();
    });

    // Cosecha con imagen muestra la imagen
    const image = screen.getByAltText('Catena Alta Malbec');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('11111111-1111-1111-1111-111111111111'));

    // Cosecha comunitaria sin imagen muestra silueta y NV
    expect(screen.getByText(/Tinto · 2020/i)).toBeInTheDocument();
    expect(screen.getByText(/Blanco · NV/i)).toBeInTheDocument();
    expect(screen.getByText('Comunidad')).toBeInTheDocument();
    expect(screen.getByText('Ficha Oficial')).toBeInTheDocument();

    // El catálogo no debe renderizar estrellas ni puntaje general
    expect(screen.queryByText('S/C')).not.toBeInTheDocument();
  });

  it('navigates to /vinos/:id on card click', async () => {
    mockSearchWines.mockResolvedValueOnce(sampleWines);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Catena Alta Malbec')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Catena Alta Malbec'));
    expect(mockNavigate).toHaveBeenCalledWith('/vinos/1');
  });

  it('displays empty state when no wines match filters', async () => {
    mockSearchWines.mockResolvedValueOnce([]);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('No encontramos vinos con esos filtros')).toBeInTheDocument();
    });
  });

  it('displays error state on network error and recovers with retry button', async () => {
    mockSearchWines.mockRejectedValueOnce(new Error('Network error'));

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText(/No pudimos cargar los vinos del catálogo/i)).toBeInTheDocument();
    });

    mockSearchWines.mockResolvedValueOnce(sampleWines);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(screen.getByText('Catena Alta Malbec')).toBeInTheDocument();
    });
  });

  it('filters by wine type chip and updates search call', async () => {
    mockSearchWines.mockResolvedValue(sampleWines);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Catena Alta Malbec')).toBeInTheDocument();
    });

    // Abrir filtros
    fireEvent.click(screen.getByRole('button', { name: /Filtros/i }));

    // Seleccionar chip 'Tinto'
    const tintoChip = screen.getByRole('button', { name: 'Tinto' });
    fireEvent.click(tintoChip);

    await waitFor(() => {
      expect(mockSearchWines).toHaveBeenCalledWith(
        expect.objectContaining({
          wineType: 'Red',
          pageNumber: 1,
        }),
        expect.any(AbortSignal)
      );
    });
  });

  it('loads more wines when "Cargar más" is clicked and hides button when exhausted', async () => {
    const page1 = Array.from({ length: 12 }, (_, i) => ({
      ...sampleWines[0],
      id: i + 1,
      name: `Vino Catena ${i + 1}`,
    }));

    const page2 = [
      {
        ...sampleWines[1],
        id: 13,
        name: 'Vino Final 13',
      },
    ];

    mockSearchWines
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2);

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Vino Catena 1')).toBeInTheDocument();
    });

    const loadMoreBtn = screen.getByRole('button', { name: /Cargar más/i });
    expect(loadMoreBtn).toBeInTheDocument();

    fireEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(screen.getByText('Vino Final 13')).toBeInTheDocument();
    });

    // Como la página 2 trajo 1 (< 12), el botón se oculta
    expect(screen.queryByRole('button', { name: /Cargar más/i })).not.toBeInTheDocument();
  });
});
