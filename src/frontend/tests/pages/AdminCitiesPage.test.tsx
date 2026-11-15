import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCitiesPage from '@/pages/AdminCitiesPage';
import * as adminCitiesApi from '@/features/admin/api/adminCitiesApi';
import * as locationApi from '@/features/winery/api/locationApi';
import { AdminToastProvider } from '@/features/admin';
import type { CityResponseDto, StateResponseDto } from '@/features/winery/types/location';

vi.mock('@/features/admin/api/adminCitiesApi', () => ({
  getCities: vi.fn(),
  changeCityStatus: vi.fn(),
}));

vi.mock('@/features/winery/api/locationApi', () => ({
  getStates: vi.fn(),
}));

describe('AdminCitiesPage Component', () => {
  const mockStates: StateResponseDto[] = [
    { id: 1, name: 'Mendoza' },
    { id: 2, name: 'San Juan' },
  ];

  const mockPendingCities: CityResponseDto[] = [
    { id: 10, name: 'Chacras de Coria', stateId: 1, status: 'Pending' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(locationApi.getStates).mockResolvedValue(mockStates);
  });

  it('la carga inicial pide status Pending por defecto y muestra la provincia resuelta', async () => {
    vi.mocked(adminCitiesApi.getCities).mockResolvedValue(mockPendingCities);

    render(
      <MemoryRouter initialEntries={['/admin/ciudades']}>
        <AdminToastProvider>
          <AdminCitiesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminCitiesApi.getCities).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Pending',
        stateId: undefined,
      });
      expect(screen.getByText('Chacras de Coria')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Mendoza' })).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });
  });

  it('filtrar por provincia envía stateId en la petición', async () => {
    vi.mocked(adminCitiesApi.getCities).mockResolvedValue(mockPendingCities);

    render(
      <MemoryRouter initialEntries={['/admin/ciudades']}>
        <AdminToastProvider>
          <AdminCitiesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chacras de Coria')).toBeInTheDocument();
    });

    const selectState = screen.getByLabelText(/filtrar por provincia/i);
    fireEvent.change(selectState, { target: { value: '2' } });

    await waitFor(() => {
      expect(adminCitiesApi.getCities).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Pending',
        stateId: 2,
      });
    });
  });

  it('aprobar llama changeCityStatus con Approved y recarga la lista', async () => {
    vi.mocked(adminCitiesApi.getCities).mockResolvedValue(mockPendingCities);
    vi.mocked(adminCitiesApi.changeCityStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/ciudades']}>
        <AdminToastProvider>
          <AdminCitiesPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Chacras de Coria')).toBeInTheDocument();
    });

    const approveBtn = screen.getByTitle('Aprobar ciudad');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminCitiesApi.changeCityStatus).toHaveBeenCalledWith(10, 'Approved');
      expect(adminCitiesApi.getCities).toHaveBeenCalledTimes(2);
    });
  });
});

