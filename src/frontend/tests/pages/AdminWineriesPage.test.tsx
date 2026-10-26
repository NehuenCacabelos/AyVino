import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminWineriesPage from '@/pages/AdminWineriesPage';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as adminWineriesApi from '@/features/admin/api/adminWineriesApi';
import { AdminToastProvider } from '@/features/admin';
import type { WineryResponseDto } from '@/features/winery/types';

vi.mock('@/features/winery/api/wineryApi', () => ({
  getWineries: vi.fn(),
}));

vi.mock('@/features/admin/api/adminWineriesApi', () => ({
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la carga inicial pide status Pending por defecto', async () => {
    vi.mocked(wineryApi.getWineries).mockResolvedValue(mockPendingWineries);

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <AdminToastProvider>
          <AdminWineriesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(wineryApi.getWineries).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Pending',
      });
      expect(screen.getByText('Bodega Trapiche')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('aprobar llama changeWineryStatus con Approved y recarga la lista', async () => {
    vi.mocked(wineryApi.getWineries).mockResolvedValue(mockPendingWineries);
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
      expect(wineryApi.getWineries).toHaveBeenCalledTimes(2); // Inicial + recarga
    });
  });

  it('eliminar exige confirmación en ConfirmDialog antes de llamar a deleteWinery', async () => {
    vi.mocked(wineryApi.getWineries).mockResolvedValue(mockPendingWineries);
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
      expect(wineryApi.getWineries).toHaveBeenCalledTimes(2);
    });
  });
});

