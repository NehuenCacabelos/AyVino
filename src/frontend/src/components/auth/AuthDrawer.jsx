import { useState, useEffect } from 'react';
import { X, Lock, Mail, User, ArrowRight, CheckCircle2, Wine, Sparkles } from 'lucide-react';

/**
 * AuthDrawer Component
 * Panel lateral derecho (Slide-Over Drawer) elegante y editorial.
 * Reemplaza el modal flotante centrado para integrarse orgánicamente con la estética de AyVino.
 */
export default function AuthDrawer({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [formData, setFormData] = useState({
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
    const handleKeyDown = (e) => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
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
      {/* Backdrop / Overlay sutil con transparencia baja (sin blur pesado) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-earth-900/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel lateral deslizante (Slide-Over Drawer) */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 h-full w-full max-w-md bg-cream-50 border-l border-cream-200/90 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Parte superior scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-7 flex flex-col justify-between">
          <div>
            
            {/* Barra superior: Identidad y botón de cierre minimalista */}
            <div className="flex items-center justify-between pb-6 border-b border-cream-200/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-wine-900 flex items-center justify-center text-cream-50 shadow-sm">
                  <Wine className="w-3.5 h-3.5 text-cream-100" />
                </div>
                <span className="font-serif text-lg font-bold tracking-tight text-wine-900">
                  AyVino
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="group inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-earth-900/50 hover:text-wine-900 transition-colors py-1.5 px-2.5 rounded-lg hover:bg-cream-100 cursor-pointer"
                aria-label="Cerrar panel lateral"
              >
                <span>Cerrar</span>
                <X className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90" />
              </button>
            </div>

            {/* Encabezado Editorial */}
            <div className="mt-8 mb-6">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-wine-800 bg-wine-50 px-2.5 py-0.5 rounded-full mb-3 border border-wine-100">
                <Sparkles className="w-3 h-3 text-wine-500" />
                Comunidad Vitivinícola
              </span>
              
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-earth-900 leading-tight">
                Tu bodega personal,
                <span className="block font-normal italic text-wine-900 mt-1">
                  organizada copa a copa.
                </span>
              </h3>

              <p className="mt-2 text-xs sm:text-sm text-earth-900/70 leading-relaxed font-sans">
                {mode === 'login'
                  ? 'Ingresá a tus colecciones de Favoritos, listas de Por Probar y reseñas comunitarias.'
                  : 'Registrate para catalogar botellas no listadas, calificar terruños y guardar notas sensoriales.'}
              </p>
            </div>

            {/* Tabs minimalistas tipo línea inferior (editorial) */}
            <div className="flex items-center border-b border-cream-200 gap-8 mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setIsSuccess(false);
                }}
                className={`pb-2.5 text-sm font-medium transition-all relative cursor-pointer ${
                  mode === 'login'
                    ? 'text-wine-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-wine-900'
                    : 'text-earth-900/50 hover:text-earth-900'
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
                className={`pb-2.5 text-sm font-medium transition-all relative cursor-pointer ${
                  mode === 'register'
                    ? 'text-wine-900 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-wine-900'
                    : 'text-earth-900/50 hover:text-earth-900'
                }`}
              >
                Crear Perfil
              </button>
            </div>

            {/* Estado de Éxito / Feedback de Envío */}
            {isSuccess ? (
              <div className="py-12 flex flex-col items-center text-center space-y-3 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-wine-50 text-wine-900 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-serif text-xl font-bold text-earth-900">
                  {mode === 'login' ? '¡Bienvenido nuevamente!' : '¡Perfil creado con éxito!'}
                </h4>
                <p className="text-xs text-earth-900/60 max-w-xs">
                  Sincronizando tus etiquetas y bodegas predilectas...
                </p>
              </div>
            ) : (
              /* Formulario de Auth */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Nombre de usuario (solo en registro) */}
                {mode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-earth-900/70 mb-1.5">
                      Nombre o Apodo de Sommelier
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-900/40" />
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej. Martín Berasategui"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-cream-100/70 border border-cream-200/90 rounded-xl text-sm text-earth-900 placeholder:text-earth-900/35 focus:outline-none focus:bg-cream-50 focus:border-wine-800 focus:ring-2 focus:ring-wine-800/10 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-earth-900/70 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-900/40" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-cream-100/70 border border-cream-200/90 rounded-xl text-sm text-earth-900 placeholder:text-earth-900/35 focus:outline-none focus:bg-cream-50 focus:border-wine-800 focus:ring-2 focus:ring-wine-800/10 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-earth-900/70">
                      Contraseña
                    </label>
                    {mode === 'login' && (
                      <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="text-xs text-wine-800 hover:text-wine-900 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-900/40" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-cream-100/70 border border-cream-200/90 rounded-xl text-sm text-earth-900 placeholder:text-earth-900/35 focus:outline-none focus:bg-cream-50 focus:border-wine-800 focus:ring-2 focus:ring-wine-800/10 transition-all"
                    />
                  </div>
                </div>

                {/* Botón Principal de Envío */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-wine-900 hover:bg-wine-800 text-cream-50 font-medium text-sm transition-all duration-200 shadow-md shadow-wine-900/15 disabled:opacity-70 cursor-pointer active:scale-[0.99]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-cream-50/30 border-t-cream-50 rounded-full animate-spin" />
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
          <div className="pt-6 mt-8 border-t border-cream-200/70">
            <div className="text-center text-xs text-earth-900/60 mb-2">
              {mode === 'login' ? (
                <p>
                  ¿No tenés cuenta todavía?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="text-wine-800 font-semibold hover:underline cursor-pointer"
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
                    className="text-wine-800 font-semibold hover:underline cursor-pointer"
                  >
                    Iniciá sesión acá
                  </button>
                </p>
              )}
            </div>

            <p className="text-[10px] text-earth-900/40 text-center leading-relaxed">
              Al continuar aceptás nuestras políticas de comunidad vinícola y confirmás ser mayor de edad legal para beber.
            </p>
          </div>

        </div>
      </aside>
    </div>
  );
}
