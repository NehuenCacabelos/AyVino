import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminAuditPage from '@/pages/AdminAuditPage';
import * as adminAuditApi from '@/features/admin/api/adminAuditApi';
import type { AuditLogEntryDto } from '@/features/admin/types/adminAudit';

vi.mock('@/features/admin/api/adminAuditApi', () => ({
  getAuditLogs: vi.fn(),
}));

describe('AdminAuditPage Component', () => {
  const mockLogs: AuditLogEntryDto[] = [
    {
      id: 1,
      userId: 42,
      username: 'admin_alice',
      action: 'WineryStatusChanged',
      entityType: 'Winery',
      entityId: 10,
      details: 'Status changed to Approved',
      createdAt: '2026-10-27T15:30:00Z',
    },
    {
      id: 2,
      userId: 43,
      username: 'admin_bob',
      action: 'WineMerged',
      entityType: 'Wine',
      entityId: 99,
      details: 'Merged duplicate 105',
      createdAt: '2026-10-27T16:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('la carga inicial pide registros de auditoría y los muestra en la tabla formateados', async () => {
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue(mockLogs);

    render(
      <MemoryRouter initialEntries={['/admin/auditoria']}>
        <AdminAuditPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(adminAuditApi.getAuditLogs).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        action: undefined,
        entityType: undefined,
        from: undefined,
        to: undefined,
      });
      expect(screen.getByText('admin_alice')).toBeInTheDocument();
      expect(screen.getByText('admin_bob')).toBeInTheDocument();
      expect(screen.getAllByText('Cambio de estado de bodega').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Fusión de vinos').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Bodega').length).toBeGreaterThan(0);
      expect(screen.getByText('#10')).toBeInTheDocument();
      expect(screen.getByText('#99')).toBeInTheDocument();
    });
  });

  it('los filtros envían action, entityType, from y to en la petición', async () => {
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue(mockLogs);

    render(
      <MemoryRouter initialEntries={['/admin/auditoria']}>
        <AdminAuditPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin_alice')).toBeInTheDocument();
    });

    const actionSelect = screen.getByLabelText(/filtrar por acción/i);
    fireEvent.change(actionSelect, { target: { value: 'WineryStatusChanged' } });

    const entitySelect = screen.getByLabelText(/filtrar por tipo de entidad/i);
    fireEvent.change(entitySelect, { target: { value: 'Winery' } });

    const fromInput = screen.getByLabelText(/fecha desde/i);
    fireEvent.change(fromInput, { target: { value: '2026-10-01' } });

    const toInput = screen.getByLabelText(/fecha hasta/i);
    fireEvent.change(toInput, { target: { value: '2026-10-31' } });

    await waitFor(() => {
      expect(adminAuditApi.getAuditLogs).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        action: 'WineryStatusChanged',
        entityType: 'Winery',
        from: '2026-10-01',
        to: '2026-10-31',
      });
    });
  });

  it('el botón "Limpiar filtros" resetea los filtros y recarga la lista', async () => {
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue(mockLogs);

    render(
      <MemoryRouter initialEntries={['/admin/auditoria']}>
        <AdminAuditPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin_alice')).toBeInTheDocument();
    });

    const actionSelect = screen.getByLabelText(/filtrar por acción/i);
    fireEvent.change(actionSelect, { target: { value: 'WineMerged' } });

    await waitFor(() => {
      expect(screen.getByText(/limpiar filtros/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/limpiar filtros/i));

    await waitFor(() => {
      expect(adminAuditApi.getAuditLogs).toHaveBeenLastCalledWith({
        pageNumber: 1,
        pageSize: 10,
        action: undefined,
        entityType: undefined,
        from: undefined,
        to: undefined,
      });
      expect(actionSelect).toHaveValue('');
    });
  });
});
