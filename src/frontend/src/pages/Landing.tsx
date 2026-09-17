import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import AuthDrawer from '../components/auth/AuthDrawer';
import WineCard from '../components/wine/WineCard';
import WineBottleMock from '../components/wine/WineBottleMock';
import WineDetailModal from '../components/wine/WineDetailModal';
import type { CuratedWine } from '../types/wine';
import type { AuthMode } from '../types/auth';
import {
  Sparkles,
  ArrowDown,
  Lock,
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
    price: 32000,
    rating: 4.9,
    reviewCount: 58,
    isOfficial: true,
    aging: 'Sin paso por madera, hormigón puro',
    pairing: 'Chivito andino a las brasas, ojo de bife con romero o quesos curados de oveja.',
    altitude: '1.100 msnm · Suelo calcáreo aluvial',
    colorAccent: 'from-wine-900/15 to-wine-500/5',
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
    price: 24500,
    rating: 4.8,
    reviewCount: 84,
    isOfficial: true,
    aging: '15 meses en foudres alsacianos centenarios',
    pairing: 'Cordero braseado, empanadas mendocinas cortadas a cuchillo y pastas rellenas.',
    altitude: '1.470 msnm · Caliche y gravas profundas',
    colorAccent: 'from-wine-950/20 to-amber-900/10',
  },
  {
    id: 'wine-3',
    name: 'Cara Sur Criolla Chica',
    winery: 'Cara Sur Viticultores',
    grape: 'Criolla Chica',
    vintage: '2022',
    region: 'Barreal, Valle de Calingasta (San Juan)',
    tastingNotes: 'Frutillas del bosque, té negro, cascara de naranja y hierbas autóctonas en un trago etéreo y fresco.',
    longDescription:
      'Vino de mínima intervención elaborado a partir de parrales centenarios rescatados en las faldas de la Cordillera de Ansilta. Ligero en color pero profundamente aromático, fluido y gastronómico.',
    descriptors: ['Frutilla Silvestre', 'Té Negro', 'Hierbas Frescas', 'Jugo Puro'],
    price: 16500,
    rating: 4.7,
    reviewCount: 31,
    isOfficial: false, // Marcado como "Agregado por la comunidad" (RF-1.3)
    aging: 'Huevos de hormigón y barricas viejas neutras',
    pairing: 'Charcutería artesanal, trucha patagónica a la plancha o platos con hongos silvestres.',
    altitude: '1.500 msnm · Clima desértico andino',
    colorAccent: 'from-rose-900/15 to-amber-500/5',
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
    price: 14200,
    rating: 4.6,
    reviewCount: 42,
    isOfficial: true,
    aging: '6 meses sobre lías en tanques de acero inoxidable',
    pairing: 'Ceviche clásico, empanadas salteñas de carne picante o sushi de pesca blanca.',
    altitude: '2.300 msnm · Extrema radiación UV y noches frías',
    colorAccent: 'from-amber-400/15 to-yellow-600/5',
  },
];

export default function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');
  const [selectedWine, setSelectedWine] = useState<CuratedWine | null>(null);

  const handleOpenAuth = (mode: AuthMode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 text-earth-900 font-sans selection:bg-wine-100 selection:text-wine-900">
      
      {/* 1. Navbar persistente */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-cream-200/80">
        
        {/* Fondo sutil con ruido y manchas difusas */}
        <div className="absolute -top-32 right-1/4 w-96 h-96 rounded-full bg-wine-100/40 blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-0 w-80 h-80 rounded-full bg-amber-100/30 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Lado izquierdo: Tipografía y llamados a la acción */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              
              {/* Badge superior editorial */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-wine-50 border border-wine-100/90 text-wine-900 text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-wine-500 animate-pulse" />
                <span>La nueva cultura colectiva del vino</span>
              </div>

              {/* Título principal en dos líneas combinando Sans y Serif en cursiva */}
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-sans font-extrabold tracking-tight text-earth-900 leading-[1.1]">
                Descorchá nuevas historias,
                <span className="block font-serif font-normal italic text-wine-900 mt-1 sm:mt-2">
                  coleccioná cada copa.
                </span>
              </h1>

              {/* Subtítulo corto y reflexivo */}
              <p className="text-lg sm:text-xl text-earth-900/75 max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0">
                El catálogo vivo donde bodegas independientes y amantes del buen beber reseñan,
                descubren terruños singulares y construyen su memoria sensorial sin pretensiones.
              </p>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('seleccion-curada')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-wine-900 hover:bg-wine-800 text-cream-50 font-medium text-base transition-all duration-200 shadow-lg shadow-wine-900/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span>Explorar Selección</span>
                  <ArrowDown className="w-4 h-4 text-cream-200" />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenAuth('register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-cream-100 hover:bg-cream-200/80 text-earth-900 border border-cream-200 font-medium text-base transition-all duration-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-wine-800" />
                  <span>Crear Cuenta Libre</span>
                </button>
              </div>

              {/* Micro métricas editoriales */}
              <div className="pt-6 border-t border-cream-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                <div>
                  <p className="font-serif text-2xl font-bold text-wine-900">+1.400</p>
                  <p className="text-xs text-earth-900/60 font-medium">Etiquetas vivas</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-wine-900">100%</p>
                  <p className="text-xs text-earth-900/60 font-medium">Reseñas honestas</p>
                </div>
                <div>
                  <p className="font-serif text-2xl font-bold text-wine-900">0 Fricción</p>
                  <p className="text-xs text-earth-900/60 font-medium">Cata abierta</p>
                </div>
              </div>

            </div>

            {/* Lado derecho: Mock visual de botella de vino con perspectiva pseudo-3D */}
            <div className="lg:col-span-5 flex justify-center">
              <WineBottleMock />
            </div>

          </div>
        </div>
      </section>

      {/* 3. Sección "Selección Curada" (Demo pública sin bloqueo) */}
      <section id="seleccion-curada" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest uppercase text-wine-800 bg-wine-50 px-3 py-1 rounded-full border border-wine-100">
              Cata Abierta y Fichas Libres
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-earth-900 mt-3">
              Selección Curada de la Semana
            </h2>
            <p className="text-earth-900/70 text-sm sm:text-base mt-2 max-w-xl">
              Explorá estas 4 etiquetas representativas con acceso irrestricto a notas organolépticas,
              maridaje y terroir.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-earth-900/60 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Fichas completas disponibles sin registro previo</span>
          </div>
        </div>

        {/* Grilla de 4 WineCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CURATED_WINES.map((wine) => (
            <WineCard
              key={wine.id}
              wine={wine}
              onSelect={(selected) => setSelectedWine(selected)}
            />
          ))}
        </div>

        {/* 4. Banner de bloqueo / Acceso completo */}
        <div className="mt-16 sm:mt-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24040a] via-wine-900 to-earth-900 text-cream-50 p-8 sm:p-12 shadow-2xl border border-wine-800/40">
            
            {/* Elemento de ambientación visual de fondo */}
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-wine-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-8 space-y-4">
                
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Acceso Completo al Catálogo General</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-4xl font-bold leading-tight text-cream-50">
                  Desbloqueá más de 1.400 botellas, listas personalizadas y notas extendidas
                </h3>

                <p className="text-cream-200/80 text-sm sm:text-base leading-relaxed max-w-2xl">
                  La selección semanal es solo el comienzo. Formá parte de AyVino para organizar tus copas,
                  puntuar etiquetas comunitarias y acceder a los filtros de suelo, altitud y guarda.
                </p>

                {/* Lista de beneficios destacados */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-cream-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Listas fijas: "Favoritos" y "Por Probar"</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-cream-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Carga comunitaria de botellas por foto</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-cream-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Filtros avanzados por altitud y terroir</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm text-cream-100">
                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Catálogo oficial unificado de bodegas</span>
                  </div>
                </div>

              </div>

              {/* Botón CTA del Banner */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => handleOpenAuth('register')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-cream-50 hover:bg-cream-100 text-wine-900 font-bold text-sm sm:text-base transition-all duration-200 shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Crear Cuenta Gratuita</span>
                  <ArrowRight className="w-4 h-4 text-wine-900" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAuth('login')}
                  className="w-full py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-cream-100 text-xs sm:text-sm font-medium transition-colors text-center cursor-pointer"
                >
                  ¿Ya tenés perfil? Iniciar Sesión
                </button>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 5. Sección Filosofía & Comunidad */}
      <section id="filosofia" className="py-16 sm:py-20 bg-cream-100/60 border-y border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-wine-800">
              Nuestra Filosofía
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-earth-900">
              El vino no es un examen, es una conversación
            </h2>
            <p className="text-earth-900/75 text-sm sm:text-base leading-relaxed">
              Creemos en una plataforma donde las bodegas artesanales y las grandes etiquetas conviven
              con el paladar honesto de las personas. Sin esnobismos técnicos ni puntajes comprados:
              cada botella cuenta la verdad de la tierra que la vio nacer.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-cream-50 rounded-2xl border border-cream-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-900 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-bold text-earth-900">Comunidad Viva</h4>
              <p className="text-xs sm:text-sm text-earth-900/70 leading-relaxed">
                Si tomás una botella no registrada en nuestro catálogo, podés subirla vos mismo.
                La catalogación pertenece a quienes disfrutan cada copa.
              </p>
            </div>

            <div className="p-6 bg-cream-50 rounded-2xl border border-cream-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-900 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-bold text-earth-900">Bodegas Verificadas</h4>
              <p className="text-xs sm:text-sm text-earth-900/70 leading-relaxed">
                Distingue fácilmente entre fichas oficiales de bodega y opiniones de usuarios.
                Transparencia total en el origen de cada dato.
              </p>
            </div>

            <div className="p-6 bg-cream-50 rounded-2xl border border-cream-200/90 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-wine-50 text-wine-900 flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <h4 className="font-serif text-lg font-bold text-earth-900">Tus Colecciones</h4>
              <p className="text-xs sm:text-sm text-earth-900/70 leading-relaxed">
                Guardá en "Favoritos" o recordá aquellas botellas anotadas en "Por Probar"
                para tu próxima visita a una vinoteca o cena especial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer Minimalista Editorial */}
      <footer id="comunidad" className="bg-cream-50 py-12 border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-wine-900 flex items-center justify-center text-cream-50">
                <Wine className="w-3.5 h-3.5 text-cream-100" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-wine-900">
                AyVino
              </span>
              <span className="text-xs text-earth-900/50 ml-2">
                © {new Date().getFullYear()} — Catálogo colaborativo de vinos.
              </span>
            </div>

            <div className="flex items-center gap-6 text-xs text-earth-900/70">
              <a href="#seleccion-curada" className="hover:text-wine-900 transition-colors">
                Destacados
              </a>
              <a href="#filosofia" className="hover:text-wine-900 transition-colors">
                Filosofía
              </a>
              <button
                type="button"
                onClick={() => handleOpenAuth('login')}
                className="hover:text-wine-900 transition-colors cursor-pointer"
              >
                Acceso Miembros
              </button>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-cream-200/60 text-center">
            <p className="text-[11px] text-earth-900/40">
              Beber con moderación. Prohibida su venta a menores de 18 años. AyVino promueve la cultura enológica responsable.
            </p>
          </div>
        </div>
      </footer>

      {/* Panel lateral de Autenticación (Slide-Over Drawer) */}
      <AuthDrawer
        isOpen={authModalOpen}
        onClose={handleCloseAuth}
        initialMode={authModalMode}
      />

      {/* Modal de Ficha de Cata Completa (Sin bloqueo para la muestra) */}
      <WineDetailModal
        wine={selectedWine}
        onClose={() => setSelectedWine(null)}
        onOpenAuth={handleOpenAuth}
      />

    </div>
  );
}

