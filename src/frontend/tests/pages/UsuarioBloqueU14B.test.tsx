import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CavaPage from '@/pages/CavaPage';
import WineDetailPage from '@/pages/WineDetailPage';
import UncorkDialog from '@/features/dashboard/components/UncorkDialog';
import VaultVitals from '@/features/cava/components/VaultVitals';
import * as reviewsApi from '@/features/wines/api/reviewsApi';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import { apiClient } from '@/services/apiClient';
import type { CellarVitals } from '@/features/cava/types';
import type { DashboardWine } from '@/types/wine';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 10, username: 'Kevin Sommelier', email: 'kevin@ayvino.com', role: 'User' },
  }),
}));

const { mockApiInstance } = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return { mockApiInstance: instance };
});

vi.mock('@/services/apiClient', () => ({
  apiClient: mockApiInstance,
  default: mockApiInstance,
}));

vi.mock('@/features/winery/api/wineApi');
vi.mock('@/features/winery/api/wineryApi');
vi.mock('@/features/winery/api/wineryWinePairingsApi');
vi.mock('@/features/winery/api/grapeApi');
vi.mock('@/features/wines/api/reviewsApi');

describe('Bloque U14B - Reseña única en el front, eventos de descorche y varietal real', () => {
  const mockClient = vi.mocked(apiClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // B.1 Ficha de vino (WineDetailView)
  // =========================================================================
  describe('B.1 Ficha de vino (WineDetailView)', () => {
    const mockRealWine = {
      id: 22,
      name: 'Catena Zapata Nicasia 2020',
      wineType: 'Red',
      description: 'Gran exponente de Paraje Altamira.',
      wineryId: 1,
      wineryNameText: 'Catena Zapata',
      locationId: 1,
      sourceType: 'Official',
      duplicateOfWineId: null,
      averageRating: 4.8,
      reviewCount: 15,
    };

    const mockWinery = {
      id: 1,
      name: 'Catena Zapata',
      description: 'Bodega icónica.',
      locationId: 1,
      foundationYear: 1902,
      website: 'https://catenazapata.com',
      userId: 1,
      status: 'Approved',
      registerDate: new Date('2020-01-01'),
      location: { regionName: 'Mendoza', stateName: 'Mendoza' },
    };

    const mockVintages = [
      {
        id: 301,
        wineId: 22,
        year: 2020,
        alcoholContent: 14.5,
        servingTemperature: 16,
        agingAdvice: '18 meses',
        approvalStatus: 'Approved',
        uploadedByUserId: 1,
        registerDate: '2025-01-01',
        grapes: [],
        reviewCount: 10,
        averageRating: 4.8,
      },
    ];

    beforeEach(() => {
      vi.mocked(wineApi.getWineById).mockResolvedValue(mockRealWine);
      vi.mocked(wineryApi.getWineryById).mockResolvedValue(mockWinery);
      vi.mocked(wineApi.getWineVintages).mockResolvedValue(mockVintages);
      vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([]);
      vi.mocked(grapeApi.getGrapes).mockResolvedValue([]);
      vi.mocked(reviewsApi.getWineReviews).mockResolvedValue([]);
    });

    it('tiene una sola acción de reseña, sin pestañas de "Mi cata privada" ni textos de cata privada', async () => {
      vi.mocked(reviewsApi.getMyVintageReview).mockResolvedValue(null);

      render(
        <MemoryRouter initialEntries={['/vinos/22']}>
          <Routes>
            <Route path="/vinos/:id" element={<WineDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Catena Zapata Nicasia 2020')).toBeInTheDocument();
      });

      // No debe existir pestaña ni botón de cata privada
      expect(screen.queryByText(/Mi cata privada/i)).toBeNull();
      expect(screen.queryByText(/Reseña pública/i)).toBeNull();
      expect(screen.queryByText(/\+ Registrar mi cata/i)).toBeNull();

      // Debe haber acción para dejar reseña
      const leaveReviewBtn = screen.getByRole('button', { name: /\+ Dejar mi reseña/i });
      expect(leaveReviewBtn).toBeInTheDocument();

      // Abrir formulario
      fireEvent.click(leaveReviewBtn);

      // El formulario no contiene tabs ni textos de cata privada
      expect(screen.queryByText(/Mi cata privada/i)).toBeNull();
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Describí aromas primarios/i)).toBeInTheDocument();
      });
    });

    it('crea reseña con POST /api/reviews y muestra el mensaje "¡Tu reseña (4,5 ★) fue guardada!"', async () => {
      vi.mocked(reviewsApi.getMyVintageReview).mockResolvedValue(null);
      vi.mocked(reviewsApi.createReview).mockResolvedValue({
        id: 701,
        userId: 10,
        username: 'Kevin Sommelier',
        wineVintageId: 301,
        vintageYear: 2020,
        rating: 4.5,
        comment: 'Excelente estructura y notas de violetas.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter initialEntries={['/vinos/22']}>
          <Routes>
            <Route path="/vinos/:id" element={<WineDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Catena Zapata Nicasia 2020')).toBeInTheDocument();
      });

      const openBtn = await screen.findByRole('button', { name: /\+ Dejar mi reseña/i });
      fireEvent.click(openBtn);

      const textarea = await screen.findByPlaceholderText(/Describí aromas primarios/i);
      fireEvent.change(textarea, { target: { value: 'Excelente estructura y notas de violetas.' } });

      const slider = screen.getByLabelText(/Seleccionar puntuación decimal/i);
      fireEvent.change(slider, { target: { value: '4.5' } });

      const submitBtn = screen.getByRole('button', { name: /Publicar Reseña/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(reviewsApi.createReview).toHaveBeenCalledWith({
          wineVintageId: 301,
          rating: 4.5,
          comment: 'Excelente estructura y notas de violetas.',
        });
      });

      expect(await screen.findByText(/¡Tu reseña \(4,5 ★\) fue guardada!/i)).toBeInTheDocument();
    });

    it('si ya existe reseña, precarga datos en el formulario y al guardar llama a updateReview', async () => {
      vi.mocked(reviewsApi.getMyVintageReview).mockResolvedValue({
        id: 701,
        userId: 10,
        username: 'Kevin Sommelier',
        wineVintageId: 301,
        vintageYear: 2020,
        rating: 4.7,
        comment: 'Notas minerales impecables.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      vi.mocked(reviewsApi.updateReview).mockResolvedValue({
        id: 701,
        userId: 10,
        username: 'Kevin Sommelier',
        wineVintageId: 301,
        vintageYear: 2020,
        rating: 4.9,
        comment: 'Actualizado: evolución perfecta en botella.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <MemoryRouter initialEntries={['/vinos/22']}>
          <Routes>
            <Route path="/vinos/:id" element={<WineDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Catena Zapata Nicasia 2020')).toBeInTheDocument();
      });

      // El botón debe indicar "Editar mi reseña"
      const editBtn = await screen.findByRole('button', { name: /Editar mi reseña/i });
      fireEvent.click(editBtn);

      // Formulario precargado
      const textarea = screen.getByPlaceholderText(/Describí aromas primarios/i);
      expect(textarea).toHaveValue('Notas minerales impecables.');

      // Modificamos nota y rating
      fireEvent.change(textarea, { target: { value: 'Actualizado: evolución perfecta en botella.' } });
      const slider = screen.getByLabelText(/Seleccionar puntuación decimal/i);
      fireEvent.change(slider, { target: { value: '4.9' } });

      const submitBtn = screen.getByRole('button', { name: /Guardar cambios/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(reviewsApi.updateReview).toHaveBeenCalledWith(701, {
          rating: 4.9,
          comment: 'Actualizado: evolución perfecta en botella.',
        });
      });

      expect(await screen.findByText(/¡Tu reseña \(4,9 ★\) fue guardada!/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // B.2 Diálogo "Registrar Cata" (UncorkDialog)
  // =========================================================================
  describe('B.2 Diálogo de descorche (UncorkDialog)', () => {
    const testWine: DashboardWine = {
      id: 'api-item-55',
      wineVintageId: 55,
      name: 'Gran Enemigo Gualtallary',
      winery: 'El Enemigo',
      region: 'Gualtallary, Mendoza',
      varietal: 'Cabernet Franc',
      vintage: 2019,
      rating: 4.8,
      bottle: 'red-burgundy',
      units: 3,
    };

    it('precarga reseña existente y muestra el aviso visible "Ya tenés una reseña de este vino: se va a actualizar"', async () => {
      vi.mocked(reviewsApi.getMyVintageReview).mockResolvedValue({
        id: 888,
        userId: 10,
        username: 'Kevin Sommelier',
        wineVintageId: 55,
        vintageYear: 2019,
        rating: 4.6,
        comment: 'Pimienta negra y grafito.',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      });

      render(<UncorkDialog wine={testWine} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.getByText('Ya tenés una reseña de este vino: se va a actualizar')
        ).toBeInTheDocument();
      });

      const notes = screen.getByPlaceholderText(/Aromas predominantes/i);
      expect(notes).toHaveValue('Pimienta negra y grafito.');
      expect(notes).not.toBeDisabled();
    });

    it('sin reseña previa: no tiene valor por defecto y el comentario está deshabilitado hasta que se asigne puntaje', async () => {
      vi.mocked(reviewsApi.getMyVintageReview).mockResolvedValue(null);

      render(<UncorkDialog wine={testWine} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(
          screen.queryByText('Ya tenés una reseña de este vino: se va a actualizar')
        ).toBeNull();
      });

      const notes = screen.getByPlaceholderText(/Aromas predominantes/i);
      expect(notes).toBeDisabled();
      expect(notes).toHaveValue('');

      // Asignar puntuación habilita el campo de notas
      const slider = screen.getByLabelText(/Puntuación de descorche/i);
      fireEvent.change(slider, { target: { value: '4.4' } });

      expect(notes).not.toBeDisabled();
    });

    it('al enviar el formulario, emite la estructura normalizada para el servicio de descorche', async () => {
      vi.mocked(reviewsApi.getMyVintageReview).mockResolvedValue(null);
      const onSave = vi.fn();

      render(<UncorkDialog wine={testWine} onClose={vi.fn()} onSave={onSave} />);

      const slider = screen.getByLabelText(/Puntuación de descorche/i);
      fireEvent.change(slider, { target: { value: '4.7' } });

      const notes = screen.getByPlaceholderText(/Aromas predominantes/i);
      fireEvent.change(notes, { target: { value: 'Gran final tánico.' } });

      const submitBtn = screen.getByRole('button', { name: /REGISTRAR DESCORCHE/i });
      fireEvent.click(submitBtn);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          wine: testWine,
          rating: 4.7,
          tastingNotes: 'Gran final tánico.',
        })
      );
    });
  });

  // =========================================================================
  // B.4 Bitácora de /cava desde GET /api/users/me/uncorks
  // =========================================================================
  describe('B.4 Bitácora de /cava (Uncorks API)', () => {
    it('carga los descorches desde /users/me/uncorks mostrando la reseña actual del usuario', async () => {
      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 1, name: 'Cava Principal' }] });
        }
        if (url === '/cellars/1/items') {
          return Promise.resolve({ data: [] });
        }
        if (url === '/users/me/uncorks') {
          return Promise.resolve({
            data: [
              {
                id: 101,
                wineId: 10,
                wineVintageId: 201,
                wineName: 'Zuccardi Aluvional',
                wineryName: 'Zuccardi Valle de Uco',
                year: 2018,
                imageId: null,
                cellarName: 'Cava Principal',
                uncorkedAt: '2026-11-14T20:00:00Z',
                rating: 4.8,
                comment: 'Textura calcárea única en boca.',
              },
            ],
          });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <Routes>
            <Route path="/cava" element={<CavaPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockClient.get).toHaveBeenCalledWith(
          '/users/me/uncorks',
          expect.objectContaining({
            params: expect.objectContaining({ pageNumber: 1, pageSize: 10 }),
          })
        );
      });

      expect(await screen.findByText('Zuccardi Aluvional (2018)')).toBeInTheDocument();
      expect(screen.getByText('TU RESEÑA 4,8 ★')).toBeInTheDocument();
      expect(screen.getByText(/Textura calcárea única en boca/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // B.5 Varietal dominante y "Total en Cava" (Caso Kevin & reglas de cálculo)
  // =========================================================================
  describe('B.5 Varietal dominante y Total en Cava', () => {
    it('Caso Kevin: 2 Chardonnay (blanco), 2 Malbec (tinto), 1 Sauvignon Blanc (blanco) -> 40 / 40 / 20 con título "Chardonnay · Malbec"', async () => {
      const kevinWines = [
        {
          wineVintageId: 1,
          name: 'Chardonnay Reserva',
          grapeName: 'Chardonnay',
          wineType: 'White',
          quantity: 2,
          year: 2022,
        },
        {
          wineVintageId: 2,
          name: 'Malbec Clásico',
          grapeName: 'Malbec',
          wineType: 'Red',
          quantity: 2,
          year: 2021,
        },
        {
          wineVintageId: 3,
          name: 'Sauvignon Blanc Finca',
          grapeName: 'Sauvignon Blanc',
          wineType: 'White',
          quantity: 1,
          year: 2023,
        },
      ];

      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 1, name: 'Cava de Kevin' }] });
        }
        if (url === '/cellars/1/items') {
          return Promise.resolve({ data: kevinWines });
        }
        if (url === '/users/me/uncorks') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <Routes>
            <Route path="/cava" element={<CavaPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Total de botellas: 5
      expect(await screen.findByText('5')).toBeInTheDocument();

      // Total en cava: 2 Tintos, 3 Blancos, 0 Esp.
      expect(screen.getByText(/2 Tintos/i)).toBeInTheDocument();
      expect(screen.getByText(/3 Blancos/i)).toBeInTheDocument();

      // Empate en 1er lugar: título con "Chardonnay · Malbec" y porcentaje 40%
      expect(screen.getByTitle('Chardonnay · Malbec')).toBeInTheDocument();
      expect(screen.getByText('40%')).toBeInTheDocument();

      // Leyenda con porcentajes exactos de las 3 uvas
      expect(screen.getByText('Chardonnay 40 %')).toBeInTheDocument();
      expect(screen.getByText('Malbec 40 %')).toBeInTheDocument();
      expect(screen.getByText('Sauvignon Blanc 20 %')).toBeInTheDocument();
    });

    it('botellas sin uva declarada: no cuentan como varietal y muestran la nota chica "N botellas sin uva declarada"', async () => {
      const winesWithUndeclared = [
        {
          wineVintageId: 1,
          name: 'Vino Sin Uva',
          grapeName: null,
          wineType: 'Red',
          quantity: 3,
          year: 2020,
        },
        {
          wineVintageId: 2,
          name: 'Cabernet Franc Lote',
          grapeName: 'Cabernet Franc',
          wineType: 'Red',
          quantity: 2,
          year: 2021,
        },
      ];

      mockClient.get.mockImplementation((url: string) => {
        if (url === '/cellars/me') {
          return Promise.resolve({ data: [{ id: 1, name: 'Mi Cava' }] });
        }
        if (url === '/cellars/1/items') {
          return Promise.resolve({ data: winesWithUndeclared });
        }
        if (url === '/users/me/uncorks') {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter initialEntries={['/cava']}>
          <Routes>
            <Route path="/cava" element={<CavaPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Total de botellas: 5
      expect(await screen.findByText('5')).toBeInTheDocument();

      // Varietal dominante es 100% Cabernet Franc (calculado sobre las 2 botellas con uva declarada)
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByTitle('Cabernet Franc')).toBeInTheDocument();

      // Nota chica de botellas sin uva declarada
      expect(screen.getByText('3 botellas sin uva declarada')).toBeInTheDocument();
    });

    it('más de 3 uvas declaradas: muestra las 3 primeras y un tramo "Otros" con el remanente', () => {
      const vitals: CellarVitals = {
        totalBottles: 10,
        redsCount: 10,
        whitesCount: 0,
        sparklingCount: 0,
        othersCount: 0,
        optimalCount: 4,
        dominantVarietal: 'Malbec',
        dominantVarietalPercentage: 40,
        undeclaredGrapeBottles: 0,
        varietalSegments: [
          { name: 'Malbec', percentage: 40, bottleCount: 4, wineType: 'Red', color: '#722F37', opacity: 1 },
          { name: 'Cabernet Sauvignon', percentage: 30, bottleCount: 3, wineType: 'Red', color: '#722F37', opacity: 0.7 },
          { name: 'Syrah', percentage: 20, bottleCount: 2, wineType: 'Red', color: '#722F37', opacity: 0.45 },
          { name: 'Otros', percentage: 10, bottleCount: 1, wineType: 'Other', color: '#525252', opacity: 1 },
        ],
        oldestVintage: 2018,
        oldestVintageAgingYears: 8,
      };

      render(<VaultVitals vitals={vitals} />);

      expect(screen.getByText('Malbec 40 %')).toBeInTheDocument();
      expect(screen.getByText('Cabernet Sauvignon 30 %')).toBeInTheDocument();
      expect(screen.getByText('Syrah 20 %')).toBeInTheDocument();
      expect(screen.getByText('Otros 10 %')).toBeInTheDocument();
    });

    it('cava vacía: muestra guiones (—), total 0, sin leyenda ni porcentajes falsos', () => {
      const emptyVitals: CellarVitals = {
        totalBottles: 0,
        redsCount: 0,
        whitesCount: 0,
        sparklingCount: 0,
        othersCount: 0,
        optimalCount: 0,
        dominantVarietal: '—',
        dominantVarietalPercentage: 0,
        undeclaredGrapeBottles: 0,
        varietalSegments: [],
        oldestVintage: null,
        oldestVintageAgingYears: 0,
      };

      render(<VaultVitals vitals={emptyVitals} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText(/Malbec/i)).toBeNull();
      expect(screen.queryByText(/Otros/i)).toBeNull();
    });

    it('Total en Cava incluye categoría Otros para vinos rosados y naranjos cuando existen', () => {
      const vitalsWithRosado: CellarVitals = {
        totalBottles: 8,
        redsCount: 4,
        whitesCount: 2,
        sparklingCount: 1,
        othersCount: 1, // 1 Rosado o Naranjo
        optimalCount: 2,
        dominantVarietal: 'Malbec',
        dominantVarietalPercentage: 50,
        undeclaredGrapeBottles: 0,
        varietalSegments: [
          { name: 'Malbec', percentage: 50, bottleCount: 4, wineType: 'Red', color: '#722F37', opacity: 1 },
        ],
        oldestVintage: 2020,
        oldestVintageAgingYears: 6,
      };

      render(<VaultVitals vitals={vitalsWithRosado} />);

      expect(screen.getByText('4 Tintos')).toBeInTheDocument();
      expect(screen.getByText('2 Blancos')).toBeInTheDocument();
      expect(screen.getByText('1 Esp.')).toBeInTheDocument();
      expect(screen.getByText('1 Otros')).toBeInTheDocument();
    });
  });
});
