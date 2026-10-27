import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Plus,
  Edit,
  ShieldCheck,
  Users,
  AlertCircle,
  Wine,
} from 'lucide-react';
import {
  useWinery,
  useWineryCatalog,
  WineVintagesModal,
  WineryVintageCard,
  WineryWinePairingsList,
  WineryCatalogBottleSilhouette,
  type WineResponseDto,
  type WineType,
} from '../features/winery';
import WineEditModal from '../features/winery/components/WineEditModal';

function getWineTypeSpanish(type?: string | null): string {
  switch (type?.toLowerCase()) {
    case 'red':
      return 'Tinto';
    case 'white':
      return 'Blanco';
    case 'rose':
      return 'Rosado';
    case 'sparkling':
      return 'Espumoso';
    case 'orange':
      return 'Naranjo';
    default:
      return type || 'Vino';
  }
}

export default function WineryWineDetailPage() {
  const { wineId } = useParams<{ wineId: string }>();
  const { winery } = useWinery();
  const { catalog, isLoading, reload } = useWineryCatalog();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVintagesModalOpen, setIsVintagesModalOpen] = useState(false);

  const numericWineId = Number(wineId);
  const wine = catalog?.wines.find((w) => w.id === numericWineId);

  // Modal de añadas espera un WineResponseDto
  const mappedWineForVintages: WineResponseDto | null = wine && winery ? {
    id: wine.id,
    wineryId: winery.id,
    wineryNameText: winery.name,
    name: wine.name,
    description: wine.description ?? null,
    wineType: wine.wineType as WineType,
    locationId: winery.locationId ?? null,
    sourceType: wine.sourceType,
    duplicateOfWineId: null,
    averageRating: wine.averageRating ?? null,
    reviewCount: wine.reviewCount,
  } : null;

  if (isLoading && !catalog) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-white/5 rounded" />
        <div className="h-56 bg-[#121015] rounded-2xl border border-white/5" />
        <div className="h-64 bg-[#121015] rounded-2xl border border-white/5" />
      </div>
    );
  }

  // 404 Amable: vino no encontrado o no pertenece a la bodega
  if (!wine) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#121015] border border-white/5 space-y-4 shadow-sm animate-in fade-in">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-neutral-400 w-fit mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-400" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            Etiqueta no encontrada
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            La etiqueta solicitada no existe o no forma parte del catálogo de tu bodega.
          </p>
        </div>
        <Link
          to="/bodega/vinos"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-semibold uppercase tracking-wider text-white transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo</span>
        </Link>
      </div>
    );
  }

  // Imagen de portada: la añada más reciente con foto
  const vintageWithImage = wine.vintages.find((v) => Boolean(v.imageUrl));
  const coverImage = vintageWithImage?.imageUrl;
  const wineTypeLabel = getWineTypeSpanish(wine.wineType);
  const isOfficial = wine.sourceType?.toLowerCase() === 'official';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Enlace Volver al Catálogo */}
      <div>
        <Link
          to="/bodega/vinos"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al catálogo</span>
        </Link>
      </div>

      {/* Cabecera Editorial del Vino */}
      <section className="bg-[#121015] rounded-2xl border border-white/5 p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
        {/* Foto de la Botella */}
        <div className="w-28 h-44 md:w-36 md:h-56 bg-[#0a0a0c] rounded-2xl border border-white/5 flex items-center justify-center p-3 shrink-0 overflow-hidden shadow-inner">
          {coverImage ? (
            <img
              src={coverImage}
              alt={wine.name}
              loading="lazy"
              decoding="async"
              className="max-h-full w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <WineryCatalogBottleSilhouette className="w-12 h-36 text-neutral-600" />
          )}
        </div>

        {/* Información Detallada y Acciones */}
        <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
          {/* Eyebrow con Tipo y Origen */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest bg-rose-950/40 border border-rose-900/40 text-rose-300">
              {wineTypeLabel}
            </span>

            {isOfficial ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/40 text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>Oficial de tu bodega</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-950/40 border border-amber-900/40 text-amber-300">
                <Users className="w-3 h-3" />
                <span>Agregado por la comunidad</span>
              </span>
            )}
          </div>

          {/* Título de la Etiqueta */}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight leading-snug">
            {wine.name}
          </h1>

          {/* Valoración General */}
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs">
            {wine.averageRating != null ? (
              <div className="flex items-center gap-1.5 text-amber-300 font-mono">
                <Star className="w-4 h-4 fill-amber-300" />
                <span className="font-semibold text-sm">
                  {wine.averageRating.toFixed(1)}
                </span>
                <span className="text-neutral-500 font-sans">
                  ({wine.reviewCount} {wine.reviewCount === 1 ? 'reseña' : 'reseñas'})
                </span>
              </div>
            ) : (
              <span className="text-neutral-500 font-mono text-[11px]">
                Sin valoraciones globales registradas
              </span>
            )}
          </div>

          {/* Descripción */}
          {wine.description && (
            <p className="text-xs text-neutral-300 leading-relaxed font-sans max-w-2xl">
              {wine.description}
            </p>
          )}

          {/* Botones de Acción de Cabecera */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-200 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-neutral-400" />
              <span>Editar etiqueta</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVintagesModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-semibold uppercase tracking-wider text-zinc-100 border border-rose-800/40 transition-colors shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar añada</span>
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Cosechas y Añadas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block">
              Registro cronológico
            </span>
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              Añadas y cosechas ({wine.vintages.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsVintagesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>Nueva añada</span>
          </button>
        </div>

        {wine.vintages.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-[#121015] border border-white/5 space-y-3">
            <Wine className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="font-serif text-base font-semibold text-zinc-200">
              No hay cosechas registradas
            </h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Registrá la primera cosecha para que los usuarios puedan conocer la graduación, notas de cata y corte varietal.
            </p>
            <button
              type="button"
              onClick={() => setIsVintagesModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#6e1a24] hover:bg-[#85222e] text-xs font-semibold uppercase tracking-wider text-white transition-colors cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar primera añada</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {wine.vintages.map((vintage) => (
              <WineryVintageCard
                key={vintage.id}
                vintage={vintage}
                wineryStatus={catalog?.wineryStatus}
                onEditVintage={() => setIsVintagesModalOpen(true)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sección de Maridajes Recomendados */}
      <WineryWinePairingsList wineId={numericWineId} />

      {/* Modal de Edición de Etiqueta */}
      {winery?.id && (
        <WineEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          wine={wine}
          wineryId={winery.id}
          locationId={winery.locationId}
          onWineUpdated={() => {
            void reload();
          }}
        />
      )}

      {/* Modal de Añadas Reutilizado */}
      <WineVintagesModal
        isOpen={isVintagesModalOpen}
        onClose={() => setIsVintagesModalOpen(false)}
        wine={mappedWineForVintages}
        onVintageAdded={() => {
          void reload();
        }}
      />
    </div>
  );
}
