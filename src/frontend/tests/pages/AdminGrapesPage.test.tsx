import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminGrapesPage from '@/pages/AdminGrapesPage';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as adminGrapesApi from '@/features/admin/api/adminGrapesApi';
import { AdminToastProvider } from '@/features/admin';
import type { GrapeResponseDto } from '@/features/winery/types/grape';

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/admin/api/adminGrapesApi', () => ({
  createGrape: vi.fn(),
  updateGrape: vi.fn(),
  deleteGrape: vi.fn(),
}));

describe('AdminGrapesPage Component', () => {
  const mockGrapes: GrapeResponseDto[] = [
    {
      id: 1,
      name: 'Malbec',
      colorType: 'Red',
      typicalBody: 'MediumFull',
      typicalTannins: 'MediumSoft',
      typicalAcidity: 'Medium',
      description: 'Cepa insignia argentina',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('el formulario no envía con nombre vacío y muestra error de validación', async () => {
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapes);

    render(
      <MemoryRouter initialEntries={['/admin/uvas']}>
        <AdminToastProvider>
          <AdminGrapesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec')).toBeInTheDocument();
    });

    const newBtn = screen.getByRole('button', { name: /nueva uva/i });
    fireEvent.click(newBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /^crear$/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText('El nombre de la uva es obligatorio.')
    ).toBeInTheDocument();
    expect(adminGrapesApi.createGrape).not.toHaveBeenCalled();
  });

  it('crear envía los strings de enum correctos al backend', async () => {
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapes);
    vi.mocked(adminGrapesApi.createGrape).mockResolvedValue({
      id: 2,
      name: 'Bonarda',
      colorType: 'Red',
      typicalBody: 'Medium',
      typicalTannins: 'MediumSoft',
      typicalAcidity: 'MediumHigh',
      description: 'Tradicional',
    });

    render(
      <MemoryRouter initialEntries={['/admin/uvas']}>
        <AdminToastProvider>
          <AdminGrapesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec')).toBeInTheDocument();
    });

    // Abrir modal
    fireEvent.click(screen.getByRole('button', { name: /nueva uva/i }));

    // Completar inputs
    const nameInput = screen.getByLabelText(/nombre/i);
    fireEvent.change(nameInput, { target: { value: 'Bonarda' } });

    const colorSelect = screen.getByLabelText(/tipo de color/i);
    fireEvent.change(colorSelect, { target: { value: 'Red' } });

    const bodySelect = screen.getByLabelText(/cuerpo típico/i);
    fireEvent.change(bodySelect, { target: { value: 'Medium' } });

    const tanninsSelect = screen.getByLabelText(/taninos típicos/i);
    fireEvent.change(tanninsSelect, { target: { value: 'MediumSoft' } });

    const aciditySelect = screen.getByLabelText(/acidez típica/i);
    fireEvent.change(aciditySelect, { target: { value: 'MediumHigh' } });

    const descInput = screen.getByLabelText(/descripción/i);
    fireEvent.change(descInput, { target: { value: 'Tradicional' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^crear$/i }));

    await waitFor(() => {
      expect(adminGrapesApi.createGrape).toHaveBeenCalledWith({
        name: 'Bonarda',
        colorType: 'Red',
        typicalBody: 'Medium',
        typicalTannins: 'MediumSoft',
        typicalAcidity: 'MediumHigh',
        description: 'Tradicional',
      });
      expect(grapeApi.getGrapes).toHaveBeenCalledTimes(2);
    });
  });

  it('eliminar exige confirmación en ConfirmDialog antes de llamar a deleteGrape', async () => {
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapes);
    vi.mocked(adminGrapesApi.deleteGrape).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/uvas']}>
        <AdminToastProvider>
          <AdminGrapesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Malbec')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Eliminar uva');
    fireEvent.click(deleteBtn);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Eliminar uva?')).toBeInTheDocument();
    expect(adminGrapesApi.deleteGrape).not.toHaveBeenCalled();

    // Confirmar
    const confirmDeleteBtn = screen.getByRole('button', {
      name: /eliminar definitivamente/i,
    });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(adminGrapesApi.deleteGrape).toHaveBeenCalledWith(1);
      expect(grapeApi.getGrapes).toHaveBeenCalledTimes(2);
    });
  });
});

