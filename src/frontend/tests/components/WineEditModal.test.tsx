import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WineEditModal from '@/features/winery/components/WineEditModal';
import * as wineApi from '@/features/winery/api/wineApi';
import type { WineryCatalogWineDto } from '@/features/winery/types/catalog';
import type { RegionPickerProps } from '@/features/winery/components/RegionPicker';

vi.mock('@/features/winery/api/wineApi', () => ({
  updateWine: vi.fn(),
}));

vi.mock('@/features/winery/components/RegionPicker', () => ({
  default: ({ onChange }: RegionPickerProps) => (
    <div data-testid="mock-region-picker">
      <button
        type="button"
        data-testid="select-location-btn"
        onClick={() =>
          onChange({
            mode: 'manual',
            locationId: 99,
            regionName: 'San Rafael',
            stateName: 'Mendoza',
          })
        }
      >
        Seleccionar Terruño
      </button>
    </div>
  ),
}));

describe('WineEditModal', () => {
  const mockWine: WineryCatalogWineDto = {
    id: 42,
    name: 'Gran Reserva Malbec',
    description: 'Notas frutales y madera',
    wineType: 'Red',
    sourceType: 'Official',
    averageRating: 4.8,
    reviewCount: 30,
    vintages: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <WineEditModal
        isOpen={false}
        onClose={vi.fn()}
        wine={mockWine}
        wineryId={10}
        onWineUpdated={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('muestra el campo de bodega en solo lectura con el nombre de la bodega', () => {
    render(
      <WineEditModal
        isOpen={true}
        onClose={vi.fn()}
        wine={mockWine}
        wineryId={10}
        wineryName="Bodega El Terruño"
        onWineUpdated={vi.fn()}
      />
    );

    const wineryInput = screen.getByLabelText(/Bodega/i);
    expect(wineryInput).toBeDisabled();
    expect(wineryInput).toHaveValue('Bodega El Terruño');
  });

  it('permite modificar la ubicación reutilizando RegionPicker y envía el locationId seleccionado', async () => {
    vi.mocked(wineApi.updateWine).mockResolvedValue({
      id: 42,
      name: 'Gran Reserva Malbec Modificado',
      wineryId: 10,
      wineryNameText: 'Bodega El Terruño',
      description: 'Notas frutales y madera',
      wineType: 'Red',
      locationId: 99,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.8,
      reviewCount: 30,
    });

    const onWineUpdatedMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <WineEditModal
        isOpen={true}
        onClose={onCloseMock}
        wine={mockWine}
        wineryId={10}
        locationId={5}
        onWineUpdated={onWineUpdatedMock}
      />
    );

    // Cambiar nombre
    const nameInput = screen.getByLabelText(/Nombre de la etiqueta/i);
    fireEvent.change(nameInput, { target: { value: 'Gran Reserva Malbec Modificado' } });

    // Seleccionar terruño en RegionPicker
    const selectLocationBtn = screen.getByTestId('select-location-btn');
    fireEvent.click(selectLocationBtn);

    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(wineApi.updateWine).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          name: 'Gran Reserva Malbec Modificado',
          wineryId: 10,
          locationId: 99,
        })
      );
      expect(onWineUpdatedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('muestra mensaje claro cuando el backend responde 403 Forbidden', async () => {
    const error403 = {
      isAxiosError: true,
      response: {
        status: 403,
        data: {
          detail: 'No tenés permisos para modificar esta etiqueta oficial.',
        },
      },
    };

    vi.mocked(wineApi.updateWine).mockRejectedValue(error403);

    render(
      <WineEditModal
        isOpen={true}
        onClose={vi.fn()}
        wine={mockWine}
        wineryId={10}
        onWineUpdated={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('No tenés permisos para modificar esta etiqueta oficial.')
    ).toBeInTheDocument();
  });
});
