import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAdminFilters } from '@/features/admin/hooks/useAdminFilters';

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

describe('useAdminFilters Hook', () => {
  it('lee parámetros iniciales desde la URL y aplica defaults opcionales', () => {
    const wrapper = createWrapper('/admin/vinos?search=malbec&page=3&origin=official');

    const { result } = renderHook(
      () => useAdminFilters({ defaults: { status: 'Pending' } }),
      { wrapper }
    );

    expect(result.current.filters).toEqual({
      status: 'Pending',
      search: 'malbec',
      page: 3,
      role: undefined,
      origin: 'official',
      type: undefined,
    });
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('setFilter reinicia page a 1 y elimina el parámetro de la URL al limpiarse', () => {
    const wrapper = createWrapper('/admin/usuarios?role=Admin&page=4');

    const { result } = renderHook(
      () => ({
        adminFilters: useAdminFilters(),
        location: useLocation(),
      }),
      { wrapper }
    );

    expect(result.current.adminFilters.filters.page).toBe(4);

    act(() => {
      result.current.adminFilters.setFilter('search', 'ana');
    });

    expect(result.current.adminFilters.filters.page).toBe(1);
    expect(result.current.adminFilters.filters.search).toBe('ana');
    expect(result.current.location.search).toBe('?role=Admin&search=ana');

    act(() => {
      result.current.adminFilters.setFilter('role', undefined);
    });

    expect(result.current.adminFilters.filters.role).toBeUndefined();
    expect(result.current.location.search).toBe('?search=ana');
  });

  it('setPage navega entre páginas y omite page=1 en la URL', () => {
    const wrapper = createWrapper('/admin/bodegas?status=Approved');

    const { result } = renderHook(
      () => ({
        adminFilters: useAdminFilters(),
        location: useLocation(),
      }),
      { wrapper }
    );

    act(() => {
      result.current.adminFilters.setPage(2);
    });

    expect(result.current.adminFilters.filters.page).toBe(2);
    expect(result.current.location.search).toBe('?status=Approved&page=2');

    act(() => {
      result.current.adminFilters.setPage(1);
    });

    expect(result.current.adminFilters.filters.page).toBe(1);
    expect(result.current.location.search).toBe('?status=Approved');
  });

  it('clearFilters limpia los filtros del contrato y resetea page', () => {
    const wrapper = createWrapper('/admin/vinos?search=cabernet&type=Red&origin=community&page=2&extra=1');

    const { result } = renderHook(
      () => ({
        adminFilters: useAdminFilters(),
        location: useLocation(),
      }),
      { wrapper }
    );

    act(() => {
      result.current.adminFilters.clearFilters();
    });

    expect(result.current.adminFilters.filters).toEqual({
      status: undefined,
      search: undefined,
      page: 1,
      role: undefined,
      origin: undefined,
      type: undefined,
    });
    expect(result.current.adminFilters.hasActiveFilters).toBe(false);
    expect(result.current.location.search).toBe('?extra=1');
  });
});
