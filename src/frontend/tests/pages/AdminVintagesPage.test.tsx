import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminVintagesPage from '@/pages/AdminVintagesPage';
import * as adminVintagesApi from '@/features/admin/api/adminVintagesApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import type { AdminWineVintageListItem } from '@/features/admin/types/adminVintages';

vi.mock('@/features/admin/api/adminVintagesApi', () => ({
  getAdminVintages: vi.fn(),
  changeVintageStatus: vi.fn(),
  deleteVintage: vi.fn(),
  getVintageDetail: vi.fn(),
}));

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
};

vi.mock('@/features/admin', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useAdminToast: () => mockToast,
  };
});

describe('AdminVintagesPage Component', () => {
  const mockVintages: AdminWineVintageListItem[] = [
    {
      vintageId: 101,
      wineId: 42,
      wineName: 'Malbec Reserva',
      wineType: 'Red',
      wineryId: 7,
      wineryName: 'Bodega del Fin del Mundo',
      year: 2022,
      alcoholContent: 14.2,
      imageUrl: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 3,
      uploadedByUsername: 'sommelier_juan',
      registerDate: '2026-01-15T12:00:00Z',
    },
    {
      vintageId: 102,
      wineId: 43,
      wineName: 'Chardonnay Estate',
      wineType: 'White',
      wineryId: 8,
      wineryName: 'Bodega Norton',
      year: 2023,
      alcoholContent: 13.5,
      imageUrl: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 4,
      uploadedByUsername: 'lucia_wine',
      registerDate: '2026-01-20T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([
      { id: 1, name: 'Malbec', colorType: 'Red' },
      { id: 2, name: 'Chardonnay', colorType: 'White' },
    ]);
  });

  it('la carga inicial pide status Pending por defecto y renderiza las cosechas', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);

    render(
      <MemoryRouter>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminVintagesApi.getAdminVintages).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Pending',
      });
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
      expect(screen.getByText('Chardonnay Estate')).toBeInTheDocument();
      expect(screen.getByText('Bodega del Fin del Mundo')).toBeInTheDocument();
      expect(screen.getByText('2022')).toBeInTheDocument();
      expect(screen.getByText('Tinto')).toBeInTheDocument();
      expect(screen.getByText('Blanco')).toBeInTheDocument();
    });
  });

  it('Aprobar llama changeVintageStatus(wineId, vintageId, "Approved") usando el wineId de la fila', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    vi.mocked(adminVintagesApi.changeVintageStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
    });

    const approveButton = screen.getByTitle('Aprobar cosecha');
    fireEvent.click(approveButton);

    expect(adminVintagesApi.changeVintageStatus).toHaveBeenCalledWith(42, 101, 'Approved');
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Cosecha aprobada exitosamente.');
    });
  });

  it('eliminar exige confirmación en ConfirmDialog antes de llamar a deleteVintage', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    vi.mocked(adminVintagesApi.deleteVintage).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar cosecha');
    fireEvent.click(deleteButtons[0]);

    // El diálogo modal debe aparecer
    expect(screen.getByText('¿Eliminar cosecha?')).toBeInTheDocument();
    expect(screen.getByText(/Si tiene reseñas, marcas o cava no se podrá eliminar: usá Fusionar \(vinos\) o Rechazar \(cosechas\)\./i)).toBeInTheDocument();
    expect(adminVintagesApi.deleteVintage).not.toHaveBeenCalled();

    // Confirmar en el diálogo
    const confirmButton = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminVintagesApi.deleteVintage).toHaveBeenCalledWith(42, 101);
      expect(mockToast.success).toHaveBeenCalledWith('Cosecha eliminada del catálogo.');
    });
  });

  it('eliminar cosecha con conflicto 409 muestra el mensaje retornado por el servidor en toast', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    const serverMessage = 'No se puede eliminar la cosecha porque tiene historial de usuarios (reseñas: 2, cava: 1). Podés rechazarla en lugar de eliminarla para preservar el historial.';
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
    vi.mocked(adminVintagesApi.deleteVintage).mockRejectedValue(conflictError);

    render(
      <MemoryRouter initialEntries={['/admin/cosechas']}>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar cosecha');
    fireEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(serverMessage);
    });
  });
});
