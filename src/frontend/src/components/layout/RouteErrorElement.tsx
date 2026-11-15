import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * RouteErrorElement Component
 * Barrera de contención (Error Boundary) para Data Routers de React Router.
 * Captura excepciones en tiempo de renderizado y respuestas de error HTTP de loaders/actions,
 * evitando la caída general de la aplicación SPA.
 */
export default function RouteErrorElement() {
  const error = useRouteError();
  let title = 'Ocurrió un error inesperado';
  let message = 'No se pudo cargar la vista solicitada.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message =
      (error.data as { message?: string })?.message ||
      'La ruta solicitada no se encuentra disponible o ha cambiado de ubicación.';
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-[#161619] border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed">{message}</p>
        <Link
          to="/"
          replace
          className="inline-flex items-center gap-2 bg-[#6e1a24] hover:bg-[#831823] text-white px-5 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </div>
  );
}

