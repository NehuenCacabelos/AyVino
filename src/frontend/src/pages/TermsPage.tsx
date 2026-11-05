import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wine,
  ShieldAlert,
  Sparkles,
  Building2,
  UserCheck,
  Scale,
  FileText,
  Mail,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

interface SectionItem {
  id: string;
  title: string;
  number: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'edad-y-consumo', number: '1', title: 'Restricción de Edad y Consumo Responsable' },
  { id: 'naturaleza-servicio', number: '2', title: 'Naturaleza y Alcance del Servicio' },
  { id: 'tipos-cuentas', number: '3', title: 'Perfiles de Cuenta: Enófilos y Bodegas' },
  { id: 'sommelier-ia', number: '4', title: 'Sommelier Asistente e Inteligencia Artificial' },
  { id: 'normas-conducta', number: '5', title: 'Normas de Conducta y Contenido del Usuario' },
  { id: 'propiedad-intelectual', number: '6', title: 'Propiedad Intelectual y Marcas de Terceros' },
  { id: 'garantias-salud', number: '7', title: 'Exclusión de Garantías, Salud y Alergias' },
  { id: 'enlaces-terceros', number: '8', title: 'Enlaces a Terceros y No Comercialización' },
  { id: 'modificaciones', number: '9', title: 'Modificaciones de los Términos' },
  { id: 'ley-aplicable', number: '10', title: 'Ley Aplicable y Jurisdicción' },
  { id: 'contacto', number: '11', title: 'Canales de Contacto' },
];

/**
 * TermsPage Component
 * Términos y Condiciones de Uso de AyVino.
 * Integra diseño editorial estilo cava oscura con índice interactivo y navegación fluida por secciones.
 */
export default function TermsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e11] text-zinc-100 flex flex-col selection:bg-[#6b1d2f] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0e0e11]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Volver</span>
          </button>
          <span className="hidden sm:inline-block h-3.5 w-px bg-white/10" />
          <span className="hidden sm:inline-block text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Documento Legal
          </span>
        </div>

        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-serif text-lg font-bold tracking-tight text-white group-hover:text-rose-200 transition-colors">
            AyVino
          </span>
          <div className="w-7 h-7 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center text-rose-300 group-hover:border-[#6b1d2f] transition-colors shadow-sm">
            <Wine className="w-3.5 h-3.5 text-rose-300" strokeWidth={1.8} />
          </div>
        </Link>
      </header>

      {/* Hero Header */}
      <section className="border-b border-white/5 bg-gradient-to-b from-[#171217] via-[#0e0e11] to-[#0e0e11] px-4 sm:px-8 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/30 text-rose-300 text-xs font-mono tracking-widest uppercase">
            <FileText className="w-3.5 h-3.5" />
            <span>Términos y Condiciones</span>
          </div>

          <h1 className="font-serif font-semibold text-3xl sm:text-5xl text-zinc-100 tracking-tight">
            Términos y Condiciones de Uso
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs sm:text-sm text-zinc-400 font-mono">
            <span>Última actualización: 28 de octubre de 2026</span>
            <span className="h-1 w-1 rounded-full bg-zinc-600 hidden sm:inline-block" />
            <span className="text-rose-300/90 font-serif italic">Plataforma AyVino</span>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 font-sans leading-relaxed pt-2 max-w-3xl">
            Bienvenido a <strong>AyVino</strong> (en adelante, la &ldquo;Plataforma&rdquo; o &ldquo;AyVino&rdquo;),
            servicio digital operado por el equipo titular de AyVino (en adelante, &ldquo;la Empresa&rdquo;,
            &ldquo;nosotros&rdquo; o &ldquo;nuestro&rdquo;). El acceso, registro y uso de la Plataforma confiere la
            condición de Usuario (en adelante, el &ldquo;Usuario&rdquo;) y presupone la aceptación plena, expresa y
            sin reservas de las presentes cláusulas.
          </p>
        </div>
      </section>

      {/* Main Layout: Sticky Sidebar Index + Content */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Sidebar (Desktop TOC) */}
        <aside className="lg:col-span-4 sticky top-20 hidden lg:block bg-zinc-950/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5 text-xs font-mono tracking-widest uppercase text-zinc-400">
            <Scale className="w-3.5 h-3.5 text-rose-400" />
            <span>Índice del Documento</span>
          </div>
          <nav aria-label="Índice de secciones" className="space-y-1 text-xs">
            {SECTIONS.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#4f131f]/40 text-rose-200 border border-rose-800/40 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="truncate pr-2">
                    <span className="font-mono text-zinc-500 mr-2">{sec.number}.</span>
                    {sec.title}
                  </span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-300 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Legal Text Sections */}
        <div className="lg:col-span-8 space-y-12 text-zinc-300 font-sans text-sm sm:text-[15px] leading-relaxed">
          {/* SECCIÓN 1 */}
          <section id="edad-y-consumo" className="scroll-mt-24 space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-900/50">
                1
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Restricción de Edad y Consumo Responsable de Alcohol
              </h2>
            </div>

            <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-2 text-rose-200/90 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-medium text-rose-200">
                <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Advertencia Legal de Edad Mínima</span>
              </div>
              <p>
                El acceso y registro a AyVino está estrictamente reservado a personas que hayan alcanzado la
                <strong> mayoría de edad legal para consumir y comprar bebidas alcohólicas</strong> en su país de residencia.
              </p>
            </div>

            <p>
              <strong>1.1. Mayoría de edad legal:</strong> La Plataforma recopila, cataloga y recomienda vinos y maridajes
              gastronómicos con bebidas con graduación alcohólica. Queda terminantemente prohibido el acceso a personas
              menores de la edad legal establecida (por ejemplo, 18 años de edad en la República Argentina y en la mayoría
              de los países hispanohablantes, o 21 años en jurisdicciones aplicables).
            </p>
            <p>
              <strong>1.2. Declaración bajo juramento:</strong> Al registrar una cuenta y marcar la casilla de aceptación,
              el Usuario declara fehacientemente y bajo juramento cumplir con dicho requisito legal. AyVino se reserva el
              derecho de verificar la edad y dar de baja de forma inmediata toda cuenta que resulte sospechosa o no acredite
              mayoría de edad.
            </p>
            <p>
              <strong>1.3. Fomento del consumo responsable:</strong> Promovemos la cultura del vino, la apreciación sensorial
              y el maridaje con criterio enológico. En ningún caso avalamos, promovemos ni toleramos el consumo excesivo de
              alcohol, su ingesta por menores de edad, ni la conducción de vehículos o manejo de maquinaria peligrosa bajo sus
              efectos.
            </p>
          </section>

          {/* SECCIÓN 2 */}
          <section id="naturaleza-servicio" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                2
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Naturaleza y Alcance del Servicio
              </h2>
            </div>
            <p>
              AyVino es un ecosistema digital especializado en el universo vitivinícola y gastronómico que provee:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-300">
              <li>Catálogo interactivo de etiquetas de vino, cepas, regiones, añadas y fichas técnicas.</li>
              <li>Gestión de Cava Virtual personal para el seguimiento de colecciones y botellas deseadas.</li>
              <li>Motor de sugerencias y maridajes gastronómicos adaptados a diferentes platos y ocasiones.</li>
              <li>Reseñas, puntuaciones y notas de cata elaboradas por enófilos de la comunidad y especialistas.</li>
              <li>Espacio institucional para bodegas y productores vitivinícolas.</li>
            </ul>
            <p>
              <strong>Carácter informativo y recreativo:</strong> Salvo mención expresa en contrario, los maridajes y notas
              de cata representan valoraciones de apreciación gastronómica y sensorial. No representan asesoramiento
              financiero, comercial o de inversión en cosechas o botellas.
            </p>
          </section>

          {/* SECCIÓN 3 */}
          <section id="tipos-cuentas" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                3
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Perfiles de Cuenta: Enófilos y Bodegas
              </h2>
            </div>
            <p>
              AyVino reconoce perfiles diferenciados con derechos y obligaciones específicos:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-zinc-100 font-medium font-serif">
                  <UserCheck className="w-4 h-4 text-rose-300" />
                  <span>Perfil Enófilo (Usuario)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Destinado al uso personal y privado. Permite calificar vinos, organizar la cava digital personal,
                  guardar maridajes favoritos e interactuar constructivamente con la comunidad.
                </p>
              </div>

              <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-zinc-100 font-medium font-serif">
                  <Building2 className="w-4 h-4 text-amber-300" />
                  <span>Perfil Bodega (Productor)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Destinado a bodegas, enólogos y viñedos. Permite administrar la presencia institucional, verificar
                  fichas de productos oficiales y mantener actualizada la información técnica y sensorial de sus vinos.
                </p>
              </div>
            </div>

            <p>
              <strong>Seguridad de credenciales:</strong> Cada titular de cuenta es responsable exclusivo de mantener la
              confidencialidad de su contraseña y de cualquier acción ejecutada desde su sesión. Ante indicios de acceso no
              autorizado, deberá comunicarlo de inmediato a través de nuestros canales de soporte.
            </p>
          </section>

          {/* SECCIÓN 4 */}
          <section id="sommelier-ia" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                4
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Sommelier Asistente e Inteligencia Artificial
              </h2>
            </div>

            <div className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 space-y-2 text-amber-200/90 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-medium text-amber-200">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Recomendaciones Algorítmicas Asistidas por IA</span>
              </div>
              <p>
                Las funciones de Sommelier y Asistente de Maridaje operan mediante modelos de Inteligencia Artificial que
                procesan patrones de uva, acidez, taninos y notas de cata.
              </p>
            </div>

            <p>
              <strong>4.1. Alcance orientativo:</strong> Las sugerencias provistas por el Asistente IA son meramente
              orientativas y lúdicas. La apreciación del vino y el maridaje es de naturaleza subjetiva y varía conforme al
              paladar individual y la preparación culinaria.
            </p>
            <p>
              <strong>4.2. Sin garantía de idoneidad:</strong> La Plataforma no garantiza que una recomendación automática
              satisfaga de forma infalible las expectativas gastronómicas del Usuario ni asume responsabilidad por maridajes
              que discrepen con las preferencias del comensal.
            </p>
          </section>

          {/* SECCIÓN 5 */}
          <section id="normas-conducta" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                5
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Normas de Conducta y Contenido del Usuario
              </h2>
            </div>
            <p>
              Al publicar notas de cata, valoraciones numéricas, comentarios o imágenes en AyVino, el Usuario se compromete a:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-300">
              <li>Aportar críticas genuinas y sustentadas en experiencias de degustación reales.</li>
              <li>No verter expresiones denigratorias, spam publicitario, enlaces fraudulentos ni contenido difamatorio.</li>
              <li>No incitar al consumo irresponsable, retos de ingesta etílica ni promociones dirigidas a menores de edad.</li>
            </ul>
            <p>
              <strong>Licencia de uso del contenido comunitario:</strong> El Usuario conserva la autoría de sus reseñas, pero
              concede a AyVino una licencia de exhibición no exclusiva, gratuita y transferible dentro del marco del servicio
              para indexación, cálculo de promedios de calificación y difusión de la cultura del vino.
            </p>
          </section>

          {/* SECCIÓN 6 */}
          <section id="propiedad-intelectual" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                6
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Propiedad Intelectual y Marcas de Terceros
              </h2>
            </div>
            <p>
              <strong>6.1. Derechos de la Plataforma:</strong> La interfaz gráfica, código de software, arquitectura de base
              de datos, algoritmos de maridaje, iconografía y textos descriptivos son propiedad exclusiva de AyVino y están
              protegidos por las normas de propiedad intelectual aplicables.
            </p>
            <p>
              <strong>6.2. Marcas de bodegas y viñedos:</strong> Los nombres comerciales, marcas registradas, etiquetas y
              fotografías de productos de las bodegas pertenecen a sus respectivos fabricantes o titulares legales. Su mención
              en la Plataforma se realiza bajo fines informativos, de catalogación y reseña enológica conforme al uso legítimo
              (&ldquo;nominative fair use&rdquo;).
            </p>
          </section>

          {/* SECCIÓN 7 */}
          <section id="garantias-salud" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                7
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Exclusión de Garantías, Salud y Alergias
              </h2>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-medium text-zinc-200">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Salud, Sulfitos y Alergias Alimentarias</span>
              </div>
              <p className="text-zinc-400">
                El vino contiene alcohol y sulfitos naturales o añadidos. Asimismo, las comidas recomendadas para maridaje
                pueden contener alérgenos (frutos secos, lácteos, gluten, mariscos, etc.).
              </p>
            </div>

            <p>
              <strong>Responsabilidad del Usuario:</strong> Es responsabilidad indelegable del Usuario comprobar el
              etiquetado oficial del producto físico y verificar cualquier incompatibilidad con su historial médico,
              alergias o intolerancias antes de consumir cualquier bebida o plato sugerido. AyVino no asume responsabilidad
              por contingencias de salud derivadas de la ingesta de alimentos o vinos.
            </p>
          </section>

          {/* SECCIÓN 8 */}
          <section id="enlaces-terceros" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                8
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Enlaces a Terceros y No Comercialización Directa
              </h2>
            </div>
            <p>
              AyVino es un canal de descubrimiento, cata y catalogación; <strong>no actúa como distribuidor ni como punto
              de venta directa de bebidas alcohólicas</strong>. En caso de que la Plataforma provea vínculos a tiendas web de
              bodegas, portales de enoturismo o vinotecas externas:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-zinc-300">
              <li>Dichas transacciones quedan gobernadas íntegramente por los términos y condiciones del comercio tercero.</li>
              <li>AyVino no interviene en el procesamiento de cobros, despachos postales ni políticas de devolución de terceros.</li>
            </ul>
          </section>

          {/* SECCIÓN 9 */}
          <section id="modificaciones" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                9
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Modificaciones de los Términos
              </h2>
            </div>
            <p>
              Nos reservamos la facultad de revisar y adecuar los presentes Términos ante innovaciones técnicas, nuevas
              funcionalidades o exigencias normativas. Notificaremos cambios de relevancia actualizando la fecha del encabezado
              o publicando un aviso visible en la Plataforma. El uso continuo de los servicios posterior a su actualización
              convalida el consentimiento a las modificaciones.
            </p>
          </section>

          {/* SECCIÓN 10 */}
          <section id="ley-aplicable" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                10
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Ley Aplicable y Jurisdicción
              </h2>
            </div>
            <p>
              Los presentes Términos se rigen e interpretan de conformidad con la legislación aplicable en la
              <strong> República Argentina</strong> y los estándares generales del comercio digital. Para cualquier
              controversia judicial no resuelta mediante entendimiento amistoso o mediación previa, las partes acuerdan
              someterse a la jurisdicción de los tribunales ordinarios en materia comercial competentes, renunciando a
              cualquier otro fuero de excepción.
            </p>
          </section>

          {/* SECCIÓN 11 */}
          <section id="contacto" className="scroll-mt-24 space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                11
              </span>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-zinc-100 tracking-tight">
                Canales de Contacto
              </h2>
            </div>
            <p>
              Para consultas de privacidad, aclaraciones legales, reportes sobre contenidos o dudas sobre estos Términos y
              Condiciones de Uso, podés ponerte en contacto directamente con nuestro equipo:
            </p>

            <div className="mt-3 p-5 rounded-2xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-800/30 flex items-center justify-center text-rose-300 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Correo Electrónico Oficial</p>
                  <a
                    href="mailto:Ayvinonk@gmail.com"
                    className="text-base font-medium text-rose-200 hover:text-white transition-colors underline decoration-rose-500/50"
                  >
                    Ayvinonk@gmail.com
                  </a>
                </div>
              </div>

              <a
                href="mailto:Ayvinonk@gmail.com?subject=Consulta%20sobre%20T%C3%A9rminos%20y%20Condiciones%20-%20AyVino"
                className="h-10 px-4 rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs uppercase tracking-widest text-rose-100 font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Enviar Consulta</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </section>

          {/* Bottom Action Footer */}
          <div className="pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la vista anterior</span>
            </button>

            <Link
              to="/register"
              className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#4f131f] hover:bg-[#5e1725] border border-rose-400/20 text-xs font-mono uppercase tracking-widest text-rose-100 font-medium transition-colors shadow-sm inline-flex items-center justify-center gap-2"
            >
              <span>Ir a Registro</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs font-mono text-zinc-500 tracking-widest uppercase">
        <p>AyVino © 2026 · Plataforma y Cava Digital de Vinos</p>
      </footer>
    </div>
  );
}
