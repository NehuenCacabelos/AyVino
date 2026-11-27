import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AdminWineriesPage from '@/pages/AdminWineriesPage';
import * as adminWineriesApi from '@/features/admin/api/adminWineriesApi';
import { AdminToastProvider } from '@/features/admin';
import type { WineryResponseDto } from '@/features/winery/types';

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-search">{location.search}</span>;
}

vi.mock('@/features/admin/api/adminWineriesApi', () => ({
  getAdminWineries: vi.fn(),
  changeWineryStatus: vi.fn(),
  deleteWinery: vi.fn(),
}));

describe('AdminWineriesPage Component', () => {
  const mockPendingWineries: WineryResponseDto[] = [
    {
      id: 101,
      name: 'Bodega Trapiche',
      description: 'Bodega mendocina',
      locationId: 5,
      foundationYear: 1883,
      website: 'https://trapiche.com.ar',
      userId: 12,
      status: 'Pending',
      registerDate: '2026-02-15T10:00:00Z',
      latitude: -33.0,
      longitude: -68.8,
      logoUrl: null,
      location: { stateName: 'Mendoza', regionName: 'Maipú' },
    },
  ];

  const mockApprovedWineries: WineryResponseDto[] = [
    {
      id: 102,
      name: 'Catena Zapata',
      description: 'Bodega histórica',
      locationId: 5,
      foundationYear: 1902,
      website: 'https://catenazapata.com',
      userId: 15,
      status: 'Approved',
      registerDate: '2026-01-10T10:00:00Z',
      latitude: -33.1,
      longitude: -68.9,
      logoUrl: null,
      location: { stateName: 'Mendoza', regionName: 'Luján de Cuyo' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la carga inicial abre en Todas sin filtro de status por defecto', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockPendingWineries,
      totalCount: mockPendingWineries.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <AdminToastProvider>
          <AdminWineriesPage />
          <LocationProbe />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
      });
      expect(screen.getByRole('button', { name: 'Todas' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Bodega Trapiche')).toBeInTheDocument();
    });
  });

  it('entrar con URL filtrada (?status=Pending&search=catena) activa filtros y envía params al backend', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockPendingWineries,
      totalCount: mockPendingWineries.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/bodegas?status=Pending&search=catena']}>
        <AdminToastProvider>
          <AdminWineriesPage />
          <LocationProbe />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Pending',
        search: 'catena',
      });
    });

    expect(screen.getByRole('button', { name: 'Pendientes' })).toHaveAttribute('aria-pressed', 'true');
    expect((screen.getByLabelText('Buscar bodega') as HTMLInputElement).value).toBe('catena');
  });

  it('aplicar filtros (chip y búsqueda) actualiza la URL y limpiar filtros los elimina', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockPendingWineries,
      totalCount: mockPendingWineries.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <AdminToastProvider>
          <AdminWineriesPage />
          <LocationProbe />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Aprobadas' }));

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('?status=Approved');
      expect(adminWineriesApi.getAdminWineries).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Approved',
      });
    });

    fireEvent.change(screen.getByLabelText('Buscar bodega'), { target: { value: 'Zuccardi' } });

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('?status=Approved&search=Zuccardi');
      expect(adminWineriesApi.getAdminWineries).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Approved',
        search: 'Zuccardi',
      });
    });

    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-search').textContent).toBe('');
      expect(adminWineriesApi.getAdminWineries).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 10,
      });
    });
  });

  it('aprobar llama changeWineryStatus con Approved y recarga la lista', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockPendingWineries,
      totalCount: mockPendingWineries.length,
    });
    vi.mocked(adminWineriesApi.changeWineryStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <AdminToastProvider>
          <AdminWineriesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Trapiche')).toBeInTheDocument();
    });

    const approveBtn = screen.getByTitle('Aprobar bodega');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminWineriesApi.changeWineryStatus).toHaveBeenCalledWith(101, 'Approved');
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalledTimes(2); // Inicial + recarga
    });
  });

  it('para una bodega Approved la acción se llama Suspender con confirmación específica', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockApprovedWineries,
      totalCount: mockApprovedWineries.length,
    });
    vi.mocked(adminWineriesApi.changeWineryStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/bodegas?status=Approved']}>
        <AdminToastProvider>
          <AdminWineriesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Catena Zapata')).toBeInTheDocument();
    });

    const suspendBtn = screen.getByTitle('Suspender bodega');
    expect(suspendBtn).toBeInTheDocument();
    fireEvent.click(suspendBtn);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Suspender bodega?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'La bodega dejará de ser visible para el público y su dueño no podrá publicar vinos. Podés volver a aprobarla cuando quieras.'
      )
    ).toBeInTheDocument();
    expect(adminWineriesApi.changeWineryStatus).not.toHaveBeenCalled();

    // Confirmar en el modal
    const confirmSuspendBtn = screen.getByRole('button', { name: /^suspender$/i });
    fireEvent.click(confirmSuspendBtn);

    await waitFor(() => {
      expect(adminWineriesApi.changeWineryStatus).toHaveBeenCalledWith(102, 'Rejected');
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalledTimes(2);
    });
  });

  it('eliminar exige confirmación en ConfirmDialog antes de llamar a deleteWinery', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockPendingWineries,
      totalCount: mockPendingWineries.length,
    });
    vi.mocked(adminWineriesApi.deleteWinery).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <AdminToastProvider>
          <AdminWineriesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Trapiche')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Eliminar bodega');
    fireEvent.click(deleteBtn);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Eliminar bodega?')).toBeInTheDocument();
    expect(screen.getByText('Esta acción es irreversible.')).toBeInTheDocument();
    expect(adminWineriesApi.deleteWinery).not.toHaveBeenCalled();

    // Confirmar en el modal
    const confirmDeleteBtn = screen.getByRole('button', { name: /^eliminar$/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(adminWineriesApi.deleteWinery).toHaveBeenCalledWith(101);
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalledTimes(2);
    });
  });

  it('"Ver detalle" navega a /bodegas/:id sin abrir modal', async () => {
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: mockPendingWineries,
      totalCount: mockPendingWineries.length,
    });

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <AdminToastProvider>
          <AdminWineriesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Bodega Trapiche')).toBeInTheDocument();
    });

    const detailLink = screen.getByRole('link', { name: 'Ver detalle' });
    expect(detailLink).toHaveAttribute('href', '/bodegas/101');
  });
});
