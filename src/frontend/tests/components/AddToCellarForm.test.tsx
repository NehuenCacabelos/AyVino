import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddToCellarForm from '@/features/cava/components/AddToCellarForm';
import * as cellarApi from '@/features/cava/api/cellarApi';
import type { CellarDto, CellarItemDto } from '@/features/users/types';

vi.mock('@/features/cava/api/cellarApi', async () => {
  const actual = await vi.importActual('@/features/cava/api/cellarApi');
  return {
    ...actual,
    getCellarsApi: vi.fn(),
    createCellarApi: vi.fn(),
    getCellarItemApi: vi.fn(),
    addCellarItemApi: vi.fn(),
    updateCellarItemApi: vi.fn(),
  };
});

describe('AddToCellarForm Component (Vista 3B)', () => {
  const mockWine = {
    wineId: 10,
    wineVintageId: 101,
    wineName: 'Gran Reserva Malbec',
    vintageYear: 2020,
    wineryName: 'Bodega Catena',
    wineType: 'Red',
    approvalStatus: 'Approved',
  };

  const sampleCellars: CellarDto[] = [
    {
      id: 1,
      userId: 42,
      name: 'Cava Principal',
      vintageCount: 5,
      bottleCount: 12,
      createdAt: '2026-01-01',
    },
    {
      id: 2,
      userId: 42,
      name: 'Heladera Vinos',
      vintageCount: 2,
      bottleCount: 4,
      createdAt: '2026-02-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders wine summary and populates cellar selector with user cellars', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce(sampleCellars);

    render(
      <AddToCellarForm
        wine={mockWine}
        defaultCellarId={2}
        onDone={vi.fn()}
      />
    );

    expect(screen.getByText('Gran Reserva Malbec')).toBeInTheDocument();
    expect(screen.getByText('Bodega Catena · 2020')).toBeInTheDocument();

    await waitFor(() => {
      const select = screen.getByLabelText('Seleccionar cava') as HTMLSelectElement;
      expect(select.value).toBe('2');
      expect(screen.getByText(/Cava Principal/)).toBeInTheDocument();
      expect(screen.getByText(/Heladera Vinos/)).toBeInTheDocument();
    });
  });

  it('when user has 0 cellars, informs automatic creation of «Mi cava» and creates it on submit', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([]);
    vi.mocked(cellarApi.createCellarApi).mockResolvedValueOnce({
      id: 99,
      userId: 42,
      name: 'Mi cava',
      vintageCount: 0,
      bottleCount: 0,
      createdAt: '2026-11-02',
    });
    vi.mocked(cellarApi.getCellarItemApi).mockRejectedValueOnce({ response: { status: 404 } });
    vi.mocked(cellarApi.addCellarItemApi).mockResolvedValueOnce({
      wineVintageId: 101,
      wineId: 10,
      name: 'Gran Reserva Malbec',
      wineType: 'Red',
      wineryId: null,
      wineryNameText: 'Bodega Catena',
      year: 2020,
      imageId: null,
      averageRating: null,
      reviewCount: 0,
      quantity: 2,
      purchaseDate: null,
      notes: null,
      lastChangeAt: '2026-11-02',
    });

    const mockOnDone = vi.fn();

    render(
      <AddToCellarForm
        wine={mockWine}
        onDone={mockOnDone}
      />
    );

    expect(
      await screen.findByText(/Se creará tu primera cava \(«Mi cava»\)/)
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Seleccionar cava')).not.toBeInTheDocument();

    const qtyInput = screen.getByRole('spinbutton');
    fireEvent.change(qtyInput, { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Guardar/i }));

    await waitFor(() => {
      expect(cellarApi.createCellarApi).toHaveBeenCalledWith({ name: 'Mi cava' });
      expect(cellarApi.addCellarItemApi).toHaveBeenCalledWith(99, {
        wineVintageId: 101,
        quantity: 2,
        purchaseDate: null,
        notes: null,
      });
      expect(mockOnDone).toHaveBeenCalledWith({
        cellarId: 99,
        cellarName: 'Mi cava',
        quantityAdded: 2,
        totalQuantity: 2,
      });
    });
  });

  it('when item already exists in cellar, sums quantity and updates with PUT', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce(sampleCellars);
    vi.mocked(cellarApi.getCellarItemApi).mockResolvedValueOnce({
      wineVintageId: 101,
      wineId: 10,
      name: 'Gran Reserva Malbec',
      wineType: 'Red',
      wineryId: null,
      wineryNameText: 'Bodega Catena',
      year: 2020,
      imageId: null,
      averageRating: 4.5,
      reviewCount: 10,
      quantity: 3,
      purchaseDate: '2026-05-01',
      notes: 'Estante superior',
      lastChangeAt: '2026-05-01',
    });
    vi.mocked(cellarApi.updateCellarItemApi).mockResolvedValueOnce({} as CellarItemDto);

    const mockOnDone = vi.fn();

    render(
      <AddToCellarForm
        wine={mockWine}
        defaultCellarId={1}
        onDone={mockOnDone}
      />
    );

    await screen.findByLabelText('Seleccionar cava');

    const qtyInput = screen.getByRole('spinbutton');
    fireEvent.change(qtyInput, { target: { value: '2' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Guardar/i }));

    await waitFor(() => {
      expect(cellarApi.updateCellarItemApi).toHaveBeenCalledWith(1, 101, {
        quantity: 5, // 3 existentes + 2 nuevos
        purchaseDate: '2026-05-01', // conserva fecha existente
        notes: 'Estante superior', // conserva nota existente
      });
      expect(mockOnDone).toHaveBeenCalledWith({
        cellarId: 1,
        cellarName: 'Cava Principal',
        quantityAdded: 2,
        totalQuantity: 5,
      });
    });
  });

  it('when POST returns 409 conflict, retries automatically by summing via PUT', async () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce(sampleCellars);
    vi.mocked(cellarApi.getCellarItemApi)
      .mockRejectedValueOnce({ response: { status: 404 } }) // Inicialmente no detectado
      .mockResolvedValueOnce({
        // En el retry post 409
        wineVintageId: 101,
        wineId: 10,
        name: 'Gran Reserva Malbec',
        wineType: 'Red',
        wineryId: null,
        wineryNameText: 'Bodega Catena',
        year: 2020,
        imageId: null,
        averageRating: null,
        reviewCount: 0,
        quantity: 1,
        purchaseDate: null,
        notes: null,
        lastChangeAt: '2026-11-02',
      });

    vi.mocked(cellarApi.addCellarItemApi).mockRejectedValueOnce({
      response: { status: 409 },
    });
    vi.mocked(cellarApi.updateCellarItemApi).mockResolvedValueOnce({} as CellarItemDto);

    const mockOnDone = vi.fn();

    render(
      <AddToCellarForm
        wine={mockWine}
        defaultCellarId={1}
        onDone={mockOnDone}
      />
    );

    await screen.findByLabelText('Seleccionar cava');

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Guardar/i }));

    await waitFor(() => {
      expect(cellarApi.addCellarItemApi).toHaveBeenCalled();
      expect(cellarApi.updateCellarItemApi).toHaveBeenCalledWith(1, 101, {
        quantity: 2, // 1 existente + 1 nuevo
        purchaseDate: null,
        notes: null,
      });
      expect(mockOnDone).toHaveBeenCalledWith({
        cellarId: 1,
        cellarName: 'Cava Principal',
        quantityAdded: 1,
        totalQuantity: 2,
      });
    });
  });

  it('shows "Sin verificar" badge when vintage is Pending', () => {
    vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([]);

    render(
      <AddToCellarForm
        wine={{ ...mockWine, approvalStatus: 'Pending' }}
        onDone={vi.fn()}
      />
    );

    expect(screen.getByText('Sin verificar')).toBeInTheDocument();
  });
});
