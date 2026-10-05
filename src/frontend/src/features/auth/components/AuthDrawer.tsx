import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { X, Lock, Mail, User, ArrowRight, CheckCircle2, Wine } from 'lucide-react';
import type { AuthMode, AuthFormData } from '../types';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

/**
 * AuthDrawer Component
 * Panel lateral derecho (Slide-Over Drawer) elegante y sobrio con estética editorial oscura (#141416).
 * Utiliza bordes estructurales border-neutral-800, inputs #18181b y botón de acción #6b1d28.
 */
export default function AuthDrawer({ isOpen, onClose, initialMode = 'login' }: AuthDrawerProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formData, setFormData] = useState<AuthFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);

  // Sincronización idiomática durante el render al cambiar de apertura o modo inicial
  if (isOpen !== prevIsOpen || initialMode !== prevInitialMode) {
    setPrevIsOpen(isOpen);
    setPrevInitialMode(initialMode);
    if (isOpen) {
      setMode(initialMode);
      setIsSuccess(false);
      setIsLoading(false);
    }
  }

  // Manejo de accesibilidad: tecla Escape y bloqueo de scroll en el body
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulación de envío mockeado con feedback visual
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 750);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop / Overlay oscuro sutil */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel lateral deslizante (Slide-Over Drawer) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 h-full w-full max-w-md bg-[#141416] border-l border-neutral-800 text-neutral-100 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Parte superior scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-7 flex flex-col justify-between">
          <div>
            
            {/* Barra superior: Identidad y botón de cierre minimalista */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center text-neutral-300 shadow-sm">
                  <Wine className="w-3.5 h-3.5 text-neutral-300" />
                </div>
                <span className="font-serif text-lg font-semibold tracking-tight text-neutral-100">
                  AyVino
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium tracking-wider uppercase text-neutral-400 hover:text-white transition-colors py-1.5 px-2.5 rounded-sm hover:bg-neutral-800 cursor-pointer"
                aria-label="Cerrar panel lateral"
              >
                <span>Cerrar</span>
                <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            {/* Encabezado Editorial */}
            <div className="mt-8 mb-6">
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium mb-3">
                Comunidad vitivinícola
              </p>
              
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 leading-tight">
                Tu bodega personal,
                <span className="block font-normal italic text-neutral-300 mt-1">
                  organizada copa a copa.
                </span>
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                {mode === 'login'
                  ? 'Ingresá a tus colecciones de Favoritos, listas de Por Probar y reseñas comunitarias.'
                  : 'Registrate para catalogar botellas no listadas, calificar terruños y guardar notas sensoriales.'}
              </p>
            </div>

            {/* Tabs minimalistas tipo línea inferior (editorial) */}
            <div className="flex items-center border-b border-neutral-800 gap-8 mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setIsSuccess(false);
                }}
                className={`pb-2.5 text-xs font-mono uppercase tracking-wider transition-all relative cursor-pointer ${
                  mode === 'login'
                    ? 'text-neutral-100 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#6b1d28]'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Iniciar Sesión
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setIsSuccess(false);
                }}
                className={`pb-2.5 text-xs font-mono uppercase tracking-wider transition-all relative cursor-pointer ${
                  mode === 'register'
                    ? 'text-neutral-100 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#6b1d28]'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Crear Perfil
              </button>
            </div>

            {/* Estado de Éxito / Feedback de Envío */}
            {isSuccess ? (
              <div className="py-12 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  {mode === 'login' ? '¡Bienvenido nuevamente!' : '¡Perfil creado con éxito!'}
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs font-sans">
                  Sincronizando tus etiquetas y bodegas predilectas...
                </p>
              </div>
            ) : (
              /* Formulario de Auth */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Nombre de usuario (solo en registro) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">
                      Nombre o Apodo de Sommelier
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name || ''}
                        onChange={handleChange}
                        placeholder="Ej. Martín Berasategui"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-[#18181b] border border-neutral-700 rounded-sm text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#6b1d28] focus:ring-0 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-400 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#18181b] border border-neutral-700 rounded-sm text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#6b1d28] focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        ¿Olvidaste tu contraseña?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#18181b] border border-neutral-700 rounded-sm text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#6b1d28] focus:ring-0 transition-colors"
                    />
                  </div>
                </div>

                {/* Botón Principal de Envío */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-sm bg-[#6b1d28] hover:bg-[#7e2432] text-white font-semibold text-xs uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Entrar a mi Perfil' : 'Crear Cuenta Libre'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

          {/* Footer del Drawer */}
          <div className="pt-6 mt-8 border-t border-neutral-800">
            <div className="text-center text-xs text-neutral-400 mb-2">
              {mode === 'login' ? (
                <p>
                  ¿No tenés cuenta todavía?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-neutral-200 font-medium hover:underline cursor-pointer"
                  >
                    Creala acá gratis
                  </button>
                </p>
              ) : (
                <p>
                  ¿Ya sos miembro de AyVino?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-neutral-200 font-medium hover:underline cursor-pointer"
                  >
                    Iniciá sesión acá
                  </button>
                </p>
              )}
            </div>

            <p className="text-[10px] font-mono text-neutral-500 text-center leading-relaxed">
              Al continuar aceptás nuestras políticas de comunidad vinícola y confirmás ser mayor de edad legal para beber.
            </p>
          </div>

        </div>
      </aside>
    </div>
  );
}
