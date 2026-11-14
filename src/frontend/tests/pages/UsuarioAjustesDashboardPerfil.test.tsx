import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '@/pages/ProfilePage';
import CavaPage from '@/pages/CavaPage';
import Metrics from '@/features/dashboard/components/Metrics';
import * as userApi from '@/features/users/api/userApi';
import * as authHook from '@/features/auth';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Ajustes Dashboard, Cava y Perfil', () => {
  const mockClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(authHook, 'useAuth').mockReturnValue({
      user: { id: 1, username: 'Kevin', email: 'kevin@example.com', role: 'User' },
      token: 'mock-token',
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  describe('1. Metrics (Hero Strip) en Dashboard', () => {
    it('no renderiza el botón "Descorchar" en la tarjeta de Listas para Descorchar', () => {
      render(
        <Metrics
          customStats={{
            bottles: 4,
            readyToDrink: 2,
            dominantVarietal: 'Malbec (50%)',
            dominantVarietalSubtitle: '2 cepas registradas',
            topRated: '4.8 ★',
            topRatedSubtitle: '3 vinos calificados',
          }}
        />
      );

      expect(screen.queryByRole('button', { name: /Descorchar/i })).not.toBeInTheDocument();
      expect(screen.getByText('4 Botellas')).toBeInTheDocument();
      expect(screen.getByText('2 Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('4.8 ★')).toBeInTheDocument();
      expect(screen.getByText('3 vinos calificados')).toBeInTheDocument();
    });

    it('muestra "—" y "Sin calificaciones aún" cuando el usuario no tiene catas registradas', () => {
      render(
        <Metrics
          customStats={{
            bottles: 0,
            readyToDrink: 0,
            dominantVarietal: '—',
            topRated: null,
          }}
        />
      );

      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Sin calificaciones aún')).toBeInTheDocument();
    });
  });

  describe('2. CavaPage y VaultTabs', () => {
    it('renderiza "Todos los vinos" en lugar de "Todas las botellas" y no duplica el footer', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 1, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/1/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 10,
                wineId: 100,
                name: 'Gran Malbec',
                wineryName: 'Catena',
                quantity: 2,
                year: 2020,
              },
              {
                wineVintageId: 11,
                wineId: 101,
                name: 'Reserva Cabernet',
                wineryName: 'Cobos',
                quantity: 1,
                year: 2018,
              },
            ],
          });
        }
        if (url === '/user-wines/me') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      const { container } = render(
        <MemoryRouter initialEntries={['/cava']}>
          <CavaPage />
        </MemoryRouter>
      );

      // Pestaña debe decir "Todos los vinos (2)"
      expect(await screen.findByText('Todos los vinos')).toBeInTheDocument();
      expect(screen.queryByText('Todas las botellas')).not.toBeInTheDocument();

      // CavaPage no debe tener elemento footer propio (lo gobierna AppLayout)
      expect(container.querySelector('footer')).toBeNull();
    });
  });

  describe('3. ProfilePage: Redirección a ficha de vino desde las cards', () => {
    beforeEach(() => {
      vi.spyOn(authHook, 'useAuth').mockReturnValue({
        user: { id: 1, username: 'Kevin', email: 'kevin@example.com', role: 'User' },
        token: 'mock-token',
        isAuthenticated: true,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
      });

      vi.spyOn(userApi, 'getPublicUserProfileApi').mockResolvedValue({
        id: 1,
        username: 'Kevin',
        registerDate: '2024-01-01',
        cellarWinesCount: 2,
        followersCount: 5,
        followingCount: 8,
      });

      vi.spyOn(userApi, 'getMyCellarsApi').mockResolvedValue([
        { id: 1, name: 'Mi Cava', vintageCount: 2, bottleCount: 3, createdAt: '2024-01-01' },
      ]);

      vi.spyOn(userApi, 'getCellarItemsApi').mockResolvedValue([
        {
          wineVintageId: 101,
          wineId: 501,
          name: 'Nicolás Catena Zapata',
          wineType: 'Red',
          year: 2019,
          quantity: 2,
          averageRating: 4.9,
        },
      ]);

      vi.spyOn(userApi, 'getMyUserWinesApi').mockImplementation((filters) => {
        if (filters.tried) {
          return Promise.resolve([
            {
              wineId: 502,
              name: 'Cheval des Andes',
              wineType: 'Red',
              vintage: 2020,
              userRating: 5,
              userComment: 'Impresionante finura',
              isTried: true,
              isWanted: false,
              isFavorite: false,
              lastChangeAt: '2026-03-01T00:00:00Z',
              reviewCount: 15,
            },
          ]);
        }
        if (filters.favorite) {
          return Promise.resolve([
            {
              wineId: 503,
              name: 'Adrianna Vineyard Malbec',
              wineType: 'Red',
              vintage: 2021,
              userRating: 5,
              isTried: false,
              isWanted: false,
              isFavorite: true,
              lastChangeAt: '2026-03-01T00:00:00Z',
              reviewCount: 30,
            },
          ]);
        }
        return Promise.resolve([]);
      });
    });

    it('las tarjetas de Joyas de la Cava enlazan a /vinos/:id', async () => {
      render(
        <MemoryRouter initialEntries={['/perfil/Kevin']}>
          <Routes>
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      const showcaseLink = await screen.findByRole('link', { name: /Nicolás Catena Zapata/i });
      expect(showcaseLink).toBeInTheDocument();
      expect(showcaseLink).toHaveAttribute('href', '/vinos/501');
    });

    it('las tarjetas de Historial de Catas enlazan a /vinos/:id', async () => {
      render(
        <MemoryRouter initialEntries={['/perfil/Kevin?tab=historial']}>
          <Routes>
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      const triedLink = await screen.findByRole('link', { name: /Cheval des Andes/i });
      expect(triedLink).toBeInTheDocument();
      expect(triedLink).toHaveAttribute('href', '/vinos/502');
    });

    it('las tarjetas de Favoritos enlazan a /vinos/:id', async () => {
      render(
        <MemoryRouter initialEntries={['/perfil/Kevin?tab=favoritos']}>
          <Routes>
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      const favLink = await screen.findByRole('link', { name: /Adrianna Vineyard Malbec/i });
      expect(favLink).toBeInTheDocument();
      expect(favLink).toHaveAttribute('href', '/vinos/503');
    });
  });
});
