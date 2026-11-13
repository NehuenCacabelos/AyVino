import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickAddBottleModal from '@/features/cava/components/QuickAddBottleModal';
import { sortGrapesForWineType } from '@/features/cava/api/grapesCatalogCache';
import { apiClient } from '@/services/apiClient';
import type { GrapeResponseDto } from '@/features/winery/types';

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('Bloque U5 - QuickAddBottleModal & Vino Comunitario', () => {
  const sampleGrapes: GrapeResponseDto[] = [
    { id: 1, name: 'Malbec', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 2, name: 'Cabernet Sauvignon', colorType: 'Red', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 9, name: 'Chardonnay', colorType: 'White', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 10, name: 'Torrontés Riojano', colorType: 'White', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
    { id: 15, name: 'Criolla Chica', colorType: 'Rose', typicalBody: null, typicalTannins: null, typicalAcidity: null, description: null },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Default GET mocking for grapes catalog and check-duplicate
    vi.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/grapes') {
        return Promise.resolve({ data: sampleGrapes });
      }
      if (url === '/wines/check-duplicate') {
        return Promise.resolve({ data: { hasMatch: false } });
      }
      return Promise.resolve({ data: [] });
    });
  });

  describe('1. Ordenamiento de uvas por color del tipo seleccionado', () => {
    it('prioriza uvas tintas para vino Tinto (Red)', () => {
      const sorted = sortGrapesForWineType(sampleGrapes, 'Red');
      expect(sorted[0].colorType).toBe('Red');
      expect(sorted[1].colorType).toBe('Red');
      expect(sorted[0].name).toBe('Cabernet Sauvignon');
      expect(sorted[1].name).toBe('Malbec');
      // Las no tintas van después
      expect(sorted[2].colorType).not.toBe('Red');
    });

    it('prioriza uvas blancas para vino Blanco (White)', () => {
      const sorted = sortGrapesForWineType(sampleGrapes, 'White');
      expect(sorted[0].colorType).toBe('White');
      expect(sorted[1].colorType).toBe('White');
      expect(sorted[0].name).toBe('Chardonnay');
      expect(sorted[1].name).toBe('Torrontés Riojano');
      // Las tintas van después
      expect(sorted[2].colorType).not.toBe('White');
    });

    it('prioriza uvas rosadas y tintas para vino Rosado (Rose)', () => {
      const sorted = sortGrapesForWineType(sampleGrapes, 'Rose');
      const firstThreeColors = sorted.slice(0, 3).map((g) => g.colorType);
      expect(firstThreeColors).toContain('Rose');
      expect(firstThreeColors).toContain('Red');
    });
  });

  describe('2. Obligatoriedad de la uva por tipo', () => {
    it('exige uva principal para vino Tinto si el usuario la quita', async () => {
      render(
        <MemoryRouter>
          <QuickAddBottleModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      // Escribir nombre y bodega
      const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
      fireEvent.change(nameInput, { target: { value: 'Gran Corte 2020' } });

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Finca Las Moras' } });

      // Quitar uva seleccionada
      const grapeInput = screen.getByRole('combobox', { name: /Uva Principal/i });
      fireEvent.change(grapeInput, { target: { value: '' } });

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      // Debe mostrar error de validación y NO enviar quick-add
      expect(
        await screen.findByText('La uva principal es obligatoria para vinos tintos y blancos.'),
      ).toBeInTheDocument();
      expect(apiClient.post).not.toHaveBeenCalled();
    });

    it('permite guardar sin uva principal cuando el tipo es Rosado, Espumoso o Naranjo', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          wineVintageId: 50,
          wineId: 25,
          name: 'Burbujas del Valle',
          wineType: 'Sparkling',
          quantity: 2,
        },
      });

      render(
        <MemoryRouter>
          <QuickAddBottleModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      // Cambiar tipo a Espumoso
      const typeSelect = screen.getByLabelText(/Tipo \*/i);
      fireEvent.change(typeSelect, { target: { value: 'Sparkling' } });

      const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
      fireEvent.change(nameInput, { target: { value: 'Burbujas del Valle' } });

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Bodega Chandon' } });

      // Quitar uva
      const clearBtn = await screen.findByRole('button', { name: /Limpiar|Quitar/i });
      fireEvent.click(clearBtn);

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/cellars/me/quick-add',
          expect.objectContaining({
            name: 'Burbujas del Valle',
            wineType: 'Sparkling',
            mainGrapeId: null,
          }),
        );
      });
    });
  });

  describe('3. Sugerencias de bodega y texto libre', () => {
    it('muestra desplegable con bodegas registradas debounced y permite seleccionar una', async () => {
      vi.mocked(apiClient.get).mockImplementation((url) => {
        if (url === '/wineries/suggest') {
          return Promise.resolve({
            data: [
              { id: 10, name: 'Bodega Catena Zapata' },
              { id: 11, name: 'Catena Wines' },
            ],
          });
        }
        if (url === '/grapes') {
          return Promise.resolve({ data: sampleGrapes });
        }
        if (url === '/wines/check-duplicate') {
          return Promise.resolve({ data: { hasMatch: false } });
        }
        return Promise.resolve({ data: [] });
      });

      render(
        <MemoryRouter>
          <QuickAddBottleModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Catena' } });

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          '/wineries/suggest',
          expect.objectContaining({ params: { q: 'Catena' } }),
        );
      });

      const option = await screen.findByRole('option', { name: /Bodega Catena Zapata/i });
      expect(option).toBeInTheDocument();

      fireEvent.click(option);
      expect(wineryInput).toHaveValue('Bodega Catena Zapata');
    });

    it('permite ingresar texto libre si la bodega no existe en las sugerencias', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          wineVintageId: 1,
          wineId: 1,
          name: 'Vino Casero',
        },
      });

      render(
        <MemoryRouter>
          <QuickAddBottleModal isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>,
      );

      const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
      fireEvent.change(nameInput, { target: { value: 'Vino Casero Familiar' } });

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Viñedo de Don Juan (Comunitario)' } });

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/cellars/me/quick-add',
          expect.objectContaining({
            wineryName: 'Viñedo de Don Juan (Comunitario)',
            matchedWineId: null,
          }),
        );
      });
    });
  });

  describe('4. Subida de imagen opcional en segunda llamada y falla parcial', () => {
    it('sube la imagen en segunda llamada y avisa si falla la subida sin cancelar el vino creado', async () => {
      const showToastSpy = vi.fn();

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          wineVintageId: 88,
          wineId: 44,
          name: 'Corte Especial',
        },
      });

      // La subida de imagen falla
      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error('Network error uploading image'));

      render(
        <MemoryRouter>
          <QuickAddBottleModal isOpen={true} onClose={vi.fn()} showToast={showToastSpy} />
        </MemoryRouter>,
      );

      const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
      fireEvent.change(nameInput, { target: { value: 'Corte Especial' } });

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Bodega Norton' } });

      // Subir archivo de imagen simulado
      const file = new File(['dummy-image-content'], 'foto_etiqueta.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/Subir foto de la etiqueta/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Vista previa presente
      expect(await screen.findByText('foto_etiqueta.jpg')).toBeInTheDocument();

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      // Debe llamar primero a quick-add
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/cellars/me/quick-add',
          expect.objectContaining({ name: 'Corte Especial' }),
        );
      });

      // Luego a la ruta de imagen
      await waitFor(() => {
        expect(apiClient.put).toHaveBeenCalledWith(
          '/wines/44/vintages/88/image',
          expect.any(FormData),
          expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
        );
      });

      // Como la imagen falló pero el vino quedó guardado, muestra aviso de advertencia
      await waitFor(() => {
        expect(showToastSpy).toHaveBeenCalledWith(
          'Tu vino quedó cargado en tu cava y será revisado por AyVino, pero la imagen no pudo subirse.',
        );
      });
    });
  });

  describe('5. Manejo de error 409 (Duplicado del servidor)', () => {
    it('muestra el mensaje de conflicto del backend y no cierra el modal', async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          status: 409,
          data: {
            detail: 'Ya existe un vino comunitario idéntico pendiente de revisión.',
          },
        },
      });

      const onCloseSpy = vi.fn();

      render(
        <MemoryRouter>
          <QuickAddBottleModal isOpen={true} onClose={onCloseSpy} />
        </MemoryRouter>,
      );

      const nameInput = screen.getByRole('combobox', { name: /Nombre de la Etiqueta/i });
      fireEvent.change(nameInput, { target: { value: 'Vino Duplicado' } });

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Bodega Existente' } });

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText('Ya existe un vino comunitario idéntico pendiente de revisión.'),
      ).toBeInTheDocument();
      expect(onCloseSpy).not.toHaveBeenCalled();
    });
  });

  describe('6. Flujo completo de alta de vino comunitario con API simulada', () => {
    it('crea vino comunitario, muestra toast de revisión y cierra el modal', async () => {
      const showToastSpy = vi.fn();
      const onCloseSpy = vi.fn();

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          wineVintageId: 100,
          wineId: 50,
          name: 'Blend de Altura',
        },
      });

      render(
        <MemoryRouter>
          <QuickAddBottleModal
            isOpen={true}
            onClose={onCloseSpy}
            showToast={showToastSpy}
            initialName="Blend de Altura"
          />
        </MemoryRouter>,
      );

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Finca Domingo' } });

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(
          '/cellars/me/quick-add',
          expect.objectContaining({
            name: 'Blend de Altura',
            wineryName: 'Finca Domingo',
            matchedWineId: null,
          }),
        );
      });

      await waitFor(() => {
        expect(showToastSpy).toHaveBeenCalledWith(
          'Tu vino quedó cargado en tu cava y será revisado por AyVino.',
        );
      });

      expect(onCloseSpy).toHaveBeenCalled();
    });

    it('previene el doble envío deshabilitando el botón y bloqueando con guard ref', async () => {
      let resolvePost: (value: unknown) => void = () => {};
      const pendingPromise = new Promise((resolve) => {
        resolvePost = resolve;
      });

      vi.mocked(apiClient.post).mockImplementationOnce(() => pendingPromise as Promise<{ data: unknown }>);

      render(
        <MemoryRouter>
          <QuickAddBottleModal
            isOpen={true}
            onClose={vi.fn()}
            initialName="Vino Guard Ref"
          />
        </MemoryRouter>,
      );

      const wineryInput = screen.getByLabelText(/Bodega Productora/i);
      fireEvent.change(wineryInput, { target: { value: 'Bodega Test' } });

      const submitBtn = screen.getByRole('button', { name: /Guardar en Bóveda/i });
      fireEvent.click(submitBtn);

      // Esperamos que se inicie el guardado en la API
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledTimes(1);
      });

      // El botón debe estar deshabilitado mientras se guarda
      expect(submitBtn).toBeDisabled();

      // Segundo clic accidental mientras procesa
      fireEvent.click(submitBtn);

      // Verificamos que sigue habiéndose llamado solo una vez
      expect(apiClient.post).toHaveBeenCalledTimes(1);

      // Resolvemos la promesa pendiente
      resolvePost({
        data: {
          wineVintageId: 2,
          wineId: 2,
          name: 'Vino Guard Ref',
        },
      });
    });
  });
});
