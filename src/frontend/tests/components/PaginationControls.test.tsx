import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginationControls from '@/features/admin/components/PaginationControls';

describe('PaginationControls Component', () => {
  it('deshabilita el botón Anterior en la página 1 y permite Siguiente si hay más elementos', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <PaginationControls
        page={1}
        pageSize={10}
        itemsOnPage={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /página anterior/i });
    const nextBtn = screen.getByRole('button', { name: /página siguiente/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('deshabilita el botón Siguiente cuando itemsOnPage es menor a pageSize', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <PaginationControls
        page={2}
        pageSize={10}
        itemsOnPage={7}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /página anterior/i });
    const nextBtn = screen.getByRole('button', { name: /página siguiente/i });

    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('vuelve a la página 1 y notifica el nuevo tamaño al cambiar el selector de tamaño', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <PaginationControls
        page={3}
        pageSize={10}
        itemsOnPage={10}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    const select = screen.getByLabelText(/seleccionar filas por página/i);
    fireEvent.change(select, { target: { value: '25' } });

    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});

