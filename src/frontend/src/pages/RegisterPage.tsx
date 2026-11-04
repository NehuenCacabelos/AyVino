import { useState, useEffect, useRef, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, ArrowLeft, AlertCircle, CheckCircle2, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../features/auth';
import { checkUsernameAvailabilityApi } from '../features/users';
import authVineyardImg from '../assets/auth-vineyard.webp';

/**
 * RegisterPage Component
 * Vista de registro (/register) con diseño Clean Dark y minimalista.
 * - Validación en vivo de disponibilidad de nombre de usuario en onBlur.
 * - Campos opcionales de fecha de nacimiento y género.
 * - Feedback inmediato de error 409 mapeado al campo.
 */
export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const checkReqIdRef = useRef(0);

  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Limpiar temporizador de redirección en desmontaje
  useEffect(() => {
    return () => {
      clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Redirigir al Dashboard si ya tiene sesión activa
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleUsernameBlur = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setUsernameStatus('idle');
      return;
    }
    if (trimmed.length > 100) {
      setUsernameStatus('invalid');
      setErrors((prev) => ({ ...prev, name: 'El nombre de usuario no puede superar los 100 caracteres' }));
      return;
    }

    const reqId = ++checkReqIdRef.current;
    setUsernameStatus('checking');

    try {
      const isAvail = await checkUsernameAvailabilityApi(trimmed);
      if (checkReqIdRef.current !== reqId) return;
      if (isAvail) {
        setUsernameStatus('available');
        clearError('name');
      } else {
        setUsernameStatus('taken');
        setErrors((prev) => ({ ...prev, name: 'Ese nombre de usuario ya existe, elegí otro' }));
      }
    } catch {
      if (checkReqIdRef.current !== reqId) return;
      setUsernameStatus('idle');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre de usuario es requerido';
    } else if (usernameStatus === 'taken') {
      newErrors.name = 'Ese nombre de usuario ya existe, elegí otro';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'El formato del correo no es válido';
    }

    if (birthDate) {
      const selected = new Date(birthDate);
      const today = new Date();
      if (selected > today) {
        newErrors.birthDate = 'La fecha de nacimiento no puede ser futura';
      } else if (selected.getFullYear() < 1900) {
        newErrors.birthDate = 'La fecha de nacimiento no puede ser anterior a 1900';
      }
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Debés repetir la contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      await register({
        username: name.trim(),
        email: email.trim(),
        password,
        birthDate: birthDate ? birthDate : null,
        gender: gender ? gender : null,
      });

      setIsSuccess(true);
      redirectTimerRef.current = setTimeout(() => {
        navigate('/dashboard');
      }, 900);
    } catch (err: unknown) {
      let detail: string | undefined;
      let status: number | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
        status = err.response?.status;
      }
      if (status === 409) {
        setUsernameStatus('taken');
        setErrors((prev) => ({ ...prev, name: 'Ese nombre de usuario ya existe, elegí otro' }));
        setErrorMessage(detail ?? 'Ese nombre de usuario ya existe, elegí otro.');
      } else {
        setErrorMessage(
          detail ?? 'No se pudo registrar la cuenta. Verificá los datos ingresados o la conexión con el servidor.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0e0e11] text-neutral-100 font-sans flex items-center justify-center p-4 selection:bg-[#6b1d2f] selection:text-white">
      {/* Tarjeta Central Flotante */}
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[700px] bg-[#141416] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Columna Izquierda: Formulario de Registro */}
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-between h-full overflow-y-auto bg-[#141416]">
          
          {/* Header Superior: Volver a la izquierda, Logo a la derecha */}
          <div className="flex items-center justify-between mb-2">
            <Link
              to="/"
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

          {/* Cuerpo Central: Formulario */}
          <div className="flex-1 flex flex-col justify-center py-2">
            {/* Cabecera Editorial */}
            <div className="mb-4">
              <h1 className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal tracking-tight leading-tight">
                Creá tu bodega personal
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans font-light">
                Comenzá a catalogar, calificar y organizar tus botellas.
              </p>
            </div>

            {/* Estado de Éxito */}
            {isSuccess ? (
              <div className="py-8 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-zinc-950 border border-zinc-800 text-emerald-400 flex items-center justify-center shadow-xl">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-white">
                  ¡Perfil creado con éxito!
                </h2>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed font-sans">
                  {`Bienvenido/a ${name || 'Sommelier'}, sincronizando tu cava y cargando catálogo...`}
                </p>
              </div>
            ) : (
              <>
                {/* Alerta de Error del Servidor */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="mb-3 flex items-start gap-2.5 rounded-xl border border-rose-900/60 bg-rose-950/30 p-2.5 text-xs text-rose-300"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="leading-snug font-sans">{errorMessage}</p>
                  </div>
                )}

                {/* Formulario Clean Dark */}
                <form noValidate onSubmit={handleSubmit} className="space-y-3">
                  {/* Nombre de usuario con disponibilidad en vivo */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="register-name" className="block text-xs font-medium text-zinc-300">
                        Nombre de usuario
                      </label>
                      <span className="text-[11px] text-zinc-500 font-normal">
                        Así te van a ver en reseñas y comentarios
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        id="register-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearError('name');
                          setUsernameStatus('idle');
                        }}
                        onBlur={handleUsernameBlur}
                        placeholder="Elegí tu nombre de usuario"
                        autoComplete="username"
                        aria-label="Nombre de usuario"
                        className={`h-10 w-full rounded-xl pl-3.5 pr-10 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                          errors.name || usernameStatus === 'taken'
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : usernameStatus === 'available'
                            ? 'border-emerald-500/60 focus:border-emerald-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />

                      {/* Indicador de estado a la derecha */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        {usernameStatus === 'checking' && (
                          <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
                        )}
                        {usernameStatus === 'available' && (
                          <Check className="h-4 w-4 text-emerald-400" />
                        )}
                        {usernameStatus === 'taken' && (
                          <AlertCircle className="h-4 w-4 text-rose-400" />
                        )}
                      </div>
                    </div>

                    {usernameStatus === 'available' && !errors.name && (
                      <p className="text-[11px] text-emerald-400 mt-1 pl-1">Nombre de usuario disponible</p>
                    )}

                    {errors.name && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearError('email');
                      }}
                      placeholder="Correo electrónico"
                      autoComplete="email"
                      aria-label="Correo electrónico"
                      className={`h-10 w-full rounded-xl px-3.5 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                        errors.email
                          ? 'border-rose-500/70 focus:border-rose-500'
                          : 'border-zinc-800/80 focus:border-zinc-500'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Campos opcionales: Fecha de nacimiento y Género */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="register-birthdate" className="block text-[11px] font-medium text-zinc-400 mb-0.5">
                        Fecha de nacimiento <span className="text-zinc-600 font-normal">(opcional)</span>
                      </label>
                      <input
                        id="register-birthdate"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        min="1900-01-01"
                        value={birthDate}
                        onChange={(e) => {
                          setBirthDate(e.target.value);
                          clearError('birthDate');
                        }}
                        aria-label="Fecha de nacimiento"
                        className="h-9 w-full rounded-xl px-3 text-xs font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 border border-zinc-800/80 focus:border-zinc-500 focus:outline-none focus:bg-zinc-900 transition-colors"
                      />
                      {errors.birthDate && (
                        <p className="text-[10px] text-rose-400 mt-0.5 pl-1">{errors.birthDate}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="register-gender" className="block text-[11px] font-medium text-zinc-400 mb-0.5">
                        Género <span className="text-zinc-600 font-normal">(opcional)</span>
                      </label>
                      <select
                        id="register-gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        aria-label="Género"
                        className="h-9 w-full rounded-xl px-2.5 text-xs font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 border border-zinc-800/80 focus:border-zinc-500 focus:outline-none focus:bg-zinc-900 transition-colors"
                      >
                        <option value="" className="bg-[#141416] text-zinc-400">Seleccionar género</option>
                        <option value="Female" className="bg-[#141416] text-zinc-100">Femenino</option>
                        <option value="Male" className="bg-[#141416] text-zinc-100">Masculino</option>
                        <option value="Other" className="bg-[#141416] text-zinc-100">Otro</option>
                        <option value="PreferNotToSay" className="bg-[#141416] text-zinc-100">Prefiero no decirlo</option>
                      </select>
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div>
                    <div className="relative">
                      <input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          clearError('password');
                          if (errors.confirmPassword === 'Las contraseñas no coinciden') {
                            clearError('confirmPassword');
                          }
                        }}
                        placeholder="Contraseña (mínimo 8 caracteres)"
                        autoComplete="new-password"
                        aria-label="Contraseña (mínimo 8 caracteres)"
                        className={`h-10 w-full rounded-xl px-3.5 pr-10 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                          errors.password
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer focus:outline-none"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirmar Contraseña */}
                  <div>
                    <div className="relative">
                      <input
                        id="register-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          clearError('confirmPassword');
                        }}
                        placeholder="Repetir contraseña"
                        autoComplete="new-password"
                        aria-label="Repetir contraseña"
                        className={`h-10 w-full rounded-xl px-3.5 pr-10 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                          errors.confirmPassword
                            ? 'border-rose-500/70 focus:border-rose-500'
                            : 'border-zinc-800/80 focus:border-zinc-500'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer focus:outline-none"
                        aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Checkbox de Términos y Condiciones */}
                  <div className="pt-0.5">
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
                        Acepto los{' '}
                        <Link
                          to="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-zinc-300 hover:text-white transition-colors"
                        >
                          términos y condiciones
                        </Link>{' '}
                        de AyVino.
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.terms}</p>
                    )}
                  </div>

                  {/* Botón de Envío */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading || usernameStatus === 'checking' || usernameStatus === 'taken'}
                      className="w-full h-11 rounded-xl bg-[#591624] hover:bg-[#6e1a2c] active:bg-[#48111c] text-white font-medium text-sm transition-colors shadow-lg shadow-black/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-rose-200" />
                          <span>Creando tu cuenta...</span>
                        </>
                      ) : (
                        <span>Registrarme</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer Inferior: Ya tenés cuenta */}
          <div className="mt-2 text-center text-xs text-zinc-400 font-sans">
            ¿Ya tenés una cuenta?{' '}
            <Link
              to="/login"
              className="text-zinc-200 hover:text-white underline underline-offset-4 decoration-zinc-600 hover:decoration-white transition-colors"
            >
              Iniciá sesión acá
            </Link>
          </div>
        </div>

        {/* Columna Derecha: Imagen Editorial de Viñedo */}
        <div className="hidden lg:block relative h-full w-full bg-zinc-950 overflow-hidden">
          <img
            src={authVineyardImg}
            alt="Viñedo al atardecer en los Andes"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
          />
          {/* Degradado lateral suave para fusionar la imagen con el contenedor oscuro */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141416] via-[#141416]/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-transparent to-transparent opacity-60" />

          {/* Texto Editorial sobre la imagen */}
          <div className="absolute bottom-8 left-8 right-8 text-white/90 space-y-2 pointer-events-none">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-rose-300/80">
              Comunidad & Guarda
            </span>
            <p className="font-serif text-xl italic font-light leading-snug">
              «El vino conecta momentos y personas a través del tiempo.»
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
