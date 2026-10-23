import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Upload,
  Trash2,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import ProfileTopBar from '../components/layout/ProfileTopBar';
import { getAvatarUrl } from '../lib/avatar';
import {
  getCurrentUserApi,
  updateProfileApi,
  uploadAvatarApi,
  deleteAvatarApi,
  changePasswordApi,
} from '../features/users';
import { cn } from '../lib/utils';
import axios from 'axios';

type ActiveSection = 'profile' | 'security';

function extractApiErrorMessage(err: unknown, defaultMsg: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 401) {
      return 'Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.';
    }
    if (err.response?.status === 403) {
      return 'No tenés permisos para realizar esta acción.';
    }
    if (err.response?.status === 404) {
      return 'El recurso o usuario solicitado no fue encontrado.';
    }
    const data = err.response?.data as { detail?: string; title?: string; errors?: Record<string, string[]> } | undefined;
    if (data?.detail) return data.detail;
    if (data?.errors) {
      const messages = Object.values(data.errors).flat();
      if (messages.length > 0) return messages.join(' ');
    }
    if (data?.title) return data.title;
  }
  return defaultMsg;
}

/**
 * AccountPage Component (/cuenta)
 * Vista de administración de cuenta con Sidebar contenido y formulario en Card estructurada (#17151a).
 * - Sidebar limpio enfocado exclusivamente en datos de usuario y configuración.
 * - Formulario contenido en Card con tipografía editorial y botones borgoña unificados.
 */
export default function AccountPage() {
  const { user, logout, updateUserContext } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<ActiveSection>('profile');

  // Estado del formulario de perfil
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Estado de avatar
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del formulario de seguridad (contraseña)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Sincronizar con datos vivos del backend al montar la página
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveUser() {
      try {
        const live = await getCurrentUserApi();
        if (isMounted) {
          updateUserContext(live);
          setUsername(live.username || '');
          setBio(live.bio || '');
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
          navigate('/login', { replace: true });
          return;
        }
        console.warn('No se pudo refrescar el perfil vivo desde el servidor:', err);
      }
    }

    void fetchLiveUser();

    return () => {
      isMounted = false;
    };
  }, [updateUserContext, navigate]);

  // Sincronizar datos si el usuario cambia externamente
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Limpiar mensajes después de unos segundos
  useEffect(() => {
    if (profileSuccessMsg) {
      const timer = setTimeout(() => setProfileSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccessMsg]);

  useEffect(() => {
    if (passwordSuccessMsg) {
      const timer = setTimeout(() => setPasswordSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccessMsg]);

  // Manejo de carga de foto
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setProfileErrorMsg('Formato de imagen no soportado. Usá JPG, PNG o WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('La imagen supera el límite máximo permitido de 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      const res = await uploadAvatarApi(file);
      updateUserContext(res);
      setProfileSuccessMsg('¡Foto de perfil actualizada con éxito!');
    } catch (err: unknown) {
      setProfileErrorMsg(extractApiErrorMessage(err, 'No se pudo subir la foto de perfil.'));
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manejo de eliminación de foto
  const handleDeleteAvatar = async () => {
    if (!user?.photo) return;

    setIsDeletingAvatar(true);
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    try {
      await deleteAvatarApi();
      if (user) {
        updateUserContext({ ...user, photo: null });
      }
      setProfileSuccessMsg('Foto de perfil eliminada. Se usará el avatar dinámico.');
    } catch (err: unknown) {
      setProfileErrorMsg(extractApiErrorMessage(err, 'No se pudo eliminar la foto de perfil.'));
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // Guardar datos de perfil (username y bio)
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setProfileErrorMsg('El nombre de usuario no puede estar vacío.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateProfileApi({
        username: trimmedUser,
        bio: bio.trim(),
        photo: user?.photo ?? null,
      });

      updateUserContext(updated);

      setProfileSuccessMsg('¡Perfil actualizado con éxito!');
    } catch (err: unknown) {
      setProfileErrorMsg(extractApiErrorMessage(err, 'Error al guardar los cambios de perfil.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Actualizar contraseña
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (newPassword.length < 8) {
      setPasswordErrorMsg('La nueva contraseña debe contener un mínimo de 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('La confirmación de la contraseña no coincide.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePasswordApi({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMsg('¡Contraseña actualizada! Tu sesión continuará activa.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordErrorMsg(extractApiErrorMessage(err, 'Error al cambiar la contraseña. Verifica tus datos.'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const formattedRegisterDate = user?.registerDate
    ? new Date(user.registerDate).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="h-screen w-screen bg-[#0b0b0e] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col overflow-hidden">
      {/* 1. Top Bar Contextual Slim */}
      <ProfileTopBar
        backTo={user?.username ? `/perfil/${user.username}` : '/dashboard'}
        backLabel="Volver a Mi Perfil"
      />

      {/* 2. Vista Completa 100% de Pantalla (Edge-to-Edge) */}
      <main className="pt-14 flex-1 w-full flex flex-col md:flex-row overflow-hidden bg-[#0b0b0e]">
        {/* ========================================================= */}
        {/* BARRA LATERAL (SIDEBAR) */}
        {/* ========================================================= */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-white/5 p-6 sm:p-8 flex flex-col justify-between bg-[#121015]/80 overflow-y-auto">
          <div className="space-y-6">
            {/* Bloque de Usuario Jerarquizado */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group mx-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-rose-950/40 border border-white/10 shadow-lg overflow-hidden bg-stone-950 flex items-center justify-center">
                  <img
                    src={getAvatarUrl(user)}
                    alt={user?.username || 'Avatar'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getAvatarUrl({ username: user?.username });
                    }}
                  />
                </div>

                {(isUploadingAvatar || isDeletingAvatar) && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-rose-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Nombre y correo jerarquizados */}
              <h2 className="font-serif text-xl sm:text-2xl text-white font-medium mt-3 tracking-tight text-center truncate max-w-full">
                {user?.username || 'Usuario'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 text-center truncate max-w-[200px] mx-auto mt-0.5">
                {user?.email}
              </p>

              {/* Controles de Foto compactos y sobrios */}
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Cargar foto de perfil"
                />

                <button
                  type="button"
                  disabled={isUploadingAvatar || isDeletingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-1.5 px-3 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-3 w-3 text-zinc-400" />
                  <span>{user?.photo ? 'Cambiar foto' : 'Cargar foto'}</span>
                </button>

                {user?.photo && (
                  <button
                    type="button"
                    disabled={isUploadingAvatar || isDeletingAvatar}
                    onClick={handleDeleteAvatar}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 rounded-md py-1 px-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Eliminar foto</span>
                  </button>
                )}
              </div>
            </div>

            {/* Separador sutil */}
            <hr className="border-t border-white/5" />

            {/* Menú de Navegación del Sidebar: Exclusivamente CONFIGURACIÓN */}
            <nav aria-label="Menú de configuración" className="space-y-1">
              <p className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                Configuración
              </p>

              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left',
                  activeSection === 'profile'
                    ? 'bg-[#6e1a24] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <User className={cn('h-4 w-4 shrink-0 transition-colors', activeSection === 'profile' ? 'text-rose-200' : 'text-zinc-400')} />
                <span>Mi Perfil</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('security')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left',
                  activeSection === 'security'
                    ? 'bg-[#6e1a24] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <Shield className={cn('h-4 w-4 shrink-0 transition-colors', activeSection === 'security' ? 'text-rose-200' : 'text-zinc-400')} />
                <span>Seguridad y Contraseña</span>
              </button>
            </nav>
          </div>

          {/* Parte inferior del Sidebar: Botón de Cerrar Sesión */}
          <div className="pt-4 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* PANEL PRINCIPAL: LAYOUT ABIERTO Y BALANCEADO (SIN CAJA RÍGIDA) */}
        {/* ========================================================= */}
        <section className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-between overflow-y-auto bg-[#0b0b0e]">
          <div className="max-w-3xl w-full">
            {/* Cabecera Limpia */}
            <div className="border-b border-white/5 pb-4 mb-6">
              <h1 className="font-serif text-3xl text-white">
                {activeSection === 'profile' ? 'Información del Perfil' : 'Seguridad y Acceso'}
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                {activeSection === 'profile'
                  ? 'Actualizá tu alias público, biografía de cata y datos de contacto.'
                  : 'Gestioná tu contraseña para mantener protegida tu colección personal.'}
              </p>
            </div>

            {/* Mensajes de Estado */}
            {profileSuccessMsg && activeSection === 'profile' && (
              <div
                role="status"
                className="flex items-center gap-2.5 p-3 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs mb-5 animate-in fade-in"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {profileErrorMsg && activeSection === 'profile' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3 rounded-md bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs mb-5 animate-in fade-in"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            {passwordSuccessMsg && activeSection === 'security' && (
              <div
                role="status"
                className="flex items-center gap-2.5 p-3 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs mb-5 animate-in fade-in"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {passwordErrorMsg && activeSection === 'security' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3 rounded-md bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs mb-5 animate-in fade-in"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* FORMULARIO DE PERFIL */}
            {/* --------------------------------------------------------- */}
            {activeSection === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre de usuario */}
                  <div className="space-y-1.5">
                    <label htmlFor="username-input" className="block text-xs font-medium text-zinc-300">
                      Nombre de usuario
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        id="username-input"
                        type="text"
                        required
                        maxLength={100}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Tu nombre o alias"
                        className="w-full rounded-md bg-[#121015] border border-white/10 pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Email (Solo Lectura) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-input" className="block text-xs font-medium text-zinc-300">
                        Correo electrónico
                      </label>
                      <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
                        <Lock className="h-2.5 w-2.5" /> No modificable
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                      <input
                        id="email-input"
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full rounded-md bg-[#121015]/60 border border-white/5 pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-500 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* Biografía en ancho completo (sm:col-span-2) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="bio-input" className="block text-xs font-medium text-zinc-300">
                        Biografía
                      </label>
                      <span
                        className={cn(
                          'text-[10px] font-mono',
                          bio.length > 900 ? 'text-amber-400' : 'text-zinc-500'
                        )}
                      >
                        {bio.length} / 1000
                      </span>
                    </div>
                    <textarea
                      id="bio-input"
                      rows={4}
                      maxLength={1000}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Compartí tus preferencias vitivinícolas, bodegas de preferencia o notas sobre tus catas..."
                      className="w-full rounded-md bg-[#121015] border border-white/10 p-3 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Botón Guardar Cambios alineado a la derecha */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#6e1a24] hover:bg-[#85222e] text-white font-medium text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar cambios</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* --------------------------------------------------------- */}
            {/* FORMULARIO DE SEGURIDAD */}
            {/* --------------------------------------------------------- */}
            {activeSection === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Contraseña Actual */}
                  <div className="sm:col-span-2 space-y-1.5 max-w-md">
                    <label
                      htmlFor="current-password-input"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        id="current-password-input"
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md bg-[#121015] border border-white/10 pl-9 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showCurrentPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Nueva Contraseña y Confirmación */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="new-password-input"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        id="new-password-input"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        maxLength={128}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md bg-[#121015] border border-white/10 pl-9 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        aria-label={showNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm-password-input"
                      className="block text-xs font-medium text-zinc-300"
                    >
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        id="confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        maxLength={128}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md bg-[#121015] border border-white/10 pl-9 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botón Guardar Contraseña alineado a la derecha */}
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#6e1a24] hover:bg-[#85222e] text-white font-medium text-xs sm:text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <span>Actualizar contraseña</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Fecha de Creación en el pie del panel */}
          {formattedRegisterDate && (
            <footer className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center text-[11px] text-zinc-500 max-w-3xl">
              <span>AyVino • Plataforma de Cava & Sommelier</span>
              <span>Miembro desde el {formattedRegisterDate}</span>
            </footer>
          )}
        </section>
      </main>
    </div>
  );
}
