import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import WineDetailPage from '@/pages/WineDetailPage';
import WineDetailView from '@/features/wines/components/WineDetailView';
import { apiWineToEditorial } from '@/features/wines/adapters/apiWineToEditorial';
import type { WineResponseDto, WineryResponseDto } from '@/features/winery/types';

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

let mockCurrentUser = {
  id: 1,
  username: 'sommelier',
  role: 'User',
};

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    isAuthenticated: true,
  }),
}));

const sampleRealWine: WineResponseDto = {
  id: 105,
  name: 'Altamira Paraje Malbec',
  description: 'Vino de terroir de alta gama.',
  wineType: 'Red',
  wineryId: 45,
  wineryNameText: 'Bodega Zuccardi Valle de Uco',
  locationId: 1,
  sourceType: 'Official',
  duplicateOfWineId: null,
  averageRating: 4.9,
  reviewCount: 30,
};

const sampleWinery: WineryResponseDto = {
  id: 45,
  name: 'Bodega Zuccardi Valle de Uco',
  description: 'Arquitectura y terroir en Altamira.',
  foundationYear: 1963,
  website: 'https://zuccardiwines.com',
  status: 'Approved',
  registerDate: '2026-01-01',
  location: {
    regionName: 'Paraje Altamira',
    stateName: 'Mendoza',
  },
  totals: { labels: 10, vintages: 25 },
  reviewCount: 50,
  averageRating: 4.9,
};

const sampleVintages = [
  {
    id: 301,
    wineId: 105,
    year: 2019,
    alcoholContent: 14.5,
    servingTemperature: 16,
    agingAdvice: '15 años en estiba',
    approvalStatus: 'Approved',
    averageRating: 4.8,
    reviewCount: 12,
    grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
  },
  {
    id: 302,
    wineId: 105,
    year: 2021,
    alcoholContent: 14.0,
    servingTemperature: 16,
    agingAdvice: '10 años en estiba',
    approvalStatus: 'Approved',
    averageRating: 5.0,
    reviewCount: 18,
    grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
  },
];

function renderWithRoute(initialEntry = '/vinos/105') {
  const setStockCount = vi.fn();
  const refreshStock = vi.fn().mockResolvedValue(undefined);

  return {
    setStockCount,
    refreshStock,
    ...render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  stockCount: 10,
                  setStockCount,
                  refreshStock,
                }}
              />
            }
          >
            <Route path="/vinos/:id" element={<WineDetailPage />} />
            <Route path="/bodegas/:id" element={<div data-testid="winery-page">Página de Bodega</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  };
}

describe('Bloque U10 - Ficha del vino: Guardar en cava y Enlaces a bodega', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser = { id: 1, username: 'sommelier', role: 'User' };
    mockClient.get.mockImplementation((url: string) => {
      if (url === '/wines/105') {
        return Promise.resolve({ data: sampleRealWine });
      }
      if (url === '/wines/105/vintages') {
        return Promise.resolve({ data: sampleVintages });
      }
      if (url === '/wineries/45') {
        return Promise.resolve({ data: sampleWinery });
      }
      if (url === '/wines/105/pairings') {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/wines/105/reviews')) {
        return Promise.resolve({ data: [] });
      }
      if (url === '/grapes') {
        return Promise.resolve({ data: [{ id: 1, name: 'Malbec' }] });
      }
      if (url === '/pairings') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/cellars/me') {
        return Promise.resolve({ data: [{ id: 1, name: 'Mi Cava' }] });
      }
      if (url === '/wines/105/existing-years') {
        return Promise.resolve({ data: [2019, 2021] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  describe('10.1 "Guardar en cava" para vino real', () => {
    it('abre QuickAddBottleModal con los datos del vino cargados y la añada activa preseleccionada', async () => {
      renderWithRoute('/vinos/105');

      expect(await screen.findByText('Altamira Paraje Malbec')).toBeInTheDocument();

      // Añada por defecto activa es la primera (2019)
      const saveBtn = screen.getByRole('button', { name: /guardar en cava/i });
      expect(saveBtn).not.toBeDisabled();

      fireEvent.click(saveBtn);

      // Abre modal QuickAddBottleModal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // El modal muestra el nombre cargado
      expect(screen.getByDisplayValue('Altamira Paraje Malbec')).toBeInTheDocument();
      // La cosecha activa (2019) está precargada
      expect(screen.getByDisplayValue('2019')).toBeInTheDocument();
    });

    it('al cambiar de añada activa en la ficha, el modal abre con la nueva añada preseleccionada', async () => {
      renderWithRoute('/vinos/105');

      expect(await screen.findByText('Altamira Paraje Malbec')).toBeInTheDocument();

      // Cambiar a la añada 2021 haciendo clic en su chip
      const chip2021 = screen.getByRole('button', { name: '2021' });
      fireEvent.click(chip2021);

      // Abrir modal
      const saveBtn = screen.getByRole('button', { name: /guardar en cava/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Ahora la cosecha preseleccionada es 2021
      expect(screen.getByDisplayValue('2021')).toBeInTheDocument();
    });

    it('en modo dueño de la bodega, el botón "Guardar en cava" continúa deshabilitado', () => {
      const editorial = apiWineToEditorial(
        sampleRealWine,
        sampleVintages,
        sampleWinery,
        [],
        [{ id: 1, name: 'Malbec' }],
        []
      );

      render(
        <MemoryRouter>
          <WineDetailView
            wine={editorial}
            ownerMode={true}
            isRealWine={true}
          />
        </MemoryRouter>
      );

      const saveBtn = screen.getByRole('button', { name: /guardar en cava/i });
      expect(saveBtn).toBeDisabled();
      expect(saveBtn).toHaveAttribute(
        'title',
        'No podés guardar tus propios vinos en tu cava personal'
      );
    });

    it('en vino de maqueta editorial conserva su comportamiento en memoria/storage sin abrir QuickAddBottleModal', () => {
      renderWithRoute('/vinos/catena-zapata-malbec-argentino');

      const saveBtn = screen.getByRole('button', { name: /guardar en cava/i });
      fireEvent.click(saveBtn);

      // Toast de éxito de maqueta
      expect(screen.getByText(/guardado en tu Cava!/i)).toBeInTheDocument();
      // No debe existir el modal de alta rápida
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('10.2 Enlaces a la bodega elaboradora', () => {
    it('cuando wineryId está presente, "Elaborado por" y la tarjeta llevan a /bodegas/{wineryId}', async () => {
      renderWithRoute('/vinos/105');

      expect(await screen.findByText('Altamira Paraje Malbec')).toBeInTheDocument();

      // Enlaces a la bodega (texto "Elaborado por" y tarjeta "Bodega Elaboradora")
      const links = screen.getAllByRole('link', { name: /Bodega Zuccardi Valle de Uco/i });
      expect(links.length).toBe(2);
      expect(links[0]).toHaveAttribute('href', '/bodegas/45');
      expect(links[1]).toHaveAttribute('href', '/bodegas/45');

      // El enlace "Sitio web oficial" no cambia
      const webLink = screen.getByRole('link', { name: /sitio web oficial/i });
      expect(webLink).toHaveAttribute('href', 'https://zuccardiwines.com');
      expect(webLink).toHaveAttribute('target', '_blank');
    });

    it('cuando wineryId NO está presente (bodega manual o mock), se renderiza como texto plano sin enlace', () => {
      const manualWine: WineResponseDto = {
        ...sampleRealWine,
        wineryId: null,
        wineryNameText: 'Bodega de Autor Artesanal',
      };

      const editorial = apiWineToEditorial(
        manualWine,
        sampleVintages,
        null,
        [],
        [{ id: 1, name: 'Malbec' }],
        []
      );

      render(
        <MemoryRouter>
          <WineDetailView wine={editorial} isRealWine={true} />
        </MemoryRouter>
      );

      // El nombre debe estar presente
      const matches = screen.getAllByText('Bodega de Autor Artesanal');
      expect(matches.length).toBeGreaterThanOrEqual(1);

      // No debe haber enlaces a /bodegas/
      const links = screen.queryAllByRole('link');
      const wineryLinks = links.filter((l) => l.getAttribute('href')?.startsWith('/bodegas/'));
      expect(wineryLinks.length).toBe(0);
    });
  });

  describe('10.3 apiWineToEditorial mapeo de wineryId', () => {
    it('mapea correctamente wineryId desde winery.id', () => {
      const result = apiWineToEditorial(
        sampleRealWine,
        sampleVintages,
        sampleWinery,
        [],
        [],
        []
      );

      expect(result.wineryId).toBe(45);
      expect(result.winery?.wineryId).toBe(45);
    });

    it('mapea wineryId desde wine.wineryId cuando winery es null', () => {
      const result = apiWineToEditorial(
        { ...sampleRealWine, wineryId: 78 },
        sampleVintages,
        null,
        [],
        [],
        []
      );

      expect(result.wineryId).toBe(78);
      expect(result.winery?.wineryId).toBe(78);
    });

    it('deja wineryId como undefined cuando no hay id de bodega', () => {
      const result = apiWineToEditorial(
        { ...sampleRealWine, wineryId: null },
        sampleVintages,
        null,
        [],
        [],
        []
      );

      expect(result.wineryId).toBeUndefined();
    });
  });
});
