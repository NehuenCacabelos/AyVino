import { useState, useEffect } from 'react';
import { UtensilsCrossed, AlertCircle } from 'lucide-react';
import { getWinePairings } from '../api/wineryWinePairingsApi';
import type { WineryWinePairingDto } from '../types/catalog';

export interface WineryWinePairingsListProps {
  wineId: number;
}

export default function WineryWinePairingsList({ wineId }: WineryWinePairingsListProps) {
  const [pairings, setPairings] = useState<WineryWinePairingDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    getWinePairings(wineId)
      .then((data) => {
        if (!isCancelled) {
          setPairings(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          const msg =
            err instanceof Error ? err.message : 'Error al cargar los maridajes.';
          setError(msg);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [wineId]);

  if (isLoading) {
    return (
      <div className="bg-[#121015] rounded-2xl border border-white/5 p-6 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-white/5 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
          <div className="h-16 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#121015] rounded-2xl border border-white/5 p-6 flex items-center gap-3 text-xs text-rose-300">
        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
        <span>No se pudieron consultar los maridajes asociados: {error}</span>
      </div>
    );
  }

  return (
    <section className="bg-[#121015] rounded-2xl border border-white/5 p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="w-4 h-4 text-rose-400" />
        <h3 className="font-serif text-lg font-semibold text-zinc-100">
          Maridajes recomendados
        </h3>
      </div>

      {pairings.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl bg-[#0a0a0c] border border-white/5 space-y-2">
          <UtensilsCrossed className="w-6 h-6 text-neutral-600 mx-auto" />
          <p className="text-sm font-medium text-neutral-300">
            Todavía no tiene maridajes asociados
          </p>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Los maridajes y sugerencias gastronómicas para esta etiqueta estarán disponibles próximamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pairings.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-xl bg-[#0a0a0c] border border-white/5 flex flex-col justify-between gap-2"
            >
              <span className="font-medium text-sm text-zinc-200">{p.name}</span>
              <span className="self-start px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-400">
                {p.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
