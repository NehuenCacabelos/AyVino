import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineCreateModal from '@/features/winery/components/WineCreateModal';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as wineApi from '@/features/winery/api/wineApi';
import type { GrapeResponseDto, WineResponseDto } from '@/features/winery/types';

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/winery/api/wineApi', () => ({
  createWine: vi.fn(),
  getWineVintages: vi.fn().mockResolvedValue([]),
  createWineVintage: vi.fn(),
  getWineById: vi.fn(),
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

  const renderModal = (props: {
    isOpen?: boolean;
    onClose?: () => void;
    onWineCreated?: (w: WineResponseDto) => void;
  } = {}) =>
    render(
      <MemoryRouter>
        <WineCreateModal
          isOpen={props.isOpen ?? true}
          onClose={props.onClose ?? vi.fn()}
          wineryId={10}
          locationId={5}
          onWineCreated={props.onWineCreated ?? vi.fn()}
        />
      </MemoryRouter>
    );

  it('renders nothing when isOpen is false', () => {
    const { container } = renderModal({ isOpen: false });
    expect(container.firstChild).toBeNull();
  });

  it('renders form and loads grapes catalog when isOpen is true', async () => {
    renderModal();

    expect(screen.getByText('Nueva Etiqueta Oficial')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Gran Reserva Malbec/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });
  });

  it('validates that wine name is required on submit', async () => {
    renderModal();

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El nombre del vino es obligatorio.')).toBeInTheDocument();
  });

  it('la primera uva entra con 100% y la siguiente con 0% visible', async () => {
    renderModal();

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    // Primera fila de uva (Malbec) con 100%
    const pctInput = screen.getByPlaceholderText('%') as HTMLInputElement;
    expect(pctInput.value).toBe('100');

    // Agregar segunda uva
    const addGrapeBtn = screen.getByRole('button', { name: /Agregar uva/i });
    fireEvent.click(addGrapeBtn);

    const pctInputs = screen.getAllByPlaceholderText('%') as HTMLInputElement[];
    expect(pctInputs.length).toBe(2);
    expect(pctInputs[1].value).toBe('0');
  });

  it('rechaza el envio con mensaje exacto si una uva esta en 0% o la suma no es 100%', async () => {
    renderModal();

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i);
    fireEvent.change(nameInput, { target: { value: 'Gran Malbec Reserva' } });

    // Agregar segunda uva (queda en 0%)
    const addGrapeBtn = screen.getByRole('button', { name: /Agregar uva/i });
    fireEvent.click(addGrapeBtn);

    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText('Completá el porcentaje de cada uva y asegurate de que sumen 100%')
    ).toBeInTheDocument();
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
    const onCloseMock = vi.fn();

    renderModal({ onWineCreated: onWineCreatedMock, onClose: onCloseMock });

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i);
    fireEvent.change(nameInput, { target: { value: 'Gran Malbec Reserva' } });

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
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('maneja 409 WINE_VINTAGE_DUPLICATE mostrando mensaje y enlace de gestion', async () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: 'WINE_VINTAGE_DUPLICATE',
          detail: 'Ya existe el vino en esta bodega con esa cosecha',
          existingWineId: 45,
          existingVintageId: 12,
        },
      },
    };

    vi.mocked(wineApi.createWine).mockRejectedValue(error);

    renderModal();

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i);
    fireEvent.change(nameInput, { target: { value: 'Malbec Reserva 2022' } });

    const yearInput = screen.getByPlaceholderText('2022');
    fireEvent.change(yearInput, { target: { value: '2022' } });

    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Ya registraste este vino con la cosecha 2022.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Gestionar vino/i })).toHaveAttribute(
        'href',
        '/bodega/vinos/45'
      );
    });
  });

  it('maneja 409 WINE_EXISTS_ADD_VINTAGE abriendo ConfirmDialog y llamando a createWineVintage al confirmar', async () => {
    const duplicateWineError = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          existingWineId: 88,
        },
      },
    };

    const mockAddedVintage = {
      id: 301,
      wineId: 88,
      year: 2024,
      alcoholContent: 14,
      servingTemperature: 16,
      agingAdvice: null,
      approvalStatus: 'Approved' as const,
      averageRating: null,
      reviewCount: 0,
      registerDate: '2026-01-01',
      grapes: [{ grapeId: 1, grapeName: 'Malbec', percentage: 100 }],
    };

    const mockUpdatedWine: WineResponseDto = {
      id: 88,
      name: 'Cabernet Franc Reserva',
      wineryId: 10,
      wineryNameText: 'Bodega Test',
      description: null,
      wineType: 'Red',
      locationId: 5,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: null,
      reviewCount: 0,
    };

    vi.mocked(wineApi.createWine).mockRejectedValue(duplicateWineError);
    vi.mocked(wineApi.createWineVintage).mockResolvedValue(mockAddedVintage);
    vi.mocked(wineApi.getWineById).mockResolvedValue(mockUpdatedWine);

    const onWineCreatedMock = vi.fn();
    const onCloseMock = vi.fn();

    renderModal({ onWineCreated: onWineCreatedMock, onClose: onCloseMock });

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i);
    fireEvent.change(nameInput, { target: { value: 'Cabernet Franc Reserva' } });

    const yearInput = screen.getByPlaceholderText('2022');
    fireEvent.change(yearInput, { target: { value: '2024' } });

    const submitBtn = screen.getByRole('button', { name: /Publicar Etiqueta/i });
    fireEvent.click(submitBtn);

    // Debe abrir el ConfirmDialog
    await waitFor(() => {
      expect(
        screen.getByText(
          'Ya tenés «Cabernet Franc Reserva» en tu catálogo. ¿Querés agregar la cosecha 2024 a ese vino?'
        )
      ).toBeInTheDocument();
    });

    // Confirmar adición de cosecha
    const confirmBtn = screen.getByRole('button', { name: /Agregar cosecha/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(wineApi.createWineVintage).toHaveBeenCalledWith(
        88,
        expect.objectContaining({
          year: 2024,
          grapes: expect.arrayContaining([
            expect.objectContaining({ grapeId: 1, percentage: 100 }),
          ]),
        })
      );
      expect(onWineCreatedMock).toHaveBeenCalledWith(mockUpdatedWine);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('limpia el formulario al cerrar mediante el boton Cancelar', async () => {
    const onCloseMock = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <WineCreateModal
          isOpen={true}
          onClose={onCloseMock}
          wineryId={10}
          locationId={5}
          onWineCreated={vi.fn()}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(grapeApi.getGrapes).toHaveBeenCalled();
    });

    const nameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Vino a Descartar' } });
    expect(nameInput.value).toBe('Vino a Descartar');

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalled();

    // Al volver a abrir (rerender con isOpen=true) debe haberse reseteado
    rerender(
      <MemoryRouter>
        <WineCreateModal
          isOpen={true}
          onClose={onCloseMock}
          wineryId={10}
          locationId={5}
          onWineCreated={vi.fn()}
        />
      </MemoryRouter>
    );

    const freshNameInput = screen.getByPlaceholderText(/Gran Reserva Malbec/i) as HTMLInputElement;
    expect(freshNameInput.value).toBe('');
  });
});
