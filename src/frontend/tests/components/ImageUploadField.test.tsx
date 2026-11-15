import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImageUploadField from '@/features/winery/components/ImageUploadField';

describe('ImageUploadField Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload zone with label and helper text', () => {
    render(
      <ImageUploadField
        currentImageId={null}
        variant="logo"
        label="Logo Oficial de la Bodega"
      />,
    );

    expect(screen.getByText('Logo Oficial de la Bodega')).toBeInTheDocument();
    expect(screen.getByText(/Elegí un archivo/i)).toBeInTheDocument();
    expect(screen.getByText(/Formatos admitidos: JPG, PNG o WEBP/i)).toBeInTheDocument();
  });

  it('rejects files larger than 5 MB client-side before calling onUpload', async () => {
    const onUploadMock = vi.fn();
    render(
      <ImageUploadField
        currentImageId={null}
        variant="logo"
        label="Logo de Bodega"
        onUpload={onUploadMock}
      />,
    );

    const largeFile = new File(['x'.repeat(5.5 * 1024 * 1024)], 'foto_pesada.jpg', {
      type: 'image/jpeg',
    });

    const input = screen.getByLabelText('Logo de Bodega');
    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('La imagen supera el tamaño máximo permitido de 5 MB.'),
      ).toBeInTheDocument();
      expect(onUploadMock).not.toHaveBeenCalled();
    });
  });

  it('rejects unsupported file formats before calling onUpload', async () => {
    const onUploadMock = vi.fn();
    render(
      <ImageUploadField
        currentImageId={null}
        variant="logo"
        label="Logo de Bodega"
        onUpload={onUploadMock}
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
      expect(onUploadMock).not.toHaveBeenCalled();
    });
  });

  it('uploads valid image via onUpload and notifies onUploadingChange', async () => {
    const onUploadMock = vi.fn().mockResolvedValue('img-uuid-1234');
    const onUploadingChangeMock = vi.fn();

    render(
      <ImageUploadField
        currentImageId={null}
        variant="logo"
        label="Logo de Bodega"
        onUpload={onUploadMock}
        onUploadingChange={onUploadingChangeMock}
      />,
    );

    const validFile = new File(['valid-image-bytes'], 'logo.webp', { type: 'image/webp' });
    const input = screen.getByLabelText('Logo de Bodega');
    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(onUploadMock).toHaveBeenCalledWith(validFile);
      expect(onUploadingChangeMock).toHaveBeenCalledWith(true);
      expect(onUploadingChangeMock).toHaveBeenCalledWith(false);
    });
  });

  it('renders preview with "Quitar logo" button and calls onDelete when removed', async () => {
    const onDeleteMock = vi.fn().mockResolvedValue(undefined);
    render(
      <ImageUploadField
        currentImageId="123e4567-e89b-12d3-a456-426614174000"
        variant="logo"
        label="Logo de Bodega"
        onDelete={onDeleteMock}
      />,
    );

    expect(screen.getByText('Logo oficial cargado')).toBeInTheDocument();
    const previewImg = screen.getByAltText('Vista previa de imagen');
    expect(previewImg).toHaveAttribute(
      'src',
      '/api/images/123e4567-e89b-12d3-a456-426614174000?variant=logo',
    );

    const removeBtn = screen.getByRole('button', { name: 'Quitar logo' });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(onDeleteMock).toHaveBeenCalled();
    });
  });

  it('handles backend 503 error when storage is not configured', async () => {
    const axios503 = {
      isAxiosError: true,
      response: {
        status: 503,
        data: { detail: 'Storage unavailable' },
      },
    };
    const onUploadMock = vi.fn().mockRejectedValue(axios503);

    render(
      <ImageUploadField
        currentImageId={null}
        variant="logo"
        label="Logo de Bodega"
        onUpload={onUploadMock}
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
