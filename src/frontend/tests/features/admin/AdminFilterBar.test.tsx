import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AdminFilterBar from '@/features/admin/components/AdminFilterBar';

describe('AdminFilterBar Component', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza chips de estado con conteos opcionales y notifica el cambio al hacer clic', () => {
    const onChipChange = vi.fn();

    render(
      <AdminFilterBar
        chips={[
          { label: 'Pendientes', value: 'Pending', count: 4 },
          { label: 'Aprobadas', value: 'Approved' },
        ]}
        activeChip="Pending"
        onChipChange={onChipChange}
      />
    );

    const pendingBtn = screen.getByRole('button', { name: /pendientes/i });
    const approvedBtn = screen.getByRole('button', { name: /aprobadas/i });

    expect(pendingBtn).toHaveAttribute('aria-pressed', 'true');
    expect(approvedBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('4')).toBeInTheDocument();

    fireEvent.click(approvedBtn);
    expect(onChipChange).toHaveBeenCalledWith('Approved');
  });

  it('aplica debounce de 300ms en la búsqueda antes de invocar onSearchChange', () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();

    render(
      <AdminFilterBar
        searchValue=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por nombre..."
      />
    );

    const input = screen.getByPlaceholderText('Buscar por nombre...');
    fireEvent.change(input, { target: { value: 'Malbec' } });

    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('Malbec');
  });

  it('renderiza selects configurables y el botón Limpiar filtros limpia la búsqueda y dispara callback', () => {
    const onRoleChange = vi.fn();
    const onClearFilters = vi.fn();

    render(
      <AdminFilterBar
        searchValue="juan"
        onSearchChange={vi.fn()}
        selects={[
          {
            label: 'Rol',
            value: 'Admin',
            placeholder: 'Todos los roles',
            options: [
              { label: 'Admin', value: 'Admin' },
              { label: 'User', value: 'User' },
            ],
            onChange: onRoleChange,
          },
        ]}
        onClearFilters={onClearFilters}
        hasActiveFilters={true}
      />
    );

    const select = screen.getByLabelText('Rol');
    fireEvent.change(select, { target: { value: 'User' } });
    expect(onRoleChange).toHaveBeenCalledWith('User');

    const clearBtn = screen.getByRole('button', { name: /limpiar filtros/i });
    fireEvent.click(clearBtn);

    expect(onClearFilters).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('oculta el botón Limpiar filtros cuando hasActiveFilters es false', () => {
    render(
      <AdminFilterBar
        searchValue=""
        onSearchChange={vi.fn()}
        onClearFilters={vi.fn()}
        hasActiveFilters={false}
      />
    );

    expect(screen.queryByRole('button', { name: /limpiar filtros/i })).not.toBeInTheDocument();
  });
});
