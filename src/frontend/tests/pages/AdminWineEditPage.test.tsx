import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminWineEditPage from '@/pages/AdminWineEditPage';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as reviewsApi from '@/features/wines/api/reviewsApi';
import type { WineResponseDto, WineVintageResponseDto, WineryResponseDto } from '@/features/winery';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'admin_master', role: 'Admin' },
  }),
}));

vi.mock('@/features/winery/api/wineApi');
vi.mock('@/features/winery/api/wineryApi');
vi.mock('@/features/winery/api/wineryWinePairingsApi');
vi.mock('@/features/winery/api/grapeApi');
vi.mock('@/features/wines/api/reviewsApi');
vi.mock('@/features/wines/api/sensoryApi', () => ({
  getVintageSensory: vi.fn().mockResolvedValue({
    axes: [
      { key: 'body', value: 4.0, source: 'Calculated', calculatedValue: 4.0 },
      { key: 'tannins', value: 3.5, source: 'Calculated', calculatedValue: 3.5 },
      { key: 'acidity', value: 3.0, source: 'Calculated', calculatedValue: 3.0 },
      { key: 'fruit', value: null, source: 'None', calculatedValue: null },
      { key: 'oak', value: null, source: 'None', calculatedValue: null },
      { key: 'persistence', value: null, source: 'None', calculatedValue: null },
    ],
  }),
  updateVintageSensory: vi.fn().mockResolvedValue(undefined),
  previewSensory: vi.fn().mockResolvedValue({ axes: [] }),
}));

describe('AdminWineEditPage (Bloque 10)', () => {
  const mockWinery: WineryResponseDto = {
    id: 10,
    name: 'Bodega Bianchi',
    description: 'Bodega tradicional.',
    locationId: 1,
    foundationYear: 1928,
    website: 'https://bodegasbianchi.com.ar',
    userId: 2,
    status: 'Approved',
    registerDate: '2020-01-01T00:00:00Z',
    location: { stateName: 'Mendoza', regionName: 'San Rafael' },
  };

  const mockOfficialWine: WineResponseDto = {
    id: 101,
    wineryId: 10,
    wineryNameText: 'Bodega Bianchi',
    name: 'Enzo Bianchi Gran Corte',
    description: 'Vino oficial.',
    wineType: 'Red',
    locationId: 1,
    sourceType: 'Official',
    duplicateOfWineId: null,
    averageRating: 4.8,
    reviewCount: 5,
  };

  const mockCommunityWine: WineResponseDto = {
    id: 202,
    wineryId: null,
    wineryNameText: 'Finca Artesanal Sur',
    name: 'Malbec de Garaje',
    description: 'Edición comunitaria sin bodega asociada.',
    wineType: 'Red',
    locationId: null,
    sourceType: 'Community',
    duplicateOfWineId: null,
    averageRating: 4.2,
    reviewCount: 2,
  };

  const mockVintages: WineVintageResponseDto[] = [
    {
      id: 301,
      wineId: 101,
      year: 2021,
      alcoholContent: 14.5,
      servingTemperature: 16,
      agingAdvice: '10 años.',
      approvalStatus: 'Approved',
      uploadedByUserId: 2,
      registerDate: '2025-01-01T00:00:00Z',
      grapes: [{ grapeId: 1, percentage: 100 }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(mockVintages);
    vi.mocked(wineryApi.getWineryById).mockResolvedValue(mockWinery);
    vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([]);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValue([]);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([{ id: 1, name: 'Malbec', colorType: 'Red' }]);
    vi.mocked(reviewsApi.getWineReviews).mockResolvedValue([]);
    vi.mocked(wineApi.updateWine).mockResolvedValue(mockOfficialWine);
    vi.mocked(wineApi.updateWineVintage).mockResolvedValue(mockVintages[0]);
  });

  it('permite al admin ver y editar un vino oficial sin guarda de bodega y con enlace de retorno a /admin/vinos', async () => {
    vi.mocked(wineApi.getWineById).mockResolvedValue(mockOfficialWine);

    render(
      <MemoryRouter initialEntries={['/admin/vinos/101']}>
        <Routes>
          <Route path="/admin/vinos/:wineId" element={<AdminWineEditPage />} />
          <Route path="/admin/vinos" element={<div>Listado Admin Vinos</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Enzo Bianchi Gran Corte' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: /acceso denegado/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver a explorar/i })).toHaveAttribute('href', '/admin/vinos');

    const editBtn = screen.getByRole('button', { name: /editar vino/i });
    fireEvent.click(editBtn);

    const nameInput = screen.getByDisplayValue('Enzo Bianchi Gran Corte');
    fireEvent.change(nameInput, { target: { value: 'Enzo Bianchi Gran Corte Editado' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar edición/i }));

    await waitFor(() => {
      expect(wineApi.updateWine).toHaveBeenCalledWith(101, expect.objectContaining({
        name: 'Enzo Bianchi Gran Corte Editado',
        wineType: 'Red',
        wineryId: 10,
      }));
    });
  });

  it('funciona con vinos comunitarios (wineryId null) preservando wineryNameText al editar', async () => {
    vi.mocked(wineApi.getWineById).mockResolvedValue(mockCommunityWine);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([
      { ...mockVintages[0], id: 401, wineId: 202 },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin/vinos/202']}>
        <Routes>
          <Route path="/admin/vinos/:wineId" element={<AdminWineEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Malbec de Garaje' })).toBeInTheDocument();
    });

    expect(wineryApi.getWineryById).not.toHaveBeenCalled();
    expect(screen.getAllByText('Finca Artesanal Sur').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /editar vino/i }));
    fireEvent.change(screen.getByDisplayValue('Malbec de Garaje'), {
      target: { value: 'Malbec de Garaje Corregido' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar edición/i }));

    await waitFor(() => {
      expect(wineApi.updateWine).toHaveBeenCalledWith(202, expect.objectContaining({
        name: 'Malbec de Garaje Corregido',
        wineryId: undefined,
        wineryNameText: 'Finca Artesanal Sur',
      }));
    });
  });

  it('si el vino no existe (404), el botón Volver al catálogo apunta a /admin/vinos', async () => {
    vi.mocked(wineApi.getWineById).mockRejectedValue({
      response: { status: 404, data: { message: 'Not found' } },
    });

    render(
      <MemoryRouter initialEntries={['/admin/vinos/999']}>
        <Routes>
          <Route path="/admin/vinos/:wineId" element={<AdminWineEditPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /etiqueta no encontrada/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /volver al catálogo/i })).toHaveAttribute('href', '/admin/vinos');
  });
});
