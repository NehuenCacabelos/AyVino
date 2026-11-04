import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
  getVintageContributions: vi.fn(),
  promoteVintageImage: vi.fn(),
  updateVintage: vi.fn(),
  uploadVintageImage: vi.fn(),
  deleteVintageImage: vi.fn(),
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
      imageId: null,
      imageUrl: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 3,
      uploadedByUsername: 'sommelier_juan',
      registerDate: '2026-01-15T12:00:00Z',
      communityUsers: 5,
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
      imageId: 'img-102-uuid',
      imageUrl: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 4,
      uploadedByUsername: 'lucia_wine',
      registerDate: '2026-01-20T12:00:00Z',
      communityUsers: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([
      { id: 1, name: 'Malbec', colorType: 'Red' },
      { id: 2, name: 'Chardonnay', colorType: 'White' },
    ]);
    vi.mocked(adminVintagesApi.getVintageContributions).mockResolvedValue([]);
  });

  it('la carga inicial pide status All (undefined) y sort date por defecto y renderiza communityUsers', async () => {
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
        status: undefined,
        sort: 'date',
      });
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
      expect(screen.getByText('Chardonnay Estate')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('cambiar a Aprobadas por defecto usa sort date y permite cambiar orden a más usadas', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);

    render(
      <MemoryRouter initialEntries={['/admin/cosechas?status=Approved']}>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminVintagesApi.getAdminVintages).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Approved',
        sort: 'date',
      });
    });

    const sortUsersBtn = screen.getByRole('button', { name: 'Más usadas' });
    fireEvent.click(sortUsersBtn);

    await waitFor(() => {
      expect(adminVintagesApi.getAdminVintages).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Approved',
        sort: 'users',
      });
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

    expect(screen.getByText('¿Eliminar cosecha?')).toBeInTheDocument();
    expect(adminVintagesApi.deleteVintage).not.toHaveBeenCalled();

    const confirmButton = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(adminVintagesApi.deleteVintage).toHaveBeenCalledWith(42, 101);
      expect(mockToast.success).toHaveBeenCalledWith('Cosecha eliminada del catálogo.');
    });
  });

  it('eliminar cosecha con conflicto 409 muestra el mensaje retornado por el servidor en toast', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    const serverMessage = 'No se puede eliminar la cosecha porque tiene historial de usuarios. Podés rechazarla.';
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

  it('el modal de detalle carga aportes comunitarios y permite promover foto pública con confirmación', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    vi.mocked(adminVintagesApi.getVintageDetail).mockResolvedValue({
      id: 101,
      wineId: 42,
      year: 2022,
      alcoholContent: 14.2,
      servingTemperature: 16,
      agingAdvice: 'Guarda hasta 5 años.',
      imageId: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 3,
      registerDate: '2026-01-15T12:00:00Z',
      averageRating: 4.5,
      reviewCount: 3,
      grapes: [{ grapeId: 1, percentage: 100 }],
    });

    const mockContributions = [
      {
        userId: 3,
        username: 'sommelier_juan',
        personalImageId: 'juan-img-uuid',
        isUploader: true,
      },
      {
        userId: 10,
        username: 'enofilo_carlos',
        personalImageId: 'carlos-img-uuid',
        isUploader: false,
      },
    ];
    vi.mocked(adminVintagesApi.getVintageContributions).mockResolvedValue(mockContributions);
    vi.mocked(adminVintagesApi.promoteVintageImage).mockResolvedValue({
      vintageId: 101,
      imageId: 'carlos-img-uuid',
    });

    render(
      <MemoryRouter>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
    });

    // Abrir modal de detalle
    const viewButtons = screen.getAllByTitle('Ver detalle');
    fireEvent.click(viewButtons[0]);

    const detailDialog = screen.getByLabelText('Cerrar modal de detalle').closest('[role="dialog"]')!;
    await within(detailDialog).findByText('Aportes de la Comunidad');

    await waitFor(() => {
      expect(adminVintagesApi.getVintageContributions).toHaveBeenCalledWith(101);
      expect(within(detailDialog).getByText('sommelier_juan')).toBeInTheDocument();
      expect(within(detailDialog).getByText('Subió la cosecha')).toBeInTheDocument();
      expect(within(detailDialog).getByText('enofilo_carlos')).toBeInTheDocument();
    });

    // Promover foto de Carlos
    const promoteButtons = within(detailDialog).getAllByRole('button', { name: 'Usar como foto pública' });
    fireEvent.click(promoteButtons[1]); // botón de Carlos

    // Confirm dialog
    const confirmTitle = screen.getByText('¿Usar como foto pública?');
    const confirmDialog = confirmTitle.closest('[role="dialog"]')!;
    const confirmBtn = within(confirmDialog).getByRole('button', { name: 'Usar como foto pública' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminVintagesApi.promoteVintageImage).toHaveBeenCalledWith(101, 10);
      expect(mockToast.success).toHaveBeenCalledWith('Foto pública actualizada a partir del aporte del usuario.');
    });
  });

  it('permite cambiar imagen pública manualmente y quitar imagen pública con confirmación', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    vi.mocked(adminVintagesApi.getVintageDetail).mockResolvedValue({
      id: 102,
      wineId: 43,
      year: 2023,
      alcoholContent: 13.5,
      servingTemperature: 12,
      agingAdvice: null,
      imageId: 'img-102-uuid',
      approvalStatus: 'Approved',
      uploadedByUserId: 4,
      registerDate: '2026-01-20T12:00:00Z',
      averageRating: 4.0,
      reviewCount: 1,
      grapes: [],
    });
    vi.mocked(adminVintagesApi.deleteVintageImage).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/cosechas?status=Approved']}>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chardonnay Estate')).toBeInTheDocument();
    });

    // Abrir detalle de la cosecha 102 (segunda fila)
    const viewButtons = screen.getAllByTitle('Ver detalle');
    fireEvent.click(viewButtons[1]);

    const detailDialog = screen.getByLabelText('Cerrar modal de detalle').closest('[role="dialog"]')!;
    await within(detailDialog).findByText('Imagen Pública Oficial');
    expect(within(detailDialog).getByText('Las fotos personales de los usuarios no se modifican.')).toBeInTheDocument();

    // Quitar imagen pública
    const deleteImgBtn = within(detailDialog).getByRole('button', { name: 'Quitar imagen' });
    fireEvent.click(deleteImgBtn);

    const confirmTitle = screen.getByText('¿Quitar imagen pública?');
    const confirmDialog = confirmTitle.closest('[role="dialog"]')!;
    const confirmDeleteBtn = within(confirmDialog).getByRole('button', { name: 'Quitar imagen' });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(adminVintagesApi.deleteVintageImage).toHaveBeenCalledWith(43, 102);
      expect(mockToast.success).toHaveBeenCalledWith('Imagen pública eliminada.');
    });
  });

  it('permite editar datos técnicos de la cosecha y valida campos', async () => {
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue(mockVintages);
    vi.mocked(adminVintagesApi.getVintageDetail).mockResolvedValue({
      id: 101,
      wineId: 42,
      year: 2022,
      alcoholContent: 14.2,
      servingTemperature: 16,
      agingAdvice: 'Guarda.',
      imageId: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 3,
      registerDate: '2026-01-15T12:00:00Z',
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    });

    vi.mocked(adminVintagesApi.updateVintage).mockResolvedValue({
      id: 101,
      wineId: 42,
      year: 2021,
      alcoholContent: 14.5,
      servingTemperature: 18,
      agingAdvice: 'Nuevo consejo.',
      imageId: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 3,
      registerDate: '2026-01-15T12:00:00Z',
      averageRating: null,
      reviewCount: 0,
      grapes: [{ grapeId: 1, percentage: 100 }],
    });

    render(
      <MemoryRouter>
        <AdminVintagesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec Reserva')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByTitle('Ver detalle')[0]);
    const detailDialog = screen.getByLabelText('Cerrar modal de detalle').closest('[role="dialog"]')!;
    await within(detailDialog).findByText('Editar Datos de la Cosecha');

    // Cambiar año y alcohol
    const yearInput = within(detailDialog).getByLabelText(/año de añada/i);
    fireEvent.change(yearInput, { target: { value: '2021' } });

    const alcInput = within(detailDialog).getByLabelText(/graduación/i);
    fireEvent.change(alcInput, { target: { value: '14.5' } });

    // Agregar uva
    const addGrapeBtn = within(detailDialog).getByRole('button', { name: /agregar uva/i });
    fireEvent.click(addGrapeBtn);

    const submitBtn = within(detailDialog).getByRole('button', { name: /guardar datos de cosecha/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminVintagesApi.updateVintage).toHaveBeenCalledWith(42, 101, expect.objectContaining({
        year: 2021,
        alcoholContent: 14.5,
      }));
      expect(mockToast.success).toHaveBeenCalledWith('Datos de la cosecha actualizados exitosamente.');
    });

    // Enlace a editar vino
    const editWineLink = within(detailDialog).getByRole('link', { name: /editar vino/i });
    expect(editWineLink).toHaveAttribute('href', '/admin/vinos?focusWineId=42');
  });
});
