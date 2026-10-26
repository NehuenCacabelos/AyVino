import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmDialog from '@/features/admin/components/ConfirmDialog';

describe('ConfirmDialog Component', () => {
  it('no renderiza nada cuando open es false', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Confirmar eliminación"
        message="¿Estás seguro?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza título, mensaje y ejecuta onConfirm al confirmar', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Eliminar bodega"
        message="Esta acción es irreversible."
        confirmLabel="Eliminar definitivamente"
        tone="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Eliminar bodega')).toBeInTheDocument();
    expect(screen.getByText('Esta acción es irreversible.')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /eliminar definitivamente/i });
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cierra el diálogo al presionar la tecla Escape y enfoca Cancelar inicialmente', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Rechazar solicitud"
        message="¿Desea rechazar esta bodega?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    await waitFor(() => {
      expect(cancelBtn).toHaveFocus();
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('deshabilita ambos botones y muestra estado de carga mientras isLoading es true', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Procesando"
        message="Guardando cambios..."
        isLoading={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    const confirmBtn = screen.getByRole('button', { name: /procesando\.\.\./i });

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();

    // Escape no debe cerrar mientras carga
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });
});

