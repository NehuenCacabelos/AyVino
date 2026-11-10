import { useState } from 'react';
import { BookOpen, ArrowRight, Star, X } from 'lucide-react';
import type { TastingLogEntry } from '../types';

interface VaultLogbookModuleProps {
  entries: TastingLogEntry[];
}

export default function VaultLogbookModule({ entries }: VaultLogbookModuleProps) {
  const [showAllModal, setShowAllModal] = useState(false);
  const latest = entries[0];

  if (!latest) {
    return null;
  }

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
            className="text-[#fbbf24] hover:text-[#fde68a] font-sans font-semibold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto py-1"
          >
            <span>Ver {entries.length} notas registradas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Featured Latest Tasting Note */}
        <div className="bg-[#121216] border border-neutral-800/80 rounded-lg p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-neutral-800/50">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-serif text-lg sm:text-xl text-neutral-100 font-medium">
                {latest.wineName}
              </span>
              <span className="bg-[#201f25] border border-[#fbbf24]/20 px-2.5 py-0.5 rounded text-[#fbbf24] font-mono text-[11px] font-bold">
                {latest.criticScore}
              </span>
            </div>
            <span className="font-mono text-[11px] text-neutral-400">
              {latest.uncorkDate}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans italic leading-relaxed">
            &ldquo;{latest.notes}&rdquo;
          </p>

          <div className="flex items-center gap-3 text-neutral-400 font-mono text-[10px] sm:text-[11px] pt-1 flex-wrap">
            <span className="text-neutral-300">VISTA: {latest.sight}</span>
            <span>·</span>
            <span className="text-[#fbbf24]">{latest.agingRemaining}</span>
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
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                aria-label="Cerrar bitácora"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto divide-y divide-neutral-800/80">
              {entries.map((entry) => (
                <div key={entry.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-lg text-neutral-100 font-medium">
                        {entry.wineName}
                      </span>
                      <span className="bg-[#201f25] border border-[#fbbf24]/20 px-2 py-0.5 rounded text-[#fbbf24] font-mono text-[11px] font-bold">
                        {entry.criticScore}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      {entry.uncorkDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < entry.ratingValue ? 'fill-current' : 'text-neutral-700'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-300 font-sans italic leading-relaxed">
                    &ldquo;{entry.notes}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 text-neutral-400 font-mono text-[10px] sm:text-[11px]">
                    <span className="text-neutral-300">VISTA: {entry.sight}</span>
                    <span>·</span>
                    <span className="text-[#fbbf24]">{entry.agingRemaining}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-neutral-800 bg-[#0c0c0e] flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
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

