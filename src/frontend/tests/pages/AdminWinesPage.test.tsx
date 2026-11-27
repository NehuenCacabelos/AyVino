import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AdminWinesPage from '@/pages/AdminWinesPage';
import * as adminWinesApi from '@/features/admin/api/adminWinesApi';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import { AdminToastProvider } from '@/features/admin';
import type { WineResponseDto } from '@/features/admin/types/adminWines';
import type { WineryResponseDto } from '@/features/winery/types/winery';

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-search">{location.search}</span>;
}

vi.mock('@/features/admin/api/adminWinesApi', () => ({
  getAdminWines: vi.fn(),
  updateWine: vi.fn(),
  deleteWine: vi.fn(),
  mergeWines: vi.fn(),
}));

vi.mock('@/features/winery/api/wineApi', () => ({
  getWineVintages: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryApi', () => ({
  getWineries: vi.fn(),
}));

describe('AdminWinesPage Component', () => {
  const mockWines: WineResponseDto[] = [
    {
      id: 10,
      wineryId: 1,
      wineryNameText: null,
      name: 'Gran Malbec Reserva',
      description: 'Notas a ciruela y roble francés',
      wineType: 'Red',
      locationId: 5,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.8,
      reviewCount: 15,
    },
    {
      id: 20,
      wineryId: null,
      wineryNameText: 'Bodega Artesanal Don Carlos',
      name: 'Torrontés Riojano',
      description: null,
      wineType: 'White',
      locationId: null,
      sourceType: 'Community',
      duplicateOfWineId: 12,
      averageRating: null,
      reviewCount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryApi.getWineries).mockResolvedValue([
      { id: 1, name: 'Bodega Catena Zapata', status: 'Approved' } as unknown as WineryResponseDto,
    ]);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([]);
  });

  it('la carga inicial pide vinos y los renderiza con sus badges', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminWinesApi.getAdminWines).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        name: undefined,
        winery: undefined,
        wineType: undefined,
      });
      const table = screen.getByRole('table');
      expect(within(table).getByText('Gran Malbec Reserva')).toBeInTheDocument();
      expect(within(table).getByText('Bodega Catena Zapata')).toBeInTheDocument();
      expect(within(table).getByText('Oficial')).toBeInTheDocument();
      expect(within(table).getByText('Torrontés Riojano')).toBeInTheDocument();
      expect(within(table).getByText('Bodega Artesanal Don Carlos')).toBeInTheDocument();
      expect(within(table).getByText('Comunitario')).toBeInTheDocument();
      expect(screen.getByText('Duplicado de #12')).toBeInTheDocument();
      expect(screen.getByText('Sin reseñas')).toBeInTheDocument();
    });
  });

  it('los filtros envían name, winery y wineType a getAdminWines', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/buscar por nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Malbec' } });

    const typeSelect = screen.getByLabelText(/filtrar por tipo/i);
    fireEvent.change(typeSelect, { target: { value: 'Red' } });

    const wineryInput = screen.getByLabelText(/filtrar por bodega/i);
    fireEvent.change(wineryInput, { target: { value: 'Catena' } });

    await waitFor(() => {
      expect(adminWinesApi.getAdminWines).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        name: 'Malbec',
        wineType: 'Red',
        winery: 'Catena',
      });
    });
  });

  it('editar navega a /admin/vinos/:id sin abrir modal ni llamar a updateWine', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    const editLinks = screen.getAllByRole('link', { name: 'Editar vino' });
    expect(editLinks).toHaveLength(1); // El vino #20 duplicado oculta la acción editar
    expect(editLinks[0]).toHaveAttribute('href', '/admin/vinos/10');
    expect(adminWinesApi.updateWine).not.toHaveBeenCalled();
  });

  it('eliminar exige confirmación en ConfirmDialog y llama a deleteWine', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });
    vi.mocked(adminWinesApi.deleteWine).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle(/eliminar vino/i);
    fireEvent.click(deleteBtns[0]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/¿eliminar vino\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Si tiene reseñas, marcas o cava no se podrá eliminar: usá Fusionar \(vinos\) o Rechazar \(cosechas\)\./i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminWinesApi.deleteWine).toHaveBeenCalledWith(10);
    });
  });

  it('eliminar vino con conflicto 409 muestra el mensaje retornado por el servidor', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });
    const serverMessage = 'No se puede eliminar el vino porque tiene historial de usuarios (reseñas: 3, marcas: 5, cava: 1). Si es un duplicado, usá la fusión.';
    const conflictError = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: serverMessage,
          title: 'Conflicto',
          status: 409,
        },
      },
    };
    vi.mocked(adminWinesApi.deleteWine).mockRejectedValue(conflictError);

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByTitle(/eliminar vino/i);
    fireEvent.click(deleteBtns[0]);

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText(serverMessage)).toBeInTheDocument();
    });
  });

  it('ver detalle navega a /vinos/:id sin llamar a getWineVintages ni abrir modal', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    const detailLinks = screen.getAllByRole('link', { name: 'Ver detalle' });
    expect(detailLinks[0]).toHaveAttribute('href', '/vinos/10');
    expect(detailLinks[1]).toHaveAttribute('href', '/vinos/20');
    expect(wineApi.getWineVintages).not.toHaveBeenCalled();
  });

  it('un vino duplicado no muestra el botón de fusionar', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
      expect(screen.getByText('Torrontés Riojano')).toBeInTheDocument();
    });

    const mergeBtns = screen.getAllByTitle(/fusionar vino/i);
    // Solo Gran Malbec Reserva (#10, duplicateOfWineId = null) muestra la acción
    expect(mergeBtns).toHaveLength(1);
  });

  it('flujo de fusión modal: paso 1 busca candidato (sin sí mismo ni duplicados), paso 2 exige checkbox y llama a mergeWines en orden correcto', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockImplementation(async (params) => {
      if (params?.name === 'Cabernet') {
        return {
          items: [
            {
              id: 10, // Mismo vino a fusionar
              name: 'Gran Malbec Reserva',
              wineType: 'Red',
              duplicateOfWineId: null,
              sourceType: 'Official',
              reviewCount: 0,
              wineryId: 1,
              wineryNameText: null,
              description: null,
              locationId: null,
              averageRating: null,
            },
            {
              id: 20, // Ya es un duplicado
              name: 'Torrontés Riojano',
              wineType: 'White',
              duplicateOfWineId: 12,
              sourceType: 'Community',
              reviewCount: 0,
              wineryId: null,
              wineryNameText: null,
              description: null,
              locationId: null,
              averageRating: null,
            },
            {
              id: 30, // Candidato canónico válido
              name: 'Cabernet Sauvignon Gran Reserva',
              wineType: 'Red',
              duplicateOfWineId: null,
              sourceType: 'Official',
              reviewCount: 5,
              wineryId: 1,
              wineryNameText: null,
              description: null,
              locationId: null,
              averageRating: 4.5,
            },
          ],
          totalCount: 3,
        };
      }
      return { items: mockWines, totalCount: mockWines.length };
    });

    vi.mocked(adminWinesApi.mergeWines).mockResolvedValue({
      targetId: 30,
      duplicateId: 10,
      movedVintages: 1,
      mergedVintages: 1,
      movedReviews: 2,
      discardedReviews: 1,
      movedCellarItems: 1,
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    // Abrir modal de fusión para Gran Malbec Reserva (#10)
    const mergeBtn = screen.getByTitle(/fusionar vino/i);
    fireEvent.click(mergeBtn);

    // Modal de paso 1 visible
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/fusionar vino duplicado/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/paso 1 de 2/i)).toBeInTheDocument();

    // El botón siguiente está deshabilitado sin candidato
    const nextBtn = within(dialog).getByRole('button', { name: /siguiente/i });
    expect(nextBtn).toBeDisabled();

    // Buscar candidato por nombre
    const searchInput = within(dialog).getByPlaceholderText(/escribí el nombre del vino/i);
    fireEvent.change(searchInput, { target: { value: 'Cabernet' } });

    const searchSubmit = within(dialog).getByRole('button', { name: /^buscar$/i });
    fireEvent.click(searchSubmit);

    // En los resultados solo debe aparecer el candidato válido (#30),
    // no el mismo vino (#10) ni el que ya es duplicado (#20)
    await waitFor(() => {
      expect(within(dialog).getByText('Cabernet Sauvignon Gran Reserva')).toBeInTheDocument();
      expect(within(dialog).getByText('#30')).toBeInTheDocument();
      expect(within(dialog).queryByText('#10')).not.toBeInTheDocument();
    });

    // Seleccionar candidato #30
    const candidateItem = within(dialog).getByText('Cabernet Sauvignon Gran Reserva');
    fireEvent.click(candidateItem);

    // Siguiente se habilita
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);

    // Paso 2: Resumen y confirmación
    await waitFor(() => {
      expect(within(dialog).getByText(/paso 2 de 2: confirmar fusión/i)).toBeInTheDocument();
      expect(
        within(dialog).getByText(/«Gran Malbec Reserva» \(#10\) se fusionará dentro de «Cabernet Sauvignon Gran Reserva» \(#30\)/i)
      ).toBeInTheDocument();
    });

    // Botón fusionar deshabilitado sin checkbox
    const mergeSubmitBtn = within(dialog).getByRole('button', { name: /^fusionar$/i });
    expect(mergeSubmitBtn).toBeDisabled();

    // Marcar checkbox
    const undoCheckbox = within(dialog).getByLabelText(/entiendo que no se puede deshacer/i);
    fireEvent.click(undoCheckbox);
    expect(mergeSubmitBtn).not.toBeDisabled();

    // Ejecutar fusión
    fireEvent.click(mergeSubmitBtn);

    await waitFor(() => {
      // Verifica llamada con targetId=30, duplicateId=10 (orden estricto)
      expect(adminWinesApi.mergeWines).toHaveBeenCalledWith(30, 10);
      // El modal se cierra tras el éxito
      expect(screen.queryByText(/paso 2 de 2/i)).not.toBeInTheDocument();
    });
  });

  it('muestra mensaje de error del servidor en el modal si la fusión falla (400/404/409)', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockImplementation(async (params) => {
      if (params?.name === 'Cabernet') {
        return {
          items: [
            {
              id: 30,
              name: 'Cabernet Sauvignon Gran Reserva',
              wineType: 'Red',
              duplicateOfWineId: null,
              sourceType: 'Official',
              reviewCount: 0,
              wineryId: null,
              wineryNameText: null,
              description: null,
              locationId: null,
              averageRating: null,
            },
          ],
          totalCount: 1,
        };
      }
      return { items: mockWines, totalCount: mockWines.length };
    });

    vi.mocked(adminWinesApi.mergeWines).mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'El vino origen ya fue fusionado anteriormente.' } },
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle(/fusionar vino/i));

    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByPlaceholderText(/escribí el nombre del vino/i), { target: { value: 'Cabernet' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /^buscar$/i }));

    await waitFor(() => {
      expect(within(dialog).getByText('Cabernet Sauvignon Gran Reserva')).toBeInTheDocument();
    });

    fireEvent.click(within(dialog).getByText('Cabernet Sauvignon Gran Reserva'));
    fireEvent.click(within(dialog).getByRole('button', { name: /siguiente/i }));

    fireEvent.click(within(dialog).getByLabelText(/entiendo que no se puede deshacer/i));
    fireEvent.click(within(dialog).getByRole('button', { name: /^fusionar$/i }));

      await waitFor(() => {
      expect(within(dialog).getByText('El vino origen ya fue fusionado anteriormente.')).toBeInTheDocument();
      // El modal permanece abierto para que el admin pueda leer el error o corregir
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('sincroniza search, type y origin con la URL, carga URL prefiltrada y limpia filtros', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue({
      items: mockWines,
      totalCount: mockWines.length,
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin/vinos?search=malbec&type=Red&origin=official']}>
        <AdminToastProvider>
          <AdminWinesPage />
          <LocationProbe />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminWinesApi.getAdminWines).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        name: 'malbec',
        winery: undefined,
        wineType: 'Red',
        origin: 'official',
      });
    });

    expect((screen.getByLabelText(/buscar por nombre/i) as HTMLInputElement).value).toBe('malbec');
    expect((screen.getByLabelText(/filtrar por tipo/i) as HTMLSelectElement).value).toBe('Red');
    expect((screen.getByLabelText(/filtrar por origen/i) as HTMLSelectElement).value).toBe('official');

    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('');
      expect(adminWinesApi.getAdminWines).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 10,
        name: undefined,
        winery: undefined,
        wineType: undefined,
      });
    });

    unmount();

    render(
      <MemoryRouter initialEntries={['/admin/vinos']}>
        <AdminToastProvider>
          <AdminWinesPage />
          <LocationProbe />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/filtrar por origen/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/filtrar por origen/i), { target: { value: 'community' } });

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('?origin=community');
      expect(adminWinesApi.getAdminWines).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 10,
        name: undefined,
        winery: undefined,
        wineType: undefined,
        origin: 'community',
      });
    });
  });
});
