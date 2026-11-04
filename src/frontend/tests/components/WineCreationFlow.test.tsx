import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WineCreationFlow from '@/features/wines/components/WineCreationFlow';
import { decidePostWineCreationAction } from '@/features/wines/utils/creationFlowUtils';
import type { WineCreationResult } from '@/features/winery/components/WineCreateModal';
import * as cellarApi from '@/features/cava/api/cellarApi';

// Mock de cellarApi
vi.mock('@/features/cava/api/cellarApi', () => ({
  getCellarsApi: vi.fn(),
  createCellarApi: vi.fn(),
  addCellarItemApi: vi.fn(),
}));

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

describe('WineCreationFlow Coordinator Component & Decision Logic (Bloque D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('decidePostWineCreationAction (función pura)', () => {
    it('devuelve "auto-add" cuando el usuario NO tiene ninguna cava (array vacío)', async () => {
      const decision = await decidePostWineCreationAction(async () => []);
      expect(decision).toBe('auto-add');
    });

    it('devuelve "prompt" cuando el usuario ya tiene cavas registradas', async () => {
      const decision = await decidePostWineCreationAction(async () => [
        { id: 1, name: 'Mi Cava' },
      ]);
      expect(decision).toBe('prompt');
    });

    it('devuelve "prompt" como fallback seguro si la consulta falla', async () => {
      const decision = await decidePostWineCreationAction(async () => {
        throw new Error('Network error');
      });
      expect(decision).toBe('prompt');
    });
  });

  describe('Comportamiento del flujo UI', () => {
    it('inicia en paso crear con WineCreateModal visible', () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      );

      expect(screen.getByTestId('mock-wine-create-modal')).toBeInTheDocument();
    });

    it('cuando el usuario NO tiene cavas: auto-crea "Mi cava", agrega el vino y muestra confirmación de cierre', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([]);
      vi.mocked(cellarApi.createCellarApi).mockResolvedValueOnce({
        id: 99,
        name: 'Mi cava',
        createdAt: '2026-11-04',
        bottleCount: 0,
      });
      vi.mocked(cellarApi.addCellarItemApi).mockResolvedValueOnce({} as never);

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Creado'));

      await waitFor(() => {
        expect(cellarApi.createCellarApi).toHaveBeenCalledWith({ name: 'Mi cava' });
        expect(cellarApi.addCellarItemApi).toHaveBeenCalledWith(99, {
          wineVintageId: 100,
          quantity: 1,
        });
      });

      expect(await screen.findByText('¡Agregado a tu cava!')).toBeInTheDocument();
      expect(screen.getByText(/Se agregaron 1 botella\(s\) de «Malbec del Valle» a Mi cava/i)).toBeInTheDocument();
    });

    it('cuando el usuario TIENE cavas: avanza al paso "¿Qué querés hacer con este vino?" con vino nuevo y 3 opciones', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Casa', createdAt: '2026-01-01', bottleCount: 5 },
      ]);

      const handleWineCreated = vi.fn();

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={vi.fn()} onWineCreated={handleWineCreated} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Creado'));

      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();
      expect(screen.getByText('Malbec del Valle')).toBeInTheDocument();
      expect(screen.getByText('Bodega Andina')).toBeInTheDocument();
      expect(screen.getByText('2021')).toBeInTheDocument();

      // 3 opciones requeridas
      expect(screen.getByRole('button', { name: /agregar a una cava/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /descorchar ahora/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /solo guardarlo \/ ahora no/i })).toBeInTheDocument();
    });

    it('cuando el usuario TIENE cavas con vino adoptado (existente): muestra aviso "Este vino ya estaba cargado" y las 3 opciones', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Principal', createdAt: '2026-01-01', bottleCount: 12 },
      ]);

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Adoptado'));

      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();
      expect(screen.getByText('Este vino ya estaba cargado.')).toBeInTheDocument();
      expect(screen.getByText('Sin añada')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /agregar a una cava/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /descorchar ahora/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /solo guardarlo \/ ahora no/i })).toBeInTheDocument();
    });

    it('el botón "Solo guardarlo / Ahora no" en vino created cierra el flujo y muestra aviso con enlace a la ficha', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Principal', createdAt: '2026-01-01', bottleCount: 10 },
      ]);
      const handleClose = vi.fn();

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Creado'));
      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /solo guardarlo \/ ahora no/i }));

      expect(handleClose).toHaveBeenCalled();

      const notice = await screen.findByRole('status');
      expect(within(notice).getByText(/cargaste «malbec del valle»/i)).toBeInTheDocument();
      const fichaLink = within(notice).getByRole('link', { name: /ver ficha/i });
      expect(fichaLink).toHaveAttribute('href', '/vinos/10');
    });

    it('el botón "Solo guardarlo / Ahora no" en vino adopted cierra el flujo y muestra aviso sin enlace a la ficha', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Principal', createdAt: '2026-01-01', bottleCount: 10 },
      ]);
      const handleClose = vi.fn();

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Adoptado'));
      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /solo guardarlo \/ ahora no/i }));

      expect(handleClose).toHaveBeenCalled();

      const notice = await screen.findByRole('status');
      expect(
        within(notice).getByText(/usamos «cabernet franc reserva», que ya estaba cargado/i)
      ).toBeInTheDocument();
      expect(within(notice).queryByRole('link', { name: /ver ficha/i })).toBeNull();
    });

    it('presionar Escape en el paso "¿Qué querés hacer con este vino?" equivale a "Solo guardarlo / Ahora no"', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Principal', createdAt: '2026-01-01', bottleCount: 10 },
      ]);
      const handleClose = vi.fn();

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={handleClose} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Cosecha Agregada'));
      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(handleClose).toHaveBeenCalled();
    });

    it('flujo "Descorchar ahora": abre UncorkDialog y tras confirmar avanza a cierre con opción de cava', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Principal', createdAt: '2026-01-01', bottleCount: 10 },
      ]);

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Creado'));
      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /descorchar ahora/i }));

      expect(screen.getByTestId('mock-uncork-dialog')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Confirmar Descorche'));

      expect(await screen.findByText('¡Descorche registrado!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver mi historial/i })).toHaveAttribute(
        'href',
        '/perfil?tab=historial'
      );
    });

    it('flujo "Agregar a una cava": abre AddToCellarForm y tras confirmar avanza a cierre con opción de descorchar', async () => {
      vi.mocked(cellarApi.getCellarsApi).mockResolvedValueOnce([
        { id: 1, name: 'Cava Principal', createdAt: '2026-01-01', bottleCount: 10 },
      ]);

      render(
        <MemoryRouter>
          <WineCreationFlow isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Simular Vino Creado'));
      expect(await screen.findByText('¿Qué querés hacer con este vino?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /agregar a una cava/i }));

      expect(screen.getByTestId('mock-add-to-cellar-form')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Guardar en Cava' }));

      expect(await screen.findByText('¡Agregado a tu cava!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ver mi cava/i })).toHaveAttribute(
        'href',
        '/cava?cava=55'
      );
      expect(screen.getByRole('button', { name: /descorchar ahora/i })).toBeInTheDocument();
    });
  });
});
