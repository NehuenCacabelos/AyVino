import { useState, useRef, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  DashboardNavbar,
  DashboardSection,
  UncorkDialog,
} from '../features/dashboard';
import type { DashboardWine, UncorkSubmission } from '../types/wine';

/**
 * CavaPage Component (/cava)
 * Página dedicada al inventario personal del sommelier y botellas listas para descorchar:
 * - Vinculada a la opción "Mi Cava" del menú de usuario.
 * - Incluye DashboardNavbar persistente, switch Con Stock / Usuario Nuevo, carrusel y diálogo de descorche.
 */
export default function CavaPage() {
  const [stockCount, setStockCount] = useState(24);
  const [notification, setNotification] = useState<string | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<DashboardWine | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(notificationTimerRef.current);
    };
  }, []);

  const showNotification = (msg: string) => {
    clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleUncorkSaved = (data: UncorkSubmission) => {
    setStockCount((prev) => Math.max(0, prev - 1));
    showNotification(`¡Descorche registrado! ${data.wine.name} calificado con ${data.rating} estrellas.`);
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
      {/* Toast de Notificación Flotante */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#161619] text-neutral-100 px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium font-sans">{notification}</p>
        </aside>
      )}

      {/* 1. Navbar Superior Persistente */}
      <DashboardNavbar stockCount={stockCount} />

      {/* 2. Contenido Principal de Cava */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 sm:gap-16 px-4 sm:px-6 lg:px-8 pb-24 pt-28 sm:pt-32">
        <DashboardSection
          onUncorkRequested={(wine) => setUncorkingWine(wine)}
          onAddBottleRequested={() => {
            showNotification('Seleccioná una etiqueta del catálogo para agregarla a tu cava.');
          }}
        />
      </main>

      {/* Modal Profesional de Descorche y Ficha Técnica */}
      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onSave={handleUncorkSaved}
      />

      {/* 3. Footer Editorial */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-zinc-100">
              AyVino<span className="text-rose-500">.</span>
            </span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>
    </div>
  );
}

