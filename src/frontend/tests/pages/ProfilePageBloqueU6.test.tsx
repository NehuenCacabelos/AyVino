import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProfilePage from '@/pages/ProfilePage';
import * as usersApi from '@/features/users/api/userApi';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'sommelier', email: 'somm@test.com' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/constants/bannerThemes', () => ({
  getBannerThemeByUsername: () => ({
    id: 'gran-reserva',
    name: 'Gran Reserva',
    gradient: 'from-[#4a0e17] via-[#2a0810] to-[#120306]',
  }),
}));

describe('Bloque U6 - ProfilePage Component', () => {
  const mockProfile = {
    id: 1,
    username: 'sommelier',
    fullName: 'Sommelier Privado',
    bio: 'Apasionado del vino',
    avatarImageId: null,
    avatarUrl: null,
    followerCount: 12,
    followingCount: 5,
    cellarWinesCount: 3,
    tastedCount: 8,
    wishlistCount: 4,
    createdAt: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(usersApi, 'getPublicUserProfileApi').mockResolvedValue(mockProfile);
    vi.spyOn(usersApi, 'getMyCellarsApi').mockResolvedValue([{ id: 10, name: 'Mi Cava', vintageCount: 3, bottleCount: 5, createdAt: '2025-01-01' }]);
    vi.spyOn(usersApi, 'getCellarItemsApi').mockResolvedValue([]);
  });

  it('interpreta el parámetro obsoleto ?tab=deseados como favoritos y carga getMyUserWinesApi({ favorite: true })', async () => {
    const userWinesSpy = vi.spyOn(usersApi, 'getMyUserWinesApi').mockResolvedValue([
      {
        wineId: 101,
        name: 'Nicola Catena Paraje Altamira',
        wineType: 'Red',
        wineryName: 'Catena Zapata',
        wineryNameText: 'Catena',
        vintage: 2019,
        imageUrl: '/api/images/img-nicola?variant=bottle',
        averageRating: 4.9,
        reviewCount: 15,
        isWanted: false,
        isTried: false,
        isFavorite: true,
        lastChangeAt: '2026-11-13T10:00:00Z',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/perfil/sommelier?tab=deseados']}>
        <Routes>
          <Route path="/perfil/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Debe mostrar la pestaña Favoritos activa
    expect(await screen.findByRole('button', { name: /Favoritos/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Deseados & Favoritos/i })).toBeNull();

    // Solo se debe consultar favorite: true, sin pedir wanted
    await waitFor(() => {
      expect(userWinesSpy).toHaveBeenCalledWith(expect.objectContaining({ favorite: true }));
      expect(userWinesSpy).not.toHaveBeenCalledWith(expect.objectContaining({ wanted: true }));
    });

    // Debe mostrar la tarjeta del vino favorito con sus datos enriquecidos
    expect(await screen.findByText('Nicola Catena Paraje Altamira')).toBeInTheDocument();
    expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    expect(screen.getByText('Cosecha 2019')).toBeInTheDocument();
    expect(screen.getByText('Favorito')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
  });

  it('muestra estado vacío correcto en pestaña Favoritos cuando el usuario no tiene favoritos', async () => {
    vi.spyOn(usersApi, 'getMyUserWinesApi').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/perfil/sommelier?tab=favoritos']}>
        <Routes>
          <Route path="/perfil/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sin favoritos registrados')).toBeInTheDocument();
    expect(screen.getByText('Aún no guardaste vinos en tus favoritos.')).toBeInTheDocument();
  });

  it('renderiza la pestaña Historial de Catas cuando ?tab=historial con etiquetas probadas', async () => {
    const userWinesSpy = vi.spyOn(usersApi, 'getMyUserWinesApi').mockResolvedValue([
      {
        wineId: 202,
        name: 'Zuccardi Finca Piedra Infinita',
        wineType: 'Red',
        wineryName: 'Familia Zuccardi',
        vintage: 2018,
        imageUrl: '/api/images/img-zuccardi?variant=bottle',
        averageRating: 5.0,
        reviewCount: 22,
        isWanted: false,
        isTried: true,
        isFavorite: false,
        lastChangeAt: '2026-11-12T15:30:00Z',
      },
    ]);

    render(
      <MemoryRouter initialEntries={['/perfil/sommelier?tab=historial']}>
        <Routes>
          <Route path="/perfil/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(userWinesSpy).toHaveBeenCalledWith(expect.objectContaining({ tried: true }));
    });

    expect(await screen.findByText('Zuccardi Finca Piedra Infinita')).toBeInTheDocument();
    expect(screen.getByText('Familia Zuccardi')).toBeInTheDocument();
    expect(screen.getByText('Cosecha 2018')).toBeInTheDocument();
    expect(screen.getByText('Probado')).toBeInTheDocument();
  });

  it('muestra estado vacío correcto en Historial de Catas cuando no hay registros probados', async () => {
    vi.spyOn(usersApi, 'getMyUserWinesApi').mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/perfil/sommelier?tab=historial']}>
        <Routes>
          <Route path="/perfil/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Sin historial registrado')).toBeInTheDocument();
    expect(screen.getByText('Aún no registraste vinos probados en tu historial.')).toBeInTheDocument();
  });
});
