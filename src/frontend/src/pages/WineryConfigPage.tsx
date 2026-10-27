import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  Calendar,
  MapPin,
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
  ShieldCheck,
  Clock,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { isAxiosError } from 'axios';
import { useAuth } from '../features/auth';
import {
  useWinery,
  updateWinery,
  uploadImage,
  RegionPicker,
  WineryLogo,
  WineryTopBar,
  type UpdateWineryRequestDto,
  type RegionPickerValue,
} from '../features/winery';
import { getCurrentUserApi, changePasswordApi } from '../features/users';
import type { UserProfileDto } from '../features/auth/types';
import { cn } from '../lib/utils';

type ActiveConfigSection = 'info' | 'region' | 'account' | 'security';

function extractErrorMessage(err: unknown, defaultMsg: string): string {
  if (isAxiosError<{ detail?: string; title?: string; errors?: Record<string, string[]> }>(err)) {
    if (err.response?.status === 401) {
      return 'Tu sesión ha expirado. Por favor, iniciá sesión nuevamente.';
    }
    if (err.response?.status === 403) {
      return 'No tenés permisos para realizar esta acción.';
    }
    if (err.response?.status === 404) {
      return 'La bodega o recurso solicitado no fue encontrado.';
    }
    if (err.response?.status === 413) {
      return 'El archivo supera el tamaño máximo permitido de 2 MB.';
    }
    if (err.response?.status === 415) {
      return 'Formato no soportado. Usá JPG, PNG o WEBP.';
    }
    const data = err.response?.data;
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
 * WineryConfigPage Component (/bodega/configuracion)
 * Pantalla inmersiva de configuración institucional para la bodega.
 * Réplica visual exacta y desacoplada de AccountPage:
 * - TopBar minimalista fija con vía de escape a /bodega/dashboard.
 * - Sidebar izquierda con logo circular grande, estado oficial/en revisión, subida de logo y tabs en font-mono.
 * - 4 Secciones: "Datos de la bodega", "Región y terruño", "Cuenta del responsable" y "Seguridad".
 * - Tipografía editorial serif, inputs #121015 con bordes white/10 y botones unificados #6e1a24.
 */
export default function WineryConfigPage() {
  const { user, logout } = useAuth();
  const { winery, reload } = useWinery();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<ActiveConfigSection>('info');

  // 1. Datos de la Bodega
  const [name, setName] = useState<string>(() => winery?.name ?? '');
  const [foundationYear, setFoundationYear] = useState<string>(
    () => winery?.foundationYear?.toString() ?? '',
  );
  const [website, setWebsite] = useState<string>(() => winery?.website ?? '');
  const [description, setDescription] = useState<string>(() => winery?.description ?? '');
  const [isSavingInfo, setIsSavingInfo] = useState<boolean>(false);
  const [infoErrors, setInfoErrors] = useState<Record<string, string>>({});
  const [infoSuccessMsg, setInfoSuccessMsg] = useState<string | null>(null);
  const [infoErrorMsg, setInfoErrorMsg] = useState<string | null>(null);

  // 2. Región y Terruño
  const [selectedRegion, setSelectedRegion] = useState<RegionPickerValue | null>(null);
  const [isLocationDirty, setIsLocationDirty] = useState<boolean>(false);
  const [isSavingRegion, setIsSavingRegion] = useState<boolean>(false);
  const [regionSuccessMsg, setRegionSuccessMsg] = useState<string | null>(null);
  const [regionErrorMsg, setRegionErrorMsg] = useState<string | null>(null);

  // 3. Logo Oficial
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState<boolean>(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState<string | null>(null);
  const [logoErrorMsg, setLogoErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 4. Cuenta del Responsable
  const [liveUser, setLiveUser] = useState<UserProfileDto | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  // 5. Seguridad y Contraseña
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Sincronizar datos de la bodega
  const wineryId = winery?.id;
  const wineryName = winery?.name;
  const wineryYear = winery?.foundationYear;
  const wineryWeb = winery?.website;
  const wineryDesc = winery?.description;

  useEffect(() => {
    let isMounted = true;
    if (!wineryId) return;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      setName(wineryName ?? '');
      setFoundationYear(wineryYear ? wineryYear.toString() : '');
      setWebsite(wineryWeb ?? '');
      setDescription(wineryDesc ?? '');
    });

    return () => {
      isMounted = false;
    };
  }, [wineryId, wineryName, wineryYear, wineryWeb, wineryDesc]);

  // Cargar usuario en vivo para la sección "Cuenta del responsable"
  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      try {
        const u = await getCurrentUserApi();
        if (isMounted) {
          setLiveUser(u);
        }
      } catch {
        // Fallo no crítico: se utiliza el usuario autenticado desde AuthContext (user?.username / user?.email) como respaldo silencioso.
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    }

    void fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-dismiss de mensajes con limpieza estricta de timer
  useEffect(() => {
    if (infoSuccessMsg) {
      const timer = setTimeout(() => setInfoSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [infoSuccessMsg]);

  useEffect(() => {
    if (regionSuccessMsg) {
      const timer = setTimeout(() => setRegionSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [regionSuccessMsg]);

  useEffect(() => {
    if (logoSuccessMsg) {
      const timer = setTimeout(() => setLogoSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [logoSuccessMsg]);

  useEffect(() => {
    if (passwordSuccessMsg) {
      const timer = setTimeout(() => setPasswordSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordSuccessMsg]);

  // Subida de Logo Oficial
  const handleLogoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !winery) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setLogoErrorMsg('Formato no soportado. Usá JPG, PNG o WEBP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoErrorMsg('El logo supera el límite máximo permitido de 2 MB.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoErrorMsg(null);
    setLogoSuccessMsg(null);

    try {
      const uploadRes = await uploadImage(file, 'wineries');
      await updateWinery(winery.id, { name: winery.name, logoUrl: uploadRes.url });
      await reload();
      setLogoSuccessMsg('¡Logo institucional actualizado con éxito!');
    } catch (err: unknown) {
      setLogoErrorMsg(extractErrorMessage(err, 'No se pudo subir el logo institucional.'));
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Quitar Logo Oficial
  const handleDeleteLogo = async () => {
    if (!winery?.logoUrl) return;

    setIsDeletingLogo(true);
    setLogoErrorMsg(null);
    setLogoSuccessMsg(null);

    try {
      await updateWinery(winery.id, { name: winery.name, logoUrl: '' });
      await reload();
      setLogoSuccessMsg('Logo institucional eliminado. Se usará el isotipo dinámico.');
    } catch (err: unknown) {
      setLogoErrorMsg(extractErrorMessage(err, 'No se pudo eliminar el logo institucional.'));
    } finally {
      setIsDeletingLogo(false);
    }
  };

  // Guardar Datos de la Bodega
  const handleSaveInfo = async (e: FormEvent) => {
    e.preventDefault();
    setInfoSuccessMsg(null);
    setInfoErrorMsg(null);
    setInfoErrors({});

    if (!winery) return;

    const trimmedName = name.trim();
    const newErrors: Record<string, string> = {};

    if (!trimmedName) {
      newErrors.name = 'El nombre de la bodega es obligatorio.';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'El nombre no puede superar los 100 caracteres.';
    }

    if (foundationYear.trim()) {
      const year = Number(foundationYear);
      if (isNaN(year) || !Number.isInteger(year) || year < 1000 || year > 2100) {
        newErrors.foundationYear = 'El año de fundación debe ser un número entre 1000 y 2100.';
      }
    }

    if (website.trim()) {
      try {
        const url = new URL(
          /^https?:\/\//i.test(website.trim()) ? website.trim() : `https://${website.trim()}`,
        );
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.website = 'El sitio web debe comenzar con http:// o https://';
        } else if (website.trim().length > 200) {
          newErrors.website = 'El sitio web no puede superar los 200 caracteres.';
        }
      } catch {
        newErrors.website = 'Ingresá una dirección web válida (ej: https://bodegaejemplo.com.ar).';
      }
    }

    if (description.length > 1000) {
      newErrors.description = 'La semblanza histórica no puede exceder los 1000 caracteres.';
    }

    if (Object.keys(newErrors).length > 0) {
      setInfoErrors(newErrors);
      return;
    }

    setIsSavingInfo(true);
    try {
      let normalizedWebsite = website.trim();
      if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
        normalizedWebsite = `https://${normalizedWebsite}`;
      }

      const payload: UpdateWineryRequestDto = {
        name: trimmedName,
        foundationYear: foundationYear.trim() ? Number(foundationYear) : null,
        website: normalizedWebsite || null,
        description: description.trim() || null,
      };

      await updateWinery(winery.id, payload);
      await reload();
      setInfoSuccessMsg('¡Datos de la bodega actualizados con éxito!');
    } catch (err: unknown) {
      setInfoErrorMsg(extractErrorMessage(err, 'Error al guardar los datos de la bodega.'));
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Guardar Región y Terruño
  const handleSaveRegion = async (e: FormEvent) => {
    e.preventDefault();
    setRegionSuccessMsg(null);
    setRegionErrorMsg(null);

    if (!winery) return;

    if (!selectedRegion) {
      setRegionErrorMsg('Seleccioná una provincia y ciudad o marcá la ubicación en el mapa.');
      return;
    }

    setIsSavingRegion(true);
    try {
      const payload: UpdateWineryRequestDto = {
        name: winery.name,
      };

      const isMapMode =
        selectedRegion.mode === 'map' &&
        selectedRegion.latitude != null &&
        selectedRegion.longitude != null;

      if (isMapMode) {
        payload.latitude = selectedRegion.latitude;
        payload.longitude = selectedRegion.longitude;
        payload.locationId = null;
      } else if (selectedRegion.locationId) {
        payload.locationId = selectedRegion.locationId;
        payload.latitude = null;
        payload.longitude = null;
      }

      await updateWinery(winery.id, payload);
      await reload();
      setIsLocationDirty(false);
      setRegionSuccessMsg('¡Ubicación y terruño actualizados correctamente!');
    } catch (err: unknown) {
      setRegionErrorMsg(extractErrorMessage(err, 'Error al actualizar el terruño de la bodega.'));
    } finally {
      setIsSavingRegion(false);
    }
  };

  // Actualizar Contraseña
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

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

      setPasswordSuccessMsg('¡Contraseña actualizada con éxito! Tu sesión continuará activa.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPasswordErrorMsg(
        extractErrorMessage(
          err,
          'Error al cambiar la contraseña. Verificá que la contraseña actual sea correcta.',
        ),
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Coordenadas iniciales para el mapa
  const initialCoords =
    winery?.latitude && winery?.longitude
      ? { latitude: winery.latitude, longitude: winery.longitude }
      : null;

  const initialLocText = winery?.location
    ? `${winery.location.regionName}, ${winery.location.stateName}`
    : null;

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen bg-[#0b0b0e] text-neutral-200 font-sans selection:bg-[#6e1a24] selection:text-white flex flex-col overflow-hidden">
      {/* 1. TopBar Contextual Fija */}
      <WineryTopBar backTo="/bodega/dashboard" backLabel="Volver al panel" />

      {/* 2. Vista Completa Edge-to-Edge */}
      <main className="pt-14 flex-1 w-full flex flex-col md:flex-row overflow-hidden bg-[#0b0b0e]">
        {/* ========================================================= */}
        {/* BARRA LATERAL (SIDEBAR) */}
        {/* ========================================================= */}
        <aside className="w-full md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-white/5 p-6 sm:p-8 flex flex-col justify-between bg-[#121015]/80 overflow-y-auto">
          <div className="space-y-6">
            {/* Bloque Identidad de la Bodega */}
            <div className="flex flex-col items-center text-center">
              <div className="relative group mx-auto">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-rose-950/40 border border-white/10 shadow-lg overflow-hidden bg-stone-950 flex items-center justify-center">
                  <WineryLogo
                    src={winery?.logoUrl}
                    name={winery?.name}
                    size="lg"
                    className="h-full w-full object-cover rounded-full"
                  />
                </div>

                {(isUploadingLogo || isDeletingLogo) && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-rose-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Nombre y Estado de Bodega */}
              <h2 className="font-serif text-xl sm:text-2xl text-white font-medium mt-3 tracking-tight text-center truncate max-w-full">
                {winery?.name || 'Mi Bodega'}
              </h2>

              <div className="mt-1.5 flex items-center justify-center">
                {winery?.status === 'Approved' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2.5 py-0.5 rounded-full font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Bodega Oficial
                  </span>
                ) : winery?.status === 'Rejected' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-rose-400 bg-rose-950/30 border border-rose-900/40 px-2.5 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Observaciones
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-amber-300 bg-amber-950/30 border border-amber-900/40 px-2.5 py-0.5 rounded-full font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    En revisión
                  </span>
                )}
              </div>

              {/* Controles de Logo compactos */}
              <div className="flex flex-col items-center gap-1.5 mt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Cargar logo de bodega"
                />

                <button
                  type="button"
                  disabled={isUploadingLogo || isDeletingLogo}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-1.5 px-3 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-3 w-3 text-zinc-400" />
                  <span>{winery?.logoUrl ? 'Cambiar logo' : 'Cargar logo'}</span>
                </button>

                {winery?.logoUrl && (
                  <button
                    type="button"
                    disabled={isUploadingLogo || isDeletingLogo}
                    onClick={handleDeleteLogo}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/20 rounded-md py-1 px-2.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Quitar logo</span>
                  </button>
                )}
              </div>

              {/* Mensajes de feedback de logo en el sidebar */}
              {logoSuccessMsg && (
                <p className="mt-2 text-[11px] text-emerald-400 font-sans">{logoSuccessMsg}</p>
              )}
              {logoErrorMsg && (
                <p className="mt-2 text-[11px] text-rose-400 font-sans">{logoErrorMsg}</p>
              )}
            </div>

            {/* Separador */}
            <hr className="border-t border-white/5" />

            {/* Menú de Navegación del Sidebar */}
            <nav aria-label="Menú de configuración institucional" className="space-y-1">
              <p className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                Configuración
              </p>

              <button
                type="button"
                onClick={() => setActiveSection('info')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer text-left',
                  activeSection === 'info'
                    ? 'bg-[#6e1a24] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <Building2
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    activeSection === 'info' ? 'text-rose-200' : 'text-zinc-400'
                  )}
                />
                <span>Datos de la bodega</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('region')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer text-left',
                  activeSection === 'region'
                    ? 'bg-[#6e1a24] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <MapPin
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    activeSection === 'region' ? 'text-rose-200' : 'text-zinc-400'
                  )}
                />
                <span>Región y terruño</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('account')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer text-left',
                  activeSection === 'account'
                    ? 'bg-[#6e1a24] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <User
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    activeSection === 'account' ? 'text-rose-200' : 'text-zinc-400'
                  )}
                />
                <span>Cuenta del responsable</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('security')}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer text-left',
                  activeSection === 'security'
                    ? 'bg-[#6e1a24] text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                )}
              >
                <Shield
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    activeSection === 'security' ? 'text-rose-200' : 'text-zinc-400'
                  )}
                />
                <span>Seguridad y contraseña</span>
              </button>
            </nav>
          </div>

          {/* Pie del Sidebar: Cerrar Sesión */}
          <div className="pt-4 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* PANEL PRINCIPAL */}
        {/* ========================================================= */}
        <section className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-between overflow-y-auto bg-[#0b0b0e]">
          <div className="max-w-3xl w-full">
            {/* Cabecera Limpia */}
            <div className="border-b border-white/5 pb-4 mb-6">
              <h1 className="font-serif text-3xl text-white">
                {activeSection === 'info' && 'Identidad y Datos de la Bodega'}
                {activeSection === 'region' && 'Ubicación Geográfica y Terruño'}
                {activeSection === 'account' && 'Cuenta del Responsable Institucional'}
                {activeSection === 'security' && 'Seguridad y Acceso a la Cuenta'}
              </h1>
              <p className="text-zinc-400 text-sm mt-1 font-sans">
                {activeSection === 'info' &&
                  'Mantené al día el nombre oficial, historia, año de fundación y enlaces de tu establecimiento.'}
                {activeSection === 'region' &&
                  'Certificá la procedencia de tus viñedos mediante el selector territorial o marcación en mapa.'}
                {activeSection === 'account' &&
                  'Información de acceso y credenciales del usuario titular de la bodega en AyVino.'}
                {activeSection === 'security' &&
                  'Gestioná tu clave de acceso para resguardar la administración de tus etiquetas oficiales.'}
              </p>
            </div>

            {/* Avisos de Estado para SECCIÓN 1: Datos */}
            {infoSuccessMsg && activeSection === 'info' && (
              <div
                role="status"
                className="flex items-center gap-2.5 p-3 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs mb-5 animate-in fade-in"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{infoSuccessMsg}</span>
              </div>
            )}
            {infoErrorMsg && activeSection === 'info' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3 rounded-md bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs mb-5 animate-in fade-in"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{infoErrorMsg}</span>
              </div>
            )}

            {/* Avisos de Estado para SECCIÓN 2: Región */}
            {regionSuccessMsg && activeSection === 'region' && (
              <div
                role="status"
                className="flex items-center gap-2.5 p-3 rounded-md bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs mb-5 animate-in fade-in"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{regionSuccessMsg}</span>
              </div>
            )}
            {regionErrorMsg && activeSection === 'region' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 p-3 rounded-md bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs mb-5 animate-in fade-in"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{regionErrorMsg}</span>
              </div>
            )}

            {/* Avisos de Estado para SECCIÓN 4: Seguridad */}
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

            {/* ========================================================= */}
            {/* SECCIÓN 1: DATOS DE LA BODEGA */}
            {/* ========================================================= */}
            {activeSection === 'info' && (
              <form noValidate onSubmit={handleSaveInfo} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Nombre oficial de la bodega <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (infoErrors.name) setInfoErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="Ej: Catena Zapata, Zuccardi, Rutini..."
                      className={cn(
                        'w-full pl-9 pr-3 py-2 rounded-md bg-[#121015] border text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors',
                        infoErrors.name ? 'border-rose-500' : 'border-white/10 focus:border-zinc-500'
                      )}
                    />
                  </div>
                  {infoErrors.name && (
                    <p className="text-[11px] text-rose-400 mt-1">{infoErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                      Año de fundación <span className="text-zinc-500">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min="1000"
                        max="2100"
                        value={foundationYear}
                        onChange={(e) => {
                          setFoundationYear(e.target.value);
                          if (infoErrors.foundationYear)
                            setInfoErrors((prev) => ({ ...prev, foundationYear: '' }));
                        }}
                        placeholder="Ej: 1902"
                        className={cn(
                          'w-full pl-9 pr-3 py-2 rounded-md bg-[#121015] border text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors font-mono',
                          infoErrors.foundationYear
                            ? 'border-rose-500'
                            : 'border-white/10 focus:border-zinc-500'
                        )}
                      />
                    </div>
                    {infoErrors.foundationYear && (
                      <p className="text-[11px] text-rose-400 mt-1">{infoErrors.foundationYear}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                      Sitio web oficial <span className="text-zinc-500">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => {
                          setWebsite(e.target.value);
                          if (infoErrors.website)
                            setInfoErrors((prev) => ({ ...prev, website: '' }));
                        }}
                        placeholder="https://www.tuestablecimiento.com.ar"
                        className={cn(
                          'w-full pl-9 pr-3 py-2 rounded-md bg-[#121015] border text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors',
                          infoErrors.website
                            ? 'border-rose-500'
                            : 'border-white/10 focus:border-zinc-500'
                        )}
                      />
                    </div>
                    {infoErrors.website && (
                      <p className="text-[11px] text-rose-400 mt-1">{infoErrors.website}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300">
                      Semblanza histórica y filosofía <span className="text-zinc-500">(Opcional)</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {description.length} / 1000
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contá la historia del viñedo, el terruño, los métodos de vinificación y la tradición familiar..."
                    className="w-full p-3 rounded-md bg-[#121015] border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors resize-none leading-relaxed"
                  />
                  {infoErrors.description && (
                    <p className="text-[11px] text-rose-400 mt-1">{infoErrors.description}</p>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingInfo}
                    className="inline-flex items-center gap-2 rounded-md bg-[#6e1a24] hover:bg-[#85222e] text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSavingInfo ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Guardar datos de la bodega</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* SECCIÓN 2: REGIÓN Y TERRUÑO */}
            {/* ========================================================= */}
            {activeSection === 'region' && (
              <form noValidate onSubmit={handleSaveRegion} className="space-y-6">
                <div className="p-4 rounded-xl bg-[#121015] border border-white/10 space-y-1.5 text-xs text-zinc-300">
                  <span className="font-mono uppercase tracking-wider text-amber-300 font-semibold block text-[10px]">
                    Ubicación Actual Registrada
                  </span>
                  <p className="text-zinc-100 font-medium">
                    {winery?.location
                      ? `${winery.location.regionName} (${winery.location.stateName})`
                      : winery?.latitude && winery?.longitude
                        ? `Coordenadas: Lat ${winery.latitude.toFixed(4)}, Long ${winery.longitude.toFixed(4)}`
                        : 'Sin terruño geográfico asignado todavía.'}
                  </p>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Podés seleccionar una provincia vitivinícola argentina con su departamento o marcar el punto exacto de la finca en el mapa interactivo.
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 p-4 bg-[#121015]">
                  <RegionPicker
                    value={selectedRegion}
                    onChange={(val) => {
                      setSelectedRegion(val);
                      setIsLocationDirty(true);
                      setRegionErrorMsg(null);
                    }}
                    initialCoordinates={initialCoords}
                    initialLocationText={initialLocText}
                    disabled={isSavingRegion}
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingRegion || !isLocationDirty}
                    className="inline-flex items-center gap-2 rounded-md bg-[#6e1a24] hover:bg-[#85222e] text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingRegion ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Actualizando terruño...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Actualizar región y terruño</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* SECCIÓN 3: CUENTA DEL RESPONSABLE */}
            {/* ========================================================= */}
            {activeSection === 'account' && (
              isLoadingUser ? (
                <div className="py-12 flex items-center justify-center gap-2 text-xs font-mono text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Sincronizando credenciales de titular...</span>
                </div>
              ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Nombre de usuario titular
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        disabled
                        value={liveUser?.username || user?.username || ''}
                        className="w-full pl-9 pr-3 py-2 rounded-md bg-[#121015]/60 border border-white/5 text-xs sm:text-sm text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Correo electrónico registrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={liveUser?.email || user?.email || ''}
                        className="w-full pl-9 pr-3 py-2 rounded-md bg-[#121015]/60 border border-white/5 text-xs sm:text-sm text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Rol institucional en AyVino
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#121015]/60 border border-white/5 text-xs text-zinc-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-mono font-medium">Productor Vitivinícola (Winery)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                      Fecha de alta de la cuenta
                    </label>
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-[#121015]/60 border border-white/5 text-xs text-zinc-300">
                      <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="font-mono">
                        {liveUser?.registerDate
                          ? new Date(liveUser.registerDate).toLocaleDateString('es-AR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Registrado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-stone-900/30 border border-white/5 text-xs text-zinc-400 leading-relaxed font-sans mt-4">
                  <p>
                    El nombre de usuario y el correo electrónico del titular están vinculados a la personería
                    institucional de la bodega. Para solicitar un cambio de correo electrónico de administración,
                    comunicate con el equipo editorial de AyVino a través de los canales de asistencia para productores.
                  </p>
                </div>
              </div>
              )
            )}

            {/* ========================================================= */}
            {/* SECCIÓN 4: SEGURIDAD Y ACCESO */}
            {/* ========================================================= */}
            {activeSection === 'security' && (
              <form noValidate onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                    Contraseña actual <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingresá tu contraseña vigente"
                      className="w-full pl-9 pr-10 py-2 rounded-md bg-[#121015] border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                      Nueva contraseña <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full pl-9 pr-10 py-2 rounded-md bg-[#121015] border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-zinc-300 mb-1.5">
                      Confirmar nueva contraseña <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repetí la nueva contraseña"
                        className="w-full pl-9 pr-10 py-2 rounded-md bg-[#121015] border border-white/10 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="inline-flex items-center gap-2 rounded-md bg-[#6e1a24] hover:bg-[#85222e] text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Actualizar contraseña</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer de solo lectura dentro del panel de configuración */}
          <div className="pt-8 mt-8 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>AyVino · Panel institucional de productores</span>
            <span>Seguridad y Datos Certificados</span>
          </div>
        </section>
      </main>
    </div>
  );
}
