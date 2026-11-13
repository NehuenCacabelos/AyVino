import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CavaPage from '@/pages/CavaPage';
import { apiClient } from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'sommelier', email: 'user@test.com' },
  }),
}));

describe('Bloque U4 - CavaPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renderiza estado vacío claro ("Tu cava está vacía") cuando la API no tiene botellas registradas', async () => {
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/cellars/me') {
        return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava', bottleCount: 0 }] });
      }
      if (url === '/cellars/10/items') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <CavaPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Tu cava está vacía')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Ingresar primera botella/i }),
    ).toBeInTheDocument();

    // No debe contener etiquetas de muestra fijas
    expect(screen.queryByText('Cobos Chañares 2017')).toBeNull();
    expect(screen.queryByText('Adrianna Vineyard Mundus Bacillus Terrae')).toBeNull();
  });

  it('mapea ítems reales de la API sin inventar valores por defecto (muestra "—")', async () => {
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/cellars/me') {
        return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava', bottleCount: 1 }] });
      }
      if (url === '/cellars/10/items') {
        return Promise.resolve({
          data: [
            {
              wineVintageId: 55,
              wineId: 20,
              name: 'Vino Comunitario Don Pedro',
              wineType: 'Red',
              wineryId: null,
              wineryNameText: 'Don Pedro',
              wineryName: null,
              regionName: null, // Sin región registrada
              grapeName: null, // Sin uva principal
              year: 2022,
              imageId: null,
              averageRating: null, // Sin reseñas
              reviewCount: 0,
              quantity: 2,
              notes: null, // Sin estante asignado
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <MemoryRouter>
        <CavaPage />
      </MemoryRouter>,
    );

    // Esperamos que cargue la tarjeta real
    const title = await screen.findByText('Vino Comunitario Don Pedro');
    expect(title).toBeInTheDocument();

    // Puntaje sin reseñas debe mostrar "—" y no inventar 92 PTS
    expect(screen.queryByText(/92 PTS/i)).toBeNull();

    // Ubicación sin notas debe mostrar "—" y no inventar "ESTANTE #1"
    expect(screen.queryByText(/ESTANTE #1/i)).toBeNull();

    // Verificamos que contenga "—" para los valores no definidos
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('al guardar con el modal refresca la lista desde la API', async () => {
    let callCount = 0;
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/cellars/me') {
        return Promise.resolve({ data: [{ id: 10, name: 'Mi Cava', bottleCount: 0 }] });
      }
      if (url === '/cellars/10/items') {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({
          data: [
            {
              wineVintageId: 99,
              wineId: 30,
              name: 'Rutini Cabernet Franc',
              wineType: 'Red',
              wineryId: 4,
              wineryName: 'Bodega Rutini',
              wineryNameText: null,
              regionName: 'Gualtallary, Mendoza',
              grapeName: 'Cabernet Franc',
              year: 2021,
              imageId: null,
              averageRating: 4.6,
              reviewCount: 8,
              quantity: 1,
              notes: 'B1 - Estante Medio',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      data: {
        wineVintageId: 99,
        wineId: 30,
        name: 'Rutini Cabernet Franc',
      },
    });

    render(
      <MemoryRouter>
        <CavaPage />
      </MemoryRouter>,
    );

    // Cava vacía inicialmente
    const addFirstBtn = await screen.findByRole('button', { name: /Ingresar primera botella/i });
    fireEvent.click(addFirstBtn);

    // Modal abierto: completamos datos
    const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
    fireEvent.change(nameInput, { target: { value: 'Rutini Cabernet Franc' } });

    const wineryInput = screen.getByLabelText(/Bodega Productora/i);
    fireEvent.change(wineryInput, { target: { value: 'Bodega Rutini' } });

    // Guardar en bóveda
    const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
    fireEvent.click(submitBtn);

    // Se debe haber llamado al backend para agregar la botella
    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/cellars/me/quick-add',
        expect.objectContaining({
          name: 'Rutini Cabernet Franc',
          wineryName: 'Bodega Rutini',
        }),
      );
    });

    // Tras el guardado, debe refrescar la lista y mostrar el vino incorporado
    const newWineTitle = await screen.findByText('Rutini Cabernet Franc');
    expect(newWineTitle).toBeInTheDocument();
  });
});
