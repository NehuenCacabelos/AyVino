import { useState, useEffect, useRef, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../features/auth';
import { registerWinery, LocationCascadeSelect } from '../features/winery';
import authVineyardImg from '../assets/auth-vineyard.webp';

/**
 * WineryRegisterPage Component (/bodega/registro)
 * Formulario de alta institucional unificado: crea el usuario dueño con rol "Winery"
 * y su registro de bodega en una sola transacción.
 * Tras el registro exitoso, efectúa login automático para sincronizar AuthContext y redirige a /bodega/dashboard.
 */
export default function WineryRegisterPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Datos del Responsable
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Datos de la Bodega
  const [wineryName, setWineryName] = useState('');
  const [locationId, setLocationId] = useState<number | null>(null);
  const [foundationYear, setFoundationYear] = useState<string>('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // Términos y Estado
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Si ya tiene sesión con rol Winery, redirigir al panel
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'Winery' || user?.role === 'Admin') {
        navigate('/bodega/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user?.role, navigate]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newErrors: Record<string, string> = {};

    // Validaciones del Responsable
    if (!username.trim()) {
      newErrors.username = 'El nombre del responsable es obligatorio';
    } else if (username.trim().length > 100) {
      newErrors.username = 'El nombre no puede superar los 100 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'El formato del correo electrónico no es válido';
    } else if (email.trim().length > 100) {
      newErrors.email = 'El correo electrónico no puede superar los 100 caracteres';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (password.length > 128) {
      newErrors.password = 'La contraseña no puede superar los 128 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debés repetir la contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validaciones de la Bodega
    if (!wineryName.trim()) {
      newErrors.wineryName = 'El nombre de la bodega es obligatorio';
    } else if (wineryName.trim().length > 100) {
      newErrors.wineryName = 'El nombre de la bodega no puede superar los 100 caracteres';
    }

    if (!locationId || locationId <= 0) {
      newErrors.locationId = 'Debés seleccionar una provincia y región para la bodega';
    }

    if (foundationYear.trim()) {
      const yearNum = Number(foundationYear);
      if (isNaN(yearNum) || yearNum < 1000 || yearNum > 2100) {
        newErrors.foundationYear = 'El año de fundación debe estar entre 1000 y 2100';
      }
    }

    if (website.trim()) {
      try {
        const url = new URL(website.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.website = 'El sitio web debe comenzar con http:// o https://';
        } else if (website.trim().length > 200) {
          newErrors.website = 'El sitio web no puede superar los 200 caracteres';
        }
      } catch {
        newErrors.website = 'Ingresá una dirección web válida (ej: https://bodega.com)';
      }
    }

    if (description.trim().length > 1000) {
      newErrors.description = 'La descripción no puede superar los 1000 caracteres';
    }

    if (!termsAccepted) {
      newErrors.terms = 'Debés aceptar los términos y condiciones para continuar';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // 1. Registro unificado en el backend
      await registerWinery({
        username: username.trim(),
        email: email.trim(),
        password,
        wineryName: wineryName.trim(),
        locationId: locationId!,
        foundationYear: foundationYear.trim() ? Number(foundationYear) : null,
        website: website.trim() ? website.trim() : null,
        description: description.trim() ? description.trim() : null,
      });

      // 2. Login inmediato con las mismas credenciales para obtener refresh token y sesión completa
      await login({
        email: email.trim(),
        password,
      });

      setIsSuccess(true);
      redirectTimerRef.current = setTimeout(() => {
        navigate('/bodega/dashboard');
      }, 950);
    } catch (err: unknown) {
      let detail: string | undefined;
      let status: number | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
        status = err.response?.status;
      }

      if (status === 409) {
        setErrorMessage(
          detail ?? 'El correo electrónico o nombre de usuario ya se encuentra registrado.',
        );
      } else {
        setErrorMessage(
          detail ??
            'No se pudo completar el registro de la bodega. Verificá los datos ingresados o la conexión con el servidor.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e11] text-neutral-100 font-sans flex items-center justify-center p-3 sm:p-5 selection:bg-[#6b1d2f] selection:text-white">
      {/* Tarjeta Central Flotante */}
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[780px] bg-[#141416] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Columna Izquierda: Formulario con scroll vertical interno suave */}
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between h-full overflow-y-auto bg-[#141416]">
          
          {/* Header Superior: Volver a la izquierda, Logo a la derecha */}
          <div className="flex items-center justify-between shrink-0 mb-4">
            <Link
              to="/para-bodegas"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </Link>

            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="font-serif text-xl font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors">
                AyVino
              </span>
              <div className="w-8 h-8 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-rose-300 group-hover:border-[#6b1d2f] transition-colors shadow-sm">
                <Wine className="w-4 h-4 text-rose-300" strokeWidth={1.8} />
              </div>
            </Link>
          </div>

          {/* Cuerpo Central */}
          <div className="flex-1 flex flex-col justify-center py-2">
            
            {/* Cabecera Editorial */}
            <div className="mb-5">
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-200/70 font-mono block mb-1.5 font-medium">
                Alta Institucional
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal tracking-tight leading-tight">
                Registrá tu bodega oficial
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans font-light">
                Completá los datos del responsable y del establecimiento para acceder al panel.
              </p>
            </div>

            {/* Estado de Éxito */}
            {isSuccess ? (
              <div className="py-12 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-zinc-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white">
                  ¡Bodega registrada con éxito!
                </h2>
                <p className="text-xs text-zinc-400 max-w-sm leading-relaxed font-sans">
                  Iniciando sesión oficial de {wineryName || 'Bodega'} y preparando tu panel de gestión...
                </p>
              </div>
            ) : (
              <>
                {/* Alerta de Error del Servidor */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="leading-snug font-sans">{errorMessage}</p>
                  </div>
                )}

                {/* Formulario Clean Dark */}
                <form noValidate onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Bloque 1: Responsable */}
                  <div className="space-y-3 pt-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-1">
                      1. Responsable de la cuenta
                    </p>

                    <div>
                      <input
                        id="winery-owner-name"
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          clearError('username');
                        }}
                        placeholder="Nombre y apellido o apodo del responsable"
                        autoComplete="name"
                        aria-label="Nombre del responsable"
                        className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                          errors.username
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />
                      {errors.username && (
                        <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.username}</p>
                      )}
                    </div>

                    <div>
                      <input
                        id="winery-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearError('email');
                        }}
                        placeholder="Correo institucional de contacto"
                        autoComplete="email"
                        aria-label="Correo institucional"
                        className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                          errors.email
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.email}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="relative">
                          <input
                            id="winery-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              clearError('password');
                              if (errors.confirmPassword === 'Las contraseñas no coinciden') {
                                clearError('confirmPassword');
                              }
                            }}
                            placeholder="Contraseña (mín. 8)"
                            autoComplete="new-password"
                            aria-label="Contraseña"
                            className={`h-12 w-full rounded-xl px-4 pr-11 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                              errors.password
                                ? 'border-rose-500/70 focus:border-rose-500'
                                : 'border-zinc-800/80 focus:border-zinc-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer focus:outline-none"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.password}</p>
                        )}
                      </div>

                      <div>
                        <div className="relative">
                          <input
                            id="winery-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              clearError('confirmPassword');
                            }}
                            placeholder="Repetir clave"
                            autoComplete="new-password"
                            aria-label="Repetir clave"
                            className={`h-12 w-full rounded-xl px-4 pr-11 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                              errors.confirmPassword
                                ? 'border-rose-500/70 focus:border-rose-500'
                                : 'border-zinc-800/80 focus:border-zinc-500'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer focus:outline-none"
                            aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-[11px] text-rose-400 mt-1 pl-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Establecimiento */}
                  <div className="space-y-3 pt-2">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 border-b border-white/5 pb-1">
                      2. Datos del establecimiento
                    </p>

                    <div>
                      <input
                        id="winery-name"
                        type="text"
                        value={wineryName}
                        onChange={(e) => {
                          setWineryName(e.target.value);
                          clearError('wineryName');
                        }}
                        placeholder="Nombre oficial de la bodega (ej: Bodega Catena Zapata)"
                        aria-label="Nombre de la bodega"
                        className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                          errors.wineryName
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />
                      {errors.wineryName && (
                        <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.wineryName}</p>
                      )}
                    </div>

                    {/* Selector de Ubicación en Cascada */}
                    <LocationCascadeSelect
                      value={locationId}
                      onChange={(id) => {
                        setLocationId(id);
                        clearError('locationId');
                      }}
                      error={errors.locationId}
                      disabled={isLoading}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          id="winery-foundation"
                          type="number"
                          value={foundationYear}
                          onChange={(e) => {
                            setFoundationYear(e.target.value);
                            clearError('foundationYear');
                          }}
                          placeholder="Año de fundación (ej: 1902)"
                          min={1000}
                          max={2100}
                          aria-label="Año de fundación"
                          className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                            errors.foundationYear
                              ? 'border-rose-500/70 focus:border-rose-500'
                              : 'border-zinc-800/80 focus:border-zinc-500'
                          }`}
                        />
                        {errors.foundationYear && (
                          <p className="text-[11px] text-rose-400 mt-1 pl-1">
                            {errors.foundationYear}
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          id="winery-website"
                          type="url"
                          value={website}
                          onChange={(e) => {
                            setWebsite(e.target.value);
                            clearError('website');
                          }}
                          placeholder="Sitio web (https://...)"
                          aria-label="Sitio web"
                          className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                            errors.website
                              ? 'border-rose-500/70 focus:border-rose-500'
                              : 'border-zinc-800/80 focus:border-zinc-500'
                          }`}
                        />
                        {errors.website && (
                          <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.website}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <textarea
                        id="winery-description"
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          clearError('description');
                        }}
                        rows={3}
                        placeholder="Descripción, historia o filosofía del viñedo (opcional)"
                        aria-label="Descripción de la bodega"
                        className={`w-full rounded-xl p-3.5 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors resize-none ${
                          errors.description
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />
                      {errors.description && (
                        <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Términos y Condiciones */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-400 select-none">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          clearError('terms');
                        }}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 accent-[#4f131f] cursor-pointer"
                      />
                      <span>
                        Declaro ser representante de la bodega y acepto los{' '}
                        <Link
                          to="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-zinc-300 hover:text-white transition-colors"
                        >
                          términos y condiciones
                        </Link>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-6">{errors.terms}</p>
                    )}
                  </div>

                  {/* Botón Sello de Cava */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs uppercase tracking-widest text-rose-100 font-medium transition-colors shadow-sm mt-3 inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-rose-200/30 border-t-rose-100 rounded-full animate-spin" />
                    ) : (
                      <span>Registrar bodega oficial</span>
                    )}
                  </button>
                </form>
              </>
            )}

          </div>

          {/* Footer Inferior Fijo */}
          <div className="text-center text-xs text-zinc-400 pt-4 shrink-0">
            <p>
              ¿Ya registraste tu bodega?{' '}
              <Link
                to="/login"
                className="text-zinc-200 hover:text-white font-medium underline transition-colors"
              >
                Iniciá sesión acá
              </Link>
            </p>
          </div>

        </div>

        {/* Columna Derecha: Foto Vertical de Viñedos */}
        <div className="hidden lg:relative lg:flex lg:flex-col lg:justify-end p-8 md:p-10 overflow-hidden h-full border-l border-white/10">
          <img
            src={authVineyardImg}
            alt="Viñedos y cordillera en Valle de Uco, Mendoza"
            loading="lazy"
            decoding="async"
            width={600}
            height={900}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-black/25 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200/80 font-medium">
              Voz de Productor
            </span>
            <p className="text-xs tracking-[0.3em] text-white/90 font-light uppercase">
              VALLE DE UCO · MENDOZA
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

