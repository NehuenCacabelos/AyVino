import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
  changeUserRole: vi.fn(),
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
    {
      id: 4,
      username: 'otroadmin',
      email: 'otro@ayvino.com',
      role: 'Admin',
      registerDate: '2026-02-10T00:00:00Z',
      isActive: true,
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
    expect(ownButtons.length).toBe(3); // Cambiar rol, Desactivar y Eliminar
    ownButtons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });

    // En la fila de Winery (id 3), cambiar rol está deshabilitado con su title específico
    const wineryRoleBtn = screen.getByTitle('El rol Bodega se asigna al registrar una bodega');
    expect(wineryRoleBtn).toBeDisabled();

    // En las filas de otros usuarios (id 2 y 4), los botones de cambiar rol están habilitados
    expect(screen.getByTitle('Hacer administrador')).toBeEnabled();
    expect(screen.getByTitle('Quitar administrador')).toBeEnabled();

    // En las filas de otros usuarios, desactivar y eliminar están habilitados
    const otherDeactivateBtns = screen.getAllByTitle('Desactivar cuenta');
    const otherDeleteBtns = screen.getAllByTitle('Eliminar usuario');
    expect(otherDeactivateBtns.length).toBe(2);
    expect(otherDeleteBtns.length).toBe(3);
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

    const deactivateBtns = screen.getAllByTitle('Desactivar cuenta');
    fireEvent.click(deactivateBtns[0]);

    // Diálogo abierto
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Desactivar usuario?')).toBeInTheDocument();
    expect(adminUsersApi.changeUserStatus).not.toHaveBeenCalled();

    // Confirmar
    const confirmBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /^desactivar$/i });
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

  it('"Hacer administrador" llama changeUserRole(id, "Admin") tras confirmar en el diálogo', async () => {
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(adminUsersApi.changeUserRole).mockResolvedValue(undefined);

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

    const promoteBtn = screen.getByTitle('Hacer administrador');
    fireEvent.click(promoteBtn);

    // Diálogo abierto
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Hacer administrador' })).toBeInTheDocument();
    expect(
      screen.getByText(/juanperez tendrá acceso total al panel de administración/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el cambio se aplica cuando el usuario renueve su sesión/i)
    ).toBeInTheDocument();
    expect(adminUsersApi.changeUserRole).not.toHaveBeenCalled();

    // Confirmar en el diálogo
    const confirmBtn = within(dialog).getByRole('button', { name: /^hacer administrador$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminUsersApi.changeUserRole).toHaveBeenCalledWith(2, 'Admin');
      expect(screen.getByText('Rol actualizado')).toBeInTheDocument();
      expect(adminUsersApi.getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('"Quitar administrador" llama changeUserRole(id, "User") tras confirmar en el diálogo', async () => {
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(adminUsersApi.changeUserRole).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <AdminToastProvider>
          <AdminUsersPage />
        </AdminToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('otroadmin')).toBeInTheDocument();
    });

    const demoteBtn = screen.getByTitle('Quitar administrador');
    fireEvent.click(demoteBtn);

    // Diálogo abierto
    const demoteDialog = screen.getByRole('dialog');
    expect(demoteDialog).toBeInTheDocument();
    expect(screen.getByText('Quitar rol de administrador')).toBeInTheDocument();
    expect(
      screen.getByText(/otroadmin pasará a ser un usuario común/i)
    ).toBeInTheDocument();
    expect(adminUsersApi.changeUserRole).not.toHaveBeenCalled();

    // Confirmar en el diálogo
    const demoteConfirmBtn = within(demoteDialog).getByRole('button', { name: /^quitar administrador$/i });
    fireEvent.click(demoteConfirmBtn);

    await waitFor(() => {
      expect(adminUsersApi.changeUserRole).toHaveBeenCalledWith(4, 'User');
      expect(screen.getByText('Rol actualizado')).toBeInTheDocument();
      expect(adminUsersApi.getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('un error 409 muestra el mensaje del servidor en el toast de error', async () => {
    vi.mocked(adminUsersApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(adminUsersApi.changeUserRole).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          detail: 'El rol Winery se asigna al registrar una bodega y no puede modificarse manualmente.',
        },
      },
    });

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

    const promoteBtn = screen.getByTitle('Hacer administrador');
    fireEvent.click(promoteBtn);

    const errorDialog = screen.getByRole('dialog');
    const confirmBtn = within(errorDialog).getByRole('button', { name: /^hacer administrador$/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        screen.getByText(
          'El rol Winery se asigna al registrar una bodega y no puede modificarse manualmente.'
        )
      ).toBeInTheDocument();
    });
  });
});

