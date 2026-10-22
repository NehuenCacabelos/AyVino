import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wine,
  Plus,
  Search,
  Star,
  Layers,
  Sparkles,
  Filter,
} from 'lucide-react';
import {
  useWinery,
  getWines,
  WineCreateModal,
  WineVintagesModal,
  type WineResponseDto,
  type WineType,
} from '../features/winery';

type FilterType = 'All' | WineType;

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'All', label: 'Todas las etiquetas' },
  { id: 'Red', label: 'Tintos' },
  { id: 'White', label: 'Blancos' },
  { id: 'Rose', label: 'Rosados' },
  { id: 'Sparkling', label: 'Espumosos' },
  { id: 'Orange', label: 'Naranjos' },
];

function getWineTypeBadge(type?: string): { label: string; className: string } {
  switch (type?.toLowerCase()) {
    case 'red':
      return { label: 'Tinto', className: 'bg-rose-950/40 text-rose-300 border-rose-900/40' };
    case 'white':
      return { label: 'Blanco', className: 'bg-amber-950/30 text-amber-200 border-amber-900/40' };
    case 'rose':
      return { label: 'Rosado', className: 'bg-pink-950/30 text-pink-300 border-pink-900/40' };
    case 'sparkling':
      return {
        label: 'Espumoso',
        className: 'bg-yellow-950/30 text-yellow-200 border-yellow-900/40',
      };
    case 'orange':
      return {
        label: 'Naranjo',
        className: 'bg-orange-950/30 text-orange-300 border-orange-900/40',
      };
    default:
      return { label: type || 'Vino', className: 'bg-stone-900 text-neutral-300 border-white/10' };
  }
}

/**
 * WineryWinesPage Component (/bodega/vinos)
 * Gestión integral del catálogo de etiquetas y cosechas oficiales de la bodega.
 */
export default function WineryWinesPage() {
  const { winery } = useWinery();
  const [searchParams, setSearchParams] = useSearchParams();

  const [wines, setWines] = useState<WineResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(winery?.id));

  // Filtros y Búsqueda
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<FilterType>('All');

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(
    () => searchParams.get('action') === 'new' || searchParams.get('nuevo') === '1',
  );
  const [selectedWineForVintages, setSelectedWineForVintages] = useState<WineResponseDto | null>(
    null,
  );

  // Cargar vinos al montar o cambiar de bodega
  useEffect(() => {
    let isMounted = true;
    if (!winery?.id) return;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const data = await getWines({ wineryId: winery.id, pageSize: 100 });
        if (!isMounted) return;
        setWines(data);
      } catch (err) {
        console.error('Error al cargar vinos de la bodega:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [winery?.id]);

  // Si la URL contiene ?action=new o ?nuevo=1 tras navegación, abrir modal
  useEffect(() => {
    if (searchParams.get('action') === 'new' || searchParams.get('nuevo') === '1') {
      Promise.resolve().then(() => {
        setIsCreateModalOpen(true);
      });
      searchParams.delete('action');
      searchParams.delete('nuevo');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleWineCreated = (newWine: WineResponseDto) => {
    setWines((prev) => [newWine, ...prev]);
  };

  // Filtrado reactivo en memoria
  const filteredWines = useMemo(() => {
    return wines.filter((wine) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        wine.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (wine.description &&
          wine.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesType =
        selectedType === 'All' ||
        (typeof wine.wineType === 'string' &&
          wine.wineType.toLowerCase() === selectedType.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [wines, searchQuery, selectedType]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Encabezado Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Portfolio Oficial de Cosechas
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1 text-neutral-100 tracking-tight">
            Catálogo de Etiquetas
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed">
            Administrá tus botellas oficiales, cortes varietales y añadas habilitadas para catas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva etiqueta</span>
        </button>
      </div>

      {/* Barra de Filtros y Buscador */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="h-11 w-full rounded-xl pl-10 pr-4 text-xs font-sans bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 border border-zinc-800/80 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* Chips de Categoría */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-neutral-500 mr-1 hidden sm:inline-block" />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelectedType(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                selectedType === opt.id
                  ? 'bg-rose-950/50 text-rose-200 border border-rose-800/50 font-semibold'
                  : 'bg-stone-900/40 text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grilla de Etiquetas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-[#141416] border border-white/5 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : filteredWines.length === 0 ? (
        /* Empty States */
        wines.length === 0 ? (
          <div className="rounded-2xl bg-[#141416] border border-white/5 p-12 text-center shadow-xl space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-white/10 text-rose-300 mx-auto flex items-center justify-center shadow-sm">
              <Wine className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-xl font-semibold text-neutral-100">
                Tu catálogo aún está vacío
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Comenzá publicando tu primera etiqueta con su corte de uvas inaugural para que
                sommeliers y amantes del vino puedan valorarla en la plataforma.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Cargar primera etiqueta</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#141416] border border-white/5 p-10 text-center space-y-3">
            <p className="text-sm font-sans text-neutral-400">
              No se encontraron etiquetas con los filtros seleccionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedType('All');
              }}
              className="text-xs font-mono uppercase tracking-wider text-rose-300 hover:text-rose-200 underline cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )
      ) : (
        /* Listado de Vinos */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWines.map((wine) => {
            const badge = getWineTypeBadge(
              typeof wine.wineType === 'string' ? wine.wineType : undefined,
            );
            return (
              <div
                key={wine.id}
                className="rounded-2xl bg-[#141416] border border-white/5 p-6 flex flex-col justify-between hover:border-white/10 transition-all shadow-lg group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Categoría + Calificación */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${badge.className}`}
                    >
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1 text-xs text-amber-200 font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-300/30 text-amber-300" />
                      <span className="font-semibold">
                        {wine.averageRating ? wine.averageRating.toFixed(1) : '—'}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        ({wine.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Nombre y Descripción */}
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-neutral-100 group-hover:text-rose-200 transition-colors line-clamp-1">
                      {wine.name}
                    </h3>
                    {wine.description && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2 font-sans leading-relaxed">
                        {wine.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones y Añadas */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300/70" />
                    <span>Oficial</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedWineForVintages(wine)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-300" />
                    <span>Añadas</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Alta de Etiqueta */}
      {winery && (
        <WineCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          wineryId={winery.id}
          locationId={winery.locationId}
          onWineCreated={handleWineCreated}
        />
      )}

      {/* Modal de Gestión de Añadas */}
      <WineVintagesModal
        isOpen={Boolean(selectedWineForVintages)}
        onClose={() => setSelectedWineForVintages(null)}
        wine={selectedWineForVintages}
      />
    </div>
  );
}
