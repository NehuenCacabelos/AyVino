import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import * as adminStatsApi from '@/features/admin/api/adminStatsApi';
import * as adminAuditApi from '@/features/admin/api/adminAuditApi';
import * as authModule from '@/features/auth';
import type { AdminStatsDto } from '@/features/admin/types/adminStats';
import type { AuditLogEntryDto } from '@/features/admin/types/adminAudit';

vi.mock('@/features/admin/api/adminStatsApi', () => ({
  getAdminStats: vi.fn(),
}));

vi.mock('@/features/admin/api/adminAuditApi', () => ({
  getAuditLogs: vi.fn(),
}));

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

describe('AdminDashboardPage Component', () => {
  const mockStats: AdminStatsDto = {
    users: { total: 150, blocked: 3 },
    wineries: { total: 31, pending: 4, approved: 25, rejected: 2 },
    cities: { pending: 5 },
    vintages: { pending: 8, approved: 80, rejected: 1 },
    wines: { total: 45, community: 15, official: 30 },
    reviews: { total: 320 },
  };

  const mockAuditLogs: AuditLogEntryDto[] = [
    {
      id: 1,
      userId: 1,
      username: 'admin_master',
      action: 'WineMerged',
      entityType: 'Wine',
      entityId: 10,
      details: '20',
      createdAt: '2026-10-27T10:00:00Z',
    },
    {
      id: 2,
      userId: 1,
      username: 'admin_master',
      action: 'UserStatusChanged',
      entityType: 'User',
      entityId: 5,
      details: 'isActive=false',
      createdAt: '2026-10-27T09:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 99,
        username: 'admin_principal',
        role: 'Admin',
      },
    });
  });

  it('muestra los conteos exactos de los 4 KPIs y las métricas completas del ecosistema', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue(mockAuditLogs);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 4 KPIs principales con conteos exactos (sin "+")
      expect(screen.getByText('4')).toBeInTheDocument(); // Bodegas pendientes
      expect(screen.getByText('8')).toBeInTheDocument(); // Cosechas pendientes
      expect(screen.getByText('5')).toBeInTheDocument(); // Ciudades pendientes
      expect(screen.getByText('3')).toBeInTheDocument(); // Usuarios bloqueados

      // Resumen del ecosistema
      expect(screen.getByText('150')).toBeInTheDocument(); // Total usuarios
      expect(screen.getByText('31')).toBeInTheDocument(); // Total bodegas
      expect(screen.getByText(/25 aprobadas · 4 pend\./i)).toBeInTheDocument(); // Desglose bodegas
      expect(screen.getByText(/30 oficiales · 15 com\./i)).toBeInTheDocument(); // Desglose vinos
      expect(screen.getByText('320')).toBeInTheDocument(); // Total reseñas

      // Widget de actividad reciente
      expect(screen.getByText('Fusión de vinos')).toBeInTheDocument();
      expect(screen.getByText('Bloqueo/desbloqueo de usuario')).toBeInTheDocument();
      expect(screen.getAllByText('admin_master')).toHaveLength(2);
    });
  });

  it('cuando hay usuarios bloqueados (> 0) muestra alerta de cuentas suspendidas', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/cuentas suspendidas/i)).toBeInTheDocument();
    });
  });

  it('error en getAdminStats no rompe el widget de auditoría y permite reintentar', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockRejectedValueOnce(
      new Error('No se pudo conectar con el servidor.')
    );
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue(mockAuditLogs);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Reintentar disponible en tarjetas
      expect(screen.getAllByRole('button', { name: /reintentar/i }).length).toBeGreaterThan(0);
      // El log de auditoría cargó correctamente
      expect(screen.getByText('Fusión de vinos')).toBeInTheDocument();
    });

    // Simulamos éxito en el reintento
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    const retryBtn = screen.getAllByRole('button', { name: /reintentar/i })[0];
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('error en getAuditLogs no rompe las tarjetas de estadísticas', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          detail: 'Error al cargar auditoría.',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // KPIs renderizados normalmente
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      // Error en el bloque de auditoría
      expect(screen.getByText('Error al cargar auditoría.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });
  });
});
