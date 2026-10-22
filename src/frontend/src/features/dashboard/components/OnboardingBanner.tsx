import { Plus, Compass, Sparkles } from 'lucide-react';
import BottleVector from './BottleVector';

interface OnboardingBannerProps {
  onAddFirstBottle?: () => void;
}

const steps = [
  {
    number: '01',
    title: 'Registrá',
    text: 'Cargá tus botellas con su añada, terruño y espacio de estiba.',
  },
  {
    number: '02',
    title: 'Descorchá',
    text: 'Puntuá con estrellas y documentá tus notas de cata personales.',
  },
  {
    number: '03',
    title: 'Descubrí',
    text: 'Explorá bodegas de altura y armá tu lista de deseos.',
  },
];

/**
 * OnboardingBanner Component
 * Banner de bienvenida guiado para nuevos miembros de la plataforma.
 * Explica en 3 pasos cómo catalogar, catar y explorar terruños argentinos.
 */
export default function OnboardingBanner({ onAddFirstBottle }: OnboardingBannerProps) {
  return (
    <section
      aria-labelledby="onboarding-title"
      className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-14 rounded-3xl border border-cream-200/90 bg-gradient-to-br from-cream-100/90 via-cream-50 to-white p-8 sm:p-12 shadow-xs overflow-hidden relative"
    >
      {/* Halo de luz decorativo */}
      <div
        className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-wine-800/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Columna Izquierda: Información y Pasos */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        <div className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-wine-50 border border-wine-100 text-wine-900 text-[11px] font-semibold tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-wine-500" />
          <span>Tu viaje enológico comienza acá</span>
        </div>

        <h3
          id="onboarding-title"
          className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-earth-900 leading-tight"
        >
          Comenzá tu{' '}
          <span className="italic font-normal text-wine-900">
            cava digital
          </span>
        </h3>

        <div className="h-0.5 w-16 bg-wine-800/40 rounded-full" aria-hidden="true" />

        <p className="max-w-xl text-sm leading-relaxed text-earth-900/70 font-sans">
          Explorá las bodegas de la comunidad abajo para añadir etiquetas a tu inventario o registrar los vinos que ya forman parte de tu colección.
        </p>

        {/* 3 Pasos */}
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {steps.map((step) => (
            <li
              key={step.number}
              className="flex flex-col gap-1.5 border-t border-cream-200 pt-4"
            >
              <span className="font-serif text-lg font-bold text-wine-900">
                {step.number}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-earth-900">
                {step.title}
              </span>
              <span className="text-xs leading-relaxed text-earth-900/65 font-sans">
                {step.text}
              </span>
            </li>
          ))}
        </ol>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            type="button"
            onClick={onAddFirstBottle}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-wine-900 hover:bg-wine-800 text-cream-50 px-6 text-xs font-semibold uppercase tracking-[0.14em] shadow-md shadow-wine-900/15 hover:shadow-wine-900/25 active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Cargar primera botella</span>
          </button>

          <a
            href="#catalogo"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-wine-800/30 bg-white/80 hover:bg-wine-50 text-wine-900 px-6 text-xs font-semibold uppercase tracking-[0.14em] transition-all"
          >
            <Compass className="h-4 w-4 text-wine-800" />
            <span>Explorar catálogo</span>
          </a>
        </div>

      </div>

      {/* Columna Derecha: Muestra de Botellas Vectoriales */}
      <div
        className="lg:col-span-5 flex items-center justify-center gap-4 bg-cream-50/80 rounded-2xl border border-cream-200/60 p-6"
        aria-hidden="true"
      >
        <div className="transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <BottleVector kind="white" className="h-48" alt="Blanco" />
        </div>
        <div className="transform scale-110 z-10 hover:scale-115 transition-transform duration-300">
          <BottleVector kind="red-black" className="h-52" alt="Tinto Gran Reserva" />
        </div>
        <div className="transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <BottleVector kind="sparkling" className="h-48" alt="Espumante" />
        </div>
      </div>

    </section>
  );
}

