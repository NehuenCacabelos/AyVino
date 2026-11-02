import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineCreateModal, { type WineCreationResult } from '@/features/winery/components/WineCreateModal';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import type { GrapeResponseDto, WineryResponseDto } from '@/features/winery/types';

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryApi', () => ({
  getWineries: vi.fn(),
}));

vi.mock('@/features/winery/api/wineApi', () => ({
  createWine: vi.fn(),
  getWineVintages: vi.fn(),
  createWineVintage: vi.fn(),
  matchWine: vi.fn(),
  putMyVintageImage: vi.fn(),
  extractConflictWineExtensions: vi.fn(),
}));

vi.mock('@/features/wines/api/userVintageImageApi', () => ({
  uploadMyVintageImage: vi.fn(),
  getMyVintageImage: vi.fn(),
  deleteMyVintageImage: vi.fn(),
}));

describe('WineCreateModal - Modo Usuario (Vista 4)', () => {
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
  ];

  const mockWineries: WineryResponseDto[] = [
    {
      id: 10,
      name: 'Catena Zapata',
      prefix: null,
      cuit: '30-12345678-9',
      legalName: 'Catena Zapata S.A.',
      email: 'info@catena.com',
      phoneNumber: null,
      address: null,
      websiteUrl: null,
      status: 'Approved',
      logoImageId: null,
      bannerImageId: null,
      locationId: null,
      ownerUserId: 1,
      createdAt: '2026-01-01T00:00:00Z',
      verifiedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapes);
    vi.mocked(wineryApi.getWineries).mockResolvedValue(mockWineries);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([
      {
        id: 101,
        wineId: 50,
        year: 2021,
        alcoholContent: null,
        servingTemperature: null,
        agingAdvice: null,
        approvalStatus: 'Approved',
        uploadedByUserId: 1,
        registerDate: '2026-01-01',
        averageRating: null,
        reviewCount: 0,
        grapes: [],
      },
    ]);
  });

  const renderComponent = (props: {
    isOpen?: boolean;
    initialName?: string;
    onResolved?: (res: WineCreationResult) => void;
    onClose?: () => void;
  }) => {
    return render(
      <MemoryRouter>
        <WineCreateModal
          mode="user"
          isOpen={props.isOpen ?? true}
          onClose={props.onClose ?? vi.fn()}
          initialName={props.initialName}
          onResolved={props.onResolved ?? vi.fn()}
        />
      </MemoryRouter>
    );
  };

  it('renders with title "Cargar un vino" and empty initial values', async () => {
    renderComponent({ initialName: 'Vino Inicial' });

    expect(screen.getByText('Cargar un vino')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vino Inicial')).toBeInTheDocument();

    const wineTypeSelect = screen.getByLabelText(/Tipo de Vino/i) as HTMLSelectElement;
    expect(wineTypeSelect.value).toBe('');

    const yearInput = screen.getByLabelText(/Año de Cosecha/i) as HTMLInputElement;
    expect(yearInput.value).toBe('');
  });

  it('validates mandatory fields: name, winery and wineType without preselection', async () => {
    renderComponent({ initialName: '' });

    const submitBtn = screen.getByRole('button', { name: /Cargar vino/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('El nombre del vino es obligatorio.')).toBeInTheDocument();
    expect(await screen.findByText('La bodega es obligatoria.')).toBeInTheDocument();
    expect(await screen.findByText('Seleccioná el tipo de vino.')).toBeInTheDocument();
  });

  it('"Sin añada" checkbox disables harvest year input', async () => {
    renderComponent({ initialName: 'Blend Joven' });

    const yearInput = screen.getByLabelText(/Año de Cosecha/i) as HTMLInputElement;
    const noVintageCheck = screen.getByRole('checkbox', { name: /Sin añada/i });

    expect(yearInput).not.toBeDisabled();
    fireEvent.click(noVintageCheck);
    expect(yearInput).toBeDisabled();
  });

  it('performs live match: detects existing wine and vintage (outcome "adopted")', async () => {
    vi.mocked(wineApi.matchWine).mockResolvedValue({
      wine: { id: 77, name: 'Malbec Argentino', winery: 'Catena Zapata', type: 'Red' },
      vintage: { id: 88, year: 2020, approvalStatus: 'Approved' },
    });

    const onResolvedMock = vi.fn();
    renderComponent({ onResolved: onResolvedMock });

    // Fill fields to trigger match
    fireEvent.change(screen.getByLabelText(/Nombre del Vino/i), { target: { value: 'Malbec Argentino' } });
    fireEvent.change(screen.getByLabelText(/Bodega/i), { target: { value: 'Catena Zapata' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Vino/i), { target: { value: 'Red' } });
    fireEvent.change(screen.getByLabelText(/Año de Cosecha/i), { target: { value: '2020' } });

    // Wait for debounce and match
    await waitFor(() => {
      expect(wineApi.matchWine).toHaveBeenCalledWith(
        { name: 'Malbec Argentino', wineryName: 'Catena Zapata', wineType: 'Red', year: 2020 },
        expect.any(AbortSignal)
      );
    });

    // Button updates to "Usar este vino"
    const adoptBtn = await screen.findByRole('button', { name: /Usar este vino/i }, { timeout: 3000 });
    expect(adoptBtn).toBeInTheDocument();

    // Click adopt
    fireEvent.click(adoptBtn);

    await waitFor(() => {
      expect(onResolvedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'adopted',
          wine: { id: 77, name: 'Malbec Argentino' },
          vintageId: 88,
          photoUploaded: false,
        })
      );
    });

    expect(await screen.findByText(/Este vino ya estaba cargado: lo usamos/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('performs live match: detects wine but new vintage (outcome "vintage-added")', async () => {
    vi.mocked(wineApi.matchWine).mockResolvedValue({
      wine: { id: 77, name: 'Malbec Argentino', winery: 'Catena Zapata', type: 'Red' },
      vintage: null,
    });
    vi.mocked(wineApi.createWineVintage).mockResolvedValue({
      id: 99,
      wineId: 77,
      year: 2024,
      alcoholContent: null,
      servingTemperature: null,
      agingAdvice: null,
      approvalStatus: 'Pending',
      uploadedByUserId: 1,
      registerDate: '2026-01-01',
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    });

    const onResolvedMock = vi.fn();
    renderComponent({ onResolved: onResolvedMock });

    fireEvent.change(screen.getByLabelText(/Nombre del Vino/i), { target: { value: 'Malbec Argentino' } });
    fireEvent.change(screen.getByLabelText(/Bodega/i), { target: { value: 'Catena Zapata' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Vino/i), { target: { value: 'Red' } });
    fireEvent.change(screen.getByLabelText(/Año de Cosecha/i), { target: { value: '2024' } });

    const vintageBtn = await screen.findByRole('button', { name: /Agregar la cosecha 2024 a este vino/i }, { timeout: 3000 });
    expect(vintageBtn).toBeInTheDocument();

    fireEvent.click(vintageBtn);

    await waitFor(() => {
      expect(wineApi.createWineVintage).toHaveBeenCalledWith(77, expect.objectContaining({ year: 2024 }));
      expect(onResolvedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'vintage-added',
          wine: { id: 77, name: 'Malbec Argentino' },
          vintageId: 99,
          photoUploaded: false,
        })
      );
    });

    expect(await screen.findByText(/Se agregó la cosecha a «Malbec Argentino»/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('creates new wine when no match found (outcome "created")', async () => {
    vi.mocked(wineApi.matchWine).mockResolvedValue({
      wine: null,
      vintage: null,
    });
    vi.mocked(wineApi.createWine).mockResolvedValue({
      id: 150,
      name: 'Vino Garage',
      wineryId: null,
      wineryNameText: 'Bodega Garage',
      description: null,
      wineType: 'Red',
      locationId: null,
      sourceType: 'Community',
      duplicateOfWineId: null,
      averageRating: null,
      reviewCount: 0,
    });

    const onResolvedMock = vi.fn();
    renderComponent({ onResolved: onResolvedMock });

    fireEvent.change(screen.getByLabelText(/Nombre del Vino/i), { target: { value: 'Vino Garage' } });
    fireEvent.change(screen.getByLabelText(/Bodega/i), { target: { value: 'Bodega Garage' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Vino/i), { target: { value: 'Red' } });
    fireEvent.change(screen.getByLabelText(/Año de Cosecha/i), { target: { value: '2022' } });

    const createBtn = await screen.findByRole('button', { name: /Cargar vino/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(wineApi.createWine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Vino Garage',
          wineryNameText: 'Bodega Garage',
          wineType: 'Red',
        })
      );
      expect(onResolvedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'created',
          wine: { id: 150, name: 'Vino Garage' },
        })
      );
    });

    expect(await screen.findByText(/Queda como «Sin verificar» hasta que otros usuarios lo usen/i)).toBeInTheDocument();
  });

  it('handles 409 conflict during createWine by automatically adopting existing vintage', async () => {
    vi.mocked(wineApi.matchWine).mockResolvedValue({ wine: null, vintage: null });

    const conflictErr = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: 'Ya existe un vino con características idénticas.',
          existingWineId: 200,
          existingVintageId: 300,
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(conflictErr);
    vi.mocked(wineApi.extractConflictWineExtensions).mockReturnValue({
      existingWineId: 200,
      existingVintageId: 300,
    });

    const onResolvedMock = vi.fn();
    renderComponent({ onResolved: onResolvedMock });

    fireEvent.change(screen.getByLabelText(/Nombre del Vino/i), { target: { value: 'Vino Duplicado' } });
    fireEvent.change(screen.getByLabelText(/Bodega/i), { target: { value: 'Bodega Test' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Vino/i), { target: { value: 'Red' } });
    fireEvent.change(screen.getByLabelText(/Año de Cosecha/i), { target: { value: '2020' } });

    const createBtn = await screen.findByRole('button', { name: /Cargar vino/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(onResolvedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'adopted',
          wine: { id: 200, name: 'Vino Duplicado' },
          vintageId: 300,
          photoUploaded: false,
        })
      );
    });
  });

  it('warns when photo upload fails without rolling back wine creation', async () => {
    vi.mocked(wineApi.matchWine).mockResolvedValue({
      wine: { id: 77, name: 'Malbec Argentino', winery: 'Catena Zapata', type: 'Red' },
      vintage: { id: 88, year: 2020, approvalStatus: 'Approved' },
    });
    vi.mocked(wineApi.putMyVintageImage).mockRejectedValue(new Error('Upload failed'));

    renderComponent({});

    fireEvent.change(screen.getByLabelText(/Nombre del Vino/i), { target: { value: 'Malbec Argentino' } });
    fireEvent.change(screen.getByLabelText(/Bodega/i), { target: { value: 'Catena Zapata' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Vino/i), { target: { value: 'Red' } });
    fireEvent.change(screen.getByLabelText(/Año de Cosecha/i), { target: { value: '2020' } });

    // Attach mock file
    const file = new File(['dummy'], 'botella.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const adoptBtn = await screen.findByRole('button', { name: /Usar este vino/i }, { timeout: 3000 });
    fireEvent.click(adoptBtn);

    expect(
      await screen.findByText(/El vino se cargó pero la foto no se pudo subir; podés agregarla desde la ficha/i, {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });
});
