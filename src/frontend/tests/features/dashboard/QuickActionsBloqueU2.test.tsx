import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickActions from '@/features/dashboard/components/QuickActions';
import DashboardWineCard from '@/features/dashboard/components/DashboardWineCard';
import WineryBlock from '@/features/dashboard/components/WineryBlock';
import * as catalogApi from '@/features/dashboard/api/catalogApi';
import type { DashboardWine } from '@/types/wine';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { username: 'Nehuen Sommelier' },
    isAuthenticated: true,
  }),
}));

vi.mock('@/features/dashboard/api/catalogApi', () => ({
  getCatalogFilters: vi.fn(),
  getSearchSuggestions: vi.fn(),
  searchCatalogWines: vi.fn(),
  clearCatalogFiltersCache: vi.fn(),
}));

const sampleFilters: catalogApi.CatalogFiltersResponse = {
  grapes: [
    { id: 1, name: 'Malbec', wineCount: 8 },
    { id: 2, name: 'Cabernet Franc', wineCount: 4 },
  ],
  provinces: [
    { id: 10, name: 'Mendoza', wineCount: 14 },
    { id: 20, name: 'Salta', wineCount: 3 },
  ],
  wineries: [
    { id: 100, name: 'Catena Zapata', wineCount: 5 },
    { id: 200, name: 'Zuccardi', wineCount: 7 },
  ],
};

const sampleSuggestions: catalogApi.SearchSuggestionsResponse = {
  wines: [
    { id: 42, name: 'Catena Zapata Malbec Argentino', wineryName: 'Catena Zapata', vintage: 2020 },
  ],
  wineries: [
    { id: 100, name: 'Catena Zapata', location: 'Mendoza', logoImageId: null },
  ],
  grapes: [
    { id: 1, name: 'Malbec', wineCount: 8 },
  ],
  regions: [
    { id: 10, name: 'Mendoza', wineCount: 14 },
  ],
};

describe('Bloque U2: QuickActions, Combos reales y Buscador con Sugerencias', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el placeholder correcto en el buscador sin la palabra maridaje', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /varietal/i })).not.toBeDisabled();
    });

    const input = screen.getByPlaceholderText('Buscar vino, bodega, cepa o región...');
    expect(input).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/maridaje/i)).not.toBeInTheDocument();
  });

  it('combos: carga datos reales con conteo de vinos y permite seleccionar opciones emitiendo grapeId, stateId, wineryId', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    const onFilterChange = vi.fn();

    render(
      <MemoryRouter>
        <QuickActions onFilterChange={onFilterChange} />
      </MemoryRouter>
    );

    // Esperar a que los combos se habiliten tras la carga
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /varietal/i })).not.toBeDisabled();
    });

    // 1. Abrir combo de varietal y seleccionar Malbec
    const varietalTrigger = screen.getByRole('button', { name: /varietal/i });
    fireEvent.click(varietalTrigger);
    expect(screen.getByText('Malbec (8)')).toBeInTheDocument();
    expect(screen.getByText('Cabernet Franc (4)')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Malbec (8)'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        varietal: 'Malbec',
        grapeId: 1,
      })
    );

    // 2. Abrir combo de región y seleccionar Mendoza (14)
    const regionTrigger = screen.getByRole('button', { name: /región/i });
    fireEvent.click(regionTrigger);
    expect(screen.getByText('Mendoza (14)')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Mendoza (14)'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'Mendoza',
        stateId: 10,
      })
    );

    // 3. Abrir combo de bodega y seleccionar Catena Zapata (5)
    const wineryTrigger = screen.getByRole('button', { name: /bodega/i });
    fireEvent.click(wineryTrigger);
    expect(screen.getByText('Catena Zapata (5)')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Catena Zapata (5)'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        winery: 'Catena Zapata',
        wineryId: 100,
      })
    );
  });

  it('combos: maneja estado de error y botón de reintentar', async () => {
    vi.mocked(catalogApi.getCatalogFilters)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(sampleFilters);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    // Esperar a que termine la carga con error y el botón esté habilitado
    const varietalTrigger = screen.getByRole('button', { name: /varietal/i });
    await waitFor(() => {
      expect(varietalTrigger).not.toBeDisabled();
    });

    // Abrir dropdown una sola vez
    fireEvent.click(varietalTrigger);
    expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument();

    // Hacer clic en Reintentar
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(catalogApi.getCatalogFilters).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Malbec (8)')).toBeInTheDocument();
    });
  });

  it('desplegable de sugerencias: con >= 2 caracteres ejecuta debounce, muestra grupos, fila Crear y cancela con AbortSignal', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');

    // Escribir 1 caracter -> no debe llamar a getSearchSuggestions
    fireEvent.change(input, { target: { value: 'C' } });
    expect(catalogApi.getSearchSuggestions).not.toHaveBeenCalled();
    // Pero debe mostrar la fila Crear «C»
    expect(screen.getByText('Crear «C»')).toBeInTheDocument();

    // Escribir 2 caracteres
    fireEvent.change(input, { target: { value: 'Catena' } });

    // Esperar debounce de 250ms
    await waitFor(
      () => {
        expect(catalogApi.getSearchSuggestions).toHaveBeenCalledWith('Catena', expect.any(AbortSignal));
      },
      { timeout: 1000 }
    );

    // Verificar secciones agrupadas
    expect(screen.getByText('Vinos')).toBeInTheDocument();
    expect(screen.getByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();

    expect(screen.getByText('Bodegas')).toBeInTheDocument();
    expect(screen.getByText('Uvas')).toBeInTheDocument();
    expect(screen.getByText('Regiones')).toBeInTheDocument();

    // Fila fija Crear al final
    expect(screen.getByText('Crear «Catena»')).toBeInTheDocument();
  });

  it('desplegable de sugerencias: con 0 resultados de la API solo muestra la fila Crear', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue({
      wines: [],
      wineries: [],
      grapes: [],
      regions: [],
    });

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'VinoInexistente' } });

    await waitFor(() => {
      expect(screen.getByText('Crear «VinoInexistente»')).toBeInTheDocument();
      expect(screen.queryByText('Vinos')).not.toBeInTheDocument();
      expect(screen.queryByText('Bodegas')).not.toBeInTheDocument();
      expect(screen.queryByText('Uvas')).not.toBeInTheDocument();
      expect(screen.queryByText('Regiones')).not.toBeInTheDocument();
    });
  });

  it('acciones de sugerencias: vino navega a /vinos/{id} numérico', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Catena Zapata Malbec Argentino'));
    expect(mockNavigate).toHaveBeenCalledWith('/vinos/42');
  });

  it('acciones de sugerencias: bodega navega a /bodegas/{id}', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(screen.getByText('Bodegas')).toBeInTheDocument();
    });

    // En la sección bodegas: Catena Zapata
    const wineryOption = screen.getByRole('option', { name: /catena zapata.*mendoza/i });
    fireEvent.click(wineryOption);
    expect(mockNavigate).toHaveBeenCalledWith('/bodegas/100');
  });

  it('acciones de sugerencias: uva y región aplican filtro en combo y limpian texto', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);
    const onFilterChange = vi.fn();

    render(
      <MemoryRouter>
        <QuickActions onFilterChange={onFilterChange} />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Malbec' } });

    await waitFor(() => {
      expect(screen.getByText('Uvas')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('option', { name: /malbec.*8 vinos/i }));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        varietal: 'Malbec',
        grapeId: 1,
        query: '',
      })
    );
    expect(input).toHaveValue('');
  });

  it('fila Crear invoca onCreateWine con el texto escrito', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue({
      wines: [],
      wineries: [],
      grapes: [],
      regions: [],
    });
    const onCreateWine = vi.fn();

    render(
      <MemoryRouter>
        <QuickActions onCreateWine={onCreateWine} />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Mi Gran Tinto' } });

    await waitFor(() => {
      expect(screen.getByText('Crear «Mi Gran Tinto»')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Crear «Mi Gran Tinto»'));
    expect(onCreateWine).toHaveBeenCalledWith('Mi Gran Tinto');
  });

  it('teclado: flechas y Enter con ítem resaltado navega a la ficha', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();
    });

    // Flecha abajo para resaltar el primer ítem (Vino id 42)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'suggestion-opt-0');

    // Presionar Enter con el primer ítem resaltado -> navega a /vinos/42
    fireEvent.submit(input.closest('form')!);
    expect(mockNavigate).toHaveBeenCalledWith('/vinos/42');
  });

  it('teclado: Enter sin ítem resaltado con resultados aplica búsqueda de catálogo', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);
    const onSearch = vi.fn();

    render(
      <MemoryRouter>
        <QuickActions onSearch={onSearch} />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata Malbec Argentino')).toBeInTheDocument();
    });

    fireEvent.submit(input.closest('form')!);
    expect(onSearch).toHaveBeenCalledWith('Catena');
  });

  it('teclado: Escape cierra el desplegable de sugerencias', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue(sampleSuggestions);

    render(
      <MemoryRouter>
        <QuickActions />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Enter sin coincidencias ejecuta Crear', async () => {
    vi.mocked(catalogApi.getCatalogFilters).mockResolvedValue(sampleFilters);
    vi.mocked(catalogApi.getSearchSuggestions).mockResolvedValue({
      wines: [],
      wineries: [],
      grapes: [],
      regions: [],
    });
    const onCreateWine = vi.fn();

    render(
      <MemoryRouter>
        <QuickActions onCreateWine={onCreateWine} />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Vino Nuevo 2026' } });

    await waitFor(() => {
      expect(screen.getByText('Crear «Vino Nuevo 2026»')).toBeInTheDocument();
    });

    // Presionar Enter directamente sin flechas
    fireEvent.submit(input.closest('form')!);
    expect(onCreateWine).toHaveBeenCalledWith('Vino Nuevo 2026');
  });

  it('enlaces de cards en DashboardWineCard y WineryBlock llevan a /vinos/{id} numérico', () => {
    const sampleWine: DashboardWine = {
      id: '88',
      name: 'Gran Enemigo Gualtallary',
      winery: 'El Enemigo',
      region: 'Gualtallary, Mendoza',
      varietal: 'Cabernet Franc',
      vintage: 2018,
      rating: 98,
      bottle: 'red-black',
    };

    // 1. DashboardWineCard
    const { unmount } = render(
      <MemoryRouter>
        <DashboardWineCard wine={sampleWine} />
      </MemoryRouter>
    );

    const cardLink = screen.getByRole('link');
    expect(cardLink).toHaveAttribute('href', '/vinos/88');
    unmount();

    // 2. WineryBlock
    render(
      <MemoryRouter>
        <WineryBlock
          name="El Enemigo"
          region="Mendoza"
          initials="EE"
          total={1}
          wines={[sampleWine]}
        />
      </MemoryRouter>
    );

    const wineLinks = screen.getAllByRole('link', { name: /gran enemigo gualtallary/i });
    expect(wineLinks[0]).toHaveAttribute('href', '/vinos/88');
  });
});
