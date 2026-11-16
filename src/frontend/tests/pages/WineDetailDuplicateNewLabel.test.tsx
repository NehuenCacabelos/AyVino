import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import WineryNewWinePage from '@/pages/WineryNewWinePage';
import * as wineryModule from '@/features/winery';
import * as wineApi from '@/features/winery/api/wineApi';
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
}));

describe('Bloque 6 - Modal de Confirmación de Etiqueta Existente y Nueva Variedad', () => {
  const mockWineryData: WineryResponseDto = {
    id: 10,
    name: 'Bodega Aleanna',
    slug: 'bodega-aleanna',
    description: 'Bodega de montaña en Mendoza.',
    locationId: 1,
    status: 'Approved',
    rejectionReason: null,
    logoUrl: null,
    bannerUrl: null,
    websiteUrl: 'https://aleannawines.com',
    email: 'contacto@aleannawines.com',
    phone: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const mockUseWineryReturn: UseMyWineryReturn = {
    winery: mockWineryData,
    isLoading: false,
    error: null,
    isOwner: true,
    isApproved: true,
    refetch: vi.fn(),
  };

  const mockGrapesCatalog = [
    { id: 1, name: 'Malbec', colorType: 'Red' },
    { id: 2, name: 'Cabernet Franc', colorType: 'Red' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wineryModule.useWinery).mockReturnValue(mockUseWineryReturn);
    vi.mocked(grapeApi.getGrapes).mockResolvedValue(mockGrapesCatalog);
    vi.mocked(pairingsApi.getPairingsCatalog).mockResolvedValue([]);
    vi.mocked(pairingsApi.getWinePairings).mockResolvedValue([]);
    vi.mocked(wineApi.getWineVintages).mockResolvedValue([
      {
        id: 301,
        wineId: 105,
        year: 2021,
        alcoholContent: 14.5,
        servingTemperature: 16,
        agingAdvice: '10 años',
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
      agingAdvice: '10 años',
      imageId: null,
      approvalStatus: 'Approved',
      uploadedByUserId: 1,
      registerDate: new Date('2026-01-01'),
      averageRating: 0,
      reviewCount: 0,
      grapes: [],
    });
    vi.mocked(imageApi.uploadVintageImage).mockResolvedValue({ imageId: 'img-123' });
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

  it('409 muestra el modal con las añadas existentes listadas', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino en esta bodega.',
          existingWineId: 555,
          existingVintages: [
            { year: 2022, mainGrapeId: 1, mainGrapeName: 'Malbec' },
            { year: 2023, mainGrapeId: 1, mainGrapeName: 'Malbec' },
          ],
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(error409);

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

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    // Diálogo modal aparece con título y mensaje
    expect(await screen.findByText('Etiqueta existente')).toBeInTheDocument();
    expect(
      screen.getByText(/Ya tenés «Gran Enemigo Gualtallary» en tu catálogo\. ¿Querés agregar la cosecha 2021 a ese vino\?/i)
    ).toBeInTheDocument();

    // Listado de cosechas existentes en el cuerpo del modal
    expect(screen.getByText(/2022 · Malbec/i)).toBeInTheDocument();
    expect(screen.getByText(/2023 · Malbec/i)).toBeInTheDocument();

    // Botones presentes
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar cosecha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Crear etiqueta nueva/i })).toBeInTheDocument();
  });

  it('acción "Agregar cosecha" llama a createWineVintage y navega', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino.',
          existingWineId: 555,
          existingVintages: [{ year: 2020, mainGrapeId: 1, mainGrapeName: 'Malbec' }],
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(error409);

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

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    const addVintageBtn = await screen.findByRole('button', { name: /Agregar cosecha/i });
    fireEvent.click(addVintageBtn);

    await waitFor(() => {
      expect(wineApi.createWineVintage).toHaveBeenCalledWith(
        555,
        expect.objectContaining({
          year: 2021,
        })
      );
    });

    expect(await screen.findByText('Detalle Vino Creado')).toBeInTheDocument();
  });

  it('acción "Crear etiqueta nueva" reenvía el POST con confirmNewLabel true', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino pero no posee la cosecha.',
          existingWineId: 555,
          existingVintages: [{ year: 2020, mainGrapeId: 1, mainGrapeName: 'Malbec' }],
        },
      },
    };

    // Primera llamada rechaza con 409; segunda llamada resuelve creación exitosa
    vi.mocked(wineApi.createWine)
      .mockRejectedValueOnce(error409)
      .mockResolvedValueOnce({
        id: 777,
        name: 'Gran Enemigo Gualtallary',
        slug: 'gran-enemigo-gualtallary',
        description: null,
        wineType: 'Red',
        locationId: 1,
        wineryId: 10,
        sourceType: 'Official',
        averageRating: 0,
        reviewCount: 0,
        registerDate: new Date('2026-01-01'),
        firstVintageId: 888,
      });

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

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    const newLabelBtn = await screen.findByRole('button', { name: /Crear etiqueta nueva/i });
    fireEvent.click(newLabelBtn);

    await waitFor(() => {
      expect(wineApi.createWine).toHaveBeenCalledTimes(2);
      expect(wineApi.createWine).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Gran Enemigo Gualtallary',
          confirmNewLabel: true,
        })
      );
    });

    expect(await screen.findByText('Detalle Vino Creado')).toBeInTheDocument();
  });

  it('muestra sugerencia "Parece una variedad distinta" y destaca esa acción si la uva del draft es distinta', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino.',
          existingWineId: 555,
          existingVintages: [{ year: 2020, mainGrapeId: 1, mainGrapeName: 'Malbec' }],
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(error409);

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

    // Cargar uva Cabernet Franc (id 2) mediante el buscador / combobox
    const grapeInput = await screen.findByPlaceholderText(/Buscar uva/i);
    fireEvent.focus(grapeInput);
    fireEvent.change(grapeInput, { target: { value: 'Cabernet Franc' } });
    const option = await screen.findByText('Cabernet Franc');
    fireEvent.click(option);

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    // Aparece sugerencia "Parece una variedad distinta"
    expect(await screen.findByText(/Parece una variedad distinta/i)).toBeInTheDocument();

    // El botón "Crear etiqueta nueva" tiene la estética de Publicar etiqueta (bg-[#6e1a24])
    const newLabelBtn = screen.getByRole('button', { name: /Crear etiqueta nueva/i });
    expect(newLabelBtn.className).toContain('bg-[#6e1a24]');

    // El botón "Agregar cosecha" es punteado como + Añada / + Agregar
    const addVintageBtn = screen.getByRole('button', { name: /Agregar cosecha/i });
    expect(addVintageBtn.className).toContain('border-dashed');
  });

  it('renderiza "Agregar cosecha" punteado y "Crear etiqueta nueva" con estética de publicación cuando coinciden uvas', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino.',
          existingWineId: 555,
          existingVintages: [{ year: 2020, mainGrapeId: 1, mainGrapeName: 'Malbec' }],
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(error409);

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

    // Cargar uva Malbec (id 1)
    const grapeInput = await screen.findByPlaceholderText(/Buscar uva/i);
    fireEvent.focus(grapeInput);
    fireEvent.change(grapeInput, { target: { value: 'Malbec' } });
    const option = await screen.findByText('Malbec');
    fireEvent.click(option);

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    // NO debe aparecer sugerencia de variedad distinta
    expect(await screen.findByText('Etiqueta existente')).toBeInTheDocument();
    expect(screen.queryByText(/Parece una variedad distinta/i)).not.toBeInTheDocument();

    // El botón "Agregar cosecha" es punteado
    const addVintageBtn = screen.getByRole('button', { name: /Agregar cosecha/i });
    expect(addVintageBtn.className).toContain('border-dashed');

    // El botón "Crear etiqueta nueva" tiene el fondo vino de Publicar etiqueta
    const newLabelBtn = screen.getByRole('button', { name: /Crear etiqueta nueva/i });
    expect(newLabelBtn.className).toContain('bg-[#6e1a24]');
  });

  it('cancelar cierra el modal sin llamar a APIs y preserva el formulario intacto', async () => {
    const error409 = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino.',
          existingWineId: 555,
          existingVintages: [{ year: 2020, mainGrapeId: 1, mainGrapeName: 'Malbec' }],
        },
      },
    };
    vi.mocked(wineApi.createWine).mockRejectedValue(error409);

    renderComponent();

    const nameInput = screen.getByPlaceholderText('Ej.: Gran Reserva Malbec');
    fireEvent.change(nameInput, { target: { value: 'Gran Enemigo Gualtallary' } });

    const typeSelect = screen.getByLabelText(/Seleccionar tipo de vino/i);
    fireEvent.change(typeSelect, { target: { value: 'Red' } });

    const yearInput = screen.getByPlaceholderText('Ej.: 2020');
    fireEvent.change(yearInput, { target: { value: '2021' } });

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    expect(await screen.findByText('Etiqueta existente')).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    // Modal se cierra
    await waitFor(() => {
      expect(screen.queryByText('Etiqueta existente')).not.toBeInTheDocument();
    });

    // Ninguna llamada adicional a createWine o createWineVintage
    expect(wineApi.createWineVintage).not.toHaveBeenCalled();
    expect(wineApi.createWine).toHaveBeenCalledTimes(1);

    // Formulario intacto
    expect(nameInput).toHaveValue('Gran Enemigo Gualtallary');
    expect(typeSelect).toHaveValue('Red');
    expect(yearInput).toHaveValue(2021);
  });

  it('si el backend responde 409 también con confirmNewLabel true, muestra toast y no entra en bucle', async () => {
    const errorAddVintage = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe el vino en catálogo.',
          existingWineId: 555,
          existingVintages: [{ year: 2020, mainGrapeId: 1, mainGrapeName: 'Malbec' }],
        },
      },
    };
    const errorSameGrape = {
      response: {
        status: 409,
        data: {
          code: 'WINE_EXISTS_ADD_VINTAGE',
          detail: 'Ya existe una etiqueta con la misma uva principal.',
          existingWineId: 555,
        },
      },
    };

    vi.mocked(wineApi.createWine)
      .mockRejectedValueOnce(errorAddVintage)
      .mockRejectedValueOnce(errorSameGrape);

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

    fireEvent.click(screen.getByRole('button', { name: /Publicar etiqueta/i }));

    const newLabelBtn = await screen.findByRole('button', { name: /Crear etiqueta nueva/i });
    fireEvent.click(newLabelBtn);

    // Muestra toast con el error devuelto por el backend
    expect(await screen.findByText('Ya existe una etiqueta con la misma uva principal.')).toBeInTheDocument();

    // No reabre el modal
    expect(screen.queryByText('Etiqueta existente')).not.toBeInTheDocument();
  });
});
