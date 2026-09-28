import Navbar from '../components/layout/Navbar';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '../features/auth';

/**
 * WineryDashboardPage Component
 * Página protegida exclusiva para bodegas (Winery) y administradores (Admin).
 */
export default function WineryDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-cream-50 text-earth-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Encabezado Editorial */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-wine-800 bg-wine-50 px-2.5 py-1 rounded-full border border-wine-100">
            <ShieldCheck className="w-3.5 h-3.5 text-wine-600" />
            Acceso Exclusivo Bodega & Admin
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-3 text-earth-900 leading-tight">
            Panel de Bodega — {user?.username || 'Gestión Oficial'}
          </h1>

          <p className="mt-2 text-sm text-earth-900/70 max-w-2xl font-sans leading-relaxed">
            Administración técnica de añadas, certificación de terruños y supervisión de reseñas oficiales. Rol activo:{' '}
            <strong className="text-wine-900 font-semibold">{user?.role}</strong>.
          </p>
        </div>

        {/* Placeholder de Gestión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl bg-cream-100/70 border border-cream-200/90 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-900 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-wine-800" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-earth-900">
                  Métricas de Cata y Valoración
                </h2>
                <p className="text-xs text-earth-900/60">
                  Estadísticas de impacto sensorial comunitario
                </p>
              </div>
            </div>
            <p className="text-xs text-earth-900/70 leading-relaxed">
              Visualización agregada de puntajes, favoritos y perfiles organolépticos asociados a tu bodega.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-cream-100/70 border border-cream-200/90 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-900 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-wine-800" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-bold text-earth-900">
                  Cosechas Certificadas
                </h2>
                <p className="text-xs text-earth-900/60">
                  Control de fichas y graduación técnica
                </p>
              </div>
            </div>
            <p className="text-xs text-earth-900/70 leading-relaxed">
              Certificación de lotes, tipos de crianza y notas de enólogo validadas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

