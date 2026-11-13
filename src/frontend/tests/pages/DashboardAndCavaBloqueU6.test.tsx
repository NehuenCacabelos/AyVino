import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import CavaPage from '@/pages/CavaPage';
import DashboardNavbar from '@/features/dashboard/components/DashboardNavbar';

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

function AppOutletHarness({ children, initialStock = 5 }: { children: React.ReactNode; initialStock?: number }) {
  const [stockCount, setStockCount] = [initialStock, vi.fn()];
  const refreshStock = vi.fn().mockResolvedValue(undefined);

  return (
    <Routes>
      <Route
        element={
          <Outlet
            context={{
              stockCount,
              setStockCount,
              refreshStock,
            }}
          />
        }
      >
        <Route path="/" element={children} />
      </Route>
    </Routes>
  );
}

describe('Bloque U6 - Favoritos, Descorche y Navegación', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Favoritos (Corazón) en DashboardPage', () => {
    it('carga el estado inicial de favoritos en una sola consulta compartida (/user-wines/me?favorite=true&pageSize=100)', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/user-wines/me?favorite=true&pageSize=100') {
          return Promise.resolve({ data: [{ wineId: 1 }] });
        }
        if (url === '/wines/search' || String(url).includes('/wines/search')) {
          return Promise.resolve({
            data: [
              {
                id: 1,
                name: 'Vino Uno',
                wineryName: 'Bodega Test',
                wineryId: 10,
                wineType: 'Red',
                varietal: 'Malbec',
                vintage: 2020,
                averageRating: 4.8,
                reviewCount: 10,
              },
              {
                id: 2,
                name: 'Vino Dos',
                wineryName: 'Bodega Test',
                wineryId: 10,
                wineType: 'Red',
                varietal: 'Malbec',
                vintage: 2021,
                averageRating: 4.5,
                reviewCount: 8,
              },
            ],
          });
        }
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 1, name: 'Mi Cava' }] });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter>
          <AppOutletHarness>
            <DashboardPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      // Esperar que cargue catálogo
      expect(await screen.findByText('Vino Uno')).toBeInTheDocument();
      expect(await screen.findByText('Vino Dos')).toBeInTheDocument();

      // Verificar que /user-wines/me se haya llamado exactamente una vez
      const favoriteCalls = mockClient.get.mock.calls.filter(
        ([callUrl]) => String(callUrl).includes('/user-wines/me?favorite=true')
      );
      expect(favoriteCalls.length).toBe(1);

      // El vino 1 debe tener botón de favoritos activo
      const favBtn1 = screen.getByRole('button', { name: /Quitar Vino Uno de favoritos/i });
      expect(favBtn1).toBeInTheDocument();

      // El vino 2 debe tener botón para añadir a favoritos
      const favBtn2 = screen.getByRole('button', { name: /Añadir Vino Dos a favoritos/i });
      expect(favBtn2).toBeInTheDocument();
    });

    it('persiste con PUT al marcar favorito y revierte optimismo si la API falla', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/user-wines/me?favorite=true&pageSize=100') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/wines/search' || String(url).includes('/wines/search')) {
          return Promise.resolve({
            data: [
              {
                id: 5,
                name: 'Vino Cinco',
                wineryName: 'Bodega Cinco',
                wineryId: 50,
                wineType: 'Red',
                varietal: 'Cabernet',
                vintage: 2020,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      // Simular fallo en PUT
      mockClient.put.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter>
          <AppOutletHarness>
            <DashboardPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      expect(await screen.findByText('Vino Cinco')).toBeInTheDocument();

      const favBtn = screen.getByRole('button', { name: /Añadir Vino Cinco a favoritos/i });
      fireEvent.click(favBtn);

      // Debe haber intentado el PUT a /wines/5/favorite
      expect(mockClient.put).toHaveBeenCalledWith('/wines/5/favorite');

      // Ante error, debe mostrar toast de error y revertir estado
      expect(await screen.findByText('No se pudo actualizar favoritos. Intentalo de nuevo.')).toBeInTheDocument();
      expect(screen.queryByText(/añadido a tus Deseados/i)).toBeNull();
    });
  });

  describe('Descorche Atómico en CavaPage', () => {
    it('al confirmar descorche, dispara POST a /cellars/{cellarId}/items/{vintageId}/uncork y actualiza cava', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/10/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 100,
                wineId: 40,
                name: 'Gran Reserva Malbec',
                wineryName: 'Bodega Norton',
                wineType: 'Red',
                year: 2020,
                quantity: 2,
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      mockClient.post.mockResolvedValue({
        data: {
          wineVintageId: 100,
          quantity: 1,
        },
      });

      render(
        <MemoryRouter>
          <AppOutletHarness>
            <CavaPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      expect(await screen.findByText('Gran Reserva Malbec')).toBeInTheDocument();

      // Click en "Registrar Cata" para abrir UncorkDialog
      const uncorkBtn = screen.getByRole('button', { name: /Registrar Cata/i });
      fireEvent.click(uncorkBtn);

      // Confirmar en el modal de descorche con botón REGISTRAR DESCORCHE
      const confirmUncork = await screen.findByRole('button', { name: /REGISTRAR DESCORCHE/i });
      fireEvent.click(confirmUncork);

      // Debe haber llamado al endpoint nuevo de descorche
      await waitFor(() => {
        expect(mockClient.post).toHaveBeenCalledWith('/cellars/10/items/100/uncork');
      });

      // Muestra notificación de éxito en el toast status
      const statusEl = await screen.findByRole('status');
      expect(statusEl).toHaveTextContent(/¡Descorche registrado!/i);
    });

    it('al fallar el descorche en backend, muestra el error sin reportar falso éxito ni alterar stock', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/10/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 100,
                wineId: 40,
                name: 'Gran Reserva Malbec',
                wineryName: 'Bodega Norton',
                wineType: 'Red',
                year: 2020,
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
          status: 409,
          data: { detail: 'No quedan botellas de esta cosecha en la cava o el ítem no existe.' },
        },
      });

      render(
        <MemoryRouter>
          <AppOutletHarness>
            <CavaPage />
          </AppOutletHarness>
        </MemoryRouter>
      );

      expect(await screen.findByText('Gran Reserva Malbec')).toBeInTheDocument();

      const uncorkBtn = screen.getByRole('button', { name: /Registrar Cata/i });
      fireEvent.click(uncorkBtn);

      const confirmUncork = await screen.findByRole('button', { name: /REGISTRAR DESCORCHE/i });
      fireEvent.click(confirmUncork);

      // Debe mostrar el mensaje exacto de conflicto del backend en el toast status
      const statusEl = await screen.findByRole('status');
      expect(statusEl).toHaveTextContent('No quedan botellas de esta cosecha en la cava o el ítem no existe.');
      expect(statusEl).not.toHaveTextContent(/¡Descorche registrado!/i);
    });
  });

  describe('Navegación de DashboardNavbar', () => {
    it('enlaces "Mi historial" y "Favoritos" apuntan a rutas de perfil con query params correctos', () => {
      render(
        <MemoryRouter>
          <DashboardNavbar />
        </MemoryRouter>
      );

      // Abrir menú de usuario para mostrar opciones de escritorio
      const avatarBtn = screen.getByRole('button', { name: /Menú de perfil de usuario/i });
      fireEvent.click(avatarBtn);

      // Verificar enlaces en el menú abierto
      const historialLink = screen.getByRole('menuitem', { name: /Mi historial/i });
      expect(historialLink).toBeInTheDocument();
      expect(historialLink).toHaveAttribute('href', '/perfil/sommelier?tab=historial');

      const favoritosLink = screen.getByRole('menuitem', { name: /Favoritos/i });
      expect(favoritosLink).toBeInTheDocument();
      expect(favoritosLink).toHaveAttribute('href', '/perfil/sommelier?tab=favoritos');
    });
  });
});
