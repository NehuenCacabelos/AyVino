import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Mail, Lock, ArrowRight, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../features/auth';

/**
 * LoginPage Component
 * Vista dedicada de inicio de sesión (/login) con el sistema de diseño editorial de AyVino.
 * Conecta con useAuth(), soporta llamadas API reales y modo de contingencia demo para desarrollo.
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
    <div className="min-h-screen bg-cream-50 text-earth-900 font-sans flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 selection:bg-wine-100 selection:text-wine-900">
      
      {/* Barra Superior con Enlace de Retorno */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-earth-900/60 hover:text-wine-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Link>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-wine-900 flex items-center justify-center text-cream-50 shadow-sm">
            <Wine className="w-3.5 h-3.5 text-cream-100" />
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-wine-900">
            AyVino
          </span>
        </Link>
      </header>

      {/* Contenedor Central / Tarjeta de Autenticación */}
      <main className="my-auto py-8 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-cream-200/90 bg-white p-8 sm:p-10 shadow-xl shadow-earth-900/5">
          
          {/* Encabezado Editorial */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-50 border border-wine-100 text-wine-900 text-[11px] font-semibold tracking-wider uppercase mb-4">
              <Sparkles className="w-3 h-3 text-wine-500" />
              <span>Acceso a tu Cava</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-earth-900 leading-tight">
              Bienvenido de nuevo,
              <span className="block font-normal italic text-wine-900 mt-1">
                copa a copa.
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-earth-900/65 font-sans leading-relaxed">
              Ingresá para gestionar tus botellas en cava, registrar descorches y notas de cata.
            </p>
          </div>

          {/* Alerta de Error */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900"
            >
              <AlertCircle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed font-sans">{errorMessage}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Correo Electrónico */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-earth-900/70 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-900/40" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sommelier@tudominio.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream-50/70 border border-cream-200 text-sm text-earth-900 placeholder:text-earth-900/35 focus:bg-white focus:border-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-800/10 shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-earth-900/70"
                >
                  Contraseña
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-wine-800 hover:text-wine-900 hover:underline"
                >
                  ¿Olvidaste tu clave?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-900/40" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream-50/70 border border-cream-200 text-sm text-earth-900 placeholder:text-earth-900/35 focus:bg-white focus:border-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-800/10 shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Botón Píldora de Entrada */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-wine-900 hover:bg-wine-800 text-cream-50 py-3.5 px-6 font-semibold text-xs uppercase tracking-[0.16em] shadow-md shadow-wine-900/15 hover:shadow-wine-900/25 active:scale-98 transition-all cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-cream-50/30 border-t-cream-50 rounded-full animate-spin" />
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
                <div className="w-full border-t border-cream-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-earth-900/40 text-[10px] font-semibold tracking-wider">
                  o acceso instantáneo
                </span>
              </div>
            </div>

            {/* Botón de Acceso Demo */}
            <button
              type="button"
              onClick={handleDemoAccess}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-wine-800/30 bg-wine-50/70 hover:bg-wine-100 text-wine-900 py-3 px-5 font-semibold text-xs uppercase tracking-[0.14em] transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-98"
            >
              <Sparkles className="h-3.5 w-3.5 text-wine-800" />
              <span>Acceso Rápido Demo / Desarrollador</span>
            </button>

          </form>

          {/* Enlace para Registro */}
          <div className="mt-8 pt-6 border-t border-cream-200 text-center text-xs text-earth-900/60">
            <p>
              ¿Todavía no tenés tu perfil?{' '}
              <Link
                to="/register"
                className="text-wine-900 font-bold hover:underline"
              >
                Crear cuenta acá
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-earth-900/40 uppercase tracking-widest">
        AyVino · Plataforma Enológica Editorial · Beber con moderación
      </footer>

    </div>
  );
}
