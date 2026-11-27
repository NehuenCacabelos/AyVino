import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePagedList } from '@/features/admin/hooks/usePagedList';
import type { PagedResponse } from '@/features/admin/types/pagedResult';

describe('usePagedList Hook', () => {
  it('devuelve items, totalCount y totalPages calculado cuando el backend informa totalCount', async () => {
    const fetcher = vi.fn(
      async (): Promise<PagedResponse<{ id: number }>> => ({
        items: [{ id: 1 }, { id: 2 }],
        totalCount: 25,
      })
    );

    const { result } = renderHook(() => usePagedList(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetcher).toHaveBeenCalledWith(1, 10);
    expect(result.current.items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.current.totalCount).toBe(25);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('mantiene totalCount y totalPages en null cuando no hay X-Total-Count', async () => {
    const fetcher = vi.fn(
      async (): Promise<PagedResponse<string>> => ({
        items: ['a', 'b'],
        totalCount: null,
      })
    );

    const { result } = renderHook(() => usePagedList(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalCount).toBeNull();
    expect(result.current.totalPages).toBeNull();
  });

  it('actualiza page y pageSize y resetea a página 1 al cambiar deps externas', async () => {
    const fetcher = vi.fn(
      async (page: number, pageSize: number): Promise<PagedResponse<number>> => ({
        items: [page * 100 + pageSize],
        totalCount: 100,
      })
    );

    const { result, rerender } = renderHook(
      ({ filter }: { filter: string }) => usePagedList(fetcher, [filter]),
      { initialProps: { filter: 'Pending' } }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPage(3);
    });

    await waitFor(() => {
      expect(fetcher).toHaveBeenLastCalledWith(3, 10);
    });

    act(() => {
      result.current.setPageSize(25);
    });

    await waitFor(() => {
      expect(result.current.totalPages).toBe(4);
    });

    rerender({ filter: 'Approved' });

    await waitFor(() => {
      expect(result.current.page).toBe(1);
      expect(fetcher).toHaveBeenLastCalledWith(1, 25);
    });
  });

  it('captura errores de la API y permite reintentar con reload', async () => {
    const fetcher = vi
      .fn<() => Promise<PagedResponse<string>>>()
      .mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { detail: 'Error temporal del servidor' } },
      })
      .mockResolvedValueOnce({ items: ['ok'], totalCount: 1 });

    const { result } = renderHook(() => usePagedList(fetcher));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Error temporal del servidor');

    await act(async () => {
      await result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.items).toEqual(['ok']);
    });
  });
});
