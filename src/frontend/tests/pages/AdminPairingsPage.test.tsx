import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminPairingsPage from '@/pages/AdminPairingsPage';
import * as adminPairingsApi from '@/features/admin/api/adminPairingsApi';
import { AdminToastProvider } from '@/features/admin';
import type { PairingResponseDto } from '@/features/admin/types/adminPairings';

vi.mock('@/features/admin/api/adminPairingsApi', () => ({
  getPairings: vi.fn(),
  createPairing: vi.fn(),
  updatePairing: vi.fn(),
  deletePairing: vi.fn(),
}));

describe('AdminPairingsPage Component', () => {
  const mockPairings: PairingResponseDto[] = [
    { id: 1, name: 'Asado criollo', category: 'Meat' },
    { id: 2, name: 'Salmón rosado', category: 'Fish' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('crear envía name y category correctos al backend', async () => {
    vi.mocked(adminPairingsApi.getPairings).mockResolvedValue(mockPairings);
    vi.mocked(adminPairingsApi.createPairing).mockResolvedValue({
      id: 3,
      name: 'Trucha a la manteca negra',
      category: 'Fish',
    });

    render(
      <MemoryRouter initialEntries={['/admin/maridajes']}>
        <AdminToastProvider>
          <AdminPairingsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Asado criollo')).toBeInTheDocument();
    });

    // Abrir modal
    fireEvent.click(screen.getByRole('button', { name: /nuevo maridaje/i }));

    // Completar formulario
    const nameInput = screen.getByLabelText(/nombre del maridaje/i);
    fireEvent.change(nameInput, { target: { value: 'Trucha a la manteca negra' } });

    const categorySelect = screen.getByLabelText(/categoría gastronómica/i);
    fireEvent.change(categorySelect, { target: { value: 'Fish' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(adminPairingsApi.createPairing).toHaveBeenCalledWith({
        name: 'Trucha a la manteca negra',
        category: 'Fish',
      });
      expect(adminPairingsApi.getPairings).toHaveBeenCalledTimes(2);
    });
  });

  it('el filtro por categoría envía el parámetro al backend', async () => {
    vi.mocked(adminPairingsApi.getPairings).mockResolvedValue(mockPairings);

    render(
      <MemoryRouter initialEntries={['/admin/maridajes']}>
        <AdminToastProvider>
          <AdminPairingsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Asado criollo')).toBeInTheDocument();
    });

    const fishChip = screen.getByRole('button', { name: /^pescados$/i });
    fireEvent.click(fishChip);

    await waitFor(() => {
      expect(adminPairingsApi.getPairings).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        category: 'Fish',
      });
    });
  });

  it('eliminar exige confirmación en ConfirmDialog antes de llamar a deletePairing', async () => {
    vi.mocked(adminPairingsApi.getPairings).mockResolvedValue(mockPairings);
    vi.mocked(adminPairingsApi.deletePairing).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/maridajes']}>
        <AdminToastProvider>
          <AdminPairingsPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Asado criollo')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar maridaje');
    fireEvent.click(deleteButtons[0]);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Eliminar maridaje?')).toBeInTheDocument();
    expect(adminPairingsApi.deletePairing).not.toHaveBeenCalled();

    // Confirmar
    const confirmBtn = screen.getByRole('button', {
      name: /eliminar definitivamente/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminPairingsApi.deletePairing).toHaveBeenCalledWith(1);
      expect(adminPairingsApi.getPairings).toHaveBeenCalledTimes(2);
    });
  });
});

