import { ArrowRight, Thermometer, Droplets, SunMedium, Activity, UtensilsCrossed, Sparkles, Calendar } from 'lucide-react';
import BottleVector from './BottleVector';

/**
 * PromoBlocks Component (Bento Grid — Estética Oscura Mate)
 * Bloques modulares estructurados con fondo carbón (#121214 / #161619), bordes sutiles de 1px
 * border-neutral-800, micro-iconos en font-mono y botones de acción limpios.
 */
export default function PromoBlocks() {
  return (
    <section aria-label="Curaduría y Guías de Cava" className="flex flex-col gap-6">
      
      {/* Encabezado de Sección */}
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-mono font-medium uppercase tracking-[0.25em] text-neutral-400">
          CURADURÍA EDITORIAL
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100">
          Recomendaciones & Maridaje
        </h2>
      </div>

      {/* Grid Bento Modular */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* ========================================================
            CARD 1 (7 cols): Almacenamiento & Estiba
            ======================================================== */}
        <article className="md:col-span-7 rounded-xl bg-[#141417] text-neutral-200 p-7 sm:p-8 border border-neutral-800 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          
          {/* Silueta de fondo ambiental sutil */}
          <div className="absolute -right-6 -bottom-10 opacity-15 group-hover:opacity-20 transition-all duration-300 pointer-events-none">
            <BottleVector kind="red-black" className="h-72 w-auto" />
          </div>

          <div className="relative z-10 flex flex-col gap-4 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px] uppercase tracking-wider w-fit">
              <Sparkles className="w-3 h-3 text-neutral-400" />
              El Arte de la Guarda
            </span>

            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 leading-tight">
              Pautas esenciales para la estiba perfecta
            </h3>

            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Mantené la integridad organoléptica de tus botellas más nobles siguiendo los estándares profesionales de bodega.
            </p>

            {/* Fila de 4 Micro-iconos Lineales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
                  <Thermometer className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Temp</span>
                  <span className="text-xs font-mono font-semibold text-neutral-200">12°–15°C</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
                  <Droplets className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Humedad</span>
                  <span className="text-xs font-mono font-semibold text-neutral-200">65%–75%</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
                  <SunMedium className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Luz</span>
                  <span className="text-xs font-mono font-semibold text-neutral-200">Oscura</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-neutral-500">Reposo</span>
                  <span className="text-xs font-mono font-semibold text-neutral-200">Sin vibrar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón Píldora Discreto */}
          <div className="pt-6 relative z-10">
            <a
              href="#cava"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-300 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Ver Guía de Cava</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </a>
          </div>

        </article>

        {/* ========================================================
            CARD 2 (5 cols): Maridaje del Sommelier (Acento Bordó Sutil)
            ======================================================== */}
        <article className="md:col-span-5 rounded-xl bg-[#170a0e] text-neutral-200 p-7 sm:p-8 border border-neutral-800 shadow-sm relative overflow-hidden flex flex-col justify-between group">
          
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#240e15] border border-neutral-800 text-neutral-300 font-mono text-[10px] uppercase tracking-wider w-fit">
              <UtensilsCrossed className="w-3 h-3 text-[#722F37]" />
              Maridaje de la Semana
            </span>

            <h3 className="font-serif text-2xl font-semibold text-neutral-100 leading-tight">
              Tintos de Altura & Brasas Nobles
            </h3>

            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Los Malbec y Cabernet Franc de suelos calcáreos en Gualtallary aportan notas minerales y taninos firmes, ideales para carnes maduradas y pastas rellenas.
            </p>

            <div className="rounded-md bg-neutral-900/60 border border-neutral-800/80 p-3 mt-1 text-xs">
              <span className="text-neutral-300 font-semibold block mb-0.5 font-mono text-[11px] uppercase tracking-wider">
                Sugerencia de Servicio:
              </span>
              <span className="text-neutral-400">Copa Burdeos a 16°–18°C con decantación previa de 30 minutos.</span>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 rounded-md bg-[#722F37] hover:bg-[#5c1d24] text-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>Explorar Etiquetas</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-200" />
            </a>
          </div>

        </article>

        {/* ========================================================
            CARD 3 (6 cols): Blancos de Altura
            ======================================================== */}
        <article className="md:col-span-6 rounded-xl bg-[#141417] text-neutral-200 p-7 sm:p-8 border border-neutral-800 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-neutral-700 transition-all">
          
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px] uppercase tracking-wider w-fit">
              <Sparkles className="w-3 h-3 text-neutral-400" />
              Selección del Norte
            </span>

            <h3 className="font-serif text-2xl font-semibold text-neutral-100 leading-tight">
              Blancos de Cafayate & Valles Calchaquíes
            </h3>

            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Torrontés y Chardonnay de viñedos a más de 2.000 metros sobre el nivel del mar. Frescura cítrica, acidez crocante y aromáticas de jazmín.
            </p>

            <div className="flex items-center gap-3 text-xs font-mono text-neutral-500 pt-1">
              <span>Servicio: 8°–10°C</span>
              <span>·</span>
              <span>Maridaje: Pesca & empanadas</span>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <a
              href="#catalogo"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-300 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Ver Blancos</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </a>
          </div>

        </article>

        {/* ========================================================
            CARD 4 (6 cols): Experiencias & Catas Privadas
            ======================================================== */}
        <article className="md:col-span-6 rounded-xl bg-[#121214] text-neutral-200 p-7 sm:p-8 border border-neutral-800 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:border-neutral-700 transition-all">
          
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px] uppercase tracking-wider w-fit">
              <Calendar className="w-3 h-3 text-neutral-400" />
              Comunidad Sommelier
            </span>

            <h3 className="font-serif text-2xl font-semibold text-neutral-100 leading-tight">
              Catas Guiadas & Degustaciones a Ciegas
            </h3>

            <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
              Encuentros mensuales con enólogos y sommeliers de prestigio para descubrir partidas limitadas y cosechas inéditas de bodegas boutique.
            </p>

            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 pt-1">
              <span>Próxima: Jueves 24 Oct</span>
              <span>·</span>
              <span>Cupos limitados (12 miembros)</span>
            </div>
          </div>

          <div className="pt-6 relative z-10">
            <button
              type="button"
              onClick={() => alert('Próximamente disponible: reserva anticipada de catas.')}
              className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-300 hover:text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <span>Reservar Plaza</span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </button>
          </div>

        </article>

      </div>

    </section>
  );
}
