import { useState } from 'react';
import { BookOpen, ArrowRight, Star, X } from 'lucide-react';
import type { TastingLogEntry } from '../types';
import { imageUrl } from '../../../lib/image';
import WineBottleSilhouette from '../../wines/components/WineBottleSilhouette';

interface VaultLogbookModuleProps {
  entries: TastingLogEntry[];
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export default function VaultLogbookModule({
  entries,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: VaultLogbookModuleProps) {
  const [showAllModal, setShowAllModal] = useState(false);

  if (!entries || entries.length === 0) {
    return null;
  }

  const latest = entries[0];
  const latestImageSrc = latest.personalImageId
    ? imageUrl(latest.personalImageId, 'bottle')
    : latest.vintageImageId
    ? imageUrl(latest.vintageImageId, 'bottle')
    : null;

  return (
    <>
      <section className="bg-[#0c0c0e] border border-neutral-800/80 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#fbbf24]" />
              <span className="font-mono text-[11px] text-[#fbbf24] tracking-widest uppercase">
                Historial de Descorches
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl text-neutral-100 font-medium mt-0.5">
              Última Reseña de Cata
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAllModal(true)}
            className="text-[#fbbf24] hover:text-[#fde68a] font-sans font-semibold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto py-1 cursor-pointer"
          >
            <span>Ver {entries.length} notas registradas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Featured Latest Tasting Note */}
        <div className="bg-[#121216] border border-neutral-800/80 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-12 h-16 sm:w-14 sm:h-20 shrink-0 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center overflow-hidden">
            {latestImageSrc ? (
              <img
                src={latestImageSrc}
                alt={latest.wineName}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <WineBottleSilhouette className="w-6 h-12 text-neutral-600" />
            )}
          </div>

          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-neutral-800/50 pb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-lg sm:text-xl text-neutral-100 font-medium">
                  {latest.wineName} {latest.vintageYear != null ? latest.vintageYear : ''}
                </span>
                {latest.wineryName && (
                  <span className="text-xs text-neutral-400 font-sans">
                    · {latest.wineryName}
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] text-neutral-400">
                {latest.uncorkDate}
              </span>
            </div>

            {latest.ratingValue != null && latest.ratingValue > 0 && (
              <div
                aria-label={`Puntaje: ${latest.ratingValue} de 5 estrellas`}
                className="flex items-center gap-1 text-amber-400"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < latest.ratingValue!
                        ? 'fill-current text-amber-400'
                        : 'text-neutral-700'
                    }`}
                  />
                ))}
              </div>
            )}

            {latest.notes ? (
              <p className="text-xs sm:text-sm text-neutral-300 font-sans italic leading-relaxed">
                &ldquo;{latest.notes}&rdquo;
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Modal / Sheet for viewing all logbook entries */}
      {showAllModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="bg-[#121216] border border-neutral-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#fbbf24]" />
                <h3 className="font-serif text-xl text-neutral-100 font-semibold">
                  Bitácora de Catas &amp; Descorches ({entries.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Cerrar bitácora"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto divide-y divide-neutral-800/80">
              {entries.map((entry) => {
                const entryImageSrc = entry.personalImageId
                  ? imageUrl(entry.personalImageId, 'bottle')
                  : entry.vintageImageId
                  ? imageUrl(entry.vintageImageId, 'bottle')
                  : null;

                return (
                  <div key={entry.id} className="pt-4 first:pt-0 flex gap-4 items-start">
                    <div className="w-12 h-16 shrink-0 bg-neutral-900 border border-neutral-800 rounded flex items-center justify-center overflow-hidden">
                      {entryImageSrc ? (
                        <img
                          src={entryImageSrc}
                          alt={entry.wineName}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <WineBottleSilhouette className="w-5 h-10 text-neutral-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif text-base sm:text-lg text-neutral-100 font-medium">
                            {entry.wineName} {entry.vintageYear != null ? entry.vintageYear : ''}
                          </span>
                          {entry.wineryName && (
                            <span className="text-xs text-neutral-400 font-sans">
                              · {entry.wineryName}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-neutral-400">
                          {entry.uncorkDate}
                        </span>
                      </div>

                      {entry.ratingValue != null && entry.ratingValue > 0 && (
                        <div
                          aria-label={`Puntaje: ${entry.ratingValue} de 5 estrellas`}
                          className="flex items-center gap-1 text-amber-400"
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < entry.ratingValue!
                                  ? 'fill-current text-amber-400'
                                  : 'text-neutral-700'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {entry.notes ? (
                        <p className="text-xs sm:text-sm text-neutral-300 font-sans italic leading-relaxed">
                          &ldquo;{entry.notes}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="p-3 border-t border-neutral-800/80 bg-[#0e0e11] flex justify-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  disabled={isLoadingMore}
                  className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isLoadingMore ? 'Cargando más...' : 'Cargar más notas'}
                </button>
              </div>
            )}

            <div className="p-4 border-t border-neutral-800 bg-[#0c0c0e] flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
