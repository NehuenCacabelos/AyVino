import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminWinesPage from '@/pages/AdminWinesPage';
import * as adminWinesApi from '@/features/admin/api/adminWinesApi';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import { AdminToastProvider } from '@/features/admin';
import type { WineResponseDto } from '@/features/admin/types/adminWines';
import type { WineryResponseDto } from '@/features/winery/types/winery';
import type { WineVintageResponseDto } from '@/features/winery/types/wine';

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
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue(mockWines);

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
      expect(screen.getByText('Gran Malbec Reserva')).toBeInTheDocument();
      expect(screen.getByText('Bodega Catena Zapata')).toBeInTheDocument();
      expect(screen.getByText('Oficial')).toBeInTheDocument();
      expect(screen.getByText('Torrontés Riojano')).toBeInTheDocument();
      expect(screen.getByText('Bodega Artesanal Don Carlos')).toBeInTheDocument();
      expect(screen.getByText('Comunitario')).toBeInTheDocument();
      expect(screen.getByText('Duplicado de #12')).toBeInTheDocument();
      expect(screen.getByText('Sin reseñas')).toBeInTheDocument();
    });
  });

  it('los filtros envían name, winery y wineType a getAdminWines', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue(mockWines);

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

  it('editar abre modal y envía el cuerpo correcto a updateWine', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue(mockWines);
    vi.mocked(adminWinesApi.updateWine).mockResolvedValue({
      ...mockWines[0],
      name: 'Gran Malbec Reserva Editado',
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

    const editBtns = screen.getAllByTitle(/editar vino/i);
    fireEvent.click(editBtns[0]);

    // Modal abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/editar vino #10/i)).toBeInTheDocument();

    const nameField = screen.getByLabelText(/nombre del vino \*/i);
    fireEvent.change(nameField, { target: { value: 'Gran Malbec Reserva Editado' } });

    const saveBtn = screen.getByRole('button', { name: /guardar cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminWinesApi.updateWine).toHaveBeenCalledWith(10, {
        name: 'Gran Malbec Reserva Editado',
        wineType: 'Red',
        description: 'Notas a ciruela y roble francés',
        wineryId: 1,
        wineryNameText: null,
      });
    });
  });

  it('eliminar exige confirmación en ConfirmDialog y llama a deleteWine', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue(mockWines);
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

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminWinesApi.deleteWine).toHaveBeenCalledWith(10);
    });
  });

  it('ver detalle llama a getWineVintages y muestra el modal con cosechas', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue(mockWines);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([
      {
        id: 101,
        wineId: 10,
        year: 2020,
        alcoholContent: 14.5,
        approvalStatus: 'Approved',
      } as unknown as WineVintageResponseDto,
    ]);

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

    const detailBtns = screen.getAllByTitle(/ver detalle y cosechas/i);
    fireEvent.click(detailBtns[0]);

    await waitFor(() => {
      expect(wineApi.getWineVintages).toHaveBeenCalledWith(10);
      expect(screen.getByText('Año: 2020')).toBeInTheDocument();
      expect(screen.getByText('Graduación: 14.5%')).toBeInTheDocument();
    });
  });

  it('un vino duplicado no muestra el botón de fusionar', async () => {
    vi.mocked(adminWinesApi.getAdminWines).mockResolvedValue(mockWines);

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
        return [
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
        ];
      }
      return mockWines;
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
        return [
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
        ];
      }
      return mockWines;
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
});
