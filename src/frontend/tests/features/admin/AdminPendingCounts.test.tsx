import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '@/features/admin/components/AdminLayout';
import AdminWineriesPage from '@/pages/AdminWineriesPage';
import AdminVintagesPage from '@/pages/AdminVintagesPage';
import * as authModule from '@/features/auth';
import * as adminStatsApi from '@/features/admin/api/adminStatsApi';
import * as adminWineriesApi from '@/features/admin/api/adminWineriesApi';
import * as adminVintagesApi from '@/features/admin/api/adminVintagesApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import type { AdminStatsDto } from '@/features/admin/types/adminStats';
import type { WineryResponseDto } from '@/features/winery/types/winery';
import type { AdminWineVintageListItem } from '@/features/admin/types/adminVintages';

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

vi.mock('@/features/admin/api/adminStatsApi', () => ({
  getAdminStats: vi.fn(),
}));

vi.mock('@/features/admin/api/adminWineriesApi', () => ({
  getAdminWineries: vi.fn(),
  changeWineryStatus: vi.fn(),
  deleteWinery: vi.fn(),
}));

vi.mock('@/features/admin/api/adminVintagesApi', () => ({
  getAdminVintages: vi.fn(),
  changeVintageStatus: vi.fn(),
  deleteVintage: vi.fn(),
  getVintageDetail: vi.fn(),
}));

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

function buildStats(wineriesPending: number, vintagesPending: number): AdminStatsDto {
  return {
    users: { total: 10, blocked: 1 },
    wineries: { total: 15, pending: wineriesPending, approved: 10, rejected: 2 },
    cities: { pending: 4 },
    vintages: { pending: vintagesPending, approved: 20, rejected: 1 },
    wines: { total: 30, community: 10, official: 20 },
    reviews: { total: 50 },
  };
}

describe('Admin pending counts & indicators (Bloque 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', email: 'admin@ayvino.com', role: 'Admin' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([]);
  });

  it('sidebar muestra badge numérico cuando hay pendientes (> 0), lo oculta con 0 y muestra "99+" si supera 99', async () => {
    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValueOnce(buildStats(3, 0));

    const { unmount } = render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /navegación del panel de administración/i });
    const wineriesLink = within(nav).getByRole('link', { name: /bodegas/i });
    const vintagesLink = within(nav).getByRole('link', { name: /cosechas/i });

    await waitFor(() => {
      const badge = within(wineriesLink).getByLabelText('3 pendientes');
      expect(badge).toHaveTextContent('3');
    });

    expect(within(vintagesLink).queryByLabelText(/pendiente/i)).not.toBeInTheDocument();

    unmount();

    vi.mocked(adminStatsApi.getAdminStats).mockResolvedValueOnce(buildStats(120, 1));

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>Inicio</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const nav2 = screen.getByRole('navigation', { name: /navegación del panel de administración/i });
    await waitFor(() => {
      expect(within(within(nav2).getByRole('link', { name: /bodegas/i })).getByLabelText('120 pendientes')).toHaveTextContent('99+');
      expect(within(within(nav2).getByRole('link', { name: /cosechas/i })).getByLabelText('1 pendiente')).toHaveTextContent('1');
    });
  });

  it('en AdminWineriesPage muestra "Pendientes (n)", resalta filas Pending y actualiza badge y chip al aprobar', async () => {
    const wineryRows: WineryResponseDto[] = [
      {
        id: 101,
        userId: 10,
        name: 'Bodega Pendiente',
        status: 'Pending',
        description: null,
        website: null,
        foundationYear: 2010,
        registerDate: '2026-01-01T00:00:00Z',
        latitude: -33,
        longitude: -68,
        logoUrl: null,
        location: null,
      },
      {
        id: 102,
        userId: 11,
        name: 'Bodega Aprobada',
        status: 'Approved',
        description: null,
        website: null,
        foundationYear: 2005,
        registerDate: '2026-01-01T00:00:00Z',
        latitude: -33,
        longitude: -68,
        logoUrl: null,
        location: null,
      },
    ];

    vi.mocked(adminStatsApi.getAdminStats)
      .mockResolvedValueOnce(buildStats(4, 2))
      .mockResolvedValueOnce(buildStats(3, 2));
    vi.mocked(adminWineriesApi.getAdminWineries).mockResolvedValue({
      items: wineryRows,
      totalCount: 2,
    });
    vi.mocked(adminWineriesApi.changeWineryStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/bodegas']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="bodegas" element={<AdminWineriesPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pendientes (4)' })).toBeInTheDocument();
      expect(screen.getByText('Bodega Pendiente')).toBeInTheDocument();
    });

    const pendingRow = screen.getByText('Bodega Pendiente').closest('tr');
    const approvedRow = screen.getByText('Bodega Aprobada').closest('tr');
    expect(pendingRow?.className).toContain('border-l-amber-400');
    expect(approvedRow?.className).not.toContain('border-l-amber-400');

    fireEvent.click(screen.getByTitle('Aprobar bodega'));

    await waitFor(() => {
      expect(adminStatsApi.getAdminStats).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: 'Pendientes (3)' })).toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: /navegación del panel de administración/i });
      expect(within(within(nav).getByRole('link', { name: /bodegas/i })).getByLabelText('3 pendientes')).toHaveTextContent('3');
    });
  });

  it('en AdminVintagesPage muestra "Pendientes (n)", resalta filas Pending y actualiza conteo tras rechazar', async () => {
    const vintageRows: AdminWineVintageListItem[] = [
      {
        vintageId: 201,
        wineId: 50,
        wineName: 'Malbec Sin Aprobar',
        wineType: 'Red',
        wineryName: 'Bodega Sur',
        year: 2023,
        alcoholContent: 14.0,
        approvalStatus: 'Pending',
        uploadedByUserId: 9,
        uploadedByUsername: 'juan',
        registerDate: '2026-02-01T00:00:00Z',
      },
      {
        vintageId: 202,
        wineId: 51,
        wineName: 'Chardonnay Aprobado',
        wineType: 'White',
        wineryName: 'Bodega Norte',
        year: 2022,
        alcoholContent: 13.0,
        approvalStatus: 'Approved',
        uploadedByUserId: 9,
        uploadedByUsername: 'juan',
        registerDate: '2026-02-01T00:00:00Z',
      },
    ];

    vi.mocked(adminStatsApi.getAdminStats)
      .mockResolvedValueOnce(buildStats(1, 5))
      .mockResolvedValueOnce(buildStats(1, 4));
    vi.mocked(adminVintagesApi.getAdminVintages).mockResolvedValue({
      items: vintageRows,
      totalCount: 2,
    });
    vi.mocked(adminVintagesApi.changeVintageStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/cosechas']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="cosechas" element={<AdminVintagesPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pendientes (5)' })).toBeInTheDocument();
      expect(screen.getByText('Malbec Sin Aprobar')).toBeInTheDocument();
    });

    const pendingRow = screen.getByText('Malbec Sin Aprobar').closest('tr');
    const approvedRow = screen.getByText('Chardonnay Aprobado').closest('tr');
    expect(pendingRow?.className).toContain('border-l-amber-400');
    expect(approvedRow?.className).not.toContain('border-l-amber-400');

    const rejectButtons = screen.getAllByTitle('Rechazar cosecha');
    fireEvent.click(rejectButtons[0]);
    fireEvent.click(screen.getByRole('button', { name: /^rechazar$/i }));

    await waitFor(() => {
      expect(adminStatsApi.getAdminStats).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: 'Pendientes (4)' })).toBeInTheDocument();
      const nav = screen.getByRole('navigation', { name: /navegación del panel de administración/i });
      expect(within(within(nav).getByRole('link', { name: /cosechas/i })).getByLabelText('4 pendientes')).toHaveTextContent('4');
    });
  });
});
