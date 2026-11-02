import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TechnicalSheetModal from '@/features/cava/components/TechnicalSheetModal';
import * as cellarApi from '@/features/cava/api/cellarApi';
import type { CellarWine } from '@/features/cava/types';

vi.mock('@/features/cava/api/cellarApi', async () => {
  const actual = await vi.importActual<typeof cellarApi>('@/features/cava/api/cellarApi');
  return {
    ...actual,
    updateCellarItemApi: vi.fn(),
    deleteCellarItemApi: vi.fn(),
  };
});

describe('TechnicalSheetModal Component (Vista 3A: Ficha de Botella)', () => {
  const sampleWine: CellarWine = {
    id: '10-101',
    cellarId: 10,
    wineId: 55,
    wineVintageId: 101,
    name: 'Cobos Bramare Malbec',
    winery: 'Viña Cobos',
    vintage: 2019,
    rating: 4.8,
    units: 3,
    bottle: 'red-burgundy',
    imageUrl: 'http://test/img.png',
    purchaseDate: '2023-11-20',
    notes: 'Guardar para festejo',
    isJewel: true,
  };

  const sampleWineWithoutOptionalData: CellarWine = {
    id: '10-102',
    cellarId: 10,
    wineId: 56,
    wineVintageId: 102,
    name: 'Vino Sin Datos',
    winery: 'Bodega Desconocida',
    vintage: null, // Sin añada
    rating: null, // Sin rating
    units: 1,
    bottle: 'white',
    isJewel: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: {
    wine: CellarWine | null;
    onClose?: () => void;
    onBottleUpdated?: () => void;
    onBottleRemoved?: () => void;
  }) => {
    return render(
      <MemoryRouter>
        <TechnicalSheetModal
          wine={props.wine}
          onClose={props.onClose ?? vi.fn()}
          onBottleUpdated={props.onBottleUpdated ?? vi.fn()}
          onBottleRemoved={props.onBottleRemoved ?? vi.fn()}
        />
      </MemoryRouter>
    );
  };

  it('renders technical sheet with real score over 5, vitals and link to /vinos/:wineId', () => {
    renderComponent({ wine: sampleWine });

    expect(screen.getByRole('heading', { name: 'Cobos Bramare Malbec' })).toBeInTheDocument();
    expect(screen.getByText('4,8')).toBeInTheDocument();
    expect(screen.getByText('★')).toBeInTheDocument();
    expect(screen.getByText('3 botellas')).toBeInTheDocument();
    expect(screen.getByText('2023-11-20')).toBeInTheDocument();
    expect(screen.getByText('Guardar para festejo')).toBeInTheDocument();

    // Link to wine sheet
    const link = screen.getByRole('link', { name: /Ver ficha del vino/i });
    expect(link).toHaveAttribute('href', '/vinos/55');

    // Descorche is enabled (Vista 6)
    const uncorkBtn = screen.getByRole('button', { name: /Registrar Cata \/ Descorchar/i });
    expect(uncorkBtn).toBeEnabled();
  });

  it('hides missing fields and shows "Sin añada" when optional data is null', () => {
    renderComponent({ wine: sampleWineWithoutOptionalData });

    expect(screen.getByRole('heading', { name: 'Vino Sin Datos' })).toBeInTheDocument();
    expect(screen.getByText('Sin añada')).toBeInTheDocument();

    // No rating rendered
    expect(screen.queryByText('★')).not.toBeInTheDocument();

    // No notes rendered
    expect(screen.queryByText(/Mis Notas de Cava/i)).not.toBeInTheDocument();
  });

  it('opens edit modal and saves updated quantity, purchase date, and notes', async () => {
    const onBottleUpdatedMock = vi.fn();
    vi.mocked(cellarApi.updateCellarItemApi).mockResolvedValueOnce({
      wineVintageId: 101,
      wineId: 55,
      name: 'Cobos Bramare Malbec',
      wineType: 'Red',
      quantity: 5,
      purchaseDate: '2024-01-15',
      notes: 'Notas editadas',
      reviewCount: 0,
      lastChangeAt: '2026-01-01',
    });

    renderComponent({ wine: sampleWine, onBottleUpdated: onBottleUpdatedMock });

    fireEvent.click(screen.getByRole('button', { name: /Editar botella/i }));

    expect(await screen.findByRole('heading', { name: 'Editar botella en cava' })).toBeInTheDocument();

    const quantityInput = screen.getByDisplayValue('3');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    const notesInput = screen.getByDisplayValue('Guardar para festejo');
    fireEvent.change(notesInput, { target: { value: 'Notas editadas' } });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(cellarApi.updateCellarItemApi).toHaveBeenCalledWith(10, 101, {
        quantity: 5,
        purchaseDate: '2023-11-20',
        notes: 'Notas editadas',
      });
      expect(onBottleUpdatedMock).toHaveBeenCalled();
    });
  });

  it('confirms and deletes bottle from cellar', async () => {
    const onBottleRemovedMock = vi.fn();
    const onCloseMock = vi.fn();
    vi.mocked(cellarApi.deleteCellarItemApi).mockResolvedValueOnce();

    renderComponent({
      wine: sampleWine,
      onBottleRemoved: onBottleRemovedMock,
      onClose: onCloseMock,
    });

    fireEvent.click(screen.getByRole('button', { name: /Quitar de mi cava/i }));

    expect(await screen.findByRole('heading', { name: '¿Quitar de tu cava?' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quitar de la cava' }));

    await waitFor(() => {
      expect(cellarApi.deleteCellarItemApi).toHaveBeenCalledWith(10, 101);
      expect(onBottleRemovedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
