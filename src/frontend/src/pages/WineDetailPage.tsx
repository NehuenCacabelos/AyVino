import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wine } from 'lucide-react';
import { getEditorialWine, WineDetailView, useRealWine } from '../features/wines';

export default function WineDetailPage() {
  const { id } = useParams<{ id: string }>();

  const isNumeric = Boolean(id && /^\d+$/.test(id.trim()));

  // 1.1: Si el id es numérico, cargar vino real desde la API
  const {
    wine: realWine,
    rawWine,
    rawVintages,
    isLoading,
    isNotFound,
    error,
    reload,
    reloadReviews,
  } = useRealWine(isNumeric ? id : undefined);

  // 1.1: Si no es numérico, resolver maqueta editorial existente
  const editorialWine = useMemo(() => {
    if (isNumeric) return null;
    return getEditorialWine(id || 'gran-enemigo-single-vineyard-gualtallary');
  }, [id, isNumeric]);

  if (isNumeric) {
    if (isLoading) {
      return (
        <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] flex items-center justify-center pt-24 pb-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Cargando etiqueta enológica...
            </span>
          </div>
        </main>
      );
    }

    if (isNotFound || error || !realWine) {
      return (
        <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] flex items-center justify-center pt-24 pb-20 px-6">
          <div className="max-w-md w-full bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-8 text-center space-y-4 shadow-xl">
            <Wine className="w-10 h-10 text-rose-400 mx-auto stroke-[1.25]" />
            <h2 className="font-serif text-2xl text-neutral-100 font-bold">
              Etiqueta no encontrada
            </h2>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              La etiqueta solicitada no existe o no se encuentra disponible en este momento.
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard#catalogo"
                className="inline-flex items-center gap-2 h-10 px-5 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50"
              >
                ← Volver a explorar
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <WineDetailView
        wine={realWine}
        reviews={realWine.reviews}
        isRealWine={true}
        rawWine={rawWine}
        rawVintages={rawVintages}
        onReload={reload}
        onReviewPublished={reloadReviews}
      />
    );
  }

  // Vino editorial maqueta (id no numérico)
  return (
    <WineDetailView
      wine={editorialWine!}
      reviews={editorialWine!.reviews}
      isRealWine={false}
    />
  );
}
