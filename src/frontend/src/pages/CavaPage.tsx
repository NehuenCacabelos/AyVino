import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { DashboardSection, UncorkDialog } from '../features/dashboard';
import type { DashboardWine, UncorkSubmission } from '../types/wine';
import type { AppOutletContext } from '../components/layout/AppLayout';

/**
 * CavaPage Component (/cava)
 * Página dedicada al inventario personal del sommelier y botellas listas para descorchar:
 * - Vinculada a la opción "Mi Cava" del menú de usuario.
 * - Sincroniza el contador de stock mediante useOutletContext hacia el layout compartido.
 * - Integra carrusel de stock, onboarding de usuario nuevo y diálogo interactivo de descorche.
 */
export default function CavaPage() {
  const { setStockCount } = useOutletContext<AppOutletContext>();
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
    <>
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

      {/* Contenido Principal de Cava */}
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
    </>
  );
}
