import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickAddBottleModal from '@/features/cava/components/QuickAddBottleModal';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('Bloque U4 - QuickAddBottleModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra sugerencias debounced (250ms) al escribir en el nombre de la etiqueta', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: 42,
          name: 'Catena Zapata Malbec Argentino',
          wineryName: 'Bodega Catena Zapata',
          grapeName: 'Malbec',
          regionName: 'Mendoza, Argentina',
          wineType: 'Red',
          defaultVintageYear: 2020,
        },
      ],
    });

    render(
      <MemoryRouter>
        <QuickAddBottleModal isOpen={true} onClose={vi.fn()} onAddBottle={vi.fn()} />
      </MemoryRouter>,
    );

    const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
    fireEvent.change(nameInput, { target: { value: 'Catena' } });

    // Esperamos que se invoque /api/wines/search con debounce
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/wines/search',
        expect.objectContaining({
          params: expect.objectContaining({ search: 'Catena', pageSize: 5 }),
        }),
      );
    });

    // Se debe renderizar el listbox con la opción sugerida
    const option = await screen.findByRole('option', {
      name: /Catena Zapata Malbec Argentino/i,
    });
    expect(option).toBeInTheDocument();
  });

  it('al seleccionar una sugerencia completa campos, obtiene añadas y bloquea la etiqueta', async () => {
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/wines/search') {
        return Promise.resolve({
          data: [
            {
              id: 42,
              name: 'Catena Zapata Malbec Argentino',
              wineryName: 'Bodega Catena Zapata',
              grapeName: 'Malbec',
              regionName: 'Mendoza, Argentina',
              wineType: 'Red',
              defaultVintageYear: 2020,
            },
          ],
        });
      }
      if (url === '/wines/42/vintages') {
        return Promise.resolve({
          data: [{ year: 2019 }, { year: 2020 }, { year: 2021 }],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <QuickAddBottleModal isOpen={true} onClose={vi.fn()} onAddBottle={vi.fn()} />
      </MemoryRouter>,
    );

    const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
    fireEvent.change(nameInput, { target: { value: 'Catena' } });

    const option = await screen.findByRole('option', {
      name: /Catena Zapata Malbec Argentino/i,
    });
    fireEvent.click(option);

    // Los campos de etiqueta deben quedar bloqueados con los datos completados
    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveValue('Catena Zapata Malbec Argentino');

    const wineryInput = screen.getByLabelText(/Bodega Productora/i);
    expect(wineryInput).toBeDisabled();
    expect(wineryInput).toHaveValue('Bodega Catena Zapata');

    const regionInput = screen.getByLabelText(/Región \/ Valle/i);
    expect(regionInput).toBeDisabled();
    expect(regionInput).toHaveValue('Mendoza, Argentina');

    // Debe mostrar el botón de "Cambiar vino"
    const changeBtn = screen.getByRole('button', { name: /Cambiar vino/i });
    expect(changeBtn).toBeInTheDocument();

    // Las añadas deben cargarse en un select
    await waitFor(() => {
      const vintageSelect = screen.getByLabelText(/Añada \(Cosecha\)/i);
      expect(vintageSelect.tagName).toBe('SELECT');
      expect(screen.getByRole('option', { name: /Añada 2020/i })).toBeInTheDocument();
    });
  });

  it('al presionar "Cambiar vino" desbloquea y limpia los datos de la etiqueta', async () => {
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/wines/search') {
        return Promise.resolve({
          data: [
            {
              id: 42,
              name: 'Catena Zapata Malbec Argentino',
              wineryName: 'Bodega Catena Zapata',
              grapeName: 'Malbec',
              regionName: 'Mendoza, Argentina',
              wineType: 'Red',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <QuickAddBottleModal isOpen={true} onClose={vi.fn()} onAddBottle={vi.fn()} />
      </MemoryRouter>,
    );

    const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
    fireEvent.change(nameInput, { target: { value: 'Catena' } });

    const option = await screen.findByRole('option', {
      name: /Catena Zapata Malbec Argentino/i,
    });
    fireEvent.click(option);

    const changeBtn = screen.getByRole('button', { name: /Cambiar vino/i });
    fireEvent.click(changeBtn);

    // Campos desbloqueados y limpios
    expect(nameInput).not.toBeDisabled();
    expect(nameInput).toHaveValue('');
    const wineryInput = screen.getByLabelText(/Bodega Productora/i);
    expect(wineryInput).not.toBeDisabled();
    expect(wineryInput).toHaveValue('');
  });

  it('envía matchedWineId en el payload de onAddBottle al guardar un vino seleccionado', async () => {
    const onAddBottleSpy = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <QuickAddBottleModal
          isOpen={true}
          onClose={vi.fn()}
          onAddBottle={onAddBottleSpy}
          initialWine={{
            id: '42',
            name: 'Catena Zapata Malbec Argentino',
            winery: 'Bodega Catena Zapata',
            region: 'Mendoza, Argentina',
            varietal: 'Malbec',
            vintage: '2020',
            rating: 4.8,
            bottle: 'bordeaux',
          }}
        />
      </MemoryRouter>,
    );

    const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAddBottleSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          matchedWineId: 42,
          name: 'Catena Zapata Malbec Argentino',
          winery: 'Bodega Catena Zapata',
          vintage: 2020,
        }),
      );
    });
  });
});
