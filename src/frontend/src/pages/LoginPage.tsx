import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Mail, Lock, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../features/auth';
import authVineyardImg from '../assets/auth-vineyard.webp';

/**
 * LoginPage Component
 * Vista de inicio de sesión (/login) con layout split-card sobrio, equilibrado y sin scroll.
 * Header: botón Volver a la izquierda y logo AyVino a la derecha.
 * Inputs: Estilo Outlined con Label incrustada en el borde superior (Material UI notch).
 * Validación frontend reactiva en errores (noValidate) con borde e inline feedback.
 * Columna derecha: foto vertical de viñedos y cordillera con texto plano tipográfico.
 */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
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
      navigate('/dashboard');
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
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[640px] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Columna Izquierda: Formulario de Login */}
        <div className="p-8 md:p-10 flex flex-col justify-between h-full overflow-y-auto lg:overflow-hidden bg-zinc-900">
          
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
          <div className="flex-1 flex flex-col justify-center py-2 -mt-4">
            <div className="mb-6">
              <h1 className="font-serif font-semibold text-3xl lg:text-[34px] tracking-tight text-zinc-100 leading-tight">
                ¡Bienvenido de nuevo!
              </h1>
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

            {/* Formulario con validación personalizada y estilo Outlined Notch */}
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {/* Correo Electrónico */}
              <div>
                <div className="relative group">
                  <label
                    htmlFor="email"
                    className={`absolute -top-2 left-3 px-1.5 bg-[#18181b] text-xs font-medium tracking-wide z-10 transition-all pointer-events-none ${
                      errors.email ? 'text-rose-400' : 'text-zinc-200 group-focus-within:text-rose-300'
                    }`}
                  >
                    Correo Electrónico
                  </label>
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${
                      errors.email ? 'text-rose-400/80' : 'text-zinc-500 group-focus-within:text-zinc-300'
                    }`}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                    placeholder="sommelier@tudominio.com"
                    className={`h-11 w-full bg-black/25 rounded-lg border text-zinc-100 placeholder:text-zinc-500 text-sm pl-10 pr-3.5 pt-1 focus:outline-none transition-colors ${
                      errors.email
                        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                        : 'border-zinc-700/80 hover:border-zinc-500 focus:border-rose-800/90 focus:ring-1 focus:ring-rose-800/50'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-rose-400 mt-1 pl-1">{errors.email}</p>
                )}
              </div>

              {/* Contraseña con alternancia de visibilidad */}
              <div>
                <div className="relative group">
                  <label
                    htmlFor="password"
                    className={`absolute -top-2 left-3 px-1.5 bg-[#18181b] text-xs font-medium tracking-wide z-10 transition-all pointer-events-none ${
                      errors.password ? 'text-rose-400' : 'text-zinc-200 group-focus-within:text-rose-300'
                    }`}
                  >
                    Contraseña
                  </label>
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${
                      errors.password ? 'text-rose-400/80' : 'text-zinc-500 group-focus-within:text-zinc-300'
                    }`}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    placeholder="••••••••"
                    className={`h-11 w-full bg-black/25 rounded-lg border text-zinc-100 placeholder:text-zinc-500 text-sm pl-10 pr-10 pt-1 focus:outline-none transition-colors ${
                      errors.password
                        ? 'border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
                        : 'border-zinc-700/80 hover:border-zinc-500 focus:border-rose-800/90 focus:ring-1 focus:ring-rose-800/50'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-0.5">
                  {errors.password ? (
                    <p className="text-[10px] text-rose-400 pl-1">{errors.password}</p>
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

              {/* Botón Primario en Rojo Vino */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 mt-2 inline-flex items-center justify-center rounded-xl bg-[#6b1d2f] hover:bg-[#7e2432] active:scale-[0.99] text-white text-sm font-medium shadow-lg shadow-[#6b1d2f]/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

        {/* Columna Derecha: Nueva Foto Vertical */}
        <div className="hidden lg:relative lg:flex lg:flex-col lg:justify-end p-8 md:p-10 overflow-hidden h-full">
          {/* Imagen de Fondo vertical de viñedos y cordillera */}
          <img
            src={authVineyardImg}
            alt="Viñedos y cordillera en Valle de Uco, Mendoza"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Tinte suave */}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Sutil degradado inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

          {/* Texto tipográfico plano sin cajas ni contenedores artificiales */}
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
