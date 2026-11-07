import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WineVintagesModal from '@/features/winery/components/WineVintagesModal';
import * as wineApi from '@/features/winery/api/wineApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import type { WineResponseDto, WineVintageResponseDto, GrapeResponseDto } from '@/features/winery/types';

vi.mock('@/features/winery/api/wineApi', () => ({
  getWineVintages: vi.fn(),
  createWineVintage: vi.fn(),
  updateWineVintage: vi.fn(),
}));

vi.mock('@/features/winery/api/imageApi', () => ({
  uploadVintageImage: vi.fn(),
  deleteVintageImage: vi.fn(),
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
    {
      id: 2,
      name: 'Cabernet Franc',
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

  it('permite abrir el formulario de edicion para una cosecha especifica', async () => {
    render(<WineVintagesModal isOpen={true} onClose={vi.fn()} wine={mockWine} />);

    await waitFor(() => {
      expect(screen.getByText('2021')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    expect(editButtons.length).toBeGreaterThan(0);

    // Clic en editar la primera cosecha (2021)
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Editar Cosecha 2021')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2021')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14.5')).toBeInTheDocument();
  });

  it('guarda la cosecha editada enviando los valores completos a updateWineVintage', async () => {
    vi.mocked(wineApi.updateWineVintage).mockResolvedValue({
      ...mockVintages[0],
      alcoholContent: 15.0,
      agingAdvice: 'Guarda extendida 8 años',
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

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    // Modificar graduación alcohólica
    const alcInput = screen.getByDisplayValue('14.5');
    fireEvent.change(alcInput, { target: { value: '15.0' } });

    // Modificar consejo de guarda
    const adviceInput = screen.getByDisplayValue('Guarda 5 años');
    fireEvent.change(adviceInput, { target: { value: 'Guarda extendida 8 años' } });

    const saveChangesBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(saveChangesBtn);

    await waitFor(() => {
      expect(wineApi.updateWineVintage).toHaveBeenCalledWith(
        15,
        101,
        expect.objectContaining({
          Year: 2021,
          AlcoholContent: 15.0,
          ServingTemperature: 16,
          AgingAdvice: 'Guarda extendida 8 años',
        })
      );
      expect(wineApi.getWineVintages).toHaveBeenCalledTimes(2);
      expect(onVintageAddedMock).toHaveBeenCalled();
    });
  });

  it('muestra mensaje claro cuando el backend responde 409 por año duplicado al editar', async () => {
    const error409 = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: 'WINE_VINTAGE_DUPLICATE',
          detail: 'Ya existe la cosecha 2023 para esta etiqueta.',
        },
      },
    };

    vi.mocked(wineApi.updateWineVintage).mockRejectedValue(error409);

    render(<WineVintagesModal isOpen={true} onClose={vi.fn()} wine={mockWine} />);

    await waitFor(() => {
      expect(screen.getByText('2021')).toBeInTheDocument();
    });

    // Editar cosecha 2021
    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    // Cambiar año a 2023 (que ya existe)
    const yearInput = screen.getByDisplayValue('2021');
    fireEvent.change(yearInput, { target: { value: '2023' } });

    const saveChangesBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(saveChangesBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Ya existe una cosecha con el año 2023 para esta etiqueta.')
      ).toBeInTheDocument();
    });
  });

  it('valida que las uvas en edicion sumen 100% y no contengan valores en 0%', async () => {
    render(<WineVintagesModal isOpen={true} onClose={vi.fn()} wine={mockWine} />);

    await waitFor(() => {
      expect(screen.getByText('2021')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    // Agregar una segunda uva (entra con 0%)
    const addGrapeBtn = screen.getByRole('button', { name: /\+ Cepa/i });
    fireEvent.click(addGrapeBtn);

    const saveChangesBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(saveChangesBtn);

    expect(
      await screen.findByText('Completá el porcentaje de cada uva y asegurate de que sumen 100%')
    ).toBeInTheDocument();
  });
});
