import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminWineriesPage from '@/pages/AdminWineriesPage';
import * as adminStatsApi from '@/features/admin/api/adminStatsApi';
import * as adminAuditApi from '@/features/admin/api/adminAuditApi';
import * as adminWineriesApi from '@/features/admin/api/adminWineriesApi';
import * as authModule from '@/features/auth';
import { AdminToastProvider } from '@/features/admin';
import type {
  AdminStatsDto,
  GrapesDistribution,
  WineriesByRegion,
} from '@/features/admin/types/adminStats';
import type { AuditLogEntryDto } from '@/features/admin/types/adminAudit';

const mockDashboardMapInstance = {
  fitBounds: vi.fn(),
  flyTo: vi.fn(),
  getZoom: () => 8,
};

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="mock-tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-barrel-marker">{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tooltip">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-popup">{children}</div>
  ),
  useMap: () => mockDashboardMapInstance,
}));

vi.mock('leaflet', () => ({
  default: {
    latLngBounds: vi.fn((coords: [number, number][]) => coords),
    divIcon: vi.fn((options: { html?: string }) => options),
  },
}));

vi.mock('@/features/admin/api/adminStatsApi', () => ({
  getAdminStats: vi.fn(),
  getGrapesDistribution: vi.fn(),
  getWineriesByRegion: vi.fn(),
}));

vi.mock('@/features/admin/api/adminAuditApi', () => ({
  getAuditLogs: vi.fn(),
}));

vi.mock('@/features/admin/api/adminWineriesApi', () => ({
  getAdminWineries: vi.fn(),
  changeWineryStatus: vi.fn(),
  deleteWinery: vi.fn(),
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

  const mockGrapesDistribution: GrapesDistribution = {
    totalVintages: 10,
    grapes: [
      { grapeId: 1, name: 'Malbec', vintageCount: 7 },
      { grapeId: 2, name: 'Cabernet Sauvignon', vintageCount: 3 },
    ],
  };

  const mockWineriesByRegion: WineriesByRegion = {
    totalWineries: 19,
    withoutCoordinates: 1,
    regions: [
      { stateId: 13, stateName: 'Mendoza', wineryCount: 14 },
      { stateId: 17, stateName: 'Salta', wineryCount: 5 },
    ],
    pins: [
      {
        id: 1,
        name: 'Bodega Andina',
        latitude: -33.0,
        longitude: -68.8,
        stateName: 'Mendoza',
        cityName: 'Luján de Cuyo',
        stateId: 13,
      },
    ],
    wineries: [
      {
        id: 1,
        name: 'Bodega Andina',
        stateId: 13,
        cityName: 'Luján de Cuyo',
        foundationYear: 2001,
        hasCoordinates: true,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminStatsApi.getGrapesDistribution).mockResolvedValue(mockGrapesDistribution);
    vi.mocked(adminStatsApi.getWineriesByRegion).mockResolvedValue(mockWineriesByRegion);
    mockUseAuth.mockReturnValue({
      user: {
        id: 99,
        username: 'admin_principal',
        role: 'Admin',
      },
    });
  });

  it('muestra los conteos exactos de los 3 KPIs (sin Ciudades pendientes) y las métricas completas del ecosistema', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue({ items: mockAuditLogs, totalCount: 2 });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // 3 KPIs principales con conteos exactos (sin "+")
      expect(screen.getByText('4')).toBeInTheDocument(); // Bodegas pendientes
      expect(screen.getByText('8')).toBeInTheDocument(); // Cosechas pendientes
      expect(screen.queryByText(/ciudades pendientes/i)).not.toBeInTheDocument();
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
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue({ items: [], totalCount: 0 });

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
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue({ items: mockAuditLogs, totalCount: 2 });

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

  it('cada card de KPI y métricas renderiza como Link con su href esperado y foco visible', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue({ items: [], totalCount: 0 });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    const expectedLinks: { pattern: RegExp; href: string }[] = [
      { pattern: /bodegas pendientes/i, href: '/admin/bodegas?status=Pending' },
      { pattern: /cosechas pendientes/i, href: '/admin/cosechas?status=Pending' },
      { pattern: /usuarios bloqueados/i, href: '/admin/usuarios?status=Blocked' },
      { pattern: /total usuarios/i, href: '/admin/usuarios' },
      { pattern: /total bodegas/i, href: '/admin/bodegas' },
      { pattern: /catálogo de vinos/i, href: '/admin/vinos' },
      { pattern: /total reseñas/i, href: '/admin/resenas' },
    ];

    for (const item of expectedLinks) {
      const links = screen.getAllByRole('link', { name: item.pattern });
      const cardLink = links.find((el) => el.getAttribute('href') === item.href);
      expect(cardLink).toBeDefined();
      expect(cardLink?.className).toContain('focus-visible:');
    }
  });

  it('click en la card de Bodegas pendientes navega a /admin/bodegas?status=Pending con chip Pendientes activo', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue({ items: [], totalCount: 0 });
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({ items: [], totalCount: 0 });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminToastProvider>
          <Routes>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/bodegas" element={<AdminWineriesPage />} />
          </Routes>
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /bodegas pendientes/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('link', { name: /bodegas pendientes/i }));

    await waitFor(() => {
      expect(adminWineriesApi.getAdminWineries).toHaveBeenCalledWith({
        pageNumber: 1,
        pageSize: 10,
        status: 'Pending',
      });
      expect(screen.getByRole('button', { name: 'Pendientes' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('renderiza ambos widgets de gráficos y si falla uno el otro y el resto del dashboard siguen funcionando', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValue(mockStats);
    vi.mocked(adminAuditApi.getAuditLogs).mockResolvedValue({ items: mockAuditLogs, totalCount: 2 });

    const { unmount } = render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Regiones y Terruños')).toBeInTheDocument();
      expect(screen.getByText('Distribución por Varietales')).toBeInTheDocument();
      expect(screen.getAllByText('Mendoza').length).toBeGreaterThan(0);
      expect(screen.getByText('Malbec')).toBeInTheDocument();
      expect(screen.getByText('70% (7)')).toBeInTheDocument();
    });

    unmount();

    vi.mocked(adminStatsApi.getGrapesDistribution).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          detail: 'Error en distribución de uvas.',
        },
      },
    });
    vi.mocked(adminStatsApi.getWineriesByRegion).mockResolvedValueOnce(mockWineriesByRegion);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Tarjeta fallida muestra su error y reintento sin romper el resto
      expect(screen.getByText('Error en distribución de uvas.')).toBeInTheDocument();
      // La otra tarjeta gráfica y el dashboard siguen funcionando
      expect(screen.getByText('Regiones y Terruños')).toBeInTheDocument();
      expect(screen.getAllByText('Mendoza').length).toBeGreaterThan(0);
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Fusión de vinos')).toBeInTheDocument();
    });
  });
});
