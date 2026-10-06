import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wine, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../features/auth';
import authVineyardImg from '../assets/auth-vineyard.webp';

/**
 * LoginPage Component
 * Vista de inicio de sesión (/login) con diseño Clean Dark y minimalista.
 * Inputs directos sin labels externas (solo placeholder amplio interior).
 * Botón primario y campos con curvas uniformes (rounded-xl h-12).
 * Columna derecha: Foto vertical con degradado hacia la columna izquierda.
 */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';

  // Redirigir a la ruta original o al Dashboard si ya tiene sesión activa
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

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
    if (!email.trim()) {
      newErrors.email = 'El correo es requerido';
    }
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; title?: string } } };
      const detail = error.response?.data?.detail || error.response?.data?.title;
      setErrorMessage(
        detail ||
          'No se pudo conectar con el servidor backend o las credenciales no son válidas.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0e0e11] text-neutral-100 font-sans flex items-center justify-center p-4 selection:bg-[#6b1d2f] selection:text-white">
      {/* Tarjeta Central Flotante */}
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[640px] bg-[#141416] border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Columna Izquierda: Formulario de Login */}
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
          <div className="flex-1 flex flex-col justify-center pt-0 pb-2 -mt-5">
            {/* Cabecera Editorial */}
            <div className="mb-6">
              <span className="text-xs uppercase tracking-[0.25em] text-amber-200/60 font-sans block mb-2">
                Colección Privada
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-zinc-100 font-normal tracking-tight leading-tight">
                Bienvenido de nuevo
              </h1>
              <p className="text-sm text-zinc-400 mt-2 font-sans font-light">
                Ingresá a tu cava personal y gestioná tus etiquetas.
              </p>
            </div>

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

            {/* Formulario Clean Dark sin etiquetas externas */}
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {/* Correo Electrónico */}
              <div>
                <input
                  id="email"
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

              {/* Contraseña con botón integrado de alternancia */}
              <div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    placeholder="Contraseña"
                    autoComplete="current-password"
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1.5 px-0.5">
                  {errors.password ? (
                    <p className="text-[11px] text-rose-400 pl-0.5">{errors.password}</p>
                  ) : (
                    <span />
                  )}
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors ml-auto"
                  >
                    ¿Olvidaste tu clave?
                  </a>
                </div>
              </div>

              {/* Botón Primario Estilo Sello de Cava con rounded-xl h-12 */}
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs uppercase tracking-widest text-rose-100 font-medium transition-colors shadow-sm mt-2 inline-flex items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-rose-200/30 border-t-rose-100 rounded-full animate-spin" />
                ) : (
                  <span>Iniciar sesión</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer Inferior Fijo */}
          <div className="text-center text-xs text-zinc-400">
            <p>
              ¿Todavía no tenés tu perfil?{' '}
              <Link
                to="/register"
                className="text-zinc-200 hover:text-white font-medium underline transition-colors"
              >
                Crear cuenta acá
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
