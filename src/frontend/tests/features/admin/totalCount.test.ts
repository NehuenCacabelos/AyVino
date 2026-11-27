import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AxiosHeaders } from 'axios';
import { parseTotalCountHeader } from '@/features/admin/utils/totalCount';
import { getUsers } from '@/features/admin/api/adminUsersApi';
import apiClient from '@/services/apiClient';

vi.mock('@/services/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('X-Total-Count header parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parseTotalCountHeader interpreta headers planos, AxiosHeaders y valores inválidos', () => {
    expect(parseTotalCountHeader({ 'x-total-count': '42' })).toBe(42);
    expect(parseTotalCountHeader({ 'X-Total-Count': '0' })).toBe(0);

    const axiosHeaders = new AxiosHeaders({ 'X-Total-Count': '17' });
    expect(parseTotalCountHeader(axiosHeaders)).toBe(17);

    expect(parseTotalCountHeader({})).toBeNull();
    expect(parseTotalCountHeader({ 'x-total-count': '-3' })).toBeNull();
    expect(parseTotalCountHeader({ 'x-total-count': 'abc' })).toBeNull();
    expect(parseTotalCountHeader(undefined)).toBeNull();
  });

  it('adminUsersApi.getUsers retorna { items, totalCount } leyendo X-Total-Count', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [{ id: 1, email: 'a@b.com', fullName: 'Ana', role: 'User', isActive: true, createdAt: '2026-01-01' }],
      headers: { 'x-total-count': '125' },
    });

    const res = await getUsers({ pageNumber: 1, pageSize: 10, search: 'ana', role: 'User', status: 'Active' });

    expect(apiClient.get).toHaveBeenCalledWith('/users', {
      params: { pageNumber: 1, pageSize: 10, search: 'ana', role: 'User', status: 'Active' },
    });
    expect(res.items).toHaveLength(1);
    expect(res.totalCount).toBe(125);
  });

  it('adminUsersApi.getUsers retorna totalCount: null si el header no viene en la respuesta', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [],
      headers: {},
    });

    const res = await getUsers({ pageNumber: 1, pageSize: 10 });

    expect(res.items).toEqual([]);
    expect(res.totalCount).toBeNull();
  });
});
