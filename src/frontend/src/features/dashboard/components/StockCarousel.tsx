import { useRef } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Star, Thermometer, Clock, Wine as WineIcon } from 'lucide-react';
import SectionHeading from './SectionHeading';
import BottleVector from './BottleVector';
import type { DashboardWine } from '../../../types/wine';

export interface StockCarouselProps {
  wines?: DashboardWine[];
  onUncork: (wine: DashboardWine) => void;
}

const defaultStock: DashboardWine[] = [
  {
    name: 'Gran Enemigo Gualtallary',
    winery: 'El Enemigo',
    region: 'Tupungato, Mendoza',
    varietal: 'Cabernet Franc',
    vintage: 2018,
    rating: 4.8,
    units: 2,
    location: 'Casa Principal · Cava eléctrica',
    bottle: 'red-black',
  },
  {
    name: 'Cheval des Andes',
    winery: 'Terrazas de los Andes',
    region: 'Luján de Cuyo, Mendoza',
    varietal: 'Blend Tintorero',
    vintage: 2019,
    rating: 4.9,
    units: 1,
    location: 'Casa Principal · Cava eléctrica',
    bottle: 'red-cream',
  },
  {
    name: 'Colomé Torrontés Altura',
    winery: 'Bodega Colomé',
    region: 'Valle Calchaquí, Salta',
    varietal: 'Torrontés',
    vintage: 2023,
    rating: 4.4,
    units: 3,
    location: 'Casa Principal · Heladera',
    bottle: 'white-flute',
  },
  {
    name: 'Rutini Apartado Gran Malbec',
    winery: 'Rutini Wines',
    region: 'Valle de Uco, Mendoza',
    varietal: 'Malbec',
    vintage: 2017,
    rating: 4.7,
    units: 2,
    location: 'Departamento · Estante',
    bottle: 'red-burgundy',
  },
  {
    name: 'Baron B Brut Nature',
    winery: 'Chandon',
    region: 'Valle de Uco, Mendoza',
    varietal: 'Espumante de Método Tradicional',
    vintage: 2020,
    rating: 4.5,
    units: 4,
    location: 'Casa Principal · Heladera',
    bottle: 'sparkling',
  },
  {
    name: 'Noemía A Lisa Malbec',
    winery: 'Bodega Noemía',
    region: 'Mainqué, Río Negro',
    varietal: 'Malbec',
    vintage: 2021,
    rating: 4.6,
    units: 2,
    location: 'Departamento · Estante',
    bottle: 'red-cream',
  },
];

/**
 * StockCarousel Component (Estética Oscura Mate & Bento)
 * Carrusel horizontal de botellas con tarjetas oscuras (#121214), bordes sutiles de 1px
 * border-neutral-800, micro-datos técnicos y botón de descorche en bordó (#722F37).
 */
export default function StockCarousel({ wines = defaultStock, onUncork }: StockCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (track) {
      track.scrollBy({ left: direction * (track.clientWidth * 0.75), behavior: 'smooth' });
    }
  };

  return (
    <section aria-labelledby="ready-title" className="flex flex-col gap-6">
      
      {/* Encabezado con Botones de Navegación del Carrusel */}
      <SectionHeading
        id="ready-title"
        as="h3"
        eyebrow="De tu colección"
        title="Listos para descorchar"
        description="Botellas en su ventana de evolución óptima según añada y estiba."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Botella anterior"
            onClick={() => scroll(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-100 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Botella siguiente"
            onClick={() => scroll(1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-neutral-100 transition-all cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </SectionHeading>

      {/* Riel de Tarjetas Scrolleable */}
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-1 [scrollbar-width:none] -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {wines.map((wine) => (
          <li
            key={wine.name}
            className="w-[280px] sm:w-[310px] shrink-0 snap-start flex flex-col"
          >
            <article className="group h-full flex flex-col justify-between rounded-xl border border-neutral-800 bg-[#121214] p-5 hover:border-neutral-700 transition-all duration-200">
              
              {/* Parte Superior: Badge de Stock y Puntuación */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-neutral-300 border border-neutral-800">
                    <WineIcon className="h-3 w-3 text-neutral-400" />
                    {`x${wine.units ?? 1} en cava`}
                  </span>
                  
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-mono font-bold text-neutral-200">{wine.rating.toFixed(1)}</span>
                  </div>
                </div>

                {/* Pedestal de la Botella con Fondo Carbón */}
                <div className="my-2 flex h-48 items-center justify-center rounded-lg bg-[#18181c] border border-neutral-800/80 p-3 group-hover:bg-[#1f1f24] transition-colors relative overflow-hidden">
                  <BottleVector kind={wine.bottle} className="h-40" alt={wine.name} />
                  <div className="absolute bottom-2 w-16 h-2.5 bg-black/60 rounded-full blur-[2px]" />
                </div>

                {/* Metadatos de Bodega y Añada */}
                <div className="mt-4 flex flex-col gap-1">
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                    {`${wine.vintage} · ${wine.varietal}`}
                  </p>
                  
                  <h4 className="font-serif text-lg font-semibold text-neutral-100 tracking-tight leading-snug group-hover:text-amber-200 transition-colors">
                    {wine.name}
                  </h4>
                  
                  <p className="text-xs text-neutral-500 font-sans">
                    {wine.winery} · {wine.region}
                  </p>
                </div>

                {/* Fila de Micro-iconos Técnicos */}
                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-neutral-800/80 text-[10px] font-mono text-neutral-400 text-center">
                  <div className="flex items-center justify-center gap-1 rounded bg-neutral-900 py-1 border border-neutral-800/60">
                    <Thermometer className="h-3 w-3 text-neutral-400" />
                    <span>16°C</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 rounded bg-neutral-900 py-1 border border-neutral-800/60">
                    <Clock className="h-3 w-3 text-neutral-400" />
                    <span>2028</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 rounded bg-neutral-900 py-1 border border-neutral-800/60">
                    <WineIcon className="h-3 w-3 text-neutral-400" />
                    <span>14.5%</span>
                  </div>
                </div>
              </div>

              {/* Ubicación y Botón de Descorchar */}
              <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-col gap-3">
                {wine.location && (
                  <p className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500">
                    <MapPin className="h-3 w-3 text-neutral-400 shrink-0" aria-hidden="true" />
                    <span className="truncate">{wine.location}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => onUncork(wine)}
                  className="flex h-10 w-full items-center justify-center rounded-md bg-[#722F37] hover:bg-[#5c1d24] text-neutral-100 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Descorchar
                </button>
              </div>

            </article>
          </li>
        ))}
      </ul>

    </section>
  );
}
