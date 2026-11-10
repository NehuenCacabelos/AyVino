/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ToastItem {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export interface AdminToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
}

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export interface AdminToastProviderProps {
  children: ReactNode;
}

export function AdminToastProvider({ children }: AdminToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Cierre automático tras 4 segundos
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string) => {
      addToast('success', msg);
    },
    [addToast]
  );

  const error = useCallback(
    (msg: string) => {
      addToast('error', msg);
    },
    [addToast]
  );

  const value = useMemo(
    () => ({
      success,
      error,
    }),
    [success, error]
  );

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      {/* Contenedor flotante de toasts arriba a la derecha */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md text-xs font-sans transition-all animate-in slide-in-from-top-3 duration-200',
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200 shadow-emerald-950/50'
                : 'bg-rose-950/90 border-rose-800/60 text-rose-200 shadow-rose-950/50'
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-white/60 hover:text-white transition-colors p-0.5 cursor-pointer shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast(): AdminToastContextValue {
  const context = useContext(AdminToastContext);
  if (!context) {
    throw new Error('useAdminToast debe usarse dentro de un AdminToastProvider');
  }
  return context;
}
