import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '@/pages/ProfilePage';
import * as authModule from '@/features/auth';
import * as usersApiModule from '@/features/users/api/userApi';
import * as wineryApiModule from '@/features/winery/api/wineryApi';
import type {
  PublicUserProfileDto,
  CellarDto,
  CellarItemDto,
  UserWineListItemDto,
  HistoryItemDto,
  FollowingWineryDto,
} from '@/features/users/types';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('@/features/users/api/userApi', () => ({
  getPublicUserProfileApi: vi.fn(),
  getPublicCellarItemsApi: vi.fn(),
  followUserApi: vi.fn(),
  unfollowUserApi: vi.fn(),
  getMyFollowingUsersApi: vi.fn(),
  getMyCellarsApi: vi.fn(),
  getCellarItemsApi: vi.fn(),
  getMyUserWinesApi: vi.fn(),
  getMyHistoryApi: vi.fn(),
  getMyFollowingWineriesApi: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryApi', () => ({
  unfollowWinery: vi.fn(),
}));

describe('ProfilePage Component (Vista 5: Perfil Propio y Pestañas)', () => {
  const mockGetPublicUserProfile = vi.mocked(usersApiModule.getPublicUserProfileApi);
  const mockGetPublicCellarItems = vi.mocked(usersApiModule.getPublicCellarItemsApi);
  const mockGetMyCellars = vi.mocked(usersApiModule.getMyCellarsApi);
  const mockGetCellarItems = vi.mocked(usersApiModule.getCellarItemsApi);
  const mockGetMyUserWines = vi.mocked(usersApiModule.getMyUserWinesApi);
  const mockGetMyHistory = vi.mocked(usersApiModule.getMyHistoryApi);
  const mockGetMyFollowingWineries = vi.mocked(usersApiModule.getMyFollowingWineriesApi);
  const mockUnfollowWinery = vi.mocked(wineryApiModule.unfollowWinery);

  const sampleOwnerProfile: PublicUserProfileDto = {
    id: 1,
    username: 'sommelier_brian',
    avatarImageId: null,
    photo: null,
    bio: 'Amante del buen Malbec y vinos de altura.',
    registerDate: '2025-01-15T00:00:00Z',
    cellarWinesCount: 3,
    followersCount: 15,
    followingCount: 2,
  };

  const sampleVisitorProfile: PublicUserProfileDto = {
    id: 2,
    username: 'otro_usuario',
    avatarImageId: null,
    photo: null,
    bio: 'Perfil de otro usuario',
    registerDate: '2025-02-10T00:00:00Z',
    cellarWinesCount: 1,
    followersCount: 5,
    followingCount: 1,
  };

  const sampleCellars: CellarDto[] = [
    {
      id: 10,
      name: 'Cava Principal',
      vintageCount: 1,
      bottleCount: 3,
      createdAt: '2025-01-15T00:00:00Z',
    },
  ];

  const sampleCellarItems: CellarItemDto[] = [
    {
      wineVintageId: 101,
      wineId: 1,
      name: 'Piedra Infinita',
      wineType: 'Red',
      wineryId: 5,
      wineryNameText: 'Zuccardi',
      year: 2020,
      imageId: 'img-zuccardi-1',
      imageUrl: null,
      averageRating: 4.8,
      reviewCount: 10,
      quantity: 3,
      purchaseDate: null,
      notes: null,
      lastChangeAt: '2025-01-20T00:00:00Z',
    },
  ];

  const sampleHistoryItems: HistoryItemDto[] = [
    {
      id: 1001,
      type: 'Uncorked',
      occurredAt: '2026-10-30T15:00:00Z',
      wine: { id: 1, name: 'Piedra Infinita', wineryName: 'Zuccardi', wineType: 'Red' },
      vintage: { id: 101, year: 2020, imageId: 'img-vintage-1' },
      personalImageId: 'img-personal-1',
      rating: 5,
      comment: 'Espectacular descorche en cena familiar',
    },
    {
      id: 1002,
      type: 'Reviewed',
      occurredAt: '2026-10-29T12:00:00Z',
      wine: { id: 2, name: 'Angélica Zapata', wineryName: 'Catena Zapata', wineType: 'Red' },
      vintage: { id: 102, year: 2019, imageId: 'img-vintage-2' },
      personalImageId: null,
      rating: 4,
      comment: 'Muy buena estructura y final prolongado',
    },
    {
      id: 1003,
      type: 'AddedToCellar',
      occurredAt: '2026-10-28T10:00:00Z',
      wine: { id: 3, name: 'Torrontés Cafayate', wineryName: 'Bodega El Esteco', wineType: 'White' },
      vintage: { id: 103, year: null, imageId: null },
      personalImageId: null,
      rating: null,
      comment: null,
    },
    {
      id: 1004,
      type: 'WineContributed',
      occurredAt: '2026-10-27T08:00:00Z',
      wine: { id: 4, name: 'Criolla Chica Artesanal', wineryName: 'Cara Sur', wineType: 'Red' },
      vintage: { id: 104, year: 2022, imageId: null },
      personalImageId: null,
      rating: null,
      comment: null,
    },
  ];

  const sampleWishlist: UserWineListItemDto[] = [
    {
      wineId: 50,
      name: 'Gran Enemigo Gualtallary',
      wineType: 'Red',
      wineryId: 9,
      wineryNameText: 'Aleanna',
      averageRating: 4.9,
      reviewCount: 45,
      isWanted: true,
      isTried: false,
      isFavorite: true,
      lastChangeAt: '2026-10-25T00:00:00Z',
    },
  ];

  const sampleFollowingWineries: FollowingWineryDto[] = [
    {
      wineryId: 10,
      name: 'Catena Zapata',
      followedAt: '2026-05-10T00:00:00Z',
      logoImageId: 'logo-catena-guid',
      stateName: 'Mendoza',
      regionName: 'Luján de Cuyo',
      labelsCount: 24,
      followersCount: 1540,
    },
    {
      wineryId: 20,
      name: 'Bodega Artesanal Sin Logo',
      followedAt: '2026-08-12T00:00:00Z',
      logoImageId: null,
      stateName: null,
      regionName: null,
      labelsCount: 2,
      followersCount: 8,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'sommelier_brian', role: 'User' },
      isAuthenticated: true,
    });

    mockGetPublicUserProfile.mockResolvedValue(sampleOwnerProfile);
    mockGetMyCellars.mockResolvedValue(sampleCellars);
    mockGetCellarItems.mockResolvedValue(sampleCellarItems);
    mockGetMyUserWines.mockResolvedValue([]);
    mockGetMyHistory.mockResolvedValue(sampleHistoryItems);
    mockGetMyFollowingWineries.mockResolvedValue(sampleFollowingWineries);
  });

  const renderProfilePage = (username = 'sommelier_brian') => {
    return render(
      <MemoryRouter initialEntries={[`/perfil/${username}`]}>
        <Routes>
          <Route path="/perfil/:username" element={<ProfilePage />} />
          <Route path="/vinos/:id" element={<div>Ficha de Vino</div>} />
          <Route path="/bodegas/:id" element={<div>Ficha de Bodega</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders owner profile header and tabs with real counters', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByText('sommelier_brian')).toBeInTheDocument();
      expect(screen.getByText('Cava')).toBeInTheDocument();
      expect(screen.getByText('Seguidores')).toBeInTheDocument();
      expect(screen.getByText('Siguiendo')).toBeInTheDocument();
    });

    // Pestaña Cava inicial por defecto
    expect(screen.getByText('Joyas de la Cava')).toBeInTheDocument();
    expect(screen.getByText('Historial')).toBeInTheDocument();
    expect(screen.getByText('Deseados')).toBeInTheDocument();
    expect(screen.getByText('Bodegas')).toBeInTheDocument();
  });

  it('renders visitor profile without owner private tabs or actions', async () => {
    mockGetPublicUserProfile.mockResolvedValueOnce(sampleVisitorProfile);
    mockGetPublicCellarItems.mockResolvedValueOnce([]);

    renderProfilePage('otro_usuario');

    await waitFor(() => {
      expect(screen.getByText('otro_usuario')).toBeInTheDocument();
    });

    // Pestañas privadas no deben existir para el visitante
    expect(screen.queryByRole('button', { name: /Historial/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bodegas/i })).not.toBeInTheDocument();
  });

  it('renders Historial tab with 4 event types, labels, rating, personal image and links', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Historial/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Historial/i }));

    await waitFor(() => {
      expect(screen.getByText('Historial de Actividad')).toBeInTheDocument();
      expect(screen.getByText('Piedra Infinita')).toBeInTheDocument();
      expect(screen.getByText('Angélica Zapata')).toBeInTheDocument();
      expect(screen.getByText('Torrontés Cafayate')).toBeInTheDocument();
      expect(screen.getByText('Criolla Chica Artesanal')).toBeInTheDocument();
    });

    // Rótulos de los 4 tipos de actos
    expect(screen.getByText('Descorchó')).toBeInTheDocument();
    expect(screen.getByText('Reseñó')).toBeInTheDocument();
    expect(screen.getByText('Agregó a su cava')).toBeInTheDocument();
    expect(screen.getByText('Cargó un vino')).toBeInTheDocument();

    // Imagen personal con prioridad: 'img-personal-1'
    const personalImg = screen.getByAltText('Piedra Infinita');
    expect(personalImg).toHaveAttribute('src', expect.stringContaining('img-personal-1'));

    // Imagen pública de cosecha: 'img-vintage-2'
    const vintageImg = screen.getByAltText('Angélica Zapata');
    expect(vintageImg).toHaveAttribute('src', expect.stringContaining('img-vintage-2'));

    // Puntaje propio y comentario presente
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText(/Espectacular descorche en cena familiar/i)).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText(/Muy buena estructura y final prolongado/i)).toBeInTheDocument();

    // Cosecha sin año
    expect(screen.getByText(/Sin añada/i)).toBeInTheDocument();
  });

  it('filters Historial by activity type chip', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Historial/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Historial/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reseñas' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Reseñas' }));

    await waitFor(() => {
      expect(mockGetMyHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Reviewed',
          pageNumber: 1,
        })
      );
    });
  });

  it('renders Deseados tab without wine averageRating and with link to wine detail', async () => {
    mockGetMyUserWines.mockResolvedValue(sampleWishlist);

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Deseados/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Deseados/i }));

    await waitFor(() => {
      expect(screen.getByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
      expect(screen.getByText('Deseado')).toBeInTheDocument();
      expect(screen.getByText('Favorito')).toBeInTheDocument();
    });

    // averageRating (4.9 / 45 reseñas) no debe renderizarse
    expect(screen.queryByText(/4\.9/)).not.toBeInTheDocument();
    expect(screen.queryByText(/45 reseñas/i)).not.toBeInTheDocument();

    // Enlace a /vinos/:wineId
    const link = screen.getByRole('link', { name: /Gran Enemigo Gualtallary/i });
    expect(link).toHaveAttribute('href', '/vinos/50');
  });

  it('renders Bodegas tab with followed wineries, logo, location and counters', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Bodegas/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Bodegas/i }));

    await waitFor(() => {
      expect(screen.getByText('Bodegas que sigo')).toBeInTheDocument();
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
      expect(screen.getByText('Bodega Artesanal Sin Logo')).toBeInTheDocument();
    });

    // Ubicación de bodega con región y provincia
    expect(screen.getByText(/Luján de Cuyo, Mendoza/i)).toBeInTheDocument();
    expect(screen.getByText(/24 vinos/i)).toBeInTheDocument();
    expect(screen.getByText(/1540 seguidores/i)).toBeInTheDocument();

    // Bodega sin logo muestra letra de fallback 'B'
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText(/2 vinos/i)).toBeInTheDocument();
  });

  it('handles unfollow winery with confirmation, optimistic removal and rollback on failure', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Bodegas/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Bodegas/i }));

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });

    // Clic en "Dejar de seguir" para Catena Zapata
    const unfollowButtons = screen.getAllByRole('button', { name: /Dejar de seguir/i });
    fireEvent.click(unfollowButtons[0]);

    // Diálogo de confirmación
    await waitFor(() => {
      expect(screen.getByText('¿Dejar de seguir bodega?')).toBeInTheDocument();
    });

    // Simular error en la API
    mockUnfollowWinery.mockRejectedValueOnce(new Error('Server Error'));

    // Confirmar en el modal
    const dialog1 = screen.getByRole('dialog');
    const confirmBtn1 = within(dialog1).getByRole('button', { name: 'Dejar de seguir' });
    fireEvent.click(confirmBtn1);

    // Debe revertir la bodega y mostrar mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/No se pudo dejar de seguir a Catena Zapata/i)).toBeInTheDocument();
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });

    // Ahora simular éxito
    mockUnfollowWinery.mockResolvedValueOnce(undefined);
    const buttonsAfterRollback = screen.getAllByRole('button', { name: /Dejar de seguir/i });
    fireEvent.click(buttonsAfterRollback[0]);

    await waitFor(() => {
      expect(screen.getByText('¿Dejar de seguir bodega?')).toBeInTheDocument();
    });

    const dialog2 = screen.getByRole('dialog');
    const confirmBtn2 = within(dialog2).getByRole('button', { name: 'Dejar de seguir' });
    fireEvent.click(confirmBtn2);

    // Se elimina optimísticamente del listado
    await waitFor(() => {
      expect(screen.getByText(/Dejaste de seguir a Catena Zapata/i)).toBeInTheDocument();
      expect(screen.queryByText('Catena Zapata')).not.toBeInTheDocument();
    });
  });
});
