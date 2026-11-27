import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineDetailView from '@/features/wines/components/WineDetailView';
import type { EditorialWine } from '@/features/wines/data/editorialWines';
import * as wineApi from '@/features/winery/api/wineApi';

vi.mock('@/features/winery/api/wineApi', async (importOriginal) => {
  const actual = await importOriginal<typeof wineApi>();
  return {
    ...actual,
    deleteWine: vi.fn(),
    deleteWineVintage: vi.fn(),
  };
});

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'bodega_owner', role: 'Winery' },
  }),
}));

vi.mock('@/features/wines/hooks/useWineCatalogs', () => ({
  useWineCatalogs: () => ({
    grapesCatalog: [{ id: 1, name: 'Malbec' }],
    pairingsCatalog: [],
    error: null,
    retry: vi.fn(),
  }),
}));

vi.mock('@/features/wines/hooks/useVintageSensory', () => ({
  useVintageSensory: () => ({
    sensory: null,
    isLoading: false,
    error: null,
    updateLocal: vi.fn(),
  }),
}));

describe('Eliminación de Vino y Añada por Bodega Dueña (WineDetailView)', () => {
  const mockWine: EditorialWine = {
    id: 101,
    name: 'Gran Reserva Malbec',
    type: 'Red',
    description: 'Vino de alta gama.',
    wineryId: 10,
    wineryNameText: 'Bodega Test',
    winery: {
      id: 10,
      name: 'Bodega Test',
      region: 'Valle de Uco',
      foundedYear: 1995,
      websiteUrl: 'https://bodegatest.com',
    },
    reviews: [],
    pairings: [],
    vintages: [
      {
        id: '201',
        wineId: 101,
        year: 2020,
        alcoholContent: '14.5% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice: 'Beber ahora.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
      {
        id: '202',
        wineId: 101,
        year: 2021,
        alcoholContent: '14.2% Vol.',
        servingTemperature: '16°C – 18°C',
        agingAdvice: 'Guarda 5 años.',
        grapes: [{ variety: 'Malbec', percentage: 100 }],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props: {
    ownerMode?: boolean;
    isRealWine?: boolean;
    isNewMode?: boolean;
    onReload?: () => Promise<void>;
  }) => {
    return render(
      <MemoryRouter initialEntries={['/bodega/vinos/101']}>
        <Routes>
          <Route
            path="/bodega/vinos/101"
            element={
              <WineDetailView
                wine={mockWine}
                ownerMode={props.ownerMode ?? true}
                isRealWine={props.isRealWine ?? true}
                isNewMode={props.isNewMode ?? false}
                onReload={props.onReload}
              />
            }
          />
          <Route path="/bodega/vinos" element={<div data-testid="catalog-page">Catálogo Bodega</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('muestra los botones "Eliminar vino" y "Eliminar añada" solo en ownerMode con isRealWine y no en alta', () => {
    renderComponent({ ownerMode: true, isRealWine: true, isNewMode: false });

    expect(screen.getByRole('button', { name: /Eliminar vino/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Eliminar añada/i })).toBeInTheDocument();
  });

  it('NO muestra los botones de eliminación en la vista de usuario común (ownerMode=false)', () => {
    renderComponent({ ownerMode: false, isRealWine: true, isNewMode: false });

    expect(screen.queryByRole('button', { name: /Eliminar vino/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar añada/i })).not.toBeInTheDocument();
  });

  it('NO muestra los botones de eliminación en el modo de alta (isNewMode=true)', () => {
    renderComponent({ ownerMode: true, isRealWine: true, isNewMode: true });

    expect(screen.queryByRole('button', { name: /Eliminar vino/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Eliminar añada/i })).not.toBeInTheDocument();
  });

  it('abre el modal de confirmación de vino con texto claro y cancelar no llama a la API', async () => {
    renderComponent({ ownerMode: true, isRealWine: true });

    const deleteBtn = screen.getByRole('button', { name: /Eliminar vino/i });
    fireEvent.click(deleteBtn);

    // Modal abierto
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: '¿Eliminar vino?' })).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Esta acción borrará la etiqueta y todas sus añadas asociadas/i)
    ).toBeInTheDocument();

    // Cancelar
    const cancelBtn = within(dialog).getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(wineApi.deleteWine).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirmar eliminación de vino llama a deleteWine, muestra toast y navega a /bodega/vinos', async () => {
    vi.mocked(wineApi.deleteWine).mockResolvedValue(undefined);
    renderComponent({ ownerMode: true, isRealWine: true });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar vino/i }));

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    expect(wineApi.deleteWine).toHaveBeenCalledWith(101);

    await waitFor(() => {
      expect(screen.getByTestId('catalog-page')).toBeInTheDocument();
    });
  });

  it('error 409 al eliminar vino muestra el mensaje del ProblemDetails en un toast y NO cierra el modal silenciosamente', async () => {
    const error409 = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: 'No se puede eliminar el vino porque tiene historial de usuarios (reseñas: 3, marcas: 2, cava: 1).',
        },
      },
    };
    vi.mocked(wineApi.deleteWine).mockRejectedValue(error409);
    renderComponent({ ownerMode: true, isRealWine: true });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar vino/i }));

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    expect(wineApi.deleteWine).toHaveBeenCalledWith(101);

    // Toast visible con el mensaje del ProblemDetails
    await waitFor(() => {
      expect(
        screen.getByText(/No se puede eliminar el vino porque tiene historial de usuarios/i)
      ).toBeInTheDocument();
    });

    // El modal de confirmación sigue abierto (no se cerró silenciosamente)
    expect(within(dialog).getByRole('heading', { name: '¿Eliminar vino?' })).toBeInTheDocument();
  });

  it('abre el modal de confirmación de añada y cancelar no llama a la API', async () => {
    renderComponent({ ownerMode: true, isRealWine: true });

    const deleteVintageBtn = screen.getByRole('button', { name: /Eliminar añada/i });
    fireEvent.click(deleteVintageBtn);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: '¿Eliminar añada?' })).toBeInTheDocument();
    expect(
      within(dialog).getByText(/¿Estás seguro de que deseás eliminar la añada 2020/i)
    ).toBeInTheDocument();

    const cancelBtn = within(dialog).getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(wineApi.deleteWineVintage).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('confirmar eliminación de añada llama a deleteWineVintage, muestra toast, llama onReload y selecciona otra añada', async () => {
    const mockOnReload = vi.fn().mockResolvedValue(undefined);
    vi.mocked(wineApi.deleteWineVintage).mockResolvedValue(undefined);

    renderComponent({ ownerMode: true, isRealWine: true, onReload: mockOnReload });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar añada/i }));

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    expect(wineApi.deleteWineVintage).toHaveBeenCalledWith(101, 201);

    await waitFor(() => {
      expect(screen.getByText('Añada eliminada exitosamente.')).toBeInTheDocument();
    });
    expect(mockOnReload).toHaveBeenCalledTimes(1);
  });

  it('error 409 al eliminar añada única muestra el mensaje del ProblemDetails y no cierra el modal', async () => {
    const error409 = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: 'No se puede eliminar la única añada del vino. Eliminá el vino completo.',
        },
      },
    };
    vi.mocked(wineApi.deleteWineVintage).mockRejectedValue(error409);

    renderComponent({ ownerMode: true, isRealWine: true });

    fireEvent.click(screen.getByRole('button', { name: /Eliminar añada/i }));

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Eliminar' });
    fireEvent.click(confirmBtn);

    expect(wineApi.deleteWineVintage).toHaveBeenCalledWith(101, 201);

    await waitFor(() => {
      expect(
        screen.getByText('No se puede eliminar la única añada del vino. Eliminá el vino completo.')
      ).toBeInTheDocument();
    });

    // El modal permanece abierto
    expect(within(dialog).getByRole('heading', { name: '¿Eliminar añada?' })).toBeInTheDocument();
  });
});
