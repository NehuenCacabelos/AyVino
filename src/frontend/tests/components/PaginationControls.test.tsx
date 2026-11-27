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

  it('cuando recibe totalCount muestra el formato completo y botones Primera/Última', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <PaginationControls
        page={2}
        pageSize={10}
        itemsOnPage={10}
        totalCount={35}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText('Página 2 de 4 · 35 resultados')).toBeInTheDocument();

    const firstBtn = screen.getByRole('button', { name: /primera página/i });
    const prevBtn = screen.getByRole('button', { name: /página anterior/i });
    const nextBtn = screen.getByRole('button', { name: /página siguiente/i });
    const lastBtn = screen.getByRole('button', { name: /última página/i });

    expect(firstBtn).toBeEnabled();
    expect(prevBtn).toBeEnabled();
    expect(nextBtn).toBeEnabled();
    expect(lastBtn).toBeEnabled();

    fireEvent.click(firstBtn);
    expect(onPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(lastBtn);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('cuando está en la última página con totalCount deshabilita Siguiente y Última', () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <PaginationControls
        page={4}
        pageSize={10}
        itemsOnPage={5}
        totalCount={35}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByRole('button', { name: /primera página/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /última página/i })).toBeDisabled();
  });

  it('con totalCount 0 muestra 1 página total y deshabilita toda la navegación', () => {
    render(
      <PaginationControls
        page={1}
        pageSize={10}
        itemsOnPage={0}
        totalCount={0}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText('Página 1 de 1 · 0 resultados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /primera página/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /página anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /página siguiente/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /última página/i })).toBeDisabled();
  });

  it('sin totalCount (null) conserva el formato clásico y no renderiza Primera/Última', () => {
    render(
      <PaginationControls
        page={2}
        pageSize={10}
        itemsOnPage={10}
        totalCount={null}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByText('Página 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /primera página/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /última página/i })).not.toBeInTheDocument();
  });
});

