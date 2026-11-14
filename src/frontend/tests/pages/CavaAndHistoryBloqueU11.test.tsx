import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import CavaPage from '@/pages/CavaPage';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import * as usersApi from '@/features/users/api/userApi';
import type { CellarItemDto } from '@/features/users/types';

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

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'sommelier', email: 'somm@test.com', role: 'User' },
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

function AppOutletHarness({
  children,
  initialStock = 5,
  refreshStock = vi.fn().mockResolvedValue(undefined),
}: {
  children: React.ReactNode;
  initialStock?: number;
  refreshStock?: () => Promise<void>;
}) {
  const setStockCount = vi.fn();

  return (
    <Routes>
      <Route
        element={
          <Outlet
            context={{
              stockCount: initialStock,
              setStockCount,
              refreshStock,
            }}
          />
        }
      >
        <Route path="/" element={children} />
        <Route path="/cava" element={children} />
        <Route path="/dashboard" element={children} />
      </Route>
    </Routes>
  );
}

describe('Bloque U11 - Registrar cata completa, bitácora real y contador de la cava', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('11.2 & 11.3: Registrar cata en /cava y Bitácora persistente desde la API', () => {
    it('carga la bitácora de cata desde GET /api/user-wines/me?tried=true y la muestra en VaultLogbookModule', async () => {
      mockClient.get.mockImplementation((url: string, config?: { params?: { tried?: boolean } }) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/10/items') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/user-wines/me' && config?.params?.tried) {
          return Promise.resolve({
            data: [
              {
                wineId: 101,
                name: 'Cobos Chañares Malbec',
                vintage: 2017,
                wineryName: 'Viña Cobos',
                averageRating: 4.9,
                userRating: 5,
                userComment: 'Gran estructura, taninos redondos y largo final mineral.',
                lastChangeAt: '2026-11-14T10:00:00Z',
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <AppOutletHarness>
            <CavaPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      // Debe consultar a la API de vinos probados para la bitácora
      await waitFor(() => {
        expect(mockClient.get).toHaveBeenCalledWith('/user-wines/me', expect.objectContaining({
          params: expect.objectContaining({ tried: true, pageSize: 100 }),
        }));
      });

      // La tarjeta de última reseña de cata muestra los datos del vino probado real
      expect(await screen.findByText('Cobos Chañares Malbec (2017)')).toBeInTheDocument();
      expect(screen.getByText('CATA PRIVADA 100 PTS')).toBeInTheDocument();
      expect(screen.getByText(/Gran estructura, taninos redondos y largo final mineral/i)).toBeInTheDocument();
    });

    it('al descorchar una botella, envía calificación redondeada (1-5) y notas de cata en el body a la API', async () => {
      const refreshStockSpy = vi.fn().mockResolvedValue(undefined);

      mockClient.get.mockImplementation((url: string, config?: { params?: { tried?: boolean } }) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/10/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 205,
                wineId: 50,
                name: 'Adrianna Vineyard White Stones',
                wineryName: 'Catena Zapata',
                wineType: 'White',
                year: 2019,
                quantity: 2,
              },
            ],
          });
        }
        if (url === '/user-wines/me' && config?.params?.tried) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      mockClient.post.mockResolvedValue({
        data: {
          wineVintageId: 205,
          quantity: 1,
        },
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <AppOutletHarness refreshStock={refreshStockSpy}>
            <CavaPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      expect(await screen.findByText('Adrianna Vineyard White Stones')).toBeInTheDocument();

      // Abrir diálogo de descorche
      const uncorkBtn = screen.getByRole('button', { name: /Registrar Cata/i });
      fireEvent.click(uncorkBtn);

      // El diálogo debe estar visible
      expect(await screen.findByRole('dialog')).toBeInTheDocument();

      // Completar notas de cata
      const notesInput = screen.getByPlaceholderText(/Aromas predominantes/i);
      fireEvent.change(notesInput, { target: { value: 'Acidez punzante, notas de tiza y lima madura.' } });

      // Confirmar descorche
      const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
      fireEvent.click(submitBtn);

      // Se debe haber enviado POST con body { rating: 5, comment: 'Acidez punzante, notas de tiza y lima madura.' }
      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith(
          '/cellars/10/items/205/uncork',
          expect.objectContaining({
            rating: 5,
            comment: 'Acidez punzante, notas de tiza y lima madura.',
          })
        );
      });

      // Notificación exitosa
      const toastEl = await screen.findByRole('status');
      expect(toastEl).toHaveTextContent(/¡Descorche registrado!/i);
      expect(toastEl).toHaveTextContent(/5 estrellas/i);
      expect(refreshStockSpy).toHaveBeenCalled();
    });

    it('al fallar el descorche en backend, muestra aviso de error y no reporta falso éxito ni altera estado', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/10/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 205,
                wineId: 50,
                name: 'Adrianna Vineyard White Stones',
                wineryName: 'Catena Zapata',
                wineType: 'White',
                year: 2019,
                quantity: 1,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      mockClient.post.mockRejectedValueOnce({
        isAxiosError: true,
        response: {
          status: 400,
          data: { detail: 'El rating debe estar entre 1 y 5.' },
        },
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <AppOutletHarness>
            <CavaPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      expect(await screen.findByText('Adrianna Vineyard White Stones')).toBeInTheDocument();

      const uncorkBtn = screen.getByRole('button', { name: /Registrar Cata/i });
      fireEvent.click(uncorkBtn);

      const submitBtn = await screen.findByRole('button', { name: /REGISTRAR DESCORCHE/i });
      fireEvent.click(submitBtn);

      const toastEl = await screen.findByRole('status');
      expect(toastEl).toHaveTextContent('El rating debe estar entre 1 y 5.');
      expect(toastEl).not.toHaveTextContent(/¡Descorche registrado!/i);
    });
  });

  describe('11.4: "Joyas de la Cava" muestra "vinos" y no "botellas"', () => {
    it('muestra "vinos" en plural y singular en el perfil de usuario', async () => {
      const mockProfileMulti = {
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

      const sampleCellarItem: CellarItemDto = {
        wineVintageId: 101,
        wineId: 40,
        name: 'Gran Reserva Malbec',
        wineType: 'Red',
        year: 2020,
        quantity: 2,
        wineryNameText: 'Bodega Norton',
        reviewCount: 5,
        lastChangeAt: '2025-01-01T00:00:00Z',
      };

      vi.spyOn(usersApi, 'getPublicUserProfileApi').mockResolvedValue(mockProfileMulti);
      vi.spyOn(usersApi, 'getMyCellarsApi').mockResolvedValue([{ id: 10, name: 'Mi Cava', vintageCount: 3, bottleCount: 5, createdAt: '2025-01-01' }]);
      vi.spyOn(usersApi, 'getCellarItemsApi').mockResolvedValue([sampleCellarItem]);

      const { unmount } = render(
        <MemoryRouter initialEntries={['/perfil/sommelier?tab=cava']}>
          <Routes>
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      // Con 3 vinos: debe decir "Ver Cava Completa (3 vinos)" y no "botellas"
      expect(await screen.findByText('Ver Cava Completa (3 vinos)')).toBeInTheDocument();
      expect(screen.queryByText(/Ver Cava Completa \(\d+ botellas\)/i)).not.toBeInTheDocument();

      unmount();

      // Probar singular con 1 vino
      const mockProfileSingle = {
        ...mockProfileMulti,
        cellarWinesCount: 1,
      };
      vi.spyOn(usersApi, 'getPublicUserProfileApi').mockResolvedValue(mockProfileSingle);

      render(
        <MemoryRouter initialEntries={['/perfil/sommelier?tab=cava']}>
          <Routes>
            <Route path="/perfil/:username" element={<ProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      // Con 1 vino: debe decir "Ver Cava Completa (1 vino)"
      expect(await screen.findByText('Ver Cava Completa (1 vino)')).toBeInTheDocument();
      expect(screen.queryByText(/Ver Cava Completa \(\d+ botellas\)/i)).not.toBeInTheDocument();
    });
  });

  describe('11.3: Descorche en DashboardPage envía calificación y notas', () => {
    it('envía rating y comment al descorchar desde el Dashboard', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/10/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 301,
                wineId: 105,
                name: 'Altamira Paraje Malbec',
                quantity: 2,
              },
            ],
          });
        }
        if (url === '/wines/search' || String(url).includes('/wines/search')) {
          return Promise.resolve({
            data: [
              {
                id: 105,
                name: 'Altamira Paraje Malbec',
                wineryName: 'Zuccardi',
                wineType: 'Red',
                varietal: 'Malbec',
                vintage: 2019,
                averageRating: 4.9,
                reviewCount: 20,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      mockClient.post.mockResolvedValue({
        data: {
          wineVintageId: 301,
          quantity: 1,
        },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppOutletHarness>
            <DashboardPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      expect(await screen.findByText('Altamira Paraje Malbec')).toBeInTheDocument();

      // Abrir modal de descorche en Dashboard Wine Card
      const uncorkActionBtn = screen.getByRole('button', { name: /Descorchar/i });
      fireEvent.click(uncorkActionBtn);

      expect(await screen.findByRole('dialog')).toBeInTheDocument();

      const notesField = screen.getByPlaceholderText(/Aromas predominantes/i);
      fireEvent.change(notesField, { target: { value: 'Gran momento de apertura, fruta negra y violetas.' } });

      const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith(
          expect.stringContaining('/uncork'),
          expect.objectContaining({
            rating: 5,
            comment: 'Gran momento de apertura, fruta negra y violetas.',
          })
        );
      });
    });
  });
});
