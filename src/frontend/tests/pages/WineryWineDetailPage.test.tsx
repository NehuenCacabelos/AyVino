import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineryWineDetailPage from '@/pages/WineryWineDetailPage';
import * as wineryModule from '@/features/winery';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as reviewsApi from '@/features/wines/api/reviewsApi';
import type { UseMyWineryReturn, WineResponseDto, WineVintageResponseDto, WineryResponseDto } from '@/features/winery';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'donpedro', role: 'Winery' },
  }),
}));

vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<typeof wineryModule>();
  return {
    ...actual,
    useWinery: vi.fn(),
  };
});

vi.mock('@/features/winery/api/wineApi');
vi.mock('@/features/winery/api/wineryApi');
vi.mock('@/features/winery/api/wineryWinePairingsApi');
vi.mock('@/features/winery/api/grapeApi');
vi.mock('@/features/wines/api/reviewsApi');

describe('WineryWineDetailPage (ownerMode)', () => {
  const mockMyWinery: WineryResponseDto = {
    id: 10,
    name: 'Bodega Bianchi',
    description: 'Tradición sanrafaelina.',
    locationId: 1,
    foundationYear: 1928,
    website: 'https://bodegasbianchi.com.ar',
    userId: 1,
    status: 'Approved',
    registerDate: new Date('2020-01-01'),
    location: {
      stateName: 'Mendoza',
      regionName: 'San Rafael',
    },
  };

  const mockUseWineryReturn: UseMyWineryReturn = {
    winery: mockMyWinery,
    isLoading: false,
    error: null,
    isNotFound: false,
    isPending: false,
    isApproved: true,
    isRejected: false,
    reload: vi.fn().mockResolvedValue(undefined),
    updateLocalWinery: vi.fn(),
  };

  const mockOwnerWine: WineResponseDto = {
    id: 101,
    wineryId: 10,
    wineryNameText: 'Bodega Bianchi',
    name: 'Enzo Bianchi Gran Corte',
    description: 'Vino ícono de corte mendocino.',
    wineType: 'Red',
    locationId: 1,
    sourceType: 'Official',
    duplicateOfWineId: null,
    averageRating: 4.8,
    reviewCount: 42,
  };

  const mockOwnerVintages: WineVintageResponseDto[] = [
    {
      id: 201,
      wineId: 101,
      year: 2020,
      alcoholContent: 14.5,
      servingTemperature: 16,
      agingAdvice: 'Conservar en lugar oscuro hasta 2035.',
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: new Date('2026-01-10T10:00:00Z'),
      averageRating: 4.8,
      reviewCount: 30,
      grapes: [
        { grapeId: 1, percentage: 70 },
        { grapeId: 2, percentage: 30 },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryModule.useWinery).mockReturnValue(mockUseWineryReturn);
    vi.mocked(wineApi.getWineById).mockResolvedValue(mockOwnerWine);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(mockOwnerVintages);
    vi.mocked(wineryApi.getWineryById).mockResolvedValue(mockMyWinery);
    vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([
      { id: 1, name: 'Chivito a las brasas', category: 'Meat' },
    ]);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([
      { id: 1, name: 'Malbec', colorType: 'Red' },
      { id: 2, name: 'Cabernet Sauvignon', colorType: 'Red' },
    ]);
    vi.mocked(reviewsApi.getWineReviews).mockResolvedValue([]);
  });

  const renderComponent = (wineId = '101') => {
    return render(
      <MemoryRouter initialEntries={[`/bodega/vinos/${wineId}`]}>
        <Routes>
          <Route path="/bodega/vinos/:wineId" element={<WineryWineDetailPage />} />
          <Route path="/bodega/vinos" element={<div>Vista Catálogo</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renderiza la plantilla en modo dueño con el botón "Guardar en cava" deshabilitado', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Enzo Bianchi Gran Corte' })).toBeInTheDocument();
    });

    // Guardar en cava debe estar deshabilitado con título explicativo
    const cellarBtn = screen.getByRole('button', { name: /Guardar en cava/i });
    expect(cellarBtn).toBeDisabled();
    expect(cellarBtn).toHaveAttribute(
      'title',
      'No podés guardar tus propios vinos en tu cava personal'
    );
    expect(cellarBtn).toHaveClass('cursor-not-allowed');

    // La bodega dueña ve la valoración y datos reales
    expect(screen.getAllByText('Bodega Bianchi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('San Rafael, Mendoza')).toBeInTheDocument();
    expect(screen.getByText('Chivito a las brasas')).toBeInTheDocument();
  });

  it('muestra acceso denegado si la etiqueta pertenece a otra bodega distinta a la del usuario', async () => {
    const foreignWine: WineResponseDto = {
      ...mockOwnerWine,
      wineryId: 999, // Otra bodega
    };
    vi.mocked(wineApi.getWineById).mockResolvedValue(foreignWine);

    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Acceso denegado/i })).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Esta etiqueta enológica pertenece a otra bodega/i)
    ).toBeInTheDocument();
  });

  it('muestra 404 amable si la etiqueta no existe', async () => {
    const error404 = {
      response: { status: 404, data: { message: 'Not found' } },
    };
    vi.mocked(wineApi.getWineById).mockRejectedValue(error404);

    renderComponent('999');

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Etiqueta no encontrada/i })).toBeInTheDocument();
    });
  });
});
