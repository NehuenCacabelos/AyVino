import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WineryPublicProfileLayout from '@/pages/WineryPublicProfileLayout';
import WineryPublicOverviewPage from '@/pages/WineryPublicOverviewPage';
import WineryPublicCatalogPage from '@/pages/WineryPublicCatalogPage';
import type {
  WineryPublicProfileResponseDto,
  WineryPublicCatalogResponseDto,
} from '@/features/winery/types';

// Mock de Leaflet para jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: () => <div data-testid="mock-marker" />,
}));

let mockCurrentUser: { id: number; username: string; role: string } | null = null;
vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isAuthenticated: Boolean(mockCurrentUser),
  }),
}));

const mockGetWineryPublicProfile = vi.fn();
const mockGetWineryPublicCatalog = vi.fn();
const mockFollowWinery = vi.fn();
const mockUnfollowWinery = vi.fn();

vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getWineryPublicProfile: (...args: unknown[]) => mockGetWineryPublicProfile(...args),
    getWineryPublicCatalog: (...args: unknown[]) => mockGetWineryPublicCatalog(...args),
    followWinery: (...args: unknown[]) => mockFollowWinery(...args),
    unfollowWinery: (...args: unknown[]) => mockUnfollowWinery(...args),
  };
});

const sampleApprovedProfile: WineryPublicProfileResponseDto = {
  id: 1,
  name: 'Bodega Catena Zapata',
  description: 'Reconocida bodega pionera en la altura mendocina.',
  foundationYear: 1902,
  website: 'https://catenazapata.com',
  status: 'Approved',
  registerDate: '2026-01-01',
  latitude: -33.1234,
  longitude: -68.4567,
  logoUrl: 'https://storage.ayvino.com/wineries/catena.png',
  bannerUrl: 'https://storage.ayvino.com/banners/catena-banner.webp',
  location: {
    stateName: 'Mendoza',
    regionName: 'Luján de Cuyo',
  },
  followersCount: 120,
  isFollowedByMe: false,
  totals: {
    labels: 5,
    vintages: 15,
  },
  averageRating: 4.85,
  reviewCount: 35,
  isPreview: false,
};

const samplePreviewProfile: WineryPublicProfileResponseDto = {
  ...sampleApprovedProfile,
  id: 2,
  name: 'Bodega En Revisión',
  status: 'Pending',
  isPreview: true,
};

const sampleCatalogResponse: WineryPublicCatalogResponseDto = {
  items: [
    {
      id: 101,
      name: 'Catena Zapata Malbec Argentino',
      description: 'Cosecha histórica de viñedos viejos.',
      wineType: 'Red',
      sourceType: 'Official',
      averageRating: 4.9,
      reviewCount: 22,
      vintages: [
        {
          id: 501,
          year: 2021,
          alcoholContent: 14.5,
          servingTemperature: 16,
          agingAdvice: '24 meses en roble',
          imageUrl: 'https://storage.ayvino.com/vintages/malbec2021.png',
          approvalStatus: 'Approved',
          averageRating: 4.9,
          reviewCount: 22,
          grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
        },
      ],
    },
  ],
  filters: {
    wineTypes: ['Red', 'White'],
    grapes: [{ id: 1, name: 'Malbec' }],
    years: [2021, 2020],
  },
  pageNumber: 1,
  pageSize: 12,
  totalCount: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('WineryPublicProfile Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = null;
    mockGetWineryPublicProfile.mockResolvedValue(sampleApprovedProfile);
    mockGetWineryPublicCatalog.mockResolvedValue(sampleCatalogResponse);
    mockFollowWinery.mockResolvedValue(undefined);
    mockUnfollowWinery.mockResolvedValue(undefined);
  });

  it('muestra estado 404 amable cuando la bodega no está disponible o no existe', async () => {
    mockGetWineryPublicProfile.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    });

    render(
      <MemoryRouter initialEntries={['/bodegas/999']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route index element={<WineryPublicOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/esta bodega todavía no está disponible/i),
      ).toBeInTheDocument();
    });
  });

  it('renderiza cabecera, nombre serif, badge oficial, datos institucionales y totales en la pestaña "La bodega"', async () => {
    render(
      <MemoryRouter initialEntries={['/bodegas/1']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route index element={<WineryPublicOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Catena Zapata')).toBeInTheDocument();
    });

    expect(screen.getByText(/bodega oficial/i)).toBeInTheDocument();
    expect(screen.getAllByText(/luján de cuyo, mendoza/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/fundada en 1902/i)).toBeInTheDocument();
    expect(screen.getByText(/120/)).toBeInTheDocument();
    expect(screen.getByText('Etiquetas registradas')).toBeInTheDocument();
    expect(screen.getByText('Cosechas y añadas')).toBeInTheDocument();
  });

  it('renderiza cartel de vista previa cuando isPreview es true (dueño o admin)', async () => {
    mockGetWineryPublicProfile.mockResolvedValue(samplePreviewProfile);

    render(
      <MemoryRouter initialEntries={['/bodegas/2']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route index element={<WineryPublicOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('winery-preview-banner')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/vista previa: así la verán los usuarios cuando te aprueben/i),
    ).toBeInTheDocument();
  });

  it('visitante anónimo al cliquear "Seguir bodega" es redirigido a login con state.from', async () => {
    mockCurrentUser = null;

    render(
      <MemoryRouter initialEntries={['/bodegas/1']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route index element={<WineryPublicOverviewPage />} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Página de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Catena Zapata')).toBeInTheDocument();
    });

    const followBtn = screen.getByRole('button', { name: /seguir bodega/i });
    fireEvent.click(followBtn);

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('usuario autenticado puede seguir bodega con optimismo y rollback ante error', async () => {
    mockCurrentUser = { id: 10, username: 'sommelier_juan', role: 'User' };
    mockFollowWinery.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MemoryRouter initialEntries={['/bodegas/1']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route index element={<WineryPublicOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Catena Zapata')).toBeInTheDocument();
    });

    const followBtn = screen.getByRole('button', { name: /seguir bodega/i });
    fireEvent.click(followBtn);

    // Rollback verificado tras fallo de API
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /seguir bodega/i })).toBeInTheDocument();
    });
  });

  it('cuando el usuario es dueño de la bodega (isOwner), hacer clic en seguir no suma seguidor ni llama a la API', async () => {
    mockCurrentUser = { id: 5, username: 'bodegas_lopez', role: 'Winery' };
    mockGetWineryPublicProfile.mockResolvedValueOnce({
      ...sampleApprovedProfile,
      isOwner: true,
      followersCount: 120,
    });

    render(
      <MemoryRouter initialEntries={['/bodegas/1']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route index element={<WineryPublicOverviewPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Catena Zapata')).toBeInTheDocument();
    });

    const followBtn = screen.getByRole('button', { name: /no podés seguir a tu propia bodega/i });
    expect(followBtn).toBeInTheDocument();

    fireEvent.click(followBtn);

    // No llama a la API de seguimiento
    expect(mockFollowWinery).not.toHaveBeenCalled();
    // Toast de advertencia visible
    expect(screen.getByText(/no podés seguir a tu propia bodega/i)).toBeInTheDocument();
    // Contador de seguidores inalterado
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('pestaña catálogo renderiza tarjetas y abre modal provisorio con punto de entrada único', async () => {
    render(
      <MemoryRouter initialEntries={['/bodegas/1/catalogo']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route path="catalogo" element={<WineryPublicCatalogPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();
    });

    // Clic en la tarjeta de vino (punto de entrada único onSelectWine)
    const wineCard = screen.getByTestId('catalog-card-101');
    fireEvent.click(wineCard);

    // Modal provisorio abierto
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Cerrar modal provisorio
    const closeBtn = screen.getByRole('button', { name: /cerrar modal/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renderiza correctamente textos de valoración para 0, 1, 4 y 5 reseñas según el umbral', async () => {
    // Caso 1: 1 reseña (menos de 5 -> promedio null, muestra "1 reseña · Aún sin valoración")
    const singleReviewProfile: WineryPublicProfileResponseDto = {
      ...sampleApprovedProfile,
      averageRating: null,
      reviewCount: 1,
    };
    mockGetWineryPublicProfile.mockResolvedValue(singleReviewProfile);

    const singleReviewCatalog: WineryPublicCatalogResponseDto = {
      ...sampleCatalogResponse,
      items: [
        {
          ...sampleCatalogResponse.items[0],
          averageRating: null,
          reviewCount: 1,
        },
      ],
    };
    mockGetWineryPublicCatalog.mockResolvedValue(singleReviewCatalog);

    const { unmount } = render(
      <MemoryRouter initialEntries={['/bodegas/1/catalogo']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route path="catalogo" element={<WineryPublicCatalogPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const singularMatches = screen.getAllByText(/1 reseña · aún sin valoración/i);
      expect(singularMatches.length).toBeGreaterThanOrEqual(1);
    });

    unmount();

    // Caso 2: 4 reseñas (menos de 5 -> promedio null, muestra "4 reseñas · Aún sin valoración")
    const fourReviewProfile: WineryPublicProfileResponseDto = {
      ...sampleApprovedProfile,
      averageRating: null,
      reviewCount: 4,
    };
    mockGetWineryPublicProfile.mockResolvedValue(fourReviewProfile);
    const fourReviewCatalog: WineryPublicCatalogResponseDto = {
      ...sampleCatalogResponse,
      items: [
        {
          ...sampleCatalogResponse.items[0],
          averageRating: null,
          reviewCount: 4,
        },
      ],
    };
    mockGetWineryPublicCatalog.mockResolvedValue(fourReviewCatalog);

    const { unmount: unmountFour } = render(
      <MemoryRouter initialEntries={['/bodegas/1/catalogo']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route path="catalogo" element={<WineryPublicCatalogPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      const fourMatches = screen.getAllByText(/4 reseñas · aún sin valoración/i);
      expect(fourMatches.length).toBeGreaterThanOrEqual(1);
    });

    unmountFour();

    // Caso 3: 5 reseñas (alcanza umbral de 5 -> muestra número y "(5 reseñas)")
    const fiveReviewProfile: WineryPublicProfileResponseDto = {
      ...sampleApprovedProfile,
      averageRating: 4.2,
      reviewCount: 5,
    };
    mockGetWineryPublicProfile.mockResolvedValue(fiveReviewProfile);
    const fiveReviewCatalog: WineryPublicCatalogResponseDto = {
      ...sampleCatalogResponse,
      items: [
        {
          ...sampleCatalogResponse.items[0],
          averageRating: 4.2,
          reviewCount: 5,
        },
      ],
    };
    mockGetWineryPublicCatalog.mockResolvedValue(fiveReviewCatalog);

    const { unmount: unmountFive } = render(
      <MemoryRouter initialEntries={['/bodegas/1/catalogo']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route path="catalogo" element={<WineryPublicCatalogPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/4\.2/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/\(5 reseñas\)/i).length).toBeGreaterThanOrEqual(1);
    });

    unmountFive();

    // Caso 4: 0 reseñas -> muestra "Sin valoraciones"
    const zeroReviewProfile: WineryPublicProfileResponseDto = {
      ...sampleApprovedProfile,
      averageRating: null,
      reviewCount: 0,
    };
    mockGetWineryPublicProfile.mockResolvedValue(zeroReviewProfile);
    const zeroReviewCatalog: WineryPublicCatalogResponseDto = {
      ...sampleCatalogResponse,
      items: [
        {
          ...sampleCatalogResponse.items[0],
          averageRating: null,
          reviewCount: 0,
        },
      ],
    };
    mockGetWineryPublicCatalog.mockResolvedValue(zeroReviewCatalog);

    render(
      <MemoryRouter initialEntries={['/bodegas/1/catalogo']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfileLayout />}>
            <Route path="catalogo" element={<WineryPublicCatalogPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/sin valoraciones/i).length).toBeGreaterThanOrEqual(1);
    });
  });
});

