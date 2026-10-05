import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import WineCard from '../features/wines/components/WineCard';
import WineBottleMock from '../features/wines/components/WineBottleMock';
import WineDetailModal from '../features/wines/components/WineDetailModal';
import CommunityModal from '../components/community/CommunityModal';
import type { CuratedWine } from '../types/wine';
import {
  Sparkles,
  ArrowDown,
  Heart,
  ShieldCheck,
  Wine,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

/**
 * Datos mockeados de la muestra curada (Demo abierta sin bloqueo).
 * Representa la diversidad del terroir vitivinícola argentino y cumple RF-1.3 (Comunidad vs Bodega Oficial).
 * Alineado con el backend: sin precios, con campos extendidos opcionales.
 */
const CURATED_WINES: CuratedWine[] = [
  {
    id: 'wine-1',
    name: 'Piedra Infinita Malbec',
    winery: 'Zuccardi',
    grape: 'Malbec',
    vintage: '2021',
    region: 'Paraje Altamira, Valle de Uco (Mendoza)',
    tastingNotes: 'Ciruelas silvestres, tiza mineral, violetas andinas y taninos aterciopelados con persistencia infinita.',
    longDescription:
      'Proveniente de suelos aluviales con costra calcárea a 1.100 msnm. Fermentado en piletas de hormigón sin epoxi con levaduras nativas. Posee una frescura vibrante que expresa la pureza extrema del terroir de Altamira.',
    descriptors: ['Ciruela Negra', 'Tiza Calcárea', 'Violetas', 'Hierbas de Montaña'],
    rating: 4.9,
    reviewCount: 58,
    sourceType: 'winery',
    isOfficial: true,
    aging: 'Sin paso por madera, hormigón puro',
    pairing: 'Chivito andino a las brasas, ojo de bife con romero o quesos curados de oveja.',
    altitude: '1.100 msnm · Suelo calcáreo aluvial',
  },
  {
    id: 'wine-2',
    name: 'El Enemigo Cabernet Franc',
    winery: 'Bodega Aleanna',
    grape: 'Cabernet Franc',
    vintage: '2020',
    region: 'Gualtallary, Tupungato (Mendoza)',
    tastingNotes: 'Pimientos asados dulces, grosellas negras maduras, vainilla noble y acidez lineal electrizante.',
    longDescription:
      'Cofermentado con un toque de Malbec. Crianza en foudres centenarios durante 15 meses. Elegancia rústica con un balance impecable entre la frescura de la altura y la textura de sus taninos minerales.',
    descriptors: ['Pimiento Asado', 'Grosellas', 'Especiado', 'Cedro'],
    rating: 4.8,
    reviewCount: 84,
    sourceType: 'winery',
    isOfficial: true,
    aging: '15 meses en foudres alsacianos centenarios',
    pairing: 'Cordero braseado, empanadas mendocinas cortadas a cuchillo y pastas rellenas.',
    altitude: '1.470 msnm · Caliche y gravas profundas',
  },
  {
    id: 'wine-3',
    name: 'Cara Sur Criolla Chica',
    winery: 'Cara Sur Viticultores',
    grape: 'Criolla Chica',
    vintage: '2022',
    region: 'Barreal, Valle de Calingasta (San Juan)',
    tastingNotes: 'Frutillas del bosque, té negro, cáscara de naranja y hierbas autóctonas en un trago etéreo y fresco.',
    longDescription:
      'Vino de mínima intervención elaborado a partir de parrales centenarios rescatados en las faldas de la Cordillera de Ansilta. Ligero en color pero profundamente aromático, fluido y gastronómico.',
    descriptors: ['Frutilla Silvestre', 'Té Negro', 'Hierbas Frescas', 'Jugo Puro'],
    rating: 4.7,
    reviewCount: 31,
    sourceType: 'community',
    isOfficial: false,
    aging: 'Huevos de hormigón y barricas viejas neutras',
    pairing: 'Charcutería artesanal, trucha patagónica a la plancha o platos con hongos silvestres.',
    altitude: '1.500 msnm · Clima desértico andino',
  },
  {
    id: 'wine-4',
    name: 'Lote Especial Torrontés',
    winery: 'Bodega Colomé',
    grape: 'Torrontés',
    vintage: '2023',
    region: 'Altos Valles Calchaquíes (Salta)',
    tastingNotes: 'Jazmín, cáscara de pomelo rosado, flores blancas y un final seco, fresco y cítrico sin dulzores engañosos.',
    longDescription:
      'Nacido a más de 2.300 metros sobre el nivel del mar, bajo el sol más radiante de Argentina. Un Torrontés moderno, vertical, de paladar seco y crocante, que redefine el potencial de la cepa emblema blanca.',
    descriptors: ['Jazmín', 'Pomelo Rosado', 'Flor de Azahar', 'Mineral Salino'],
    rating: 4.6,
    reviewCount: 42,
    sourceType: 'winery',
    isOfficial: true,
    aging: '6 meses sobre lías en tanques de acero inoxidable',
    pairing: 'Ceviche clásico, empanadas salteñas de carne picante o sushi de pesca blanca.',
    altitude: '2.300 msnm · Extrema radiación UV y noches frías',
  },
];

/**
 * Landing Page Component
 * Página pública de bienvenida con estética editorial de cava oscura (carbón mate #0f0f11):
 * - Eliminación de clichés de IA y badges genéricos con animación.
 * - Eyebrows tipográficos planos en font-mono tracking amplio.
 * - Lenguaje cercano y directo para notas de cata y origen.
 * - Selección curada en tarjetas a dos columnas sin precios.
 */
export default function Landing() {
  const [selectedWine, setSelectedWine] = useState<CuratedWine | null>(null);
  const [communityModalOpen, setCommunityModalOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-100 font-sans selection:bg-[#6b1d28] selection:text-white flex flex-col justify-between">
      
      {/* 1. Navbar persistente en tema oscuro */}
      <Navbar />

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-neutral-800">
        
        {/* Fondo sutil con brillo ambiente controlado */}
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-[#6b1d28]/10 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-neutral-800/15 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Lado izquierdo: Tipografía y llamados a la acción */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              
              {/* Eyebrow editorial plano (sin contenedor, sin sombras ni animación de pulso) */}
              <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium">
                Cultura colectiva del vino
              </p>

              {/* Título principal en dos líneas combinando Sans y Serif en cursiva */}
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-sans font-extrabold tracking-tight text-neutral-100 leading-[1.1]">
                Descorchá nuevas historias,
                <span className="block font-serif font-semibold italic text-neutral-200 mt-1 sm:mt-2">
                  coleccioná cada copa.
                </span>
              </h1>

              {/* Subtítulo corto y reflexivo */}
              <p className="text-base sm:text-lg text-neutral-400 max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0 font-sans">
                El catálogo vivo donde bodegas independientes y amantes del buen beber reseñan,
                descubren terruños singulares y construyen su memoria sensorial sin pretensiones.
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('seleccion-curada')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-sm bg-[#6b1d28] hover:bg-[#7e2432] text-white font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>Explorar Selección</span>
                  <ArrowDown className="w-4 h-4 text-white/80" />
                </button>

                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm bg-transparent border border-neutral-700 text-neutral-200 hover:border-neutral-500 font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-neutral-400" />
                  <span>Crear Cuenta Libre</span>
                </Link>
              </div>

              {/* Micro métricas editoriales */}
              <div className="pt-6 border-t border-neutral-800 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="font-serif text-2xl font-semibold text-neutral-100">+1.400</p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 font-medium">Etiquetas vivas</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold text-neutral-100">100%</p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 font-medium">Reseñas honestas</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold text-neutral-100">0 Fricción</p>
                  <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500 font-medium">Cata abierta</p>
                </div>
              </div>

            </div>

            {/* Lado derecho: Mock visual de botella integrado en el fondo oscuro */}
            <div className="lg:col-span-5 flex justify-center">
              <WineBottleMock />
            </div>

          </div>
        </div>
      </section>

      {/* 3. Sección "Selección Curada" (Demo pública sin bloqueo y sin precios) */}
      <section id="seleccion-curada" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium mb-2">
              Cata abierta y fichas libres
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-neutral-100 mt-1">
              Selección Curada de la Semana
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base mt-2 max-w-xl font-sans">
              Explorá estas 4 etiquetas representativas con acceso directo a notas de cata, aromas, maridaje y origen.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-500">
              Acceso libre sin registro previo
            </span>
          </div>
        </div>

        {/* Grilla a dos columnas para escaneo horizontal rápido de tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CURATED_WINES.map((wine) => (
            <WineCard
              key={wine.id}
              wine={wine}
              onSelect={(selected) => setSelectedWine(selected)}
            />
          ))}
        </div>

        {/* 4. Banner de acceso completo */}
        <div className="mt-16 sm:mt-20">
          <div className="relative overflow-hidden rounded-sm bg-[#141416] text-neutral-100 p-8 sm:p-12 border border-neutral-800">
            
            {/* Elemento de ambientación sutil de fondo */}
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#6b1d28]/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-neutral-800/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium">
                  Catálogo general completo
                </p>

                <h3 className="font-serif text-2xl sm:text-4xl font-semibold leading-tight text-neutral-100">
                  Desbloqueá más de 1.400 botellas, listas personalizadas y notas extendidas
                </h3>

                <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl font-sans">
                  La selección semanal es solo el comienzo. Formá parte de AyVino para organizar tus copas,
                  puntuar etiquetas comunitarias y acceder a los filtros de suelo, altitud y guarda.
                </p>

                {/* Lista de beneficios destacados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Listas fijas: "Favoritos" y "Por Probar"</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Carga comunitaria de botellas por foto</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Filtros avanzados por altitud y región</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-300 font-sans">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Catálogo oficial unificado de bodegas</span>
                  </div>
                </div>

              </div>

              {/* Botón CTA del Banner */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Link
                  to="/register"
                  className="w-full py-3 px-6 rounded-sm bg-[#6b1d28] hover:bg-[#7e2432] text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Crear Cuenta Gratuita</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </Link>
                <Link
                  to="/login"
                  className="w-full py-3 px-6 rounded-sm bg-transparent border border-neutral-700 hover:border-neutral-500 text-neutral-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors text-center cursor-pointer"
                >
                  ¿Ya tenés perfil? Iniciar Sesión
                </Link>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 5. Sección Filosofía & Comunidad */}
      <section id="filosofia" className="py-16 sm:py-20 bg-[#121214] border-y border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-neutral-400 font-medium">
              Nuestra filosofía
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-neutral-100">
              El vino no es un examen, es una conversación
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed font-sans">
              Creemos en una plataforma donde las bodegas artesanales y las grandes etiquetas conviven
              con el paladar honesto de las personas. Sin esnobismos técnicos ni puntajes comprados:
              cada botella cuenta la verdad de la tierra que la vio nacer.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#141416] rounded-sm border border-neutral-800 space-y-3">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-center">
                <Users className="w-5 h-5 text-neutral-300" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-neutral-100">Comunidad Viva</h4>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                Si tomás una botella no registrada en nuestro catálogo, podés subirla vos mismo.
                La catalogación pertenece a quienes disfrutan cada copa.
              </p>
            </div>

            <div className="p-6 bg-[#141416] rounded-sm border border-neutral-800 space-y-3">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-neutral-300" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-neutral-100">Bodegas Verificadas</h4>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                Distingue fácilmente entre fichas oficiales de bodega y opiniones de usuarios.
                Transparencia total en el origen de cada dato.
              </p>
            </div>

            <div className="p-6 bg-[#141416] rounded-sm border border-neutral-800 space-y-3">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 border border-neutral-800 text-neutral-300 flex items-center justify-center">
                <Heart className="w-5 h-5 text-neutral-300" />
              </div>
              <h4 className="font-serif text-lg font-semibold text-neutral-100">Tus Colecciones</h4>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans">
                Guardá en "Favoritos" o recordá aquellas botellas anotadas en "Por Probar"
                para tu próxima visita a una vinoteca o cena especial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer Minimalista Editorial */}
      <footer id="comunidad" className="border-t border-neutral-800 bg-[#0c0c0e] py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300">
                <Wine className="h-3.5 w-3.5 text-neutral-300" />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-neutral-200">
                AyVino
              </span>
              <span className="text-xs text-neutral-500 font-mono ml-2">
                © {new Date().getFullYear()} — Catálogo colaborativo de vinos.
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono uppercase tracking-wider text-neutral-400">
              <a href="#seleccion-curada" className="hover:text-neutral-100 transition-colors">
                Destacados
              </a>
              <a href="#filosofia" className="hover:text-neutral-100 transition-colors">
                Filosofía
              </a>
              <button
                type="button"
                onClick={() => setCommunityModalOpen(true)}
                className="hover:text-neutral-100 transition-colors cursor-pointer"
              >
                Comunidad
              </button>
              <Link
                to="/login"
                className="hover:text-neutral-100 transition-colors cursor-pointer"
              >
                Acceso Miembros
              </Link>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500">
              Beber con moderación · Prohibida su venta a menores de 18 años · AyVino promueve la cultura enológica responsable.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal de Ficha de Cata Completa a 2 Columnas (Sin bloqueo) */}
      <WineDetailModal
        wine={selectedWine}
        onClose={() => setSelectedWine(null)}
      />

      {/* Modal de Próximamente para Comunidad */}
      <CommunityModal
        isOpen={communityModalOpen}
        onClose={() => setCommunityModalOpen(false)}
      />

    </div>
  );
}
