import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineryClaimPage from '../WineryClaimPage';
import * as wineryModule from '../../features/winery';
import type { WineResponseDto, UseMyWineryReturn } from '../../features/winery';

vi.mock('../../features/winery', async (importOriginal) => {
  const actual = await importOriginal<typeof wineryModule>();
  return {
    ...actual,
    useWinery: vi.fn(),
    getClaimCandidates: vi.fn(),
    claimWines: vi.fn(),
  };
});

describe('WineryClaimPage', () => {
  const mockApprovedWinery = {
    id: 10,
    name: 'Bodega Trapiche',
    locationId: 1,
    status: 'Approved' as const,
    registerDate: '2026-01-01',
    description: null,
    foundationYear: null,
    website: null,
    userId: 1,
  };

  const mockPendingWinery = {
    ...mockApprovedWinery,
    status: 'Pending' as const,
  };

  const createMockUseWinery = (winery: typeof mockApprovedWinery | typeof mockPendingWinery): UseMyWineryReturn => ({
    winery,
    isLoading: false,
    error: null,
    isNotFound: false,
    isPending: winery.status === 'Pending',
    isApproved: winery.status === 'Approved',
    isRejected: false,
    reload: vi.fn().mockResolvedValue(undefined),
    updateLocalWinery: vi.fn(),
  });

  const mockCandidates: WineResponseDto[] = [
    {
      id: 201,
      name: 'Trapiche Medalla Malbec',
      wineryId: null,
      wineryNameText: 'Trapiche',
      description: 'Cargado por usuario sommelier',
      wineType: 'Red',
      locationId: 1,
      sourceType: 'Community',
      duplicateOfWineId: null,
      averageRating: 4.6,
      reviewCount: 15,
    },
    {
      id: 202,
      name: 'Trapiche Puro Malbec',
      wineryId: null,
      wineryNameText: 'Bodega Trapiche',
      description: 'Sin madera',
      wineType: 'Red',
      locationId: 1,
      sourceType: 'Community',
      duplicateOfWineId: null,
      averageRating: 4.2,
      reviewCount: 8,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders warning banner and disabled actions when winery is pending', () => {
    vi.mocked(wineryModule.useWinery).mockReturnValue(createMockUseWinery(mockPendingWinery));

    render(
      <MemoryRouter>
        <WineryClaimPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Función disponible al certificar tu cuenta')).toBeInTheDocument();
  });

  it('renders candidate bottles and handles selection and claim submission when approved', async () => {
    vi.mocked(wineryModule.useWinery).mockReturnValue(createMockUseWinery(mockApprovedWinery));
    vi.mocked(wineryModule.getClaimCandidates).mockResolvedValue(mockCandidates);
    vi.mocked(wineryModule.claimWines).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WineryClaimPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Trapiche Medalla Malbec')).toBeInTheDocument();
      expect(screen.getByText('Trapiche Puro Malbec')).toBeInTheDocument();
    });

    // Select all candidates
    const selectAllBtn = screen.getByRole('button', { name: /Seleccionar todos/i });
    fireEvent.click(selectAllBtn);

    // Click claim button
    const claimBtn = screen.getByRole('button', { name: /Reclamar \(2\)/i });
    fireEvent.click(claimBtn);

    await waitFor(() => {
      expect(wineryModule.claimWines).toHaveBeenCalledWith(10, {
        wineIds: [201, 202],
      });
      expect(
        screen.getByText(/¡Excelente! Se certificaron 2 vinos para tu bodega/i)
      ).toBeInTheDocument();
    });
  });
});
