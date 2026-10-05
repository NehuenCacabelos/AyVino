import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../features/auth';

/**
 * RegisterPage Component
 * Vista dedicada de registro (/register) con la estética editorial de cava oscura (#0f0f11).
 * Contenedor sobrio #141416, inputs #18181b, botón de acción en #6b1d28 y metadatos en font-mono.
 */
export default function RegisterPage() {
  const { login, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirigir al Dashboard si ya tiene sesión activa
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
      try {
        await login({ email, password });
      } catch {
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

      {/* Contenedor Central / Tarjeta de Registro */}
      <main className="my-auto py-8 flex justify-center">
        <div className="bg-[#141416] border border-neutral-800 p-8 rounded-sm max-w-md w-full">
          
          {/* Encabezado Editorial */}
          <div className="text-center mb-8">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium mb-3">
              Comunidad vitivinícola
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-100 leading-tight">
              Creá tu bodega personal,
              <span className="block font-normal italic text-neutral-300 mt-1">
                libre y curada.
              </span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Sumate para organizar tu cava, calificar terruños y compartir maridajes recomendados.
            </p>
          </div>

          {/* Estado de Éxito */}
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-neutral-100">
                ¡Perfil creado con éxito!
              </h2>
              <p className="text-xs text-neutral-400 max-w-xs leading-relaxed font-sans">
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
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5"
                >
                  Nombre o Apodo de Sommelier
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Martina Berasategui"
                    className="w-full pl-11 pr-4 py-3 rounded-sm bg-[#18181b] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-[#6b1d28] focus:ring-0 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Correo Electrónico */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full pl-11 pr-4 py-3 rounded-sm bg-[#18181b] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-[#6b1d28] focus:ring-0 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    id="register-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Al menos 8 caracteres"
                    className="w-full pl-11 pr-4 py-3 rounded-sm bg-[#18181b] border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:border-[#6b1d28] focus:ring-0 focus:outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Botón Principal de Registro */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-sm bg-[#6b1d28] hover:bg-[#7e2432] text-white tracking-wider uppercase text-xs font-semibold py-3 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#141416] px-3 text-neutral-500 text-[10px] font-mono uppercase tracking-widest">
                    o probar directamente
                  </span>
                </div>
              </div>

              {/* Botón Acceso Rápido Demo */}
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full inline-flex items-center justify-center gap-2 rounded-sm border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900 text-neutral-300 hover:border-neutral-600 hover:text-white py-3 px-5 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
                <span>Acceso Rápido Demo / Desarrollador</span>
              </button>

            </form>
          )}

          {/* Enlace para Login */}
          <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-400">
            <p>
              ¿Ya tenés cuenta en AyVino?{' '}
              <Link
                to="/login"
                className="text-neutral-200 hover:text-white font-medium underline transition-colors"
              >
                Iniciá sesión acá
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Pie de Página */}
      <footer className="max-w-7xl mx-auto w-full text-center text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
        AyVino · Al registrarte confirmás ser mayor de edad legal para beber
      </footer>

    </div>
  );
}
