import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Building2,
  Users,
  Compass,
} from 'lucide-react';

/**
 * ForWineriesPage Component (/para-bodegas)
 * Página pública institucional que presenta la propuesta de valor para productores
 * vitivinícolas argentinos con estética editorial de cava oscura (#0a0a0c / #0f0f11).
 */
export default function ForWineriesPage() {
  const benefits = [
    {
      icon: ShieldCheck,
      tag: 'Certificación Institucional',
      title: 'Ficha Técnica Oficial',
      description:
        'Tomá el control de tus vinos: definí con precisión el corte de uvas, graduación alcohólica, temperatura de servicio y potencial de guarda. Cada cosecha llevará el sello de "Ficha Oficial".',
    },
    {
      icon: Sparkles,
      tag: 'Adopción Inteligente',
      title: 'Reclamo de Vinos Comunitarios',
      description:
        'Si los aficionados ya subieron botellas de tu bodega, podés reclamarlas para incorporarlas a tu portfolio oficial, preservando intacto el historial de reseñas, calificaciones y notas de cata.',
    },
    {
      icon: Users,
      tag: 'Comunidad Enológica',
      title: 'Perfil Público y Seguidores',
      description:
        'Tené tu espacio institucional exclusivo con la historia de tu viñedo, año de fundación y terruños. Permití que los miembros sigan tus novedades y reciban avisos de nuevos lanzamientos.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Registrá tu bodega',
      description:
        'Completá los datos de tu establecimiento (nombre, provincia, ciudad, año de fundación y sitio web) y creá tu usuario responsable en un único paso sin burocracia.',
    },
    {
      step: '02',
      title: 'Verificación editorial',
      description:
        'El equipo de sommeliers y administradores de AyVino revisa la información institucional para garantizar la autenticidad y prestigio de todas las bodegas del catálogo.',
    },
    {
      step: '03',
      title: 'Publicá y gestioná',
      description:
        'Una vez aprobada tu cuenta, publicá tus nuevas añadas con blends detallados, reclamá botellas cargadas por la comunidad y supervisá las valoraciones de tus etiquetas.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-[#6b1d28] selection:text-white flex flex-col justify-between overflow-x-hidden">
      <Navbar />

      {/* Hero Editorial */}
      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16 sm:pb-24 border-b border-zinc-800/60">
        {/* Textura de fondo técnica */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.06] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_60%,transparent_100%)]"
        />

        {/* Halos de iluminación cálida enológica */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
        >
          <div className="h-[400px] w-[650px] rounded-full bg-rose-700/20 blur-[130px] -translate-y-12" />
          <div className="absolute h-[250px] w-[400px] rounded-full bg-amber-600/15 blur-[100px] translate-y-10" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-200/70 font-semibold block mb-4">
            Espacio Oficial de Productores
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-semibold tracking-tight text-zinc-100 leading-[1.1] mb-6">
            Tu terruño, tus cosechas,{' '}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-200 via-rose-300 to-amber-200">
              tu voz oficial en AyVino.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-neutral-400 text-base md:text-lg leading-relaxed text-balance mb-10">
            Unite a la plataforma vitivinícola colaborativa de Argentina. Certificá tus etiquetas,
            reclamá las botellas que la comunidad ya está disfrutando y conectá directamente con sommeliers
            y amantes del vino en todo el país.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/bodega/registro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-7 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-black/40"
            >
              <span>Registrar mi bodega</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <span>¿Ya tenés cuenta? Ingresar</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Beneficios Principales */}
      <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-medium">
            Ventajas Exclusivas
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight">
            Control integral del portfolio de tu bodega
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Diseñamos herramientas pensadas para las particularidades del enólogo y la bodega argentina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-white/5 bg-[#141416] p-8 flex flex-col justify-between hover:border-white/10 transition-all shadow-xl group"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 border border-white/10 text-rose-300 mb-6 group-hover:border-rose-900/50 transition-colors shadow-sm">
                  <b.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-200/60 font-semibold block mb-2">
                  {b.tag}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-neutral-100 tracking-tight mb-3">
                  {b.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed font-sans">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo Funciona en 3 Pasos */}
      <section className="py-20 sm:py-28 bg-[#121214] border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-medium">
              Proceso Simple y Transparente
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight">
              Cómo empezar a gestionar tu bodega
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              En pocos minutos tu solicitud entra en circuito de verificación para dar de alta tu perfil oficial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-white/5 bg-[#141416] p-8 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-amber-200/20 block mb-4">
                    {s.step}
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-neutral-100 tracking-tight mb-3">
                    {s.title}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed font-sans">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#141416] to-[#0e0e11] p-10 sm:p-16 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-200/70 font-semibold block">
              Comenzá hoy
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-100 tracking-tight leading-tight">
              Hacé que tus vinos brillen en la mayor cava digital argentina
            </h2>

            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed font-sans">
              Completá el registro de tu bodega y sumate a las etiquetas oficiales que ya confían en AyVino.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/bodega/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-lg"
              >
                <span>Registrar bodega gratis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white px-6 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Explorar plataforma</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-neutral-400" />
            <span className="font-serif text-lg font-semibold text-neutral-200">
              AyVino para Bodegas
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-mono">
            © {new Date().getFullYear()} — Compromiso de calidad vitivinícola argentina.
          </p>
        </div>
      </footer>
    </div>
  );
}

