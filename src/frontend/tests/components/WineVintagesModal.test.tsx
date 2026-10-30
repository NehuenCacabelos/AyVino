import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WineVintagesModal from '@/features/winery/components/WineVintagesModal';
import * as wineApi from '@/features/winery/components/../api/wineApi';
import * as grapeApi from '@/features/winery/components/../api/grapeApi';
import type { WineResponseDto, WineVintageResponseDto, GrapeResponseDto } from '@/features/winery/components/../types';

vi.mock('@/features/winery/api/wineApi', () => ({
  getWineVintages: vi.fn(),
  createWineVintage: vi.fn(),
}));

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

describe('WineVintagesModal', () => {
  const mockWine: WineResponseDto = {
    id: 15,
    name: 'Malbec Reserva',
    wineryId: 1,
    wineryNameText: 'Bodega Test',
    description: 'Etiqueta insignia',
    wineType: 'Red',
    locationId: 5,
    sourceType: 'Official',
    duplicateOfWineId: null,
    averageRating: 4.5,
    reviewCount: 10,
  };

  const mockVintages: WineVintageResponseDto[] = [
    {
      id: 101,
      wineId: 15,
      year: 2021,
      alcoholContent: 14.5,
      servingTemperature: 16,
      agingAdvice: 'Guarda 5 años',
      imageUrl: 'https://images.ayvino.com/vintages/malbec-2021.jpg',
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: 4.8,
      reviewCount: 25,
      grapes: [{ grapeId: 1, percentage: 100 }],
    },
    {
      id: 102,
      wineId: 15,
      year: 2023,
      alcoholContent: 14.0,
      servingTemperature: 16,
      agingAdvice: null,
      imageUrl: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: null,
      reviewCount: 0,
      grapes: [{ grapeId: 1, percentage: 100 }],
    },
  ];

  const mockGrapes: GrapeResponseDto[] = [
    {
      id: 1,
      name: 'Malbec',
      colorType: 'Red',
      typicalBody: null,
      typicalTannins: null,
      typicalAcidity: null,
      description: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(mockVintages);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapes);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <WineVintagesModal isOpen={false} onClose={vi.fn()} wine={mockWine} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders existing vintages with correct badges', async () => {
    render(<WineVintagesModal isOpen={true} onClose={vi.fn()} wine={mockWine} />);

    expect(screen.getByText('Añadas y Cosechas')).toBeInTheDocument();
    expect(screen.getByText(/Malbec Reserva/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('2021')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.getByText('En Revisión')).toBeInTheDocument();

    const vintageImage = screen.getByAltText('Cosecha 2021');
    expect(vintageImage).toBeInTheDocument();
    expect(vintageImage.getAttribute('src')).toBe('https://images.ayvino.com/vintages/malbec-2021.jpg');
  });

  it('opens add vintage form and allows submitting a new vintage', async () => {
    vi.mocked(wineApi.createWineVintage).mockResolvedValue({
      id: 103,
      wineId: 15,
      year: 2024,
      alcoholContent: 14.0,
      servingTemperature: 16,
      agingAdvice: null,
      imageUrl: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    });

    const onVintageAddedMock = vi.fn();

    render(
      <WineVintagesModal
        isOpen={true}
        onClose={vi.fn()}
        wine={mockWine}
        onVintageAdded={onVintageAddedMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2021')).toBeInTheDocument();
    });

    const addBtn = screen.getByRole('button', { name: /Nueva cosecha/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('Registrar Nueva Cosecha')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Guardar Cosecha/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(wineApi.createWineVintage).toHaveBeenCalled();
    });
  });
});
