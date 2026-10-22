import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Wine,
  Bookmark,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../features/auth';
import { DashboardNavbar } from '../features/dashboard';
import { getAvatarUrl } from '../lib/avatar';
import {
  updateProfileApi,
  uploadAvatarApi,
  deleteAvatarApi,
  changePasswordApi,
} from '../features/users';
import { cn } from '../lib/utils';
import axios from 'axios';

type ActiveSection = 'profile' | 'security';

/**
 * AccountPage Component (/cuenta)
 * Vista integrada de cuenta con Sidebar y panel principal sin tarjetas fragmentadas.
 * Ocupa el ancho extendido (max-w-6xl) adaptándose a una sola pantalla sin scroll innecesario.
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

  // Sincronizar datos si el usuario cambia
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

  // Manejador para guardar perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setProfileErrorMsg('El nombre de usuario es obligatorio.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser = await updateProfileApi({
        username: trimmedUsername,
        bio: bio.trim().length > 0 ? bio.trim() : null,
        photo: user?.photo || null,
      });

      updateUserContext(updatedUser);
      setProfileSuccessMsg('Perfil actualizado correctamente.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          'Error al actualizar el perfil.';
        setProfileErrorMsg(errorDetail);
      } else {
        setProfileErrorMsg('Ocurrió un error inesperado al actualizar el perfil.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Manejador para subir foto de avatar
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg('La foto seleccionada supera el límite de 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setProfileErrorMsg(null);
    setIsUploadingAvatar(true);
    try {
      const updatedUser = await uploadAvatarApi(file);
      updateUserContext(updatedUser);
      setProfileSuccessMsg('Foto de perfil actualizada exitosamente.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          'Error al subir la foto de perfil.';
        setProfileErrorMsg(errorDetail);
      } else {
        setProfileErrorMsg('Ocurrió un error inesperado al subir la foto.');
      }
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manejador para eliminar foto de avatar
  const handleDeleteAvatar = async () => {
    setProfileErrorMsg(null);
    setIsDeletingAvatar(true);
    try {
      const updatedUser = await deleteAvatarApi();
      updateUserContext(updatedUser);
      setProfileSuccessMsg('Foto eliminada. Se restauró tu avatar predeterminado.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          'Error al eliminar la foto de perfil.';
        setProfileErrorMsg(errorDetail);
      } else {
        setProfileErrorMsg('Ocurrió un error inesperado al eliminar la foto.');
      }
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  // Manejador para cambio de contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!currentPassword) {
      setPasswordErrorMsg('Debes ingresar tu contraseña actual.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordErrorMsg('La nueva contraseña debe ser diferente a la actual.');
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
      if (axios.isAxiosError(err)) {
        const errorDetail =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          'Error al cambiar la contraseña. Verifica tus datos.';
        setPasswordErrorMsg(errorDetail);
      } else {
        setPasswordErrorMsg('Ocurrió un error inesperado al cambiar la contraseña.');
      }
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
    <div className="h-screen w-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col overflow-hidden">
      {/* 1. Navbar Superior Persistente */}
      <DashboardNavbar />

      {/* 2. Vista Completa 100% de Pantalla (Edge-to-Edge) */}
      <main className="pt-18 flex-1 w-full flex flex-col md:flex-row overflow-hidden">
        {/* ========================================================= */}
        {/* BARRA LATERAL (SIDEBAR) */}
        {/* ========================================================= */}
        <aside className="w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r border-white/10 p-6 sm:p-8 flex flex-col justify-between bg-stone-950/50 overflow-y-auto">
          <div className="space-y-6">
            {/* Tarjeta de Usuario Fija en Sidebar con Avatar y Controles */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full border border-white/10 overflow-hidden bg-stone-950 shadow-md flex items-center justify-center">
                  <img
                    src={getAvatarUrl(user)}
                    alt={user?.username || 'Avatar'}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user?.username || 'AyVino')}&backgroundColor=1c1917,292524`;
                    }}
                  />
                </div>

                {(isUploadingAvatar || isDeletingAvatar) && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-rose-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Nombre y correo en Sidebar */}
              <h2 className="mt-3 text-sm font-semibold text-zinc-100 truncate max-w-full">
                {user?.username || 'Usuario'}
              </h2>
              <p className="text-[11px] text-zinc-400 truncate max-w-full">
                {user?.email}
              </p>

              {/* Controles de Foto directamente en el Sidebar */}
              <div className="w-full flex flex-col gap-1.5 mt-3">
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
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
                >
                  <Upload className="h-3 w-3 text-zinc-400" />
                  <span>{user?.photo ? 'Cambiar foto' : 'Cargar foto'}</span>
                </button>

                {user?.photo && (
                  <button
                    type="button"
                    disabled={isUploadingAvatar || isDeletingAvatar}
                    onClick={handleDeleteAvatar}
                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-stone-900/60 hover:bg-rose-950/30 text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors cursor-pointer border border-rose-500/20 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Eliminar foto</span>
                  </button>
                )}
              </div>
            </div>

            {/* Separador sutil */}
            <hr className="border-t border-white/5" />

            {/* Menú de Navegación del Sidebar */}
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
                    ? 'bg-stone-800 text-white border border-white/10 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <User className="h-4 w-4 text-rose-400" />
                <span>Mi Perfil</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('security')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left',
                  activeSection === 'security'
                    ? 'bg-stone-800 text-white border border-white/10 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Seguridad y Contraseña</span>
              </button>

              <div className="pt-3">
                <p className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                  Colección
                </p>

                <Link
                  to="/cava"
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Wine className="h-4 w-4 text-zinc-400" />
                  <span>Mi Cava</span>
                  <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300">
                    24
                  </span>
                </Link>

                <a
                  href="#deseados"
                  className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Bookmark className="h-4 w-4 text-zinc-400" />
                  <span>Deseados</span>
                </a>
              </div>
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
        {/* PANEL PRINCIPAL (DERECHA) */}
        {/* ========================================================= */}
        <section className="flex-1 p-8 sm:p-12 flex flex-col justify-between overflow-y-auto bg-stone-900/10">
          <div className="max-w-3xl w-full">
            {/* Encabezado sin foto duplicada */}
            <div className="pb-5 border-b border-white/5 mb-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 font-serif">
                {activeSection === 'profile' ? 'Información del Perfil' : 'Seguridad y Acceso'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                {activeSection === 'profile'
                  ? 'Actualizá tu alias público, biografía de cata y datos de contacto.'
                  : 'Gestioná tu contraseña para mantener protegida tu colección personal.'}
              </p>
            </div>

              {/* Mensajes de Estado en Panel */}
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
              {/* VISTA 1: FORMULARIO DE PERFIL */}
              {/* --------------------------------------------------------- */}
              {activeSection === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                          className="w-full rounded-md bg-stone-950/80 border border-white/10 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors"
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
                          className="w-full rounded-md bg-stone-950/40 border border-white/5 pl-9 pr-3 py-2 text-xs text-zinc-500 cursor-not-allowed select-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Biografía */}
                  <div className="space-y-1.5">
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
                      className="w-full rounded-md bg-stone-950/80 border border-white/10 p-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500/50 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* Botón Guardar Cambios */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
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
              {/* VISTA 2: FORMULARIO DE SEGURIDAD */}
              {/* --------------------------------------------------------- */}
              {activeSection === 'security' && (
                <form onSubmit={handleChangePassword} className="space-y-5 animate-in fade-in duration-150">
                  {/* Contraseña Actual */}
                  <div className="space-y-1.5 max-w-md">
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
                        className="w-full rounded-md bg-stone-950/80 border border-white/10 pl-9 pr-9 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors font-mono"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                          className="w-full rounded-md bg-stone-950/80 border border-white/10 pl-9 pr-9 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors font-mono"
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
                          className="w-full rounded-md bg-stone-950/80 border border-white/10 pl-9 pr-9 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors font-mono"
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

                  {/* Botón Guardar Contraseña */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
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
              <footer className="pt-6 border-t border-white/5 mt-6 flex justify-between items-center text-[11px] text-zinc-500">
                <span>AyVino • Plataforma de Cava & Sommelier</span>
                <span>Miembro desde el {formattedRegisterDate}</span>
              </footer>
            )}
          </section>
      </main>
    </div>
  );
}
