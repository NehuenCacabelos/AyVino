import { ShieldCheck, BarChart3, Wine, Sparkles } from 'lucide-react';
import { useAuth } from '../features/auth';
import { useWinery } from '../features/winery';

/**
 * WineryDashboardPage Component
 * Vista de inicio del Panel de Bodega (/bodega/dashboard).
 * Se renderiza dentro de WineryLayout consumiendo el contexto activo de la bodega.
 */
export default function WineryDashboardPage() {
  const { user } = useAuth();
  const { winery } = useWinery();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Encabezado Editorial */}
      <div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest text-neutral-400 bg-neutral-900 px-3 py-1 rounded-sm border border-neutral-800">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          Panel Oficial de Productor
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-3 text-neutral-100 leading-tight">
          Gestión de {winery?.name || user?.username || 'Bodega'}
        </h1>

        <p className="mt-2 text-sm text-neutral-400 max-w-2xl font-sans leading-relaxed">
          Administración técnica de añadas, certificación de terruños y supervisión de reseñas oficiales en AyVino.
          Rol de acceso:{' '}
          <strong className="text-neutral-200 font-semibold">{user?.role}</strong>.
        </p>
      </div>

      {/* Bloques de Gestión Provisorios (se expandirán en la Parte 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-7 sm:p-8 rounded-2xl bg-[#141416] border border-white/5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 text-neutral-300 flex items-center justify-center shadow-sm">
                <Wine className="w-5 h-5 text-rose-300" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-neutral-100">
                  Catálogo y Cosechas
                </h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
                  Etiquetas oficiales y blends de añada
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Publicá nuevas botellas con su corte de uvas, temperaturas de servicio y notas de guarda avaladas por la bodega.
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-8 rounded-2xl bg-[#141416] border border-white/5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 text-neutral-300 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-neutral-100">
                  Reclamo de Botellas
                </h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
                  Adopción de fichas comunitarias
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Certificá etiquetas cargadas previamente por aficionados para convertirlas en fichas oficiales sin perder su historial de catas.
            </p>
          </div>
        </div>

        <div className="p-7 sm:p-8 rounded-2xl bg-[#141416] border border-white/5 flex flex-col justify-between shadow-lg md:col-span-2">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-stone-900 border border-white/10 text-neutral-300 flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5 text-neutral-300" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-neutral-100">
                  Métricas de Comunidad
                </h2>
                <p className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
                  Seguidores, calificaciones e impacto sensorial
                </p>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Seguimiento de valoraciones comunitarias, listas de deseos de los usuarios y tendencias de consumo enológicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
