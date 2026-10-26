import { useState, useCallback, useMemo } from 'react';
import {
  Search,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import { getAvatarUrl } from '../lib/avatar';
import {
  getUsers,
  changeUserStatus,
  deleteUser,
  changeUserRole,
} from '../features/admin/api/adminUsersApi';
import type { AdminUserListItemDto } from '../features/admin/types/adminUsers';
import {
  PageHeader,
  DataTable,
  PaginationControls,
  ActiveBadge,
  ConfirmDialog,
  ErrorBanner,
  useAdminToast,
  usePagedList,
  getApiErrorMessage,
} from '../features/admin';
import type { Column } from '../features/admin';
import { cn } from '../lib/utils';

type RoleFilter = 'ALL' | 'Admin' | 'Winery' | 'User';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useAdminToast();

  // Filtros locales en la página actual
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');

  // Modales y procesamiento
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'default' | 'danger';
    onConfirm: () => Promise<void>;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: '',
    tone: 'default',
    onConfirm: async () => {},
  });
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Hook paginado (el backend no recibe filtros en este endpoint)
  const fetcher = useCallback((page: number, pageSize: number) => {
    return getUsers({ pageNumber: page, pageSize });
  }, []);

  const {
    items: users,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<AdminUserListItemDto>(fetcher, []);

  // Filtrado en el cliente SOLO de los datos de la página cargada
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Acciones
  const handleToggleStatus = async (user: AdminUserListItemDto) => {
    if (user.isActive) {
      // Desactivar: pide confirmación
      setConfirmDialog({
        open: true,
        title: '¿Desactivar usuario?',
        message: `¿Estás seguro de que deseás desactivar la cuenta de "${user.username}"? El usuario no podrá iniciar sesión.`,
        confirmLabel: 'Desactivar',
        tone: 'default',
        onConfirm: async () => {
          setIsConfirmLoading(true);
          setProcessingId(user.id);
          try {
            await changeUserStatus(user.id, false);
            toast.success('Usuario desactivado.');
            setConfirmDialog((prev) => ({ ...prev, open: false }));
            await reload();
          } catch (err: unknown) {
            toast.error(getApiErrorMessage(err));
          } finally {
            setIsConfirmLoading(false);
            setProcessingId(null);
          }
        },
      });
    } else {
      // Activar: directo
      setProcessingId(user.id);
      try {
        await changeUserStatus(user.id, true);
        toast.success('Usuario activado.');
        await reload();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setProcessingId(null);
      }
    }
  };

  const openDeleteDialog = (user: AdminUserListItemDto) => {
    setConfirmDialog({
      open: true,
      title: '¿Eliminar usuario?',
      message:
        'Se elimina el usuario y sus credenciales. Esta acción es irreversible.',
      confirmLabel: 'Eliminar definitivamente',
      tone: 'danger',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(user.id);
        try {
          await deleteUser(user.id);
          toast.success('Usuario eliminado del sistema.');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await reload();
        } catch (err: unknown) {
          // Si el backend responde 409 o similar, se muestra el mensaje real sin ocultarlo
          toast.error(getApiErrorMessage(err));
        } finally {
          setIsConfirmLoading(false);
          setProcessingId(null);
        }
      },
    });
  };

  const handleOpenRoleDialog = (user: AdminUserListItemDto) => {
    if (user.role === 'Winery' || currentUser?.id === user.id) return;

    const isPromoting = user.role !== 'Admin';
    const targetRole = isPromoting ? 'Admin' : 'User';

    setConfirmDialog({
      open: true,
      title: isPromoting ? 'Hacer administrador' : 'Quitar rol de administrador',
      message: isPromoting
        ? `${user.username} tendrá acceso total al panel de administración. El cambio se aplica cuando el usuario renueve su sesión (hasta 2 horas).`
        : `${user.username} pasará a ser un usuario común. El cambio se aplica cuando el usuario renueve su sesión (hasta 2 horas).`,
      confirmLabel: isPromoting ? 'Hacer administrador' : 'Quitar administrador',
      tone: isPromoting ? 'default' : 'danger',
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setProcessingId(user.id);
        try {
          await changeUserRole(user.id, targetRole);
          toast.success('Rol actualizado');
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await reload();
        } catch (err: unknown) {
          toast.error(getApiErrorMessage(err));
        } finally {
          setIsConfirmLoading(false);
          setProcessingId(null);
        }
      },
    });
  };

  // Badge de rol
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-950/50 text-rose-300 border border-rose-800/50">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'Winery':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-950/50 text-amber-300 border border-amber-800/50">
            <Building2 className="w-3 h-3" />
            Bodega
          </span>
        );
      case 'User':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-blue-950/50 text-blue-300 border border-blue-800/50">
            <UserIcon className="w-3 h-3" />
            Usuario
          </span>
        );
    }
  };

  // Columnas de la tabla
  const columns: Column<AdminUserListItemDto>[] = useMemo(
    () => [
      {
        key: 'avatar',
        header: 'Avatar',
        className: 'w-14 text-center',
        render: (row) => (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-800 overflow-hidden mx-auto border border-white/10">
            <img
              src={getAvatarUrl(row)}
              alt={row.username}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(row.username)}&backgroundColor=1c1917,292524`;
              }}
            />
          </div>
        ),
      },
      {
        key: 'username',
        header: 'Usuario',
        render: (row) => (
          <div className="font-medium text-zinc-100 flex items-center gap-2">
            <span>{row.username}</span>
            {currentUser?.id === row.id && (
              <span className="text-[10px] font-mono uppercase bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded">
                Tú
              </span>
            )}
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (row) => (
          <span className="text-xs text-neutral-300 font-mono">{row.email}</span>
        ),
      },
      {
        key: 'role',
        header: 'Rol',
        className: 'text-center',
        render: (row) => renderRoleBadge(row.role),
      },
      {
        key: 'registerDate',
        header: 'Registro',
        className: 'font-mono text-xs',
        render: (row) => (
          <span>
            {row.registerDate
              ? new Date(row.registerDate).toLocaleDateString('es-AR')
              : '—'}
          </span>
        ),
      },
      {
        key: 'isActive',
        header: 'Estado',
        className: 'text-center',
        render: (row) => <ActiveBadge isActive={row.isActive} />,
      },
      {
        key: 'actions',
        header: 'Acciones',
        className: 'text-right',
        render: (row) => {
          const isOwnRow = currentUser?.id === row.id;
          const isProcessing = processingId === row.id;
          const isWinery = row.role === 'Winery';

          let roleTitle = 'Hacer administrador';
          let roleIcon = <ShieldCheck className="w-4 h-4" />;
          let roleColorClass =
            'border-purple-900/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60';

          if (row.role === 'Admin') {
            roleTitle = 'Quitar administrador';
            roleIcon = <ShieldAlert className="w-4 h-4" />;
            roleColorClass =
              'border-amber-900/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60';
          } else if (isWinery) {
            roleTitle = 'El rol Bodega se asigna al registrar una bodega';
            roleIcon = <Shield className="w-4 h-4" />;
            roleColorClass =
              'border-neutral-800 bg-neutral-900/40 text-neutral-500';
          }

          if (isOwnRow) {
            roleTitle = 'No podés modificar tu propia cuenta';
          }

          const isRoleDisabled = isOwnRow || isProcessing || isWinery;
          const generalDisabled = isOwnRow || isProcessing;
          const generalTooltip = isOwnRow
            ? 'No podés modificar tu propia cuenta'
            : undefined;

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Cambiar rol */}
              <button
                type="button"
                disabled={isRoleDisabled}
                title={roleTitle}
                aria-label={roleTitle}
                onClick={() => handleOpenRoleDialog(row)}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
                  roleColorClass
                )}
              >
                {roleIcon}
              </button>

              {/* Desactivar / Activar */}
              <button
                type="button"
                disabled={generalDisabled}
                title={
                  generalTooltip ??
                  (row.isActive ? 'Desactivar cuenta' : 'Activar cuenta')
                }
                aria-label={
                  generalTooltip ??
                  (row.isActive ? 'Desactivar cuenta' : 'Activar cuenta')
                }
                onClick={() => void handleToggleStatus(row)}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
                  row.isActive
                    ? 'border-amber-900/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60'
                    : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                )}
              >
                {row.isActive ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </button>

              {/* Eliminar */}
              <button
                type="button"
                disabled={generalDisabled}
                title={generalTooltip ?? 'Eliminar usuario'}
                aria-label={generalTooltip ?? 'Eliminar usuario'}
                onClick={() => openDeleteDialog(row)}
                className="p-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processingId, currentUser?.id]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Gestión integral de cuentas de usuarios, productores vitivinícolas y administradores"
      />

      {/* Barra de búsqueda y selector de rol */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-xl">
          {/* Input de búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario o email..."
              aria-label="Buscar por usuario o email"
              className="w-full h-10 rounded-xl pl-10 pr-4 text-xs font-sans bg-[#141416] border border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Selector de rol */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              aria-label="Filtrar por rol"
              className="h-10 rounded-xl border border-white/10 bg-[#141416] px-3 text-xs text-neutral-200 focus:border-rose-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los roles</option>
              <option value="Admin">Admin</option>
              <option value="Winery">Bodega</option>
              <option value="User">Usuario</option>
            </select>
          </div>
        </div>

        {/* Texto auxiliar visible */}
        <span className="text-[11px] font-mono text-neutral-500 self-start sm:self-center">
          El filtro se aplica a la página actual
        </span>
      </div>

      {/* Error de carga */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de usuarios */}
      <DataTable
        columns={columns}
        rows={filteredUsers}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="No hay usuarios."
      />

      {/* Paginación */}
      {!isLoading && users.length > 0 && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          itemsOnPage={users.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Diálogo de Confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        tone={confirmDialog.tone}
        isLoading={isConfirmLoading}
        onConfirm={() => void confirmDialog.onConfirm()}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
