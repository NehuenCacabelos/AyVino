import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineryWineDetailPage from '@/pages/WineryWineDetailPage';
import * as wineryModule from '@/features/winery';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as reviewsApi from '@/features/wines/api/reviewsApi';
import type { UseMyWineryReturn, WineResponseDto, WineVintageResponseDto, WineryResponseDto } from '@/features/winery';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'donpedro', role: 'Winery' },
  }),
}));

vi.mock('@/features/winery', async (importOriginal) => {
  const actual = await importOriginal<typeof wineryModule>();
  return {
    ...actual,
    useWinery: vi.fn(),
  };
});

vi.mock('@/features/winery/api/wineApi');
vi.mock('@/features/winery/api/wineryApi');
vi.mock('@/features/winery/api/wineryWinePairingsApi');
vi.mock('@/features/winery/api/grapeApi');
vi.mock('@/features/winery/api/imageApi');
vi.mock('@/features/wines/api/reviewsApi');

describe('Modo Editar Vino (Paso 2)', () => {
  const mockMyWinery: WineryResponseDto = {
    id: 10,
    name: 'Bodega Bianchi',
    description: 'Tradición sanrafaelina.',
    locationId: 1,
    foundationYear: 1928,
    website: 'https://bodegasbianchi.com.ar',
    userId: 1,
    status: 'Approved',
    registerDate: new Date('2020-01-01'),
    location: {
      stateName: 'Mendoza',
      regionName: 'San Rafael',
    },
  };

  const mockUseWineryReturn: UseMyWineryReturn = {
    winery: mockMyWinery,
    isLoading: false,
    error: null,
    isNotFound: false,
    isPending: false,
    isApproved: true,
    isRejected: false,
    reload: vi.fn().mockResolvedValue(undefined),
    updateLocalWinery: vi.fn(),
  };

  const mockOwnerWine: WineResponseDto = {
    id: 101,
    wineryId: 10,
    wineryNameText: 'Bodega Bianchi',
    name: 'Enzo Bianchi Gran Corte',
    description: 'Vino ícono de corte mendocino.',
    wineType: 'Red',
    locationId: 1,
    sourceType: 'Official',
    duplicateOfWineId: null,
    averageRating: 4.8,
    reviewCount: 42,
  };

  const mockOwnerVintages: WineVintageResponseDto[] = [
    {
      id: 201,
      wineId: 101,
      year: 2020,
      alcoholContent: 14.5,
      servingTemperature: 16,
      agingAdvice: 'Conservar en lugar oscuro hasta 2035.',
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: new Date('2026-01-10T10:00:00Z'),
      averageRating: 4.8,
      reviewCount: 30,
      grapes: [
        { grapeId: 1, percentage: 70 },
        { grapeId: 2, percentage: 30 },
      ],
    },
  ];

  const mockGrapesCatalog = [
    { id: 1, name: 'Malbec', colorType: 'Red' },
    { id: 2, name: 'Cabernet Sauvignon', colorType: 'Red' },
    { id: 3, name: 'Merlot', colorType: 'Red' },
  ];

  const mockPairingsList = [
    { id: 1, name: 'Chivito a las brasas', category: 'Meat' },
    { id: 2, name: 'Trucha patagónica', category: 'Fish' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryModule.useWinery).mockReturnValue(mockUseWineryReturn);
    vi.mocked(wineApi.getWineById).mockResolvedValue(mockOwnerWine);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(mockOwnerVintages);
    vi.mocked(wineryApi.getWineryById).mockResolvedValue(mockMyWinery);
    vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([mockPairingsList[0]]);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValue(mockPairingsList);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapesCatalog);
    vi.mocked(reviewsApi.getWineReviews).mockResolvedValue([]);
    vi.mocked(wineApi.updateWine).mockResolvedValue(mockOwnerWine);
    vi.mocked(wineApi.updateWineVintage).mockResolvedValue(mockOwnerVintages[0]);
    vi.mocked(wineApi.createWineVintage).mockResolvedValue({
      ...mockOwnerVintages[0],
      id: 202,
      year: 2021,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/bodega/vinos/101']}>
        <Routes>
          <Route path="/bodega/vinos/:wineId" element={<WineryWineDetailPage />} />
          <Route path="/bodega/vinos" element={<div>Vista Catálogo</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('muestra el botón "Editar vino" al final de la columna del formulario y al activarlo habilita los campos con Cancelar y Guardar edición', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Enzo Bianchi Gran Corte' })).toBeInTheDocument();
    });

    const editBarBtn = screen.getByRole('button', { name: /Editar vino/i });
    expect(editBarBtn).toBeInTheDocument();
    expect(editBarBtn.closest('aside')).toHaveAttribute('role', 'toolbar');

    fireEvent.click(editBarBtn);

    // Ahora los campos son editables
    expect(await screen.findByDisplayValue('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vino ícono de corte mendocino.')).toBeInTheDocument();
    const saveBtn = screen.getByRole('button', { name: /Guardar edición/i });
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    expect(saveBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();
    expect(saveBtn.closest('aside')).toHaveAttribute('role', 'toolbar');

    // Botones con texto sin "+" duplicado
    expect(screen.getByRole('button', { name: 'Agregar uva' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Añada' })).toBeInTheDocument();
  });

  it('permite modificar nombre, tipo, descripción y recalcula el perfil sensorial en vivo', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar vino/i }));

    const nameInput = await screen.findByDisplayValue('Enzo Bianchi Gran Corte');
    fireEvent.change(nameInput, { target: { value: 'Enzo Bianchi Gran Corte Modificado' } });

    const typeSelect = screen.getByLabelText(/Seleccionar tipo de vino/i);
    const options = screen.getAllByRole('option');
    const optionLabels = options.map((o) => o.textContent);
    expect(optionLabels).toContain('Tinto');
    expect(optionLabels).toContain('Blanco');
    expect(optionLabels).toContain('Rosado');
    expect(optionLabels).toContain('Espumoso');
    expect(optionLabels).toContain('Naranjo');
    expect(optionLabels).not.toContain('Tinto Noble');

    fireEvent.change(typeSelect, { target: { value: 'Orange' } });

    // Perfil sensorial se recalcula en vivo con los atributos de White/Orange (Cuerpo 3.2, etc.)
    expect(screen.getByText('3.2')).toBeInTheDocument();
  });

  it('gestiona uvas en el corte: agrega con 0 visible y valida que sumen 100%', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar vino/i }));

    // Esperar a que el catálogo de uvas esté cargado en los selects
    await waitFor(() => {
      expect(screen.getAllByRole('option', { name: /Merlot/i }).length).toBeGreaterThan(0);
    });

    const addGrapeBtn = screen.getByRole('button', { name: /Agregar uva/i });
    fireEvent.click(addGrapeBtn);

    // Seleccionamos la cepa para la nueva fila (para que pase la validación de cepa vacía)
    const selects = screen.getAllByLabelText('Seleccionar uva');
    fireEvent.change(selects[selects.length - 1], { target: { value: '3' } });

    // Al agregar entra con 0 visible y la suma se desbalancea (70 + 30 + 0 = 100, pero tiene 0%)
    const saveBtn = screen.getByRole('button', { name: /Guardar edición/i });
    fireEvent.click(saveBtn);

    // Rechaza el guardado si hay un cero o no suma 100%
    await waitFor(() => {
      expect(
        screen.getAllByText(/Completá el porcentaje de cada uva y asegurate de que sumen 100%/i).length
      ).toBeGreaterThanOrEqual(1);
    });
    expect(wineApi.updateWine).not.toHaveBeenCalled();
  });

  it('permite agregar y quitar maridajes abriendo el panel flotante de catálogo', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar vino/i }));

    // Quitar maridaje existente
    const removeBtn = screen.getByLabelText(/Quitar maridaje Chivito a las brasas/i);
    fireEvent.click(removeBtn);
    expect(screen.queryByLabelText(/Quitar maridaje Chivito a las brasas/i)).not.toBeInTheDocument();

    // Abrir panel "Agregar"
    const addPairingBtn = screen.getByRole('button', { name: 'Agregar' });
    fireEvent.click(addPairingBtn);

    // Catálogo visible
    expect(await screen.findByText('Catálogo de Maridajes')).toBeInTheDocument();
    const truchaBtn = screen.getByRole('button', { name: /Trucha patagónica/i });
    fireEvent.click(truchaBtn);

    // Ahora Trucha patagónica está en los chips
    expect(screen.getByLabelText(/Quitar maridaje Trucha patagónica/i)).toBeInTheDocument();
  });

  it('guarda exitosamente calculando cambios y ejecutando la secuencia de APIs', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar vino/i }));

    const nameInput = await screen.findByDisplayValue('Enzo Bianchi Gran Corte');
    fireEvent.change(nameInput, { target: { value: 'Enzo Bianchi Gran Corte 2020' } });

    const saveBtn = screen.getByRole('button', { name: /Guardar edición/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(wineApi.updateWine).toHaveBeenCalledWith(101, expect.objectContaining({
        name: 'Enzo Bianchi Gran Corte 2020',
      }));
    });

    expect(await screen.findByText('¡Edición guardada exitosamente!')).toBeInTheDocument();
  });

  it('maneja 409 WINE_VINTAGE_DUPLICATE mostrando mensaje claro y manteniendo el modo edición', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_VINTAGE_DUPLICATE',
          detail: 'Ya existe la cosecha 2020 para esta etiqueta.',
        },
      },
    };
    vi.mocked(wineApi.updateWineVintage).mockRejectedValue(error409);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar vino/i }));

    const saveBtn = screen.getByRole('button', { name: /Guardar edición/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ya registraste la cosecha 2020 para esta etiqueta/i)).toBeInTheDocument();
    });

    // Modo edición permanece activo
    expect(screen.getByRole('button', { name: /Guardar edición/i })).toBeInTheDocument();
  });

  it('pide confirmación al cancelar con cambios', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Enzo Bianchi Gran Corte')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Editar vino/i }));

    const nameInput = await screen.findByDisplayValue('Enzo Bianchi Gran Corte');
    fireEvent.change(nameInput, { target: { value: 'Cambio sin guardar' } });

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(confirmSpy).toHaveBeenCalled();
    // Como confirm devolvió false, sigue en edición
    expect(screen.getByRole('button', { name: /Guardar edición/i })).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
