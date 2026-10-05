import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Mail, Lock, ArrowRight, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../features/auth';

/**
 * LoginPage Component
 * Vista de inicio de sesión (/login) con la estética editorial de cava oscura (carbón mate #0f0f11).
 * Integra autenticación con useAuth(), campos oscuros con foco bordó (#6b1d28) y acceso rápido demo.
 */
export default function LoginPage() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirigir al Dashboard si ya tiene sesión activa
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleDemoAccess = () => {
    loginDemo({
      username: 'Martina Sommelier',
      email: email || 'martina@ayvino.com',
      role: 'User',
    });
    navigate('/dashboard');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string; title?: string } } };
      const detail = error.response?.data?.detail || error.response?.data?.title;
      setErrorMessage(
        detail ||
          'No se pudo conectar con el servidor backend o las credenciales no son válidas. Podés usar el Acceso Rápido Demo abajo para explorar la plataforma.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 selection:bg-[#6b1d28] selection:text-white">
      
      {/* Barra Superior con Enlace de Retorno */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[11px] font-mono font-medium uppercase tracking-widest text-neutral-400 hover:text-neutral-100 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver al inicio</span>
        </Link>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-300 shadow-sm">
            <Wine className="w-3.5 h-3.5 text-neutral-300" strokeWidth={1.8} />
          </div>
          <span className="font-serif text-lg font-semibold tracking-tight text-neutral-100">
            AyVino
          </span>
        </Link>
      </header>

      {/* Contenedor Central / Tarjeta de Autenticación */}
      <main className="my-auto py-8 flex justify-center">
        <div className="bg-[#141416] border border-neutral-800 p-8 rounded-sm max-w-md w-full">
          
          {/* Encabezado Editorial */}
          <div className="text-center mb-8">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium mb-3">
              Acceso a tu cava
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100 leading-tight">
              Bienvenido de nuevo,
              <span className="block font-normal italic text-neutral-300 mt-1">
                copa a copa.
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Ingresá para gestionar tus botellas en cava, registrar descorches y notas de cata.
            </p>
          </div>

          {/* Alerta de Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-sm border border-rose-900/60 bg-rose-950/30 p-4 text-xs text-rose-300"
            >
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">{errorMessage}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Correo Electrónico */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sommelier@tudominio.com"
                  className="w-full pl-11 pr-4 py-3 rounded-sm bg-[#18181b] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-[#6b1d28] focus:ring-0 focus:outline-none text-sm transition-colors"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400"
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-sm bg-[#18181b] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-[#6b1d28] focus:ring-0 focus:outline-none text-sm transition-colors"
                />
              </div>
            </div>

            {/* Botón de Submit Principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-sm bg-[#6b1d28] hover:bg-[#7e2432] text-white tracking-wider uppercase text-xs font-semibold py-3 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Ingresar a Mi Cava</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Separador de Modo Exploración */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#141416] px-3 text-neutral-500 text-[10px] font-mono uppercase tracking-widest">
                  o acceso instantáneo
                </span>
              </div>
            </div>

            {/* Botón de Acceso Demo */}
            <button
              type="button"
              onClick={handleDemoAccess}
              className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-white py-3 px-5 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>Acceso Rápido Demo / Desarrollador</span>
            </button>

          </form>

          {/* Enlace para Registro */}
          <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-400">
            <p>
              ¿Todavía no tenés tu perfil?{' '}
              <Link
                to="/register"
                className="text-neutral-200 hover:text-white font-medium underline transition-colors"
              >
                Crear cuenta acá
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
        AyVino · Plataforma Enológica Editorial · Beber con moderación
      </footer>

    </div>
  );
}
