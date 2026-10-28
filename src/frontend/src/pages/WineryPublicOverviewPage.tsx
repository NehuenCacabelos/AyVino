import { useOutletContext, Link } from 'react-router-dom';
import { Building2, Wine, Layers, Calendar, Globe, MapPin, ArrowRight } from 'lucide-react';
import type { WineryPublicOutletContext } from './WineryPublicProfileLayout';
import { WineryReadOnlyMap } from '../features/winery';

/**
 * WineryPublicOverviewPage Component
 * Pestaña institucional "La bodega" en /bodegas/:id
 * Presenta la semblanza, terruño geográfico, mapa y resumen de producción.
 */
export default function WineryPublicOverviewPage() {
  const { profile, locationLabel } = useOutletContext<WineryPublicOutletContext>();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Malla Principal: Semblanza Histórica + Panel Geográfico y Mapa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Semblanza y Datos Institucionales (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Descripción */}
          <section className="rounded-2xl bg-[#121015] border border-white/5 p-6 sm:p-8 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold">
                Semblanza institucional
              </span>
            </div>

            <h2 className="font-serif text-2xl font-medium text-white tracking-tight">
              Sobre {profile.name}
            </h2>

            {profile.description && profile.description.trim().length > 0 ? (
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                {profile.description}
              </p>
            ) : (
              <div className="py-6 text-center space-y-2 rounded-xl bg-white/[0.02] border border-white/5 p-6">
                <Building2 className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-sm text-zinc-400 font-sans">
                  Esta bodega aún no ha publicado su reseña histórica institucional.
                </p>
              </div>
            )}
          </section>

          {/* Card de Totales de Producción Vitivinícola */}
          <section className="rounded-2xl bg-[#121015] border border-white/5 p-6 sm:p-8 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold block mb-0.5">
                  Producción
                </span>
                <h3 className="font-serif text-xl font-medium text-white">
                  Catálogo publicado
                </h3>
              </div>
              <Link
                to={`/bodegas/${profile.id}/catalogo`}
                className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 transition-colors"
              >
                <span>Ver catálogo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#17151a] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Wine className="w-4 h-4 text-rose-400" />
                  <span>Etiquetas registradas</span>
                </div>
                <p className="font-serif text-3xl font-medium text-white">
                  {profile.totals.labels}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#17151a] border border-white/5 space-y-1">
                <div className="flex items-center gap-2 text-zinc-400 text-xs">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Cosechas y añadas</span>
                </div>
                <p className="font-serif text-3xl font-medium text-white">
                  {profile.totals.vintages}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Mapa Satelital y Terruño (1 col) */}
        <div className="space-y-6">
          <section className="rounded-2xl bg-[#121015] border border-white/5 p-6 shadow-lg space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-semibold block">
              Terruño y Finca
            </span>
            <h3 className="font-serif text-lg font-medium text-white">
              Ubicación Geográfica
            </h3>

            {/* Mapa Leaflet de Solo Lectura con fallback elegante */}
            <WineryReadOnlyMap
              latitude={profile.latitude}
              longitude={profile.longitude}
              locationLabel={locationLabel}
            />

            {/* Ficha rápida de contacto y registro */}
            <div className="pt-2 border-t border-white/5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Región:</span>
                </span>
                <span className="text-zinc-200 font-medium text-right">{locationLabel}</span>
              </div>

              {typeof profile.foundationYear === 'number' && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Fundación:</span>
                  </span>
                  <span className="text-zinc-200 font-mono">{profile.foundationYear}</span>
                </div>
              )}

              {profile.website && (
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Web:</span>
                  </span>
                  <a
                    href={
                      /^https?:\/\//i.test(profile.website)
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-300 hover:text-rose-200 underline truncate max-w-[180px]"
                  >
                    {profile.website.replace(/^https?:\/\//i, '')}
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
