import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CavaPage from '@/pages/CavaPage';
import VaultWineCard from '@/features/cava/components/VaultWineCard';
import VaultVitals from '@/features/cava/components/VaultVitals';
import UncorkDialog from '@/features/dashboard/components/UncorkDialog';
import type { CellarWine, CellarVitals as CellarVitalsType } from '@/features/cava/types';
import type { DashboardWine } from '@/types/wine';

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/services/apiClient', () => ({
  default: mockClient,
  apiClient: mockClient,
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 10, username: 'Mariano Cava', role: 'User' },
  }),
}));

describe('Bloque U13D - Pantalla /cava', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('D.1 Clic en un vino navega a ficha y botón Gestionar', () => {
    const sampleWine: CellarWine = {
      id: 'item-101',
      wineId: 42,
      wineVintageId: 201,
      name: 'Catena Zapata Malbec Argentino',
      winery: 'Catena Zapata',
      region: 'Mendoza',
      varietal: 'Malbec',
      vintage: 2019,
      rating: 4.8,
      userRating: 4.8,
      units: 2,
      location: 'Estante 3',
      agingStatus: 'optimal',
      agingStatusLabel: 'Ventana Óptima',
      bottle: 'red-bordeaux',
      imageUrl: '/api/images/sample-img?variant=card&v=1',
      imageId: 'sample-img',
    };

    it('el clic en la imagen o en el nombre contiene el enlace a /vinos/{wineId}', () => {
      render(
        <MemoryRouter>
          <VaultWineCard
            wine={sampleWine}
            onOpenDetails={vi.fn()}
            onUncork={vi.fn()}
          />
        </MemoryRouter>
      );

      // Enlace en el contenedor de imagen
      const imgLink = screen.getByLabelText(/Ver ficha de Catena Zapata Malbec Argentino/i);
      expect(imgLink).toHaveAttribute('href', '/vinos/42');

      // Enlace en el título
      const titleLink = screen.getByRole('link', { name: sampleWine.name });
      expect(titleLink).toHaveAttribute('href', '/vinos/42');
    });

    it('el botón "Gestionar" abre TechnicalSheetModal y "Registrar Cata" abre el modal de cata', () => {
      const openDetailsSpy = vi.fn();
      const uncorkSpy = vi.fn();

      render(
        <MemoryRouter>
          <VaultWineCard
            wine={sampleWine}
            onOpenDetails={openDetailsSpy}
            onUncork={uncorkSpy}
          />
        </MemoryRouter>
      );

      const manageBtn = screen.getByRole('button', { name: /Gestionar/i });
      fireEvent.click(manageBtn);
      expect(openDetailsSpy).toHaveBeenCalledWith(sampleWine);

      const uncorkBtn = screen.getByRole('button', { name: /Registrar Cata/i });
      fireEvent.click(uncorkBtn);
      expect(uncorkSpy).toHaveBeenCalledWith(sampleWine);
    });
  });

  describe('D.2 Modal de Registrar Cata (UncorkDialog) con imagen real o fallback', () => {
    const wineWithImage: DashboardWine = {
      id: 'api-item-201',
      name: 'Gran Enemigo Gualtallary',
      winery: 'Aleanna',
      region: 'Tupungato',
      varietal: 'Cabernet Franc',
      vintage: 2018,
      rating: 4.9,
      bottle: 'red-bordeaux',
      units: 3,
      imageId: 'img-enemigo-123',
    };

    const wineWithoutImage: DashboardWine = {
      id: 'api-item-202',
      name: 'Vino Sin Foto',
      winery: 'Bodega Desconocida',
      region: 'Salta',
      varietal: 'Torrontés',
      vintage: 2021,
      rating: 4.0,
      bottle: 'white',
      units: 1,
      imageId: null,
      imageUrl: undefined,
    };

    it('muestra la imagen real de la cosecha con variante detail', () => {
      render(
        <UncorkDialog
          wine={wineWithImage}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      const img = screen.getByAltText(wineWithImage.name);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', expect.stringContaining('/api/images/img-enemigo-123?variant=detail'));
    });

    it('muestra la silueta vectorial si no tiene imagen', () => {
      const { container } = render(
        <UncorkDialog
          wine={wineWithoutImage}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      );

      // No debe haber tag img HTML
      expect(container.querySelector('img')).toBeNull();
      // Debe haber encabezado del vino y silueta SVG de botella
      expect(screen.getByRole('heading', { name: wineWithoutImage.name })).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('D.3 Texto de puntaje en estrellas sin PTS', () => {
    const ratedWine: CellarWine = {
      id: 'item-1',
      wineId: 10,
      name: 'Vino Puntuado',
      winery: 'Bodega X',
      region: 'Mendoza',
      varietal: 'Malbec',
      vintage: 2020,
      rating: 4.3,
      userRating: 4.3,
      units: 1,
      location: 'Cava',
      agingStatus: 'optimal',
      bottle: 'red-bordeaux',
    };

    const unratedWine: CellarWine = {
      id: 'item-2',
      wineId: 11,
      name: 'Vino Sin Puntuación',
      winery: 'Bodega Y',
      region: 'Mendoza',
      varietal: 'Syrah',
      vintage: 2021,
      rating: 0,
      userRating: null,
      units: 1,
      location: 'Cava',
      agingStatus: 'optimal',
      bottle: 'red-bordeaux',
    };

    it('VaultWineCard muestra MI CATA 4,3 ★ para vinos puntuados y Sin calificar para no puntuados', () => {
      const { rerender } = render(
        <MemoryRouter>
          <VaultWineCard wine={ratedWine} onOpenDetails={vi.fn()} onUncork={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText('MI CATA 4,3 ★')).toBeInTheDocument();
      expect(screen.queryByText(/PTS/i)).toBeNull();

      rerender(
        <MemoryRouter>
          <VaultWineCard wine={unratedWine} onOpenDetails={vi.fn()} onUncork={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.queryByText(/PTS/i)).toBeNull();
    });
  });

  describe('D.4 Bitácora de catas desde API con paginación', () => {
    it('carga las catas desde /users/me/tastings y permite cargar más páginas', async () => {
      mockClient.get.mockImplementation((url: string, config?: { params?: { pageNumber?: number; pageSize?: number } }) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 1, name: 'Cava Principal' }] });
        }
        if (url === '/cellars/1/items') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/users/me/tastings') {
          const page = config?.params?.pageNumber || 1;
          if (page === 1) {
            // Retorna 10 catas para habilitar el botón "Cargar más"
            return Promise.resolve({
              data: Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                wineId: 100 + i,
                wineName: `Vino Cata ${i + 1}`,
                vintageYear: 2020,
                wineryName: 'Bodega Test',
                rating: 4.5,
                comment: `Nota de cata número ${i + 1}`,
                tastedAt: '2026-11-14T12:00:00Z',
              })),
            });
          }
          if (page === 2) {
            return Promise.resolve({
              data: [
                {
                  id: 11,
                  wineId: 111,
                  wineName: 'Vino Página Dos',
                  vintageYear: 2019,
                  wineryName: 'Bodega Dos',
                  rating: 5.0,
                  comment: 'Nota de la segunda página.',
                  tastedAt: '2026-11-13T12:00:00Z',
                },
              ],
            });
          }
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <Routes>
            <Route path="/cava" element={<CavaPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Debe consultar página 1
      await waitFor(() => {
        expect(mockClient.get).toHaveBeenCalledWith('/users/me/tastings', expect.objectContaining({
          params: expect.objectContaining({ pageNumber: 1, pageSize: 10 }),
        }));
      });

      // Abre el modal de la bitácora
      const openLogbookBtn = await screen.findByRole('button', { name: /notas registradas/i });
      fireEvent.click(openLogbookBtn);

      const modal = screen.getByRole('dialog');
      expect(within(modal).getByText('Vino Cata 1 (2020)')).toBeInTheDocument();
      const loadMoreBtn = within(modal).getByRole('button', { name: /Cargar más notas de cata/i });
      expect(loadMoreBtn).toBeInTheDocument();

      // Clic en "Cargar más notas de cata"
      fireEvent.click(loadMoreBtn);

      await waitFor(() => {
        expect(mockClient.get).toHaveBeenCalledWith('/users/me/tastings', expect.objectContaining({
          params: expect.objectContaining({ pageNumber: 2, pageSize: 10 }),
        }));
      });

      // Debe mostrar el vino de la página 2 dentro del modal
      expect(await within(modal).findByText('Vino Página Dos (2019)')).toBeInTheDocument();
    });
  });

  describe('D.5 Indicadores con cava vacía vs con botellas', () => {
    it('con cava vacía muestra guiones (—) o 0 y nunca "Malbec 55%" ni "2017"', () => {
      const emptyVitals: CellarVitalsType = {
        totalBottles: 0,
        redsCount: 0,
        whitesCount: 0,
        sparklingCount: 0,
        optimalCount: 0,
        dominantVarietal: '—',
        dominantVarietalPercentage: 0,
        oldestVintage: null,
        oldestVintageAgingYears: 0,
      };

      render(<VaultVitals vitals={emptyVitals} />);

      // Total debe ser 0
      expect(screen.getByText('0')).toBeInTheDocument();
      // Añada más antigua debe ser —
      expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('Sin botellas en estiba')).toBeInTheDocument();

      // Prohibido mostrar datos inventados
      expect(screen.queryByText(/Malbec/i)).toBeNull();
      expect(screen.queryByText(/55%/i)).toBeNull();
      expect(screen.queryByText('2017')).toBeNull();
    });

    it('con botellas, calcula la añada más antigua real y el varietal dominante real', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 99, name: 'Cava Real' }] });
        }
        if (url === '/cellars/99/items') {
          return Promise.resolve({
            data: [
              {
                wineVintageId: 1,
                wineId: 10,
                name: 'Chacra 55 Pinot Noir',
                grapeName: 'Pinot Noir',
                wineType: 'Red',
                year: 2014,
                quantity: 3,
                averageRating: 4.8,
              },
              {
                wineVintageId: 2,
                wineId: 20,
                name: 'White Bones Chardonnay',
                grapeName: 'Chardonnay',
                wineType: 'White',
                year: 2021,
                quantity: 1,
                averageRating: 4.9,
              },
            ],
          });
        }
        if (url === '/users/me/tastings') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <Routes>
            <Route path="/cava" element={<CavaPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Esperar a que carguen los vinos
      expect(await screen.findByText('Chacra 55 Pinot Noir')).toBeInTheDocument();

      // Añada más antigua debe ser 2014 (no 2017)
      expect(screen.getByText('2014')).toBeInTheDocument();

      // Varietal dominante debe ser Pinot Noir (3 de 4 botellas = 75%)
      expect(screen.getByText('Pinot Noir')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });
});
