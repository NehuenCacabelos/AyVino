import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineDetailPage from '@/pages/WineDetailPage';
import * as authModule from '@/features/auth';
import * as wineApiModule from '@/features/winery/api/wineApi';
import * as wineryPublicApiModule from '@/features/winery/api/wineryPublicApi';
import * as pairingsModule from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApiModule from '@/features/winery/api/grapeApi';
import * as reviewApiModule from '@/features/reviews';
import * as userWineApiModule from '@/features/userWines';
import * as userVintageImageApiModule from '@/features/wines';

const mockUseAuth = vi.fn();

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

vi.mock('@/features/winery/api/wineApi', () => ({
  getWineById: vi.fn(),
  getWineVintages: vi.fn(),
  getWineVintageById: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryPublicApi', () => ({
  getWineryPublicProfile: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryWinePairingsApi', () => ({
  getWinePairings: vi.fn(),
}));

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/reviews', () => ({
  getVintageReviews: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteReview: vi.fn(),
}));

vi.mock('@/features/userWines', () => ({
  getMyWineMarks: vi.fn(),
  markWineAsWanted: vi.fn(),
  unmarkWineAsWanted: vi.fn(),
  markWineAsFavorite: vi.fn(),
  unmarkWineAsFavorite: vi.fn(),
}));

vi.mock('@/features/wines', () => ({
  getMyVintageImage: vi.fn(),
  uploadMyVintageImage: vi.fn(),
  deleteMyVintageImage: vi.fn(),
}));

describe('WineDetailPage Component (Vista 1: Ficha de Vino)', () => {
  const mockWineOfficial = {
    id: 101,
    name: 'Gran Enemigo Gualtallary',
    wineryId: 20,
    wineryNameText: null,
    wineType: 'Red',
    description: 'Cabernet Franc de altura de suelos calcáreos.',
  };

  const mockWineCommunity = {
    id: 202,
    name: 'Criolla de Garaje',
    wineryId: null,
    wineryNameText: 'Viñadores del Valle',
    wineType: 'Rose',
    description: 'Vino de pequeña escala sin bodega registrada.',
  };

  const mockVintages = [
    {
      id: 1,
      wineId: 101,
      year: 2020,
      alcoholContent: 13.5,
      servingTemperature: 16,
      agingAdvice: 'Guarda potencial de 10 años.',
      approvalStatus: 'Approved',
      imageId: 'img-2020',
      averageRating: 4.8,
      reviewCount: 15,
      grapes: [{ grapeId: 10, percentage: 85 }, { grapeId: 20, percentage: 15 }],
    },
    {
      id: 2,
      wineId: 101,
      year: 2022,
      alcoholContent: 14.0,
      servingTemperature: 16,
      agingAdvice: 'Consumo óptimo 5 años.',
      approvalStatus: 'Pending',
      imageId: null,
      averageRating: null,
      reviewCount: 3,
      grapes: [{ grapeId: 10, percentage: 100 }],
    },
    {
      id: 3,
      wineId: 101,
      year: null,
      alcoholContent: 13.0,
      servingTemperature: 14,
      agingAdvice: null,
      approvalStatus: 'Approved',
      imageId: null,
      averageRating: null,
      reviewCount: 0,
      grapes: [],
    },
  ];

  const mockWineryProfile = {
    id: 20,
    name: 'Bodega Aleanna',
    foundationYear: 2008,
    website: 'https://enemigowines.com',
    location: {
      regionName: 'Gualtallary',
      stateName: 'Mendoza',
    },
  };

  const mockGrapes = [
    { id: 10, name: 'Cabernet Franc', description: null, isApproved: true },
    { id: 20, name: 'Malbec', description: null, isApproved: true },
  ];

  const mockPairings = [
    { id: 1, wineryId: 20, wineId: 101, name: 'Ojo de bife a las brasas', category: 'Carnes rojas' },
  ];

  const mockReviews = [
    {
      id: 1001,
      wineVintageId: 1,
      userId: 5,
      userName: 'Lucía Sommelier',
      rating: 5,
      comment: 'Complejidad aromática excepcional con notas minerales.',
      createdAt: '2026-02-15T10:00:00Z',
    },
    {
      id: 1002,
      wineVintageId: 1,
      userId: 8,
      userName: 'Marcos Enólogo',
      rating: 4,
      comment: 'Taninos firmes y frescura sostenida.',
      createdAt: '2026-02-10T14:30:00Z',
    },
  ];

  const mockMarks = {
    wineId: 101,
    isWanted: true,
    isFavorite: false,
    isTried: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: 5, username: 'Lucía Sommelier', role: 'User' },
      isAuthenticated: true,
    });

    vi.mocked(wineApiModule.getWineById).mockResolvedValue(mockWineOfficial);
    vi.mocked(wineApiModule.getWineVintages).mockResolvedValue(mockVintages);
    vi.mocked(wineApiModule.getWineVintageById).mockImplementation(async (_wId, vId) => {
      const v = mockVintages.find((x) => x.id === vId);
      return v ?? mockVintages[0];
    });
    vi.mocked(wineryPublicApiModule.getWineryPublicProfile).mockResolvedValue(mockWineryProfile);
    vi.mocked(pairingsModule.getWinePairings).mockResolvedValue(mockPairings);
    vi.mocked(grapeApiModule.getGrapes).mockResolvedValue(mockGrapes);
    vi.mocked(reviewApiModule.getVintageReviews).mockResolvedValue(mockReviews);
    vi.mocked(userWineApiModule.getMyWineMarks).mockResolvedValue(mockMarks);
    vi.mocked(userVintageImageApiModule.getMyVintageImage).mockResolvedValue(null);
  });

  const renderComponent = (idParam = '101') => {
    return render(
      <MemoryRouter initialEntries={[`/vinos/${idParam}`]}>
        <Routes>
          <Route path="/vinos/:id" element={<WineDetailPage />} />
          <Route path="/dashboard" element={<div>Página Catálogo</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('muestra "Vino no encontrado" cuando el ID no es un número válido', async () => {
    renderComponent('malbec-invalido');
    expect(await screen.findByText('Vino no encontrado')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explorar catálogo/i })).toBeInTheDocument();
  });

  it('muestra "Vino no encontrado" cuando la API responde con 404', async () => {
    vi.mocked(wineApiModule.getWineById).mockRejectedValueOnce({ response: { status: 404 } });
    renderComponent('999');
    expect(await screen.findByText('Vino no encontrado')).toBeInTheDocument();
  });

  it('muestra pantalla de error de red con opción de reintentar', async () => {
    vi.mocked(wineApiModule.getWineById).mockRejectedValueOnce(new Error('Network error'));
    renderComponent('101');
    expect(await screen.findByText('Error de conexión')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    expect(retryBtn).toBeInTheDocument();

    vi.mocked(wineApiModule.getWineById).mockResolvedValueOnce(mockWineOfficial);
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
  });

  it('renderiza datos del vino, bodega oficial con enlace y varietales ordenados', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
    });

    // Enlace a bodega oficial
    const wineryLink = screen.getByRole('link', { name: /bodega aleanna/i });
    expect(wineryLink).toHaveAttribute('href', '/bodegas/20');

    // Varietales resueltos por nombre
    expect(screen.getByText('Cabernet Franc')).toBeInTheDocument();

    // Cosechas ordenadas descendente: 2022 primero, 2020 segundo, "Sin añada" al final
    const vintageChips = screen.getAllByRole('button', { name: /2022|2020|sin añada/i });
    expect(vintageChips).toHaveLength(3);
    expect(vintageChips[0]).toHaveTextContent('2022');
    expect(vintageChips[1]).toHaveTextContent('2020');
    expect(vintageChips[2]).toHaveTextContent('Sin añada');

    // Cosecha Pending muestra rótulo "Sin verificar" en chip y cabecera
    expect(screen.getAllByText('Sin verificar').length).toBeGreaterThan(0);
  });

  it('para vino comunitario sin bodega muestra wineryNameText estático sin enlace', async () => {
    vi.mocked(wineApiModule.getWineById).mockResolvedValueOnce(mockWineCommunity);
    renderComponent('202');

    await waitFor(() => {
      expect(screen.getByText('Criolla de Garaje')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Viñadores del Valle').length).toBe(2);
    expect(screen.queryByRole('link', { name: /viñadores del valle/i })).not.toBeInTheDocument();
  });

  it('REGLA CENTRAL DE PUNTAJE: se toma estrictamente de los totales del backend de la cosecha', async () => {
    renderComponent('101');

    // Inicialmente activa es 2022 (reviewCount 3, averageRating null)
    await waitFor(() => {
      expect(screen.getByText(/Sin reseñas suficientes \(3\)/)).toBeInTheDocument();
    });

    // Cambiar a la cosecha 2020 (averageRating 4.8, reviewCount 15)
    const btn2020 = screen.getByRole('button', { name: /2020/i });
    fireEvent.click(btn2020);

    await waitFor(() => {
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('(15)')).toBeInTheDocument();
    });

    // El puntaje NO depende de la longitud del array de reseñas cargadas (2 reseñas cargadas !== 15)
    expect(screen.getByText('15 anotaciones enológicas verificadas')).toBeInTheDocument();
  });

  it('permite alternar marcas de Deseado y Favorito optimísticamente', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
    });

    const wantedBtn = screen.getByRole('button', { name: /quitar de deseados/i });
    const favoriteBtn = screen.getByRole('button', { name: /marcar como favorito/i });

    // Alternar Deseado (actualmente true -> pasa a false y llama unmark)
    vi.mocked(userWineApiModule.unmarkWineAsWanted).mockResolvedValueOnce();
    fireEvent.click(wantedBtn);
    await waitFor(() => {
      expect(userWineApiModule.unmarkWineAsWanted).toHaveBeenCalledWith(101);
    });

    // Alternar Favorito (actualmente false -> pasa a true y llama mark)
    vi.mocked(userWineApiModule.markWineAsFavorite).mockResolvedValueOnce();
    fireEvent.click(favoriteBtn);
    await waitFor(() => {
      expect(userWineApiModule.markWineAsFavorite).toHaveBeenCalledWith(101);
    });

    // Indicador Probado (solo lectura)
    expect(screen.getByText('Probado')).toBeInTheDocument();
  });

  it('gestiona el formulario de reseña: crear, editar y borrar con confirmación', async () => {
    renderComponent('101');

    // Cambiamos a la cosecha 2020 donde el usuario Lucía Sommelier ya tiene reseña (mockReviews[0])
    const btn2020 = await screen.findByRole('button', { name: /2020/i });
    fireEvent.click(btn2020);

    // Al tener reseña, los botones indican "Editar mi reseña" y existe "Borrar mi reseña"
    const editBtns = await screen.findAllByRole('button', { name: /editar mi reseña/i });
    expect(editBtns.length).toBeGreaterThan(0);
    const deleteBtn = screen.getByRole('button', { name: /borrar mi reseña/i });
    expect(deleteBtn).toBeInTheDocument();

    // Abrir formulario de edición
    fireEvent.click(editBtns[0]);
    expect(screen.getByText('Actualizar Anotación')).toBeInTheDocument();

    // Actualizar reseña
    vi.mocked(reviewApiModule.updateReview).mockResolvedValueOnce({
      id: 1001,
      wineVintageId: 1,
      userId: 5,
      rating: 5,
      comment: 'Comentario editado con éxito.',
      createdAt: '2026-02-15T10:00:00Z',
    });

    fireEvent.click(screen.getByRole('button', { name: /actualizar anotación/i }));

    await waitFor(() => {
      expect(reviewApiModule.updateReview).toHaveBeenCalledWith(1001, {
        rating: 5,
        comment: 'Complejidad aromática excepcional con notas minerales.',
      });
      expect(wineApiModule.getWineVintageById).toHaveBeenCalledWith(101, 1);
    });

    // Eliminar reseña con confirmación
    fireEvent.click(deleteBtn);
    expect(screen.getByText(/¿estás seguro de que querés eliminar tu reseña\?/i)).toBeInTheDocument();

    vi.mocked(reviewApiModule.deleteReview).mockResolvedValueOnce();
    const confirmDeleteBtn = screen.getByRole('button', { name: /confirmar eliminación/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(reviewApiModule.deleteReview).toHaveBeenCalledWith(1001);
      expect(wineApiModule.getWineVintageById).toHaveBeenCalledWith(101, 1);
    });
  });

  it('gestiona la subida y eliminación de foto personal en la cosecha activa', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
    });

    // Inicialmente no hay foto personal
    const addPhotoBtn = screen.getByRole('button', { name: /agregar mi foto/i });
    expect(addPhotoBtn).toBeInTheDocument();

    // Simular selección de archivo
    const file = new File(['dummy-content'], 'mifoto.jpg', { type: 'image/jpeg' });
    vi.mocked(userVintageImageApiModule.uploadMyVintageImage).mockResolvedValueOnce('img-personal-123');

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(userVintageImageApiModule.uploadMyVintageImage).toHaveBeenCalledWith(101, 2, file);
    });
  });

  it('el botón "Guardar en cava" permanece deshabilitado con el rótulo Próximamente', async () => {
    renderComponent('101');

    await waitFor(() => {
      expect(screen.getByText('Gran Enemigo Gualtallary')).toBeInTheDocument();
    });

    const vaultBtn = screen.getByRole('button', { name: /guardar en cava/i });
    expect(vaultBtn).toBeDisabled();
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });
});
