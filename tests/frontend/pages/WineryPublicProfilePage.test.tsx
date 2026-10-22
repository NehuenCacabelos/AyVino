import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WineryPublicProfilePage from '@/pages/WineryPublicProfilePage';
import * as wineryModule from '@/pages/../features/winery';
import * as authModule from '@/pages/../features/auth';
import type {
  WineryResponseDto,
  LocationResponseDto,
  WineResponseDto,
  WineryFollowerDto,
} from '@/pages/../features/winery/types';

vi.mock('@/features/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<typeof wineryModule>();
  return {
    ...actual,
    getWineryById: vi.fn(),
    getWineryFollowers: vi.fn(),
    followWinery: vi.fn(),
    unfollowWinery: vi.fn(),
    getWines: vi.fn(),
    getLocationById: vi.fn(),
  };
});

describe('WineryPublicProfilePage', () => {
  const mockWinery: WineryResponseDto = {
    id: 7,
    name: 'Catena Zapata',
    locationId: 10,
    status: 'Approved',
    registerDate: '2026-01-01',
    description: 'Pioneros en la vitivinicultura de altura en Mendoza.',
    foundationYear: 1902,
    website: 'https://catenazapata.com',
    userId: 2,
  };

  const mockLocation: LocationResponseDto = {
    id: 10,
    cityId: 100,
    cityName: 'Agrelo',
    stateId: 1,
    stateName: 'Mendoza',
  };

  const mockWines: WineResponseDto[] = [
    {
      id: 301,
      name: 'Adrianna Vineyard Malbec',
      wineryId: 7,
      wineryNameText: 'Catena Zapata',
      description: 'Parcela única de Gualtallary',
      wineType: 'Red',
      locationId: 10,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.9,
      reviewCount: 45,
    },
  ];

  const mockFollowers: WineryFollowerDto[] = [
    { userId: 99, username: 'somm1', followedAt: '2026-01-01' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        username: 'sommelier',
        email: 'user@test.com',
        role: 'User',
        registerDate: '2026-01-01',
        isActive: true,
        photo: null,
        bio: null,
      },
      login: vi.fn(),
      register: vi.fn(),
      loginDemo: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    vi.mocked(wineryModule.getWineryById).mockResolvedValue(mockWinery);
    vi.mocked(wineryModule.getLocationById).mockResolvedValue(mockLocation);
    vi.mocked(wineryModule.getWines).mockResolvedValue(mockWines);
    vi.mocked(wineryModule.getWineryFollowers).mockResolvedValue(mockFollowers);
  });

  it('renders winery profile with initials, description, and wine catalog', async () => {
    render(
      <MemoryRouter initialEntries={['/bodegas/7']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Catena Zapata' })).toBeInTheDocument();
      expect(screen.getByText('CZ')).toBeInTheDocument();
      expect(screen.getByText('Pioneros en la vitivinicultura de altura en Mendoza.')).toBeInTheDocument();
      expect(screen.getAllByText(/Agrelo, Mendoza/).length).toBeGreaterThan(0);
      expect(screen.getByText('Adrianna Vineyard Malbec')).toBeInTheDocument();
    });
  });

  it('handles follow and unfollow toggle interactively', async () => {
    vi.mocked(wineryModule.followWinery).mockResolvedValue();
    vi.mocked(wineryModule.unfollowWinery).mockResolvedValue();

    render(
      <MemoryRouter initialEntries={['/bodegas/7']}>
        <Routes>
          <Route path="/bodegas/:id" element={<WineryPublicProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Catena Zapata' })).toBeInTheDocument();
    });

    const followBtn = screen.getByRole('button', { name: /Seguir bodega/i });
    fireEvent.click(followBtn);

    await waitFor(() => {
      expect(wineryModule.followWinery).toHaveBeenCalledWith(7);
      expect(screen.getByRole('button', { name: /Siguiendo/i })).toBeInTheDocument();
    });

    // Toggle unfollow
    const followingBtn = screen.getByRole('button', { name: /Siguiendo/i });
    fireEvent.click(followingBtn);

    await waitFor(() => {
      expect(wineryModule.unfollowWinery).toHaveBeenCalledWith(7);
      expect(screen.getByRole('button', { name: /Seguir bodega/i })).toBeInTheDocument();
    });
  });
});
