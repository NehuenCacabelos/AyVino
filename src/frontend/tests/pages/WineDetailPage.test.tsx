import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineDetailPage from '@/pages/WineDetailPage';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as reviewsApi from '@/features/wines/api/reviewsApi';
import * as tastingsApi from '@/features/wines/api/tastingsApi';
import type { WineResponseDto, WineVintageResponseDto, WineryResponseDto } from '@/features/winery/types';

vi.mock('@/features/auth', () => ({
  useAuth: () => ({
    user: { id: 10, username: 'Mariano Sommelier', role: 'User' },
  }),
}));

vi.mock('@/features/winery/api/wineApi');
vi.mock('@/features/winery/api/wineryApi');
vi.mock('@/features/winery/api/wineryWinePairingsApi');
vi.mock('@/features/winery/api/grapeApi');
vi.mock('@/features/wines/api/reviewsApi');
vi.mock('@/features/wines/api/tastingsApi');

describe('WineDetailPage Integration', () => {
  const mockRealWine: WineResponseDto = {
    id: 101,
    name: 'Rutini Cabernet Malbec 2020',
    wineType: 'Red',
    description: 'Emblemático corte mendocino.',
    wineryId: 4,
    wineryNameText: 'Rutini Wines',
    locationId: 1,
    sourceType: 'Official',
    duplicateOfWineId: null,
    averageRating: 4.7,
    reviewCount: 20,
  };

  const mockRealWinery: WineryResponseDto = {
    id: 4,
    name: 'Rutini Wines',
    description: 'Pioneros en Tupungato.',
    locationId: 1,
    foundationYear: 1885,
    website: 'https://rutiniwines.com',
    userId: 2,
    status: 'Approved',
    registerDate: new Date('2020-01-01'),
    location: {
      regionName: 'Gualtallary',
      stateName: 'Mendoza',
    },
  };

  const mockRealVintages: WineVintageResponseDto[] = [
    {
      id: 201,
      wineId: 101,
      year: 2020,
      alcoholContent: 14.0,
      servingTemperature: 16,
      agingAdvice: '10 años de guarda.',
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 2,
      registerDate: new Date('2021-01-01'),
      averageRating: 4.7,
      reviewCount: 20,
      grapes: [
        { grapeId: 1, percentage: 50 },
        { grapeId: 2, percentage: 50 },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(wineApi.getWineById).mockResolvedValue(mockRealWine);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue(mockRealVintages);
    vi.mocked(wineryApi.getWineryById).mockResolvedValue(mockRealWinery);
    vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([
      { id: 1, name: 'Bife de chorizo', category: 'Meat' },
    ]);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue([
      { id: 1, name: 'Cabernet Sauvignon', colorType: 'Red' },
      { id: 2, name: 'Malbec', colorType: 'Red' },
    ]);
    vi.mocked(reviewsApi.getWineReviews).mockResolvedValue([
      {
        id: 99,
        userId: 15,
        userName: 'Esteban C.',
        wineVintageId: 201,
        vintageYear: 2020,
        rating: 5,
        comment: 'Excelente balance tánico.',
        createdAt: '2025-02-10T15:00:00Z',
        updatedAt: null,
      },
    ]);
    vi.mocked(reviewsApi.createReview).mockResolvedValue({
      id: 100,
      userId: 10,
      userName: 'Mariano Sommelier',
      wineVintageId: 201,
      vintageYear: 2020,
      rating: 4.2,
      comment: 'Muy buena concentración.',
      createdAt: '2025-03-01T10:00:00Z',
      updatedAt: null,
    });
    vi.mocked(tastingsApi.createTasting).mockResolvedValue({
      id: 50,
      userId: 10,
      wineVintageId: 201,
      cellarId: null,
      rating: 4.3,
      comment: 'Gran textura en boca.',
      tastedAt: '2025-03-01T10:00:00Z',
      createdAt: '2025-03-01T10:00:00Z',
    });
  });

  it('ruteo numérico: carga vino real desde la API y renderiza su ficha', async () => {
    render(
      <MemoryRouter initialEntries={['/vinos/101']}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando etiqueta enológica...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Rutini Cabernet Malbec 2020' })).toBeInTheDocument();
    });

    expect(wineApi.getWineById).toHaveBeenCalledWith(101);
    expect(wineApi.getWineVintages).toHaveBeenCalledWith(101);
    expect(wineryApi.getWineryById).toHaveBeenCalledWith(4);
    expect(screen.getAllByText('Rutini Wines').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Gualtallary, Mendoza')).toBeInTheDocument();
    expect(screen.getByText('Bife de chorizo')).toBeInTheDocument();
    expect(screen.getByText('Esteban C.')).toBeInTheDocument();
    expect(screen.getByText('Excelente balance tánico.')).toBeInTheDocument();
  });

  it('ruteo slug no numérico: carga directamente la maqueta editorial sin consultar APIs', async () => {
    render(
      <MemoryRouter initialEntries={['/vinos/catena-zapata-malbec-argentino']}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Catena Zapata Malbec Argentino' })).toBeInTheDocument();
    expect(wineApi.getWineById).not.toHaveBeenCalled();
  });

  it('publicación de reseña en vino real: envía rating decimal sin redondear a entero', async () => {
    render(
      <MemoryRouter initialEntries={['/vinos/101']}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec 2020')).toBeInTheDocument();
    });

    // Abrir formulario en modo reseña
    const openReviewButtons = screen.getAllByRole('button', { name: /Escribir reseña/i });
    fireEvent.click(openReviewButtons[0]);

    const textarea = screen.getByPlaceholderText(/Describí aromas primarios/i);
    fireEvent.change(textarea, { target: { value: 'Notas de vainilla y pimientos dulces.' } });

    // Cambiamos slider a 4.2 (decimal con paso 0.1)
    const slider = screen.getByLabelText(/Seleccionar puntuación decimal/i);
    fireEvent.change(slider, { target: { value: '4.2' } });

    const submitBtn = screen.getByRole('button', { name: /Publicar Reseña Pública/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reviewsApi.createReview).toHaveBeenCalledWith({
        wineVintageId: 201,
        rating: 4.2, // Sin redondear a entero
        comment: 'Notas de vainilla y pimientos dulces.',
      });
    });

    // Verifica que se haya mostrado toast de éxito en formato es-AR
    expect(await screen.findByText(/¡Tu reseña \(4,2 ★\) fue publicada con éxito!/i)).toBeInTheDocument();
  });

  it('registro de cata privada en vino real: llama a createTasting con decimal sin redondear', async () => {
    render(
      <MemoryRouter initialEntries={['/vinos/101']}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec 2020')).toBeInTheDocument();
    });

    // Abrir formulario desde "+ Registrar mi cata"
    const openTastingBtn = screen.getByRole('button', { name: /\+ Registrar mi cata/i });
    fireEvent.click(openTastingBtn);

    const textarea = screen.getByPlaceholderText(/Aromas percibidos, maridaje elegido/i);
    fireEvent.change(textarea, { target: { value: 'Excelente acidez con pastas rellenas.' } });

    // Cambiamos slider a 4.3
    const slider = screen.getByLabelText(/Seleccionar puntuación decimal/i);
    fireEvent.change(slider, { target: { value: '4.3' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar en mi bitácora/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(tastingsApi.createTasting).toHaveBeenCalledWith(
        expect.objectContaining({
          wineVintageId: 201,
          cellarId: null,
          rating: 4.3,
          comment: 'Excelente acidez con pastas rellenas.',
        })
      );
    });

    // Verifica aviso de éxito en formato es-AR
    expect(await screen.findByText(/¡Tu cata \(4,3 ★\) fue guardada en tu bitácora!/i)).toBeInTheDocument();
  });

  it('error en reseña o cata muestra el mensaje devuelto por el backend sin romper estado', async () => {
    vi.mocked(reviewsApi.createReview).mockRejectedValueOnce({
      response: { data: { detail: 'Ya registraste una reseña para esta cosecha.' } },
    });

    render(
      <MemoryRouter initialEntries={['/vinos/101']}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rutini Cabernet Malbec 2020')).toBeInTheDocument();
    });

    const openReviewButtons = screen.getAllByRole('button', { name: /Escribir reseña/i });
    fireEvent.click(openReviewButtons[0]);

    const textarea = await screen.findByPlaceholderText(/Describí aromas primarios/i);
    fireEvent.change(textarea, { target: { value: 'Comentario duplicado.' } });

    const submitBtn = screen.getByRole('button', { name: /Publicar Reseña Pública/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Ya registraste una reseña para esta cosecha/i)).toBeInTheDocument();
  });
});
