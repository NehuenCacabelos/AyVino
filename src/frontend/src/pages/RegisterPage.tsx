import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wine, Mail, Lock, User, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth, AuthField } from '../features/auth';
import authVineyardImg from '../assets/auth-vineyard.webp';

/**
 * RegisterPage Component
 * Vista dedicada de registro (/register) con layout split-card sobrio, equilibrado y sin scroll.
 * Header: botón Volver a la izquierda y logo AyVino a la derecha.
 * Inputs: Estilo Outlined con Label incrustada en el borde superior (Material UI notch).
 * Validación frontend reactiva en errores (noValidate) con borde e inline feedback.
 * Columna derecha: foto vertical de viñedos y cordillera con texto plano tipográfico.
 */
export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[640px] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Columna Izquierda: Formulario de Registro */}
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
            <div className="mb-5">
              <h1 className="font-serif font-semibold text-3xl lg:text-[34px] tracking-tight text-zinc-100 leading-tight">
                ¡Creá tu bodega personal!
              </h1>
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
                    className="mb-3.5 flex items-start gap-2.5 rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300"
                  >
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="leading-snug font-sans">{errorMessage}</p>
                  </div>
                )}

                {/* Formulario Optimizado con Estilo Outlined Notch */}
                <form noValidate onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Nombre o Apodo */}
                  <AuthField
                    id="register-name"
                    label="Nombre o Apodo"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError('name');
                    }}
                    placeholder="Ej. Martina Berasategui"
                    icon={User}
                    error={errors.name}
                    autoComplete="name"
                  />

                  {/* Correo Electrónico */}
                  <AuthField
                    id="register-email"
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                    placeholder="sommelier@tudominio.com"
                    icon={Mail}
                    error={errors.email}
                    autoComplete="email"
                  />

                  {/* Contraseña */}
                  <AuthField
                    id="register-password"
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                      if (errors.confirmPassword === 'Las contraseñas no coinciden') {
                        clearError('confirmPassword');
                      }
                    }}
                    placeholder="Al menos 8 caracteres"
                    icon={Lock}
                    error={errors.password}
                    autoComplete="new-password"
                  />

                  {/* Confirmar Contraseña */}
                  <AuthField
                    id="register-confirm-password"
                    label="Confirmar Contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError('confirmPassword');
                    }}
                    placeholder="Repetí tu contraseña"
                    icon={Lock}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />

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
                      className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-950 accent-[#6b1d2f] cursor-pointer"
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
                    <p className="text-[10px] text-rose-400 mt-1 pl-6">{errors.terms}</p>
                  )}
                </div>

                {/* Botón Principal de Registro */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-2 inline-flex items-center justify-center rounded-xl bg-[#6b1d2f] hover:bg-[#7e2432] active:scale-[0.99] text-white text-sm font-medium shadow-lg shadow-[#6b1d2f]/25 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
