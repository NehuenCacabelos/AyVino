import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, createMemoryRouter, RouterProvider } from 'react-router-dom';
import WineryNewWinePage from '@/pages/WineryNewWinePage';
import * as wineryModule from '@/features/winery';
import * as wineApi from '@/features/winery/api/wineApi';
import * as wineryApi from '@/features/winery/api/wineryApi';
import * as pairingsApi from '@/features/winery/api/wineryWinePairingsApi';
import * as grapeApi from '@/features/winery/api/grapeApi';
import * as imageApi from '@/features/winery/api/imageApi';
import type { UseMyWineryReturn, WineryResponseDto } from '@/features/winery';

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

vi.mock('@/features/winery/api/wineApi', () => ({
  createWine: vi.fn(),
  updateWine: vi.fn(),
  getWineVintages: vi.fn(),
  createWineVintage: vi.fn(),
  updateWineVintage: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryApi', () => ({
  getWineryById: vi.fn(),
}));

vi.mock('@/features/winery/api/wineryWinePairingsApi', () => ({
  getWinePairings: vi.fn(),
  getPairingsCatalog: vi.fn(),
  addWinePairing: vi.fn(),
  removeWinePairing: vi.fn(),
}));

vi.mock('@/features/winery/api/grapeApi', () => ({
  getGrapes: vi.fn(),
}));

vi.mock('@/features/winery/api/imageApi', () => ({
  uploadVintageImage: vi.fn(),
  deleteVintageImage: vi.fn(),
}));

describe('Alta de Vino Nuevo en Plantilla (Paso 3)', () => {
  const mockMyWinery: WineryResponseDto = {
    id: 10,
    name: 'Bodega Catena Zapata',
    description: 'Bodega familiar pionera en Mendoza.',
    locationId: 1,
    foundationYear: 1902,
    website: 'https://catenazapata.com',
    userId: 1,
    status: 'Approved',
    registerDate: '2026-01-01',
    location: {
      stateName: 'Mendoza',
      regionName: 'Luján de Cuyo',
    },
  };

  const mockUseWineryReturn: UseMyWineryReturn = {
    winery: mockMyWinery,
    isLoading: false,
    error: null,
    isPending: false,
    isApproved: true,
    isRejected: false,
    isClaimedPending: false,
    reload: vi.fn(),
  };

  const mockGrapesCatalog = [
    { id: 1, name: 'Malbec', colorType: 'Red' },
    { id: 2, name: 'Cabernet Franc', colorType: 'Red' },
  ];

  const mockPairingsList = [
    { id: 1, name: 'Bife de chorizo', category: 'Meat' },
    { id: 2, name: 'Cordero braseado', category: 'Meat' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryModule.useWinery).mockReturnValue(mockUseWineryReturn);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapesCatalog);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValue(mockPairingsList);
    vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([]);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([
      {
        id: 301,
        wineId: 105,
        year: 2021,
        alcoholContent: 14.5,
        servingTemperature: 16,
        agingAdvice: '10 a 15 años',
        imageId: null,
        approvalStatus: 'Approved',
        uploadedByUserId: 1,
        registerDate: new Date('2026-01-01'),
        averageRating: 0,
        reviewCount: 0,
        grapes: [],
      },
    ]);
    vi.mocked(wineApi.createWine).mockResolvedValue({
      id: 105,
      name: 'Gran Enemigo Gualtallary',
      slug: 'gran-enemigo-gualtallary',
      description: 'Vino ícono de montaña.',
      wineType: 'Red',
      locationId: 1,
      wineryId: 10,
      sourceType: 'Official',
      averageRating: 0,
      reviewCount: 0,
      registerDate: new Date('2026-01-01'),
      firstVintageId: 301,
    });
    vi.mocked(wineApi.createWineVintage).mockResolvedValue({
      id: 302,
      wineId: 105,
      year: 2021,
      alcoholContent: 14.5,
      servingTemperature: 16,
      agingAdvice: '10 a 15 años',
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: new Date('2026-01-01'),
      averageRating: 0,
      reviewCount: 0,
      grapes: [],
    });
    vi.mocked(imageApi.uploadVintageImage).mockResolvedValue({ imageId: 'img-123' });
    vi.mocked(pairingsApi.addWinePairing).mockResolvedValue();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/bodega/vinos/nuevo']}>
        <Routes>
          <Route path="/bodega/vinos/nuevo" element={<WineryNewWinePage />} />
          <Route path="/bodega/vinos/:wineId" element={<div>Detalle Vino Creado</div>} />
          <Route path="/bodega/vinos" element={<div>Vista Catálogo</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renderiza la plantilla vacía con los textos guía correspondientes y perfil sensorial en cero', async () => {
    renderComponent();

    // Nombre vacío con placeholder guía
    const nameInput = screen.getByPlaceholderText('Ej.: Gran Reserva Malbec');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveValue('');

    // Tipo con opción inicial 'Elegí un tipo'
    const typeSelect = screen.getByLabelText(/Seleccionar tipo de vino/i);
    expect(typeSelect).toHaveValue('');

    // Año de cosecha con placeholder 'Ej.: 2020'
    const yearInput = screen.getByPlaceholderText('Ej.: 2020');
    expect(yearInput).toBeInTheDocument();
    expect(yearInput).toHaveValue(null);

    // Composición varietal vacía con texto guía
    expect(screen.getByText('Agregá la primera uva')).toBeInTheDocument();

    // Bodega en solo lectura
    expect(screen.getAllByText('Bodega Catena Zapata').length).toBeGreaterThanOrEqual(1);

    // Perfil sensorial todo en 0.0
    const zeroScores = screen.getAllByText('0.0');
    expect(zeroScores.length).toBeGreaterThanOrEqual(5);

    // Botones deshabilitados que dependen de vino existente
    expect(screen.getByRole('button', { name: /Guardar en cava/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Escribir reseña/i })).toBeDisabled();

    // Botón flotante 'Publicar etiqueta' visible
    expect(screen.getByRole('button', { name: /Publicar etiqueta/i })).toBeInTheDocument();
  });

  it('valida campos obligatorios mostrando mensaje claro en toast y resaltando campos sin deshabilitar el botón', async () => {
    renderComponent();

    const publishBtn = screen.getByRole('button', { name: /Publicar etiqueta/i });
    fireEvent.click(publishBtn);

    // Muestra toast con los campos faltantes
    await waitFor(() => {
      expect(
        screen.getByText(/Completá los campos obligatorios: Nombre del vino, Tipo de vino, Año de la primera cosecha/i)
      ).toBeInTheDocument();
    });

    expect(wineApi.createWine).not.toHaveBeenCalled();

    // Si completamos nombre, los faltantes se reducen
    const nameInput = screen.getByPlaceholderText('Ej.: Gran Reserva Malbec');
    fireEvent.change(nameInput, { target: { value: 'Gran Enemigo' } });

    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Completá los campos obligatorios: Tipo de vino, Año de la primera cosecha/i)
      ).toBeInTheDocument();
    });
  });

  it('publica exitosamente ejecutando la secuencia completa (createWine -> uploadVintageImage -> addWinePairing -> navigate)', async () => {
    renderComponent();

    // 1. Completar campos obligatorios
    fireEvent.change(screen.getByPlaceholderText('Ej.: Gran Reserva Malbec'), {
      target: { value: 'Gran Enemigo Gualtallary' },
    });
    fireEvent.change(screen.getByLabelText(/Seleccionar tipo de vino/i), {
      target: { value: 'Red' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej.: 2020'), {
      target: { value: '2021' },
    });

    // 2. Agregar maridaje desde el catálogo
    const addPairingBtn = screen.getByRole('button', { name: '+ Agregar' });
    fireEvent.click(addPairingBtn);

    expect(await screen.findByText('Catálogo de Maridajes')).toBeInTheDocument();
    const bifeBtn = screen.getByRole('button', { name: /Bife de chorizo/i });
    fireEvent.click(bifeBtn);

    // 3. Adjuntar foto de botella
    const fileInput = screen.getByLabelText('Subir foto de botella');
    const dummyFile = new File(['dummy-content'], 'botella.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    // 4. Clic en publicar
    const publishBtn = screen.getByRole('button', { name: /Publicar etiqueta/i });
    fireEvent.click(publishBtn);

    // Verificaciones de orden y llamadas de API
    await waitFor(() => {
      expect(wineApi.createWine).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Gran Enemigo Gualtallary',
          wineType: 'Red',
          wineryId: 10,
          firstVintage: expect.objectContaining({
            year: 2021,
          }),
        })
      );
    });

    await waitFor(() => {
      expect(imageApi.uploadVintageImage).toHaveBeenCalledWith(105, 301, dummyFile);
    });

    await waitFor(() => {
      expect(pairingsApi.addWinePairing).toHaveBeenCalledWith(105, 1);
    });

    // Navega a la vista de la etiqueta creada
    expect(await screen.findByText('Detalle Vino Creado')).toBeInTheDocument();
  });

  it('maneja fallas parciales de imagen navegando igual a la etiqueta creada con aviso contextual', async () => {
    vi.mocked(imageApi.uploadVintageImage).mockRejectedValue(new Error('Network error on image'));

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Ej.: Gran Reserva Malbec'), {
      target: { value: 'Gran Enemigo Gualtallary' },
    });
    fireEvent.change(screen.getByLabelText(/Seleccionar tipo de vino/i), {
      target: { value: 'Red' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej.: 2020'), {
      target: { value: '2021' },
    });

    // Adjuntar foto que fallará
    const fileInput = screen.getByLabelText('Subir foto de botella');
    const dummyFile = new File(['dummy-content'], 'botella.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    const publishBtn = screen.getByRole('button', { name: /Publicar etiqueta/i });
    fireEvent.click(publishBtn);

    // Navega igual al vino creado
    expect(await screen.findByText('Detalle Vino Creado')).toBeInTheDocument();
    expect(wineApi.createWine).toHaveBeenCalledTimes(1);
  });

  it('maneja 409 WINE_VINTAGE_DUPLICATE mostrando mensaje con enlace a la etiqueta existente', async () => {
    const errorDuplicate = {
      response: {
        status: 409,
        data: {
          code: 'WINE_VINTAGE_DUPLICATE',
          detail: 'Ya registraste este vino con la cosecha 2021.',
          existingWineId: 888,
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(errorDuplicate);

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Ej.: Gran Reserva Malbec'), {
      target: { value: 'Gran Enemigo Gualtallary' },
    });
    fireEvent.change(screen.getByLabelText(/Seleccionar tipo de vino/i), {
      target: { value: 'Red' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej.: 2020'), {
      target: { value: '2021' },
    });

    const publishBtn = screen.getByRole('button', { name: /Publicar etiqueta/i });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ya registraste este vino con la cosecha 2021/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Ver etiqueta/i })).toHaveAttribute(
        'href',
        '/bodega/vinos/888'
      );
    });

    // Modo edición permanece activo en la misma página
    expect(screen.getByRole('button', { name: /Publicar etiqueta/i })).toBeInTheDocument();
  });

  it('maneja 409 WINE_EXISTS_ADD_VINTAGE abriendo diálogo para confirmar y agregar la cosecha', async () => {
    const errorExists = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'El vino ya existe pero no posee la cosecha.',
          existingWineId: 555,
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(errorExists);

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Ej.: Gran Reserva Malbec'), {
      target: { value: 'Gran Enemigo Gualtallary' },
    });
    fireEvent.change(screen.getByLabelText(/Seleccionar tipo de vino/i), {
      target: { value: 'Red' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej.: 2020'), {
      target: { value: '2021' },
    });

    const publishBtn = screen.getByRole('button', { name: /Publicar etiqueta/i });
    fireEvent.click(publishBtn);

    // Diálogo modal aparece
    expect(
      await screen.findByText(/Ya tenés «Gran Enemigo Gualtallary» en tu catálogo. ¿Querés agregar la cosecha 2021 a ese vino\?/i)
    ).toBeInTheDocument();

    // Confirmar en el modal
    const confirmBtn = screen.getByRole('button', { name: /Agregar cosecha/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(wineApi.createWineVintage).toHaveBeenCalledWith(
        555,
        expect.objectContaining({
          year: 2021,
        })
      );
    });

    // Navega a la etiqueta existente
    expect(await screen.findByText('Detalle Vino Creado')).toBeInTheDocument();
  });

  it('previene doble envío mientras se procesa la publicación', async () => {
    let resolveCreate: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    vi.mocked(wineApi.createWine).mockReturnValue(delayedPromise as any);

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Ej.: Gran Reserva Malbec'), {
      target: { value: 'Gran Enemigo Gualtallary' },
    });
    fireEvent.change(screen.getByLabelText(/Seleccionar tipo de vino/i), {
      target: { value: 'Red' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej.: 2020'), {
      target: { value: '2021' },
    });

    const publishBtn = screen.getByRole('button', { name: /Publicar etiqueta/i });
    fireEvent.click(publishBtn);

    // Botón entra en estado cargando
    expect(await screen.findByText(/Publicando etiqueta.../i)).toBeInTheDocument();

    // Segundo clic inmediato mientras está publicando
    fireEvent.click(publishBtn);

    // Solo se ejecutó una llamada a la API
    expect(wineApi.createWine).toHaveBeenCalledTimes(1);

    // Resolver promesa
    resolveCreate!({
      id: 105,
      name: 'Gran Enemigo Gualtallary',
      slug: 'gran-enemigo-gualtallary',
      description: '',
      wineType: 'Red',
      wineryId: 10,
    });
  });

  it('pide confirmación al intentar salir con cambios sin publicar', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const router = createMemoryRouter(
      [
        { path: '/bodega/vinos/nuevo', element: <WineryNewWinePage /> },
        { path: '/bodega/vinos', element: <div>Vista Catálogo</div> },
      ],
      { initialEntries: ['/bodega/vinos/nuevo'] }
    );
    render(<RouterProvider router={router} />);

    // Modificar un campo para marcar cambios pendientes
    const nameInput = screen.getByPlaceholderText('Ej.: Gran Reserva Malbec');
    fireEvent.change(nameInput, { target: { value: 'Borrador sin publicar' } });

    // Intentar navegar hacia atrás
    const backLink = screen.getByText(/← Volver a explorar/i);
    fireEvent.click(backLink);

    // Se solicita confirmación
    expect(confirmSpy).toHaveBeenCalled();
  });
});
