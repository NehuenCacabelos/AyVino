import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineDetailView from '@/features/wines/components/WineDetailView';
import * as sensoryApi from '@/features/wines/api/sensoryApi';
import * as wineApi from '@/features/winery/api/wineApi';
import type { EditorialWine } from '@/features/wines/data/editorialWines';
import type { WineResponseDto, WineVintageResponseDto } from '@/features/winery';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 10, username: 'bodeguero', role: 'Winery' },
  }),
}));

vi.mock('@/features/wines/api/sensoryApi', () => ({
  getVintageSensory: vi.fn(),
  updateVintageSensory: vi.fn(),
  previewSensory: vi.fn(),
}));

vi.mock('@/features/winery/api/wineApi', () => ({
  createWine: vi.fn(),
  updateWine: vi.fn(),
  getWineVintages: vi.fn(),
  createWineVintage: vi.fn(),
  updateWineVintage: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryWinePairingsApi', () => ({
  getWinePairings: vi.fn().mockResolvedValue([]),
  getPairingsCatalog: vi.fn().mockResolvedValue([]),
  addWinePairing: vi.fn().mockResolvedValue(undefined),
  removeWinePairing: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn().mockResolvedValue([
    { id: 1, name: 'Malbec', colorType: 'Red' },
    { id: 2, name: 'Cabernet Franc', colorType: 'Red' },
  ]),
}));

vi.mock('@/features/winery/api/imageApi', () => ({
  uploadVintageImage: vi.fn().mockResolvedValue({ id: 'img-1', url: 'https://img.test' }),
  deleteVintageImage: vi.fn().mockResolvedValue(undefined),
}));

const mockWine: EditorialWine = {
  id: '101',
  name: 'Malbec Reserva',
  winery: {
    id: '10',
    name: 'Bodega Test',
    wineryId: 10,
    region: 'Mendoza',
    country: 'Argentina',
  },
  type: 'Red',
  description: 'Un gran vino tinto.',
  region: 'Mendoza',
  country: 'Argentina',
  imageUrl: 'https://test.com/bottle.png',
  vintages: [
    {
      id: '201',
      wineId: '101',
      year: 2021,
      alcoholContent: '14.5% Vol.',
      servingTemperature: '16°C – 18°C',
      agingAdvice: '8 a 10 años.',
      grapes: [{ variety: 'Malbec', percentage: 100 }],
    },
  ],
  pairings: [],
  reviews: [],
};

const mockRawVintages: WineVintageResponseDto[] = [
  {
    id: 201,
    wineId: 101,
    year: 2021,
    alcoholContent: 14.5,
    servingTemperature: 16,
    agingAdvice: '8 a 10 años.',
    approvalStatus: 'Approved',
    uploadedByUserId: 10,
    registerDate: '2021-01-01',
    grapes: [{ grapeId: 1, percentage: 100 }],
  },
];

describe('SensoryProfileInteraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sensoryApi.getVintageSensory).mockResolvedValue({
      axes: [
        { key: 'body', value: 4.0, source: 'Calculated', calculatedValue: 4.0 },
        { key: 'tannins', value: 4.0, source: 'Calculated', calculatedValue: 4.0 },
        { key: 'acidity', value: 3.0, source: 'Calculated', calculatedValue: 3.0 },
        { key: 'fruit', value: null, source: 'None', calculatedValue: null },
        { key: 'oak', value: null, source: 'None', calculatedValue: null },
        { key: 'persistence', value: null, source: 'None', calculatedValue: null },
      ],
    });
  });

  it('el control deslizante actualiza el valor y muestra el botón Restablecer', async () => {
    render(
      <MemoryRouter>
        <WineDetailView
          wine={mockWine}
          isRealWine={true}
          ownerMode={true}
          rawVintages={mockRawVintages}
        />
      </MemoryRouter>
    );

    // Entramos en modo edición
    const editBtn = await screen.findByRole('button', { name: /editar vino/i });
    fireEvent.click(editBtn);

    // Buscamos el control deslizante de Cuerpo
    const bodySlider = screen.getByLabelText(/ajustar cuerpo/i);
    expect(bodySlider).toBeInTheDocument();

    // Modificamos el valor de Cuerpo a 3.7
    fireEvent.change(bodySlider, { target: { value: '3.7' } });

    // El valor visible 3.7 debe aparecer
    expect(screen.getByText('3.7')).toBeInTheDocument();

    // Debe aparecer el botón "Restablecer" para Cuerpo
    const resetButtons = screen.getAllByRole('button', { name: /restablecer/i });
    expect(resetButtons.length).toBeGreaterThanOrEqual(1);

    // Al presionar Restablecer, se limpia el valor manual
    fireEvent.click(resetButtons[0]);

    // El botón Restablecer desaparece para ese eje
    expect(screen.queryByRole('button', { name: /restablecer/i })).toBeNull();
  });

  it('guarda el perfil sensorial solo cuando hay cambios manuales', async () => {
    render(
      <MemoryRouter>
        <WineDetailView
          wine={mockWine}
          isRealWine={true}
          ownerMode={true}
          rawVintages={mockRawVintages}
        />
      </MemoryRouter>
    );

    // Entramos en modo edición
    const editBtn = await screen.findByRole('button', { name: /editar vino/i });
    fireEvent.click(editBtn);

    // Caso 1: guardamos SIN modificar el perfil sensorial
    vi.mocked(wineApi.updateWineVintage).mockResolvedValue({} as unknown as WineVintageResponseDto);
    const saveBtn = screen.getByRole('button', { name: /guardar edición/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(wineApi.updateWineVintage).toHaveBeenCalled();
    });

    // No debe haberse llamado a updateVintageSensory
    expect(sensoryApi.updateVintageSensory).not.toHaveBeenCalled();

    // Caso 2: modificamos un atributo y guardamos
    fireEvent.click(screen.getByRole('button', { name: /editar vino/i }));
    const fruitSlider = screen.getByLabelText(/ajustar fruta/i);
    fireEvent.change(fruitSlider, { target: { value: '4.5' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar edición/i }));

    await waitFor(() => {
      expect(sensoryApi.updateVintageSensory).toHaveBeenCalledWith(
        101,
        201,
        expect.objectContaining({
          fruit: 4.5,
        })
      );
    });
  });

  it('previsualiza con espera de 400ms y cancela petición anterior', async () => {
    vi.mocked(sensoryApi.previewSensory).mockResolvedValue({
      axes: [
        { key: 'body', value: 4.2, source: 'Calculated', calculatedValue: 4.2 },
        { key: 'tannins', value: 4.2, source: 'Calculated', calculatedValue: 4.2 },
        { key: 'acidity', value: 3.5, source: 'Calculated', calculatedValue: 3.5 },
        { key: 'fruit', value: null, source: 'None', calculatedValue: null },
        { key: 'oak', value: null, source: 'None', calculatedValue: null },
        { key: 'persistence', value: null, source: 'None', calculatedValue: null },
      ],
    });

    render(
      <MemoryRouter>
        <WineDetailView
          wine={mockWine}
          isRealWine={true}
          ownerMode={true}
          rawVintages={mockRawVintages}
        />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole('button', { name: /editar vino/i }));

    // Inmediatamente no se disparó sin cambios en blend
    expect(sensoryApi.previewSensory).not.toHaveBeenCalled();

    // Modificamos el blend agregando una uva
    const addGrapeBtn = screen.getByRole('button', { name: /agregar uva/i });
    fireEvent.click(addGrapeBtn);

    const selects = screen.getAllByRole('combobox', { name: /seleccionar uva/i });
    fireEvent.change(selects[selects.length - 1], { target: { value: '2' } });

    // Esperamos que pasen los 400ms del debounce
    await waitFor(
      () => {
        expect(sensoryApi.previewSensory).toHaveBeenCalled();
      },
      { timeout: 1500 }
    );
  });

  it('publicación nueva: maneja fallo parcial del perfil sensorial sin romper la creación', async () => {
    vi.mocked(wineApi.createWine).mockResolvedValue({ id: 505 } as unknown as WineResponseDto);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([
      { id: 601, wineId: 505, year: 2022 } as unknown as WineVintageResponseDto,
    ]);
    vi.mocked(sensoryApi.updateVintageSensory).mockRejectedValue(new Error('Network error'));

    const emptyWine: EditorialWine = {
      ...mockWine,
      id: '',
      name: '',
      vintages: [],
    };

    render(
      <MemoryRouter>
        <WineDetailView wine={emptyWine} isNewMode={true} ownerMode={true} />
      </MemoryRouter>
    );

    // Completamos campos obligatorios
    fireEvent.change(screen.getByPlaceholderText(/ej\.: gran reserva malbec/i), {
      target: { value: 'Nuevo Vino Gran Corte' },
    });
    fireEvent.change(screen.getByPlaceholderText(/ej\.: 2020/i), {
      target: { value: '2022' },
    });

    // Ajustamos perfil sensorial manual
    const bodySlider = screen.getByLabelText(/ajustar cuerpo/i);
    fireEvent.change(bodySlider, { target: { value: '4.6' } });

    // Publicamos
    const publishBtn = screen.getByRole('button', { name: /publicar etiqueta/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(wineApi.createWine).toHaveBeenCalled();
      expect(sensoryApi.updateVintageSensory).toHaveBeenCalled();
      // Muestra el mensaje claro de fallo parcial
      expect(screen.getByText(/se creó el vino, pero no se pudo guardar el perfil sensorial/i)).toBeInTheDocument();
    });
  });
});
