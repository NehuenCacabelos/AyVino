import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../features/auth';
import authVineyardImg from '../assets/auth-vineyard.webp';

/**
 * RegisterPage Component
 * Vista de registro (/register) con diseño Clean Dark y minimalista.
 * Inputs directos sin labels externas (solo placeholder amplio interior).
 * Botón primario y campos con curvas uniformes (rounded-xl h-12).
 * Columna derecha: Foto vertical con degradado hacia la columna izquierda.
 */
export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre o apodo es requerido';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'El formato del correo no es válido';
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
      });

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 900);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          status?: number;
          data?: { detail?: string; title?: string };
        };
      };
      const detail = error.response?.data?.detail || error.response?.data?.title;
      if (error.response?.status === 409) {
        setErrorMessage(detail || 'El correo electrónico o apodo ya se encuentra registrado.');
      } else {
        setErrorMessage(
          detail || 'No se pudo registrar la cuenta. Verificá los datos ingresados o la conexión con el servidor.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0e0e11] text-neutral-100 font-sans flex items-center justify-center p-4 selection:bg-[#6b1d2f] selection:text-white">
      {/* Tarjeta Central Flotante */}
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[640px] bg-[#141416] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Columna Izquierda: Formulario de Registro */}
        <div className="p-8 md:p-10 flex flex-col justify-between h-full overflow-y-auto lg:overflow-hidden bg-[#141416]">
          
          {/* Header Superior: Volver a la izquierda, Logo a la derecha */}
          <div className="flex items-center justify-between">
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
          <div className="flex-1 flex flex-col justify-center py-1 -mt-2">
            {/* Cabecera Editorial */}
            <div className="mb-4">
              <span className="text-[10px] uppercase tracking-[0.25em] text-amber-200/60 font-sans block mb-2">
                Membresía
              </span>
              <h1 className="font-serif text-3xl text-zinc-100 font-normal tracking-tight">
                Creá tu bodega personal
              </h1>
              <p className="text-xs text-zinc-400 mt-2 font-sans font-light">
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

                {/* Formulario Clean Dark sin etiquetas externas */}
                <form noValidate onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Nombre o Apodo */}
                  <div>
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearError('name');
                      }}
                      placeholder="Nombre o apodo"
                      autoComplete="name"
                      aria-label="Nombre o apodo"
                      className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                        errors.name
                          ? 'border-rose-500/70 focus:border-rose-500'
                          : 'border-zinc-800/80 focus:border-zinc-500'
                      }`}
                    />
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
                        </Link>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-[11px] text-rose-400 mt-1 pl-6">{errors.terms}</p>
                    )}
                  </div>

                  {/* Botón Principal Estilo Sello de Cava con rounded-xl h-12 */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs uppercase tracking-widest text-rose-100 font-medium transition-colors shadow-sm mt-2 inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-rose-200/30 border-t-rose-100 rounded-full animate-spin" />
                    ) : (
                      <span>Crear cuenta</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer Inferior Fijo */}
          <div className="text-center text-xs text-zinc-400">
            <p>
              ¿Ya tenés cuenta en AyVino?{' '}
              <Link
                to="/login"
                className="text-zinc-200 hover:text-white font-medium underline transition-colors"
              >
                Iniciá sesión acá
              </Link>
            </p>
          </div>
        </div>

        {/* Columna Derecha: Foto Vertical con Degradado de Fusión */}
        <div className="hidden lg:relative lg:flex lg:flex-col lg:justify-end p-8 md:p-10 overflow-hidden h-full">
          {/* Imagen de Fondo vertical de viñedos y cordillera */}
          <img
            src={authVineyardImg}
            alt="Viñedos y cordillera en Valle de Uco, Mendoza"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Tinte suave */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Capa de degradado hacia el borde izquierdo para fundirse con la columna del formulario */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141416] via-transparent to-transparent pointer-events-none" />

          {/* Sutil degradado inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Texto tipográfico plano */}
          <div className="relative z-10">
            <p className="text-xs tracking-[0.3em] text-white/80 font-light uppercase">
              VALLE DE UCO · MENDOZA
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
