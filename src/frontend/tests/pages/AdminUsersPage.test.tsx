import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminUsersPage from '@/pages/AdminUsersPage';
import * as adminUsersApi from '@/features/admin/api/adminUsersApi';
import * as authModule from '@/features/auth';
import { AdminToastProvider } from '@/features/admin';
import type { AdminUserListItemDto } from '@/features/admin/types/adminUsers';

vi.mock('@/features/admin/api/adminUsersApi', () => ({
  getUsers: vi.fn(),
  changeUserStatus: vi.fn(),
  deleteUser: vi.fn(),
}));

const mockUseAuth = vi.fn();

vi.mock('@/features/auth/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof authModule>();
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  };
});

describe('AdminUsersPage Component', () => {
  const mockUsers: AdminUserListItemDto[] = [
    {
      id: 1,
      username: 'superadmin',
      email: 'admin@ayvino.com',
      role: 'Admin',
      registerDate: '2026-01-01T00:00:00Z',
      isActive: true,
      photo: null,
      bio: null,
    },
    {
      id: 2,
      username: 'juanperez',
      email: 'juan@example.com',
      role: 'User',
      registerDate: '2026-01-15T00:00:00Z',
      isActive: true,
      photo: null,
      bio: null,
    },
    {
      id: 3,
      username: 'bodegabianchi',
      email: 'bianchi@bodega.com',
      role: 'Winery',
      registerDate: '2026-02-01T00:00:00Z',
      isActive: false,
      photo: null,
      bio: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        id: 1,
        username: 'superadmin',
        email: 'admin@ayvino.com',
        role: 'Admin',
      },
      isAuthenticated: true,
    });
  });

  it('la fila propia tiene las acciones deshabilitadas con el tooltip de protección', async () => {
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <AdminToastProvider>
          <AdminUsersPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('superadmin')).toBeInTheDocument();
      expect(screen.getByText('juanperez')).toBeInTheDocument();
      expect(screen.getByText('bodegabianchi')).toBeInTheDocument();
    });

    // En la fila propia (id 1), los botones tienen el title de advertencia y están deshabilitados
    const ownButtons = screen.getAllByTitle('No podés modificar tu propia cuenta');
    expect(ownButtons.length).toBe(2); // Desactivar y Eliminar
    ownButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // En la fila de otro usuario (id 2 y 3), los botones están habilitados
    const otherDeactivateBtn = screen.getByTitle('Desactivar cuenta');
    const otherDeleteBtns = screen.getAllByTitle('Eliminar usuario');
    expect(otherDeactivateBtn).toBeEnabled();
    expect(otherDeleteBtns.length).toBe(2);
    otherDeleteBtns.forEach((btn) => {
      expect(btn).toBeEnabled();
    });
  });

  it('desactivar llama changeUserStatus(id, false) tras confirmar en el diálogo', async () => {
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(adminUsersApi.changeUserStatus).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <AdminToastProvider>
          <AdminUsersPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('juanperez')).toBeInTheDocument();
    });

    const deactivateBtn = screen.getByTitle('Desactivar cuenta');
    fireEvent.click(deactivateBtn);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Desactivar usuario?')).toBeInTheDocument();
    expect(adminUsersApi.changeUserStatus).not.toHaveBeenCalled();

    // Confirmar
    const confirmBtn = screen.getByRole('button', { name: /^desactivar$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminUsersApi.changeUserStatus).toHaveBeenCalledWith(2, false);
      expect(adminUsersApi.getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('el buscador filtra en tiempo real solo los datos de la página cargada', async () => {
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <AdminToastProvider>
          <AdminUsersPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('superadmin')).toBeInTheDocument();
      expect(screen.getByText('juanperez')).toBeInTheDocument();
      expect(screen.getByText('bodegabianchi')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por usuario o email/i);
    fireEvent.change(searchInput, { target: { value: 'bianchi' } });

    expect(screen.getByText('bodegabianchi')).toBeInTheDocument();
    expect(screen.queryByText('juanperez')).not.toBeInTheDocument();
    expect(screen.queryByText('superadmin')).not.toBeInTheDocument();
  });
});

