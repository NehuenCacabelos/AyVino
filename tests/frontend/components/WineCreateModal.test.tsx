import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WineCreateModal from '@/features/winery/components/WineCreateModal';
import * as grapeApi from '@/features/winery/components/../api/grapeApi';
import * as wineApi from '@/features/winery/components/../api/wineApi';
import type { GrapeResponseDto, WineResponseDto } from '@/features/winery/components/../types';

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/winery/api/wineApi', () => ({
  createWine: vi.fn(),
}));

describe('WineCreateModal', () => {
  const mockGrapes: GrapeResponseDto[] = [
    {
      id: 1,
      name: 'Malbec',
      colorType: 'Red',
      typicalBody: 'Full',
      typicalTannins: 'Medium',
      typicalAcidity: 'Medium',
      description: 'Cepa insignia',
    },
    {
      id: 2,
      name: 'Cabernet Franc',
      colorType: 'Red',
      typicalBody: 'Medium',
      typicalTannins: 'Medium',
      typicalAcidity: 'High',
      description: 'Elegante',
    },
    {
      id: 3,
      name: 'Chardonnay',
      colorType: 'White',
      typicalBody: 'Medium',
      typicalTannins: null,
      typicalAcidity: 'Medium',
      description: 'Fresco',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapes);
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <WineCreateModal
        isOpen={false}
        onClose={vi.fn()}
        wineryId={1}
        locationId={5}
        onWineCreated={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders form and loads grapes catalog when isOpen is true', async () => {
    render(
      <WineCreateModal
        isOpen={true}
        onClose={vi.fn()}
        wineryId={10}
        locationId={5}
        onWineCreated={vi.fn()}
      />
    );

    expect(screen.getByText('Nueva Etiqueta Oficial')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Gran Reserva Malbec/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });
  });

  it('validates that wine name is required on submit', async () => {
    render(
      <WineCreateModal
        isOpen={true}
        onClose={vi.fn()}
        wineryId={10}
        locationId={5}
        onWineCreated={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El nombre del vino es obligatorio.')).toBeInTheDocument();
  });

  it('submits valid wine and triggers onWineCreated', async () => {
    const mockCreatedWine: WineResponseDto = {
      id: 99,
      name: 'Gran Malbec Reserva',
      wineryId: 10,
      wineryNameText: 'Bodega Test',
      description: 'Gran exponente del terruño mendocino',
      wineType: 'Red',
      locationId: 5,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: null,
      reviewCount: 0,
    };

    vi.mocked(wineApi.createWine).mockResolvedValue(mockCreatedWine);
    const onWineCreatedMock = vi.fn();

    render(
      <WineCreateModal
        isOpen={true}
        onClose={vi.fn()}
        wineryId={10}
        locationId={5}
        onWineCreated={onWineCreatedMock}
      />
    );

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    // Enter name
    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i);
    fireEvent.change(nameInput, { target: { value: 'Gran Malbec Reserva' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(wineApi.createWine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Gran Malbec Reserva',
          wineryId: 10,
          locationId: 5,
          wineType: 'Red',
        })
      );
      expect(onWineCreatedMock).toHaveBeenCalledWith(mockCreatedWine);
    });
  });
});
