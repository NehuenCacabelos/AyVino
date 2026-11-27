import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
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
  AdminFilterBar,
  DataTable,
  PaginationControls,
  ActiveBadge,
  ConfirmDialog,
  ErrorBanner,
  useAdminToast,
  useAdminFilters,
  usePagedList,
  getApiErrorMessage,
} from '../features/admin';
import type { Column, FilterSelectConfig } from '../features/admin';
import { cn } from '../lib/utils';

const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Winery', label: 'Bodega' },
  { value: 'User', label: 'Usuario' },
];

const USER_STATUS_OPTIONS = [
  { value: 'Active', label: 'Activos' },
  { value: 'Blocked', label: 'Bloqueados' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useAdminToast();
  const { filters, setFilter, setPage: setUrlPage, clearFilters } = useAdminFilters();

  const searchParam = filters.search?.trim() || undefined;
  const roleParam = filters.role || undefined;
  const statusParam = filters.status || undefined;

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

  // Hook paginado contra backend
  const fetcher = useCallback(
    (page: number, pageSize: number) => {
      return getUsers({
        pageNumber: page,
        pageSize,
        ...(searchParam ? { search: searchParam } : {}),
        ...(roleParam ? { role: roleParam } : {}),
        ...(statusParam ? { status: statusParam } : {}),
      });
    },
    [searchParam, roleParam, statusParam]
  );

  const {
    items: users,
    totalCount,
    page,
    pageSize,
    isLoading,
    error,
    setPage,
    setPageSize,
    reload,
  } = usePagedList<AdminUserListItemDto>(fetcher, [searchParam, roleParam, statusParam], {
    page: filters.page,
    onPageChange: setUrlPage,
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      setFilter('search', value.trim() ? value : undefined);
    },
    [setFilter]
  );

  const selects = useMemo<FilterSelectConfig[]>(
    () => [
      {
        id: 'admin-users-role-filter',
        label: 'Rol',
        ariaLabel: 'Filtrar por rol',
        value: filters.role ?? '',
        placeholder: 'Todos los roles',
        options: ROLE_OPTIONS,
        onChange: (value) => setFilter('role', value || undefined),
      },
      {
        id: 'admin-users-status-filter',
        label: 'Estado',
        ariaLabel: 'Filtrar por estado',
        value: filters.status ?? '',
        placeholder: 'Todos los estados',
        options: USER_STATUS_OPTIONS,
        onChange: (value) => setFilter('status', value || undefined),
      },
    ],
    [filters.role, filters.status, setFilter]
  );

  const hasActiveFilters = Boolean(searchParam || roleParam || statusParam);

  // Acciones
  const handleToggleStatus = async (user: AdminUserListItemDto) => {
    if (user.role === 'Admin') return;

    if (user.isActive) {
      // Bloquear: pide confirmación
      setConfirmDialog({
        open: true,
        title: '¿Bloquear usuario?',
        message:
          'No podrá iniciar sesión ni renovar su sesión. Si ya tiene una sesión abierta, puede seguir hasta 2 horas.',
        confirmLabel: 'Bloquear',
        tone: 'default',
        onConfirm: async () => {
          setIsConfirmLoading(true);
          setProcessingId(user.id);
          try {
            await changeUserStatus(user.id, false);
            toast.success('Usuario bloqueado.');
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
      // Desbloquear: directo
      setProcessingId(user.id);
      try {
        await changeUserStatus(user.id, true);
        toast.success('Usuario desbloqueado.');
        await reload();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setProcessingId(null);
      }
    }
  };

  const openDeleteDialog = (user: AdminUserListItemDto) => {
    if (user.role === 'Admin') return;

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
          const isTargetAdmin = row.role === 'Admin';
          const isProcessing = processingId === row.id;
          const isWinery = row.role === 'Winery';

          let roleTitle = 'Hacer administrador';
          let roleIcon = <ShieldCheck className="w-4 h-4" />;
          let roleColorClass =
            'border-purple-900/60 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60';

          if (isTargetAdmin) {
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

          // Deshabilitar Bloquear y Eliminar en TODAS las filas con rol Admin (con title "Los administradores no se pueden modificar desde el panel"), no solo en la propia.
          const isActionDisabled = isProcessing || isTargetAdmin;
          const adminProtectionTooltip = isTargetAdmin
            ? 'Los administradores no se pueden modificar desde el panel'
            : undefined;

          const blockTitle = adminProtectionTooltip ?? (row.isActive ? 'Bloquear usuario' : 'Desbloquear usuario');
          const deleteTitle = adminProtectionTooltip ?? 'Eliminar usuario';

          return (
            <div className="flex items-center justify-end gap-1.5">
              {/* Ver perfil */}
              {row.username?.trim() ? (
                <Link
                  to={`/perfil/${encodeURIComponent(row.username)}`}
                  title="Ver perfil"
                  aria-label="Ver perfil"
                  className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-colors inline-flex items-center justify-center"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Usuario sin nombre de perfil"
                  aria-label="Ver perfil"
                  className="p-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-neutral-500 opacity-40 cursor-not-allowed inline-flex items-center justify-center"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

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

              {/* Bloquear / Desbloquear */}
              <button
                type="button"
                disabled={isActionDisabled}
                title={blockTitle}
                aria-label={blockTitle}
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
                disabled={isActionDisabled}
                title={deleteTitle}
                aria-label={deleteTitle}
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

      {/* Barra de búsqueda y filtros en servidor */}
      <AdminFilterBar
        searchValue={filters.search ?? ''}
        onSearchChange={handleSearchChange}
        searchLabel="Buscar usuario"
        searchPlaceholder="Buscar por usuario o email..."
        selects={selects}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Error de carga */}
      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {/* Tabla de usuarios */}
      <DataTable
        columns={columns}
        rows={users}
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
          totalCount={totalCount}
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
