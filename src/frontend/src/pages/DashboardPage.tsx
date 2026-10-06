import { useState, useMemo, useCallback } from 'react';
import { Wine, CheckCircle2 } from 'lucide-react';
import {
  DashboardNavbar,
  QuickActions,
  Metrics,
  DashboardSection,
  PromoBlocks,
  FilterChips,
  SectionHeading,
  WineryBlock,
  UncorkDialog,
} from '../features/dashboard';
import type { DashboardWine, UncorkSubmission } from '../types/wine';

const catenaWines: DashboardWine[] = [
  {
    name: 'Catena Zapata Malbec Argentino',
    winery: 'Catena Zapata',
    region: 'Luján de Cuyo, Mendoza',
    varietal: 'Malbec',
    vintage: 2019,
    rating: 4.8,
    units: 2,
    location: 'Cava Principal · Estante A1',
    bottle: 'red-cream',
  },
  {
    name: 'Nicolás Catena Zapata',
    winery: 'Catena Zapata',
    region: 'Mendoza',
    varietal: 'Cabernet Sauvignon',
    vintage: 2018,
    rating: 4.9,
    units: 2,
    location: 'Cava Principal · Estante A2',
    bottle: 'red-black',
  },
  {
    name: 'Catena Alta Chardonnay',
    winery: 'Catena Zapata',
    region: 'Tupungato, Mendoza',
    varietal: 'Blancos',
    vintage: 2021,
    rating: 4.4,
    units: 1,
    location: 'Heladera Cava · Nivel 2',
    bottle: 'white',
  },
  {
    name: 'Angélica Zapata Cabernet Franc',
    winery: 'Catena Zapata',
    region: 'Gualtallary, Mendoza',
    varietal: 'Cabernet Franc',
    vintage: 2020,
    rating: 4.6,
    units: 2,
    location: 'Cava Principal · Estante A3',
    bottle: 'red-burgundy',
  },
];

const zuccardiWines: DashboardWine[] = [
  {
    name: 'Finca Piedra Infinita',
    winery: 'Zuccardi',
    region: 'Paraje Altamira, Mendoza',
    varietal: 'Malbec',
    vintage: 2019,
    rating: 4.9,
    units: 3,
    location: 'Cava Principal · Estante B1',
    bottle: 'red-black',
  },
  {
    name: 'Aluvional Paraje Altamira',
    winery: 'Zuccardi',
    region: 'Paraje Altamira, Mendoza',
    varietal: 'Malbec',
    vintage: 2018,
    rating: 4.7,
    units: 1,
    location: 'Cava Principal · Estante B2',
    bottle: 'red-burgundy',
  },
  {
    name: 'Fósil Chardonnay',
    winery: 'Zuccardi',
    region: 'San Pablo, Mendoza',
    varietal: 'Blancos',
    vintage: 2022,
    rating: 4.5,
    units: 2,
    location: 'Heladera Cava · Nivel 1',
    bottle: 'white',
  },
  {
    name: 'Zuccardi Q Cabernet Sauvignon',
    winery: 'Zuccardi',
    region: 'Valle de Uco, Mendoza',
    varietal: 'Cabernet Sauvignon',
    vintage: 2020,
    rating: 4.3,
    units: 2,
    location: 'Departamento · Estante C1',
    bottle: 'red-cream',
  },
];

/**
 * DashboardPage Component
 * Vista principal con estética editorial oscura mate (#0f0f11):
 * - Distribución a 2 columnas preservada intacta.
 * - Tipografía Fraunces semi-bold para encabezados principales.
 * - Fondo carbón profundo mate #0f0f11 y superficies #121214.
 * - Acento bordó sobrio #722F37 y bordes sutiles border-neutral-800.
 */
export default function DashboardPage() {
  const [stockCount, setStockCount] = useState(24);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [uncorkingWine, setUncorkingWine] = useState<DashboardWine | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleUncorkSaved = (data: UncorkSubmission) => {
    setStockCount((prev) => Math.max(0, prev - 1));
    showNotification(`¡Descorche registrado! ${data.wine.name} calificado con ${data.rating} estrellas.`);
  };

  const handleAddToCellar = (wine: DashboardWine) => {
    setStockCount((prev) => prev + 1);
    showNotification(`"${wine.name}" fue agregado con éxito a tu Cava.`);
  };

  // Filtrado reactivo de vinos por chip y buscador
  const filterWineList = useCallback(
    (list: DashboardWine[]) => {
      return list.filter((wine) => {
        const matchesSearch =
          searchQuery === '' ||
          wine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wine.winery.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wine.varietal.toLowerCase().includes(searchQuery.toLowerCase()) ||
          wine.region.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeFilter === 'Todos') return true;
        if (activeFilter === 'Blancos')
          return (
            wine.varietal.toLowerCase().includes('blanco') ||
            wine.varietal.toLowerCase().includes('chardonnay') ||
            wine.varietal.toLowerCase().includes('torrontés')
          );
        if (activeFilter === 'Espumantes')
          return wine.varietal.toLowerCase().includes('espumante') || wine.bottle === 'sparkling';
        if (activeFilter === 'Malbec') return wine.varietal.toLowerCase().includes('malbec');
        if (activeFilter === 'Cabernet Sauvignon')
          return wine.varietal.toLowerCase().includes('cabernet');
        if (activeFilter === 'Mendoza') return wine.region.toLowerCase().includes('mendoza');
        if (activeFilter === 'Salta') return wine.region.toLowerCase().includes('salta');
        if (activeFilter === 'Patagonia')
          return (
            wine.region.toLowerCase().includes('río negro') ||
            wine.region.toLowerCase().includes('patagonia')
          );

        return true;
      });
    },
    [activeFilter, searchQuery],
  );

  const filteredCatena = useMemo(() => filterWineList(catenaWines), [filterWineList]);
  const filteredZuccardi = useMemo(() => filterWineList(zuccardiWines), [filterWineList]);

  return (
    <div className="min-h-screen bg-[#0f0f11] text-neutral-200 font-sans selection:bg-[#722F37] selection:text-white flex flex-col justify-between">
      
      {/* Toast de Notificación Flotante */}
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#161619] text-neutral-100 px-5 py-3.5 shadow-2xl animate-in slide-in-from-bottom-5 duration-200"
        >
          <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
          <p className="text-xs font-medium font-sans">{notification}</p>
        </aside>
      )}

      {/* 1. Navbar Superior */}
      <DashboardNavbar stockCount={stockCount} />

      {/* 2. Hero Principal (Distribución a Dos Columnas con Buscador Integrado) */}
      <QuickActions
        onSearch={(query) => setSearchQuery(query)}
        onRegisterBottle={() =>
          showNotification('Función de registro rápido abierta. Seleccioná una etiqueta del catálogo.')
        }
        onSelectSpotlightWine={(wineName) => {
          setSearchQuery(wineName);
          showNotification(`Filtrando catálogo por "${wineName}".`);
          const catalogEl = document.getElementById('catalogo');
          catalogEl?.scrollIntoView({ behavior: 'smooth' });
        }}
        onUncorkSpotlight={(wine) => setUncorkingWine(wine)}
      />

      {/* 3. Cinta Compacta de Métricas y KPIs */}
      <section
        aria-label="Cinta de Métricas de Cava"
        className="relative -mt-6 sm:-mt-8 z-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <Metrics
          customStats={{
            bottles: stockCount,
            readyToDrink: 3,
            dominantVarietal: 'Malbec (58%)',
            topRated: '4.9 / 5.0 ★',
          }}
        />
      </section>

      {/* 4. Contenido Principal */}
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 sm:gap-24 px-4 sm:px-6 lg:px-8 pb-24 pt-12 sm:pt-16">
        
        {/* Sección de Cava Personal (Inventario Activo) */}
        <DashboardSection
          onUncorkRequested={(wine) => setUncorkingWine(wine)}
          onAddBottleRequested={() => {
            const catalogEl = document.getElementById('catalogo');
            catalogEl?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Bloques Bento Grid: Guarda y Maridaje */}
        <section id="maridaje" aria-label="Recomendaciones y Maridajes">
          <PromoBlocks />
        </section>

        {/* Sección de Catálogo Oficial por Bodegas */}
        <section id="catalogo" aria-labelledby="catalog-title" className="flex flex-col gap-12 sm:gap-16">
          
          <div className="flex flex-col items-center gap-6 text-center">
            <SectionHeading
              id="catalog-title"
              align="center"
              eyebrow="CATÁLOGO EXCLUSIVO"
              title="Explorá por bodegas"
              description="Etiquetas oficiales y aportes certificados de la comunidad, organizadas por productor y región."
            />

            {/* Chips de Filtros Rápidos */}
            <FilterChips
              activeChip={activeFilter}
              onSelectChip={(chip) => setActiveFilter(chip)}
            />
          </div>

          {/* Grillas por Bodega */}
          <div className="flex flex-col gap-14">
            {filteredCatena.length > 0 && (
              <WineryBlock
                name="Bodega Catena Zapata"
                region="Mendoza, Argentina"
                initials="CZ"
                total={12}
                wines={filteredCatena}
                onAddToCellar={handleAddToCellar}
                onToggleFavorite={(wine, isFav) =>
                  showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                }
              />
            )}

            {filteredZuccardi.length > 0 && (
              <WineryBlock
                name="Bodega Zuccardi"
                region="Valle de Uco, Mendoza"
                initials="Z"
                total={10}
                wines={filteredZuccardi}
                onAddToCellar={handleAddToCellar}
                onToggleFavorite={(wine, isFav) =>
                  showNotification(`${wine.name} ${isFav ? 'añadido a tus Deseados' : 'removido de Deseados'}.`)
                }
              />
            )}

            {filteredCatena.length === 0 && filteredZuccardi.length === 0 && (
              <div className="rounded-xl border border-neutral-800 bg-[#121214] p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <Wine className="h-8 w-8 text-neutral-500" />
                <h4 className="font-serif text-xl font-semibold text-neutral-100">
                  No se encontraron etiquetas
                </h4>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-sm">
                  Probá ajustando los filtros o el término de búsqueda para ver más bodegas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter('Todos');
                    setSearchQuery('');
                  }}
                  className="mt-2 rounded-md border border-neutral-800 bg-neutral-900 hover:border-neutral-700 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer"
                >
                  Restablecer filtros
                </button>
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Modal Profesional de Descorche y Ficha Técnica */}
      <UncorkDialog
        wine={uncorkingWine}
        onClose={() => setUncorkingWine(null)}
        onSave={handleUncorkSaved}
      />

      {/* 5. Footer Editorial */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-8 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300">
              <Wine className="h-3 w-3" />
            </div>
            <span className="font-serif text-base font-semibold text-neutral-200">
              MiCava
            </span>
          </div>

          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-neutral-500 text-center sm:text-right">
            Beber con moderación · Prohibida su venta a menores de 18 años
          </span>
        </div>
      </footer>

    </div>
  );
}
