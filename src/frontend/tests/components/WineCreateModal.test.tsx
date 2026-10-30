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

  it('initializes grape percentage as empty and disallows selecting duplicated grapes', async () => {
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

    // Check first grape row: Malbec with empty percentage
    const pctInput = screen.getByPlaceholderText('%') as HTMLInputElement;
    expect(pctInput.value).toBe('');

    // Add second grape row
    const addGrapeBtn = screen.getByRole('button', { name: /Agregar uva/i });
    fireEvent.click(addGrapeBtn);

    const selects = screen.getAllByRole('combobox');
    // selects[0] is WineType, selects[1] is first grape, selects[2] is second grape
    const secondGrapeSelect = selects[2] as HTMLSelectElement;

    // Second grape select must NOT contain Malbec (id: 1) since it is selected in row 1
    const options = Array.from(secondGrapeSelect.options).map((opt) => opt.textContent);
    expect(options.some((o) => o?.includes('Malbec'))).toBe(false);
    expect(options.some((o) => o?.includes('Cabernet Franc'))).toBe(true);
  });

  it('renders editorial message when grapes catalog is empty', async () => {
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([]);

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

    expect(
      screen.getByText('Todavía no hay uvas cargadas en el catálogo oficial.')
    ).toBeInTheDocument();
  });

  it('validates blend percentages when sum exceeds 100%', async () => {
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

    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i);
    fireEvent.change(nameInput, { target: { value: 'Gran Malbec Reserva' } });

    // Set first grape percentage to 70
    const pctInput = screen.getByPlaceholderText('%');
    fireEvent.change(pctInput, { target: { value: '70' } });

    // Add second grape
    const addGrapeBtn = screen.getByRole('button', { name: /Agregar uva/i });
    fireEvent.click(addGrapeBtn);

    // Set second grape percentage to 40 (sum = 110%)
    const pctInputs = screen.getAllByPlaceholderText('%');
    fireEvent.change(pctInputs[1], { target: { value: '40' } });

    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('La suma del corte (110%) no puede superar el 100%.')
    ).toBeInTheDocument();
  });
});
