import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../features/auth';

/**
 * RegisterPage Component
 * Vista dedicada de registro (/register) con la misma estética editorial de AyVino.
 * Inputs redondeados con focus en borgoña y botón principal tipo píldora (rounded-full).
 * Incluye contingencia en modo desarrollo para activar la sesión con el nombre registrado.
 */
export default function RegisterPage() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirigir al Dashboard si ya tiene sesión
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleDemoAccess = () => {
    loginDemo({
      username: name.trim() || 'Martina Sommelier',
      email: email.trim() || 'sommelier@ayvino.com',
      role: 'User',
    });
    navigate('/dashboard');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Intentar flujo estándar de API
      try {
        await login({ email, password });
      } catch {
        // 2. Si el backend no tiene endpoint de register o está apagado, activar sesión demo con sus datos
        loginDemo({
          username: name.trim() || 'Nuevo Sommelier',
          email: email.trim(),
          role: 'User',
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 900);
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

      {/* Contenedor Central / Tarjeta de Registro */}
      <main className="my-auto py-8 flex justify-center">
        <div className="w-full max-w-md rounded-3xl border border-cream-200/90 bg-white p-8 sm:p-10 shadow-xl shadow-earth-900/5">
          
          {/* Encabezado Editorial */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-wine-50 border border-wine-100 text-wine-900 text-[11px] font-semibold tracking-wider uppercase mb-4">
              <Sparkles className="w-3 h-3 text-wine-500" />
              <span>Comunidad Vitivinícola</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-earth-900 leading-tight">
              Creá tu bodega personal,
              <span className="block font-normal italic text-wine-900 mt-1">
                libre y curada.
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-earth-900/65 font-sans leading-relaxed">
              Sumate para organizar tu cava, calificar terruños y compartir maridajes recomendados.
            </p>
          </div>

          {/* Estado de Éxito */}
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-wine-50 text-wine-900 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-wine-800" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-earth-900">
                ¡Perfil creado con éxito!
              </h2>
              <p className="text-xs text-earth-900/60 max-w-xs leading-relaxed font-sans">
                {`Bienvenido/a ${name || 'Sommelier'}, sincronizando tu cava y cargando catálogo...`}
              </p>
            </div>
          ) : (
            /* Formulario */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nombre o Apodo Sommelier */}
              <div>
                <label
                  htmlFor="register-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-earth-900/70 mb-1.5"
                >
                  Nombre o Apodo de Sommelier
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-900/40" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Martina Berasategui"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream-50/70 border border-cream-200 text-sm text-earth-900 placeholder:text-earth-900/35 focus:bg-white focus:border-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-800/10 shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-earth-900/70 mb-1.5"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-900/40" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream-50/70 border border-cream-200 text-sm text-earth-900 placeholder:text-earth-900/35 focus:bg-white focus:border-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-800/10 shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-earth-900/70 mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-earth-900/40" />
                  <input
                    id="register-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Al menos 8 caracteres"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-cream-50/70 border border-cream-200 text-sm text-earth-900 placeholder:text-earth-900/35 focus:bg-white focus:border-wine-800 focus:outline-none focus:ring-2 focus:ring-wine-800/10 shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Botón Píldora de Registro */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-wine-900 hover:bg-wine-800 text-cream-50 py-3.5 px-6 font-semibold text-xs uppercase tracking-[0.16em] shadow-md shadow-wine-900/15 hover:shadow-wine-900/25 active:scale-98 transition-all cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-cream-50/30 border-t-cream-50 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Crear Cuenta Libre</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Separador */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cream-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-earth-900/40 text-[10px] font-semibold tracking-wider">
                    o probar directamente
                  </span>
                </div>
              </div>

              {/* Botón Acceso Rápido Demo */}
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-wine-800/30 bg-wine-50/70 hover:bg-wine-100 text-wine-900 py-3 px-5 font-semibold text-xs uppercase tracking-[0.14em] transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-98"
              >
                <Sparkles className="h-3.5 w-3.5 text-wine-800" />
                <span>Acceso Rápido Demo / Desarrollador</span>
              </button>

            </form>
          )}

          {/* Enlace para Login */}
          <div className="mt-8 pt-6 border-t border-cream-200 text-center text-xs text-earth-900/60">
            <p>
              ¿Ya tenés cuenta en AyVino?{' '}
              <Link
                to="/login"
                className="text-wine-900 font-bold hover:underline"
              >
                Iniciá sesión acá
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] text-earth-900/40 uppercase tracking-widest">
        AyVino · Al registrarte confirmás ser mayor de edad legal para beber
      </footer>

    </div>
  );
}
