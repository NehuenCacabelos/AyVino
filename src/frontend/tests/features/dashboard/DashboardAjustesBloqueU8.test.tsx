import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryBlock from '@/features/dashboard/components/WineryBlock';
import QuickActions from '@/features/dashboard/components/QuickActions';
import * as catalogApi from '@/features/dashboard/api/catalogApi';
import type { DashboardWine } from '@/types/wine';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { username: 'Nehuen Sommelier' },
    isAuthenticated: true,
  }),
}));

const mockWines: DashboardWine[] = [
  {
    id: '101',
    wineryId: 42,
    wineryLogoImageId: 'logo-uuid-42',
    name: 'Gran Reserva Malbec',
    winery: 'Bodega Catena Zapata',
    region: 'Mendoza, Argentina',
    varietal: 'Malbec',
    vintage: '2020',
    rating: 4.8,
    bottle: 'bordeaux',
  },
];

const mockFiltersData: catalogApi.CatalogFiltersResponse = {
  grapes: [
    { id: 1, name: 'Malbec', wineCount: 15 },
    { id: 2, name: 'Cabernet Sauvignon', wineCount: 8 },
  ],
  provinces: [
    { id: 10, name: 'Mendoza', wineCount: 20 },
    { id: 20, name: 'Salta', wineCount: 5 },
  ],
  wineries: [
    { id: 42, name: 'Bodega Catena Zapata', wineCount: 10 },
    { id: 99, name: 'Rutini Wines', wineCount: 6 },
  ],
};

const mockSuggestions: catalogApi.SearchSuggestionsResponse = {
  wines: [{ id: 101, name: 'Gran Reserva Malbec', wineryName: 'Catena Zapata', vintage: 2020, imageId: null }],
  wineries: [{ id: 42, name: 'Bodega Catena Zapata', logoImageId: null, location: 'Mendoza' }],
  grapes: [{ id: 1, name: 'Malbec', wineCount: 15 }],
  regions: [{ id: 10, name: 'Mendoza', wineCount: 20 }],
};

describe('Bloque U8 - Dashboard Enlace al Catálogo y Sugerencias por Filtro', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(catalogApi, 'getCatalogFilters').mockResolvedValue(mockFiltersData);
    vi.spyOn(catalogApi, 'getSearchSuggestions').mockResolvedValue(mockSuggestions);
  });

  describe('8.1 WineryBlock - Enlace al catálogo de la bodega', () => {
    it('con wineryId: lleva a /bodegas/{wineryId}/catalogo', () => {
      const { container } = render(
        <MemoryRouter>
          <WineryBlock
            wineryId={42}
            name="Bodega Catena Zapata"
            region="Mendoza, Argentina"
            initials="CZ"
            total={5}
            wines={mockWines}
          />
        </MemoryRouter>,
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();

      const catalogLink = within(header!).getByRole('link', { name: /Ver catálogo completo \(5\)/i });
      expect(catalogLink).toBeInTheDocument();
      expect(catalogLink).toHaveAttribute('href', '/bodegas/42/catalogo');
    });

    it('sin wineryId: NO muestra el enlace "Ver catálogo completo"', () => {
      const { container } = render(
        <MemoryRouter>
          <WineryBlock
            name="Vino Comunitario Casero"
            region="Valle de Uco"
            initials="VC"
            total={1}
            wines={[
              {
                id: '999',
                name: 'Casero 2021',
                winery: 'Vino Comunitario Casero',
                region: 'Valle de Uco',
                varietal: 'Criolla',
                vintage: '2021',
                rating: 4.0,
                bottle: 'burgundy',
              },
            ]}
          />
        </MemoryRouter>,
      );

      const header = container.querySelector('header');
      expect(header).toBeInTheDocument();

      const catalogLink = within(header!).queryByRole('link', { name: /Ver catálogo completo/i });
      expect(catalogLink).toBeNull();
    });
  });

  describe('8.2 y 8.3 QuickActions - Sugerencias limitadas por el filtro activo', () => {
    it('envía los filtros activos de los combos (uva, provincia, bodega) a getSearchSuggestions', async () => {
      render(
        <MemoryRouter>
          <QuickActions />
        </MemoryRouter>,
      );

      // Esperar a que se carguen los combos
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /varietal/i })).not.toBeDisabled();
      });

      // Abrir combo de varietal y seleccionar Malbec (15)
      const varietalButton = screen.getByRole('button', { name: /varietal/i });
      fireEvent.click(varietalButton);

      const malbecOption = await screen.findByText('Malbec (15)');
      fireEvent.click(malbecOption);

      // Escribir en el buscador
      const searchInput = screen.getByPlaceholderText('Buscar vino, bodega, cepa o región...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'catena' } });

      // Avanzar timers / debounce de 250ms
      await waitFor(
        () => {
          expect(catalogApi.getSearchSuggestions).toHaveBeenCalledWith(
            'catena',
            expect.objectContaining({
              grapeId: 1,
              stateId: undefined,
              wineryId: undefined,
            }),
            expect.any(AbortSignal),
          );
        },
        { timeout: 1500 },
      );
    });

    it('vuelve a pedir las sugerencias si cambia un filtro con el término de búsqueda activo', async () => {
      render(
        <MemoryRouter>
          <QuickActions />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /región/i })).not.toBeDisabled();
      });

      // Escribir en el buscador primero
      const searchInput = screen.getByPlaceholderText('Buscar vino, bodega, cepa o región...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'reserva' } });

      await waitFor(
        () => {
          expect(catalogApi.getSearchSuggestions).toHaveBeenCalledWith(
            'reserva',
            expect.any(AbortSignal),
          );
        },
        { timeout: 1500 },
      );

      // Ahora cambiar el combo de región a Mendoza (20)
      const regionButton = screen.getByRole('button', { name: /región/i });
      fireEvent.click(regionButton);

      const mendozaOption = await screen.findByText('Mendoza (20)');
      fireEvent.click(mendozaOption);

      // Debe volver a pedir sugerencias incluyendo stateId: 10
      await waitFor(
        () => {
          expect(catalogApi.getSearchSuggestions).toHaveBeenLastCalledWith(
            'reserva',
            expect.objectContaining({
              stateId: 10,
            }),
            expect.any(AbortSignal),
          );
        },
        { timeout: 1500 },
      );
    });

    it('la fila fija "Crear «texto»" sigue apareciendo independientemente de los filtros', async () => {
      render(
        <MemoryRouter>
          <QuickActions />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /varietal/i })).not.toBeDisabled();
      });

      const searchInput = screen.getByPlaceholderText('Buscar vino, bodega, cepa o región...');
      fireEvent.focus(searchInput);
      fireEvent.change(searchInput, { target: { value: 'MiVinoEspecial' } });

      const createRow = await screen.findByText(/Crear «MiVinoEspecial»/i);
      expect(createRow).toBeInTheDocument();
    });
  });
});
