import Navbar from '../components/layout/Navbar';
import { ShieldCheck, BarChart3 } from 'lucide-react';
import { useAuth } from '../features/auth';

/**
 * WineryDashboardPage Component
 * Página protegida exclusiva para bodegas (Winery) y administradores (Admin) con estética editorial oscura (#0f0f11).
 */
export default function WineryDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Encabezado Editorial */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest text-neutral-400 bg-neutral-900 px-3 py-1 rounded-sm border border-neutral-800">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            Acceso Exclusivo Bodega & Admin
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-3 text-neutral-100 leading-tight">
            Panel de Bodega — {user?.username || 'Gestión Oficial'}
          </h1>

          <p className="mt-2 text-sm text-neutral-400 max-w-2xl font-sans leading-relaxed">
            Administración técnica de añadas, certificación de terruños y supervisión de reseñas oficiales. Rol activo:{' '}
            <strong className="text-neutral-200 font-semibold">{user?.role}</strong>.
          </p>
        </div>

        {/* Bloques de Gestión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-sm bg-[#141416] border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-neutral-300" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-neutral-100">
                  Métricas de Cata y Valoración
                </h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
                  Estadísticas de impacto sensorial comunitario
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Visualización agregada de puntajes, favoritos y perfiles organolépticos asociados a tu bodega.
            </p>
          </div>

          <div className="p-8 rounded-sm bg-[#141416] border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-neutral-300" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-neutral-100">
                  Cosechas Certificadas
                </h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
                  Control de fichas y graduación técnica
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Certificación de lotes, tipos de crianza y notas de enólogo validadas.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
