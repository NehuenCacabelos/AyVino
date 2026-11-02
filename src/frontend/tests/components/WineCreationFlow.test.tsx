import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineCreationFlow from '@/features/wines/components/WineCreationFlow';
import type { WineCreationResult } from '@/features/winery/components/WineCreateModal';

// Mock de WineCreateModal
vi.mock('@/features/winery/components/WineCreateModal', () => {
  return {
    default: ({
      isOpen,
      onClose,
      onResolved,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onResolved: (result: WineCreationResult) => void;
      onResolvedBehavior?: string;
    }) => {
      if (!isOpen) return null;
      return (
        <div data-testid="mock-wine-create-modal">
          <button type="button" onClick={onClose}>
            Cancelar Creación
          </button>
          <button
            type="button"
            onClick={() =>
              onResolved({
                outcome: 'created',
                wine: { id: 10, name: 'Malbec del Valle' },
                vintageId: 100,
                photoUploaded: false,
                winery: 'Bodega Andina',
                wineType: 'Red',
                year: 2021,
                personalImageId: null,
              })
            }
          >
            Simular Vino Creado
          </button>
          <button
            type="button"
            onClick={() =>
              onResolved({
                outcome: 'adopted',
                wine: { id: 20, name: 'Cabernet Franc Reserva' },
                vintageId: 200,
                photoUploaded: false,
                winery: 'Bodega Salentein',
                wineType: 'Red',
                year: null,
                personalImageId: 'adopted-img-uuid',
              })
            }
          >
            Simular Vino Adoptado
          </button>
          <button
            type="button"
            onClick={() =>
              onResolved({
                outcome: 'vintage-added',
                wine: { id: 30, name: 'Chardonnay Gran Reserva' },
                vintageId: 300,
                photoUploaded: false,
                winery: 'Catena Zapata',
                wineType: 'White',
                year: 2023,
                personalImageId: null,
              })
            }
          >
            Simular Cosecha Agregada
          </button>
        </div>
      );
    },
  };
});

// Mock de UncorkDialog
vi.mock('@/features/dashboard/components/UncorkDialog', () => {
  return {
    default: ({
      wine,
      onClose,
      onDone,
    }: {
      wine: { wineId: number; name: string } | null;
      onClose: () => void;
      onDone?: () => void;
    }) => {
      if (!wine) return null;
      return (
        <div data-testid="mock-uncork-dialog">
          <span>Descorchando: {wine.name}</span>
          <button type="button" onClick={onClose}>
            Cancelar Descorche
          </button>
          <button type="button" onClick={() => onDone?.()}>
            Confirmar Descorche
          </button>
        </div>
      );
    },
  };
});

// Mock de AddToCellarForm
vi.mock('@/features/cava/components/AddToCellarForm', () => {
  return {
    default: ({
      wine,
      onDone,
      onCancel,
    }: {
      wine: { wineName: string };
      onDone: (res: { cellarId: number; cellarName: string; quantityAdded: number; totalQuantity: number }) => void;
      onCancel?: () => void;
    }) => {
      return (
        <div data-testid="mock-add-to-cellar-form">
          <span>Agregando a cava: {wine.wineName}</span>
          <button type="button" onClick={onCancel}>
            Cancelar Cava
          </button>
          <button
            type="button"
            onClick={() =>
              onDone({
                cellarId: 55,
                cellarName: 'Cava Principal',
                quantityAdded: 2,
                totalQuantity: 6,
              })
            }
          >
            Guardar en Cava
          </button>
        </div>
      );
    },
  };
});

describe('WineCreationFlow Coordinator Component (Vista 8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia en paso crear con WineCreateModal visible', () => {
    const handleClose = vi.fn();
    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    expect(screen.getByTestId('mock-wine-create-modal')).toBeInTheDocument();
  });

  it('avanza al paso "Elegir" al resolver vino nuevo y muestra tarjeta con 3 opciones', async () => {
    const handleClose = vi.fn();
    const handleWineCreated = vi.fn();

    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} onWineCreated={handleWineCreated} />
      </MemoryRouter>
    );

    // Simular creación de vino
    fireEvent.click(screen.getByText('Simular Vino Creado'));

    expect(handleWineCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        outcome: 'created',
        wine: { id: 10, name: 'Malbec del Valle' },
      })
    );

    // Modal de elección
    expect(screen.getByText('¿Lo vas a tomar o lo agregás a tu cava?')).toBeInTheDocument();
    expect(screen.getByText('Malbec del Valle')).toBeInTheDocument();
    expect(screen.getByText('Bodega Andina')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();

    // 3 botones
    expect(screen.getByRole('button', { name: /lo voy a tomar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /agregar a mi cava/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ahora no' })).toBeInTheDocument();
  });

  it('muestra el aviso "Este vino ya estaba cargado" cuando el resultado es adopted', async () => {
    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simular Vino Adoptado'));

    expect(screen.getByText('¿Lo vas a tomar o lo agregás a tu cava?')).toBeInTheDocument();
    expect(screen.getByText('Este vino ya estaba cargado.')).toBeInTheDocument();
    expect(screen.getByText('Sin añada')).toBeInTheDocument();
  });

  it('el botón "Ahora no" en vino created cierra el flujo y muestra aviso con enlace a la ficha', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simular Vino Creado'));
    expect(screen.getByText('¿Lo vas a tomar o lo agregás a tu cava?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));

    expect(handleClose).toHaveBeenCalled();

    // Aviso flotante de Ahora No con enlace
    const notice = await screen.findByRole('status');
    expect(within(notice).getByText(/cargaste «malbec del valle»/i)).toBeInTheDocument();
    const fichaLink = within(notice).getByRole('link', { name: /ver ficha/i });
    expect(fichaLink).toHaveAttribute('href', '/vinos/10');
  });

  it('el botón "Ahora no" en vino adopted cierra el flujo y muestra aviso sin enlace a la ficha', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simular Vino Adoptado'));
    fireEvent.click(screen.getByRole('button', { name: 'Ahora no' }));

    expect(handleClose).toHaveBeenCalled();

    const notice = await screen.findByRole('status');
    expect(within(notice).getByText(/usamos «cabernet franc reserva», que ya estaba cargado/i)).toBeInTheDocument();
    expect(within(notice).queryByRole('link', { name: /ver ficha/i })).not.toBeInTheDocument();
  });

  it('presionar Escape en el paso Elegir equivale a "Ahora no"', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simular Cosecha Agregada'));
    expect(screen.getByText('¿Lo vas a tomar o lo agregás a tu cava?')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleClose).toHaveBeenCalled();
    const notice = await screen.findByRole('status');
    expect(within(notice).getByText(/cargaste «chardonnay gran reserva»/i)).toBeInTheDocument();
  });

  it('flujo completo "Lo voy a tomar": abre UncorkDialog y tras confirmar avanza a cierre con historial', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simular Vino Creado'));

    // Seleccionar "Lo voy a tomar"
    fireEvent.click(screen.getByRole('button', { name: /lo voy a tomar/i }));

    // UncorkDialog visible (sin modales apilados)
    expect(screen.queryByText('¿Lo vas a tomar o lo agregás a tu cava?')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-uncork-dialog')).toBeInTheDocument();
    expect(screen.getByText('Descorchando: Malbec del Valle')).toBeInTheDocument();

    // Confirmar descorche
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Descorche' }));

    // Paso de cierre
    await waitFor(() => {
      expect(screen.getByText('¡Descorche registrado!')).toBeInTheDocument();
      expect(screen.getByText(/registraste el descorche de «malbec del valle»/i)).toBeInTheDocument();
    });

    const fichaLink = screen.getByRole('link', { name: /ver ficha/i });
    expect(fichaLink).toHaveAttribute('href', '/vinos/10');

    const historyLink = screen.getByRole('link', { name: /ver mi historial/i });
    expect(historyLink).toHaveAttribute('href', '/perfil?tab=historial');

    // Botón Cargar otro reinicia a creando
    const reloadBtn = screen.getByRole('button', { name: /cargar otro/i });
    fireEvent.click(reloadBtn);

    expect(screen.getByTestId('mock-wine-create-modal')).toBeInTheDocument();
  });

  it('flujo completo "Agregar a mi cava": abre AddToCellarForm y tras confirmar avanza a cierre con cava', async () => {
    const handleClose = vi.fn();

    render(
      <MemoryRouter>
        <WineCreationFlow isOpen={true} onClose={handleClose} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Simular Vino Creado'));

    // Seleccionar "Agregar a mi cava"
    fireEvent.click(screen.getByRole('button', { name: /agregar a mi cava/i }));

    // AddToCellarForm visible
    expect(screen.queryByText('¿Lo vas a tomar o lo agregás a tu cava?')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-add-to-cellar-form')).toBeInTheDocument();
    expect(screen.getByText('Agregando a cava: Malbec del Valle')).toBeInTheDocument();

    // Guardar en cava
    fireEvent.click(screen.getByRole('button', { name: 'Guardar en Cava' }));

    // Paso de cierre
    await waitFor(() => {
      expect(screen.getByText('¡Agregado a tu cava!')).toBeInTheDocument();
      expect(screen.getByText(/se agregaron 2 botella\(s\) de «malbec del valle» a cava principal/i)).toBeInTheDocument();
    });

    const fichaLink = screen.getByRole('link', { name: /ver ficha/i });
    expect(fichaLink).toHaveAttribute('href', '/vinos/10');

    const cavaLink = screen.getByRole('link', { name: /ver mi cava/i });
    expect(cavaLink).toHaveAttribute('href', '/cava?cava=55');
  });
});
