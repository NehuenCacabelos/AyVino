import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import WineryPublicCatalogPage from '@/pages/WineryPublicCatalogPage';
import type {
  WineryPublicProfileResponseDto,
  WineryPublicCatalogResponseDto,
} from '@/features/winery/types';

const { mockClient } = vi.hoisted(() => {
  const client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { mockClient: client };
});

vi.mock('@/services/apiClient', () => ({
  default: mockClient,
  apiClient: mockClient,
}));

let mockAuthState = {
  user: { id: 1, username: 'testuser', role: 'User' },
  isAuthenticated: true,
};

vi.mock('@/features/auth', () => ({
  useAuth: () => mockAuthState,
}));

const mockGetWineryPublicCatalog = vi.fn();
vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getWineryPublicCatalog: (...args: unknown[]) => mockGetWineryPublicCatalog(...args),
  };
});

const sampleProfile: WineryPublicProfileResponseDto = {
  id: 10,
  name: 'Bodega La Rural',
  status: 'Approved',
  registerDate: '2026-01-01',
  followersCount: 50,
  totals: { labels: 2, vintages: 4 },
  isPreview: false,
  reviewCount: 15,
};

const sampleCatalogResponse: WineryPublicCatalogResponseDto = {
  items: [
    {
      id: 101,
      name: 'Rutini Cabernet Malbec',
      description: 'Corte clásico argentino.',
      wineType: 'Red',
      sourceType: 'Official',
      averageRating: 4.8,
      reviewCount: 20,
      vintages: [
        {
          id: 501,
          year: 2020,
          approvalStatus: 'Approved',
          reviewCount: 20,
          grapes: [{ grapeId: 1, grapeName: 'Cabernet Sauvignon', percentage: 50 }],
        },
      ],
    },
    {
      id: 102,
      name: 'Rutini Chardonnay',
      description: 'Blanco fresco y untuoso.',
      wineType: 'White',
      sourceType: 'Official',
      averageRating: 4.5,
      reviewCount: 10,
      vintages: [
        {
          id: 502,
          year: 2022,
          approvalStatus: 'Approved',
          reviewCount: 10,
          grapes: [{ grapeId: 2, grapeName: 'Chardonnay', percentage: 100 }],
        },
      ],
    },
  ],
  filters: {
    wineTypes: ['Red', 'White'],
    grapes: [{ id: 1, name: 'Cabernet Sauvignon' }, { id: 2, name: 'Chardonnay' }],
    years: [2022, 2020],
  },
  pageNumber: 1,
  pageSize: 12,
  totalCount: 2,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

function Harness({ initialEntries = ['/bodegas/10/catalogo'] }: { initialEntries?: string[] }) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          element={
            <Outlet
              context={{
                profile: sampleProfile,
                locationLabel: 'Maipú, Mendoza',
                reloadProfile: vi.fn(),
              }}
            />
          }
        >
          <Route path="/bodegas/:id/catalogo" element={<WineryPublicCatalogPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('Bloque U9 - Catálogo público de bodega con DashboardWineCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: { id: 1, username: 'testuser', role: 'User' },
      isAuthenticated: true,
    };
    mockGetWineryPublicCatalog.mockResolvedValue(sampleCatalogResponse);
    mockClient.get.mockImplementation((url: string) => {
      if (url === '/user-wines/me?favorite=true&pageSize=100') {
        return Promise.resolve({ data: [{ wineId: 101 }] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza tarjetas de vino que enlazan a /vinos/{id} numérico', async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec')).toBeInTheDocument();
      expect(screen.getByText('Rutini Chardonnay')).toBeInTheDocument();
    });

    const link101 = screen.getByRole('link', { name: /Rutini Cabernet Malbec/i });
    expect(link101).toHaveAttribute('href', '/vinos/101');

    const link102 = screen.getByRole('link', { name: /Rutini Chardonnay/i });
    expect(link102).toHaveAttribute('href', '/vinos/102');
  });

  it('el botón de cava abre QuickAddBottleModal con el vino cargado en modo existente', async () => {
    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /añadir a cava/i });
    expect(addButtons.length).toBe(2);

    // Clic en añadir a cava para el primer vino
    fireEvent.click(addButtons[0]);

    await waitFor(() => {
      // El modal debe estar en pantalla con el nombre y datos preseleccionados
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Rutini Cabernet Malbec')).toBeInTheDocument();
    });
  });

  it('corazón de favoritos: carga inicial en lote y actualización optimista persistida con PUT/DELETE', async () => {
    mockClient.put.mockResolvedValue({ data: {} });
    mockClient.delete.mockResolvedValue({ data: {} });

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec')).toBeInTheDocument();
    });

    // Carga inicial: /user-wines/me?favorite=true&pageSize=100 se ejecutó
    expect(mockClient.get).toHaveBeenCalledWith('/user-wines/me?favorite=true&pageSize=100');

    // Vino 101 ya era favorito según mock
    const favBtn101 = screen.getByRole('button', { name: /quitar rutini cabernet malbec de favoritos/i });
    expect(favBtn101).toBeInTheDocument();

    // Vino 102 no era favorito
    const favBtn102 = screen.getByRole('button', { name: /añadir rutini chardonnay a favoritos/i });
    expect(favBtn102).toBeInTheDocument();

    // Clic para añadir vino 102 a favoritos -> PUT
    fireEvent.click(favBtn102);

    await waitFor(() => {
      expect(mockClient.put).toHaveBeenCalledWith('/wines/102/favorite');
    });

    // Clic para quitar vino 101 de favoritos -> DELETE
    fireEvent.click(favBtn101);

    await waitFor(() => {
      expect(mockClient.delete).toHaveBeenCalledWith('/wines/101/favorite');
    });
  });

  it('corazón de favoritos: revierte optimismo si la API falla', async () => {
    mockClient.put.mockRejectedValueOnce(new Error('Network error'));

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Rutini Chardonnay')).toBeInTheDocument();
    });

    const favBtn102 = screen.getByRole('button', { name: /añadir rutini chardonnay a favoritos/i });
    fireEvent.click(favBtn102);

    // Debe mostrar error y revertir al estado inicial
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /añadir rutini chardonnay a favoritos/i })).toBeInTheDocument();
    });
  });

  it('visitante sin sesión: oculta las acciones rápidas de favoritos y cava', async () => {
    mockAuthState = {
      user: null as unknown as { id: number; username: string; role: string },
      isAuthenticated: false,
    };

    render(<Harness />);

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec')).toBeInTheDocument();
    });

    // No debe mostrar botones de añadir a cava ni botones de favorito
    expect(screen.queryByRole('button', { name: /añadir a cava/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /favoritos/i })).not.toBeInTheDocument();
  });
});
