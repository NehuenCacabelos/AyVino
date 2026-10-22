import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploadField from '@/features/winery/components/ImageUploadField';
import * as imageApi from '@/features/winery/api/imageApi';

vi.mock('@/features/winery/api/imageApi', () => ({
  uploadImage: vi.fn(),
}));

describe('ImageUploadField Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload zone with label and helper text', () => {
    render(
      <ImageUploadField
        value=""
        onChange={vi.fn()}
        folder="wineries"
        label="Logo Oficial de la Bodega"
      />,
    );

    expect(screen.getByText('Logo Oficial de la Bodega')).toBeInTheDocument();
    expect(screen.getByText(/Elegí un archivo/i)).toBeInTheDocument();
    expect(screen.getByText(/Formatos admitidos: JPG, PNG o WEBP/i)).toBeInTheDocument();
  });

  it('rejects files larger than 2 MB client-side before calling the backend', async () => {
    const onChangeMock = vi.fn();
    render(
      <ImageUploadField
        value=""
        onChange={onChangeMock}
        folder="wineries"
        label="Logo de Bodega"
      />,
    );

    const largeFile = new File(['x'.repeat(2.5 * 1024 * 1024)], 'foto_pesada.jpg', {
      type: 'image/jpeg',
    });

    const input = screen.getByLabelText('Logo de Bodega');
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('La imagen supera el tamaño máximo permitido de 2 MB.'),
      ).toBeInTheDocument();
      expect(imageApi.uploadImage).not.toHaveBeenCalled();
      expect(onChangeMock).not.toHaveBeenCalled();
    });
  });

  it('rejects unsupported file formats before calling the backend', async () => {
    const onChangeMock = vi.fn();
    render(
      <ImageUploadField
        value=""
        onChange={onChangeMock}
        folder="wineries"
        label="Logo de Bodega"
      />,
    );

    const pdfFile = new File(['fake-pdf'], 'documento.pdf', {
      type: 'application/pdf',
    });

    const input = screen.getByLabelText('Logo de Bodega');
    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Formato no permitido. Solo se aceptan archivos JPG, PNG o WEBP./i),
      ).toBeInTheDocument();
      expect(imageApi.uploadImage).not.toHaveBeenCalled();
    });
  });

  it('uploads valid image to backend and propagates resulting URL via onChange', async () => {
    const onChangeMock = vi.fn();
    const onUploadingChangeMock = vi.fn();
    vi.mocked(imageApi.uploadImage).mockResolvedValueOnce({
      url: 'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo123.webp',
    });

    render(
      <ImageUploadField
        value=""
        onChange={onChangeMock}
        folder="wineries"
        label="Logo de Bodega"
        onUploadingChange={onUploadingChangeMock}
      />,
    );

    const validFile = new File(['valid-image-bytes'], 'logo.webp', { type: 'image/webp' });
    const input = screen.getByLabelText('Logo de Bodega');
    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(imageApi.uploadImage).toHaveBeenCalledWith(validFile, 'wineries');
      expect(onChangeMock).toHaveBeenCalledWith(
        'https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo123.webp',
      );
      expect(onUploadingChangeMock).toHaveBeenCalledWith(true);
      expect(onUploadingChangeMock).toHaveBeenCalledWith(false);
    });
  });

  it('renders preview with "Quitar logo" button and sends empty string when removed', () => {
    const onChangeMock = vi.fn();
    render(
      <ImageUploadField
        value="https://example.supabase.co/storage/v1/object/public/ayvino-media/wineries/logo.png"
        onChange={onChangeMock}
        folder="wineries"
        label="Logo de Bodega"
      />,
    );

    expect(screen.getByText('Logo oficial cargado')).toBeInTheDocument();
    const removeBtn = screen.getByRole('button', { name: 'Quitar logo' });
    fireEvent.click(removeBtn);

    expect(onChangeMock).toHaveBeenCalledWith('');
  });

  it('handles backend 503 error when storage is not configured', async () => {
    const axios503 = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { detail: 'Storage unavailable' },
      },
    };
    vi.mocked(imageApi.uploadImage).mockRejectedValueOnce(axios503);

    render(
      <ImageUploadField
        value=""
        onChange={vi.fn()}
        folder="wineries"
        label="Logo de Bodega"
      />,
    );

    const validFile = new File(['bytes'], 'logo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Logo de Bodega');
    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/La carga de imágenes no está disponible por ahora/i),
      ).toBeInTheDocument();
    });
  });
});
