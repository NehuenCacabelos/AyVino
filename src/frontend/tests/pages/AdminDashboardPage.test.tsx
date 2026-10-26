import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as adminCitiesApi from '@/features/admin/api/adminCitiesApi';
import * as adminUsersApi from '@/features/admin/api/adminUsersApi';
import * as authModule from '@/features/auth';
import type { WineryResponseDto } from '@/features/winery/types/winery';
import type { CityResponseDto } from '@/features/winery/types/location';
import type { AdminUserListItemDto } from '@/features/admin/types/adminUsers';

vi.mock('@/features/winery/api/wineryApi', () => ({
  getWineries: vi.fn(),
}));

vi.mock('@/features/admin/api/adminCitiesApi', () => ({
  getCities: vi.fn(),
}));

vi.mock('@/features/admin/api/adminUsersApi', () => ({
  getUsers: vi.fn(),
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
  const mockWineries: WineryResponseDto[] = [
    {
      id: 1,
      name: 'Bodega La Rural',
      description: null,
      locationId: 1,
      foundationYear: 1885,
      website: null,
      userId: 1,
      status: 'Pending',
      registerDate: '2026-02-10T00:00:00Z',
    },
    {
      id: 2,
      name: 'Bodega Zuccardi',
      description: null,
      locationId: 2,
      foundationYear: 1963,
      website: null,
      userId: 2,
      status: 'Pending',
      registerDate: '2026-02-12T00:00:00Z',
    },
    {
      id: 3,
      name: 'Bodega Catena',
      description: null,
      locationId: 3,
      foundationYear: 1902,
      website: null,
      userId: 3,
      status: 'Pending',
      registerDate: '2026-02-14T00:00:00Z',
    },
  ];

  const mockCities: CityResponseDto[] = [
    { id: 1, name: 'Gualtallary', stateId: 1, status: 'Pending' },
    { id: 2, name: 'Altamira', stateId: 1, status: 'Pending' },
  ];

  const mockUsers: AdminUserListItemDto[] = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    username: `usuario${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: 'User',
    registerDate: '2026-01-01T00:00:00Z',
    isActive: true,
  }));

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

  it('muestra los conteos correctos y la lista de últimos pendientes', async () => {
    vi.mocked(wineryApi.getWineries).mockResolvedValue(mockWineries);
    vi.mocked(adminCitiesApi.getCities).mockResolvedValue(mockCities);
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 bodegas
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 ciudades
      expect(screen.getByText('15')).toBeInTheDocument(); // 15 usuarios
      expect(screen.getByText('Bodega La Rural')).toBeInTheDocument();
      expect(screen.getByText('Gualtallary')).toBeInTheDocument();
    });
  });

  it('muestra 100+ cuando se devuelven 100 elementos', async () => {
    const hundredWineries: WineryResponseDto[] = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Bodega ${i + 1}`,
      description: null,
      locationId: 1,
      foundationYear: 2000,
      website: null,
      userId: i + 1,
      status: 'Pending',
      registerDate: '2026-01-01',
    }));

    vi.mocked(wineryApi.getWineries).mockResolvedValue(hundredWineries);
    vi.mocked(adminCitiesApi.getCities).mockResolvedValue(mockCities);
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('100+')).toBeInTheDocument();
    });
  });

  it('una tarjeta en error no rompe las otras dos tarjetas', async () => {
    vi.mocked(wineryApi.getWineries).mockRejectedValue(
      new Error('No se pudo conectar con el servidor.')
    );
    vi.mocked(adminCitiesApi.getCities).mockResolvedValue(mockCities);
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // La tarjeta de bodegas muestra error y botón de reintento
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();

      // Las tarjetas de ciudades y usuarios cargaron con éxito
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });
  });
});

