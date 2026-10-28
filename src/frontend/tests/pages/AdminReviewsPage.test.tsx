import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminReviewsPage from '@/pages/AdminReviewsPage';
import * as adminReviewsApi from '@/features/admin/api/adminReviewsApi';
import { AdminToastProvider } from '@/features/admin';
import type { AdminReviewListItemDto } from '@/features/admin/types/adminReviews';

vi.mock('@/features/admin/api/adminReviewsApi', () => ({
  getAdminReviews: vi.fn(),
  deleteReviewByAdmin: vi.fn(),
}));

describe('AdminReviewsPage Component', () => {
  const mockReviews: AdminReviewListItemDto[] = [
    {
      id: 101,
      rating: 4,
      comment: 'Un gran vino con excelente cuerpo y aromas florales profundos.',
      createdAt: '2026-10-27T12:00:00Z',
      userId: 5,
      username: 'usuario_sommelier',
      wineVintageId: 20,
      wineId: 10,
      wineName: 'Gran Reserva Malbec',
      year: 2021,
    },
    {
      id: 102,
      rating: 5,
      comment: 'Inmejorable.',
      createdAt: '2026-10-27T13:00:00Z',
      userId: 8,
      username: 'cata_expert',
      wineVintageId: 25,
      wineId: 12,
      wineName: 'Chardonnay Estate',
      year: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la carga inicial pide reseñas y las renderiza en la tabla', async () => {
    vi.mocked(adminReviewsApi.getAdminReviews).mockResolvedValue(mockReviews);

    render(
      <MemoryRouter initialEntries={['/admin/resenas']}>
        <AdminToastProvider>
          <AdminReviewsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminReviewsApi.getAdminReviews).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        rating: undefined,
        wineId: undefined,
        userId: undefined,
      });
      expect(screen.getByText('Gran Reserva Malbec')).toBeInTheDocument();
      expect(screen.getByText('Cosecha: 2021')).toBeInTheDocument();
      expect(screen.getByText('usuario_sommelier')).toBeInTheDocument();
      expect(screen.getByText('Chardonnay Estate')).toBeInTheDocument();
      expect(screen.getByText('Cosecha: S/A')).toBeInTheDocument();
      expect(screen.getByText('cata_expert')).toBeInTheDocument();
    });
  });

  it('el filtro de puntaje envía rating al hacer clic en un chip', async () => {
    vi.mocked(adminReviewsApi.getAdminReviews).mockResolvedValue(mockReviews);

    render(
      <MemoryRouter initialEntries={['/admin/resenas']}>
        <AdminToastProvider>
          <AdminReviewsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Reserva Malbec')).toBeInTheDocument();
    });

    const chip4 = screen.getByRole('button', { name: /4 estrellas/i });
    fireEvent.click(chip4);

    await waitFor(() => {
      expect(adminReviewsApi.getAdminReviews).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        rating: 4,
        wineId: undefined,
        userId: undefined,
      });
    });
  });

  it('los inputs de ID envían wineId y userId en la petición', async () => {
    vi.mocked(adminReviewsApi.getAdminReviews).mockResolvedValue(mockReviews);

    render(
      <MemoryRouter initialEntries={['/admin/resenas']}>
        <AdminToastProvider>
          <AdminReviewsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Reserva Malbec')).toBeInTheDocument();
    });

    const wineIdInput = screen.getByLabelText(/id de vino/i);
    fireEvent.change(wineIdInput, { target: { value: '10' } });

    const userIdInput = screen.getByLabelText(/id de usuario/i);
    fireEvent.change(userIdInput, { target: { value: '5' } });

    await waitFor(() => {
      expect(adminReviewsApi.getAdminReviews).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        rating: undefined,
        wineId: 10,
        userId: 5,
      });
    });
  });

  it('eliminar exige confirmación en ConfirmDialog y llama a deleteReviewByAdmin', async () => {
    vi.mocked(adminReviewsApi.getAdminReviews).mockResolvedValue(mockReviews);
    vi.mocked(adminReviewsApi.deleteReviewByAdmin).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/resenas']}>
        <AdminToastProvider>
          <AdminReviewsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Gran Reserva Malbec')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/eliminar reseña/i);
    fireEvent.click(deleteButtons[0]);

    // Modal de confirmación abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/se elimina la reseña y se recalcula el puntaje/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminReviewsApi.deleteReviewByAdmin).toHaveBeenCalledWith(101);
    });
  });
});
