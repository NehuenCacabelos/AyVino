import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wine,
  AlertCircle,
  Star,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  useWinery,
  getClaimCandidates,
  claimWines,
  type WineResponseDto,
} from '../features/winery';

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
 * WineryClaimPage Component (/bodega/reclamar)
 * Permite a la bodega oficial adoptar y certificar etiquetas cargadas previamente por aficionados,
 * transfiriendo su titularidad técnica oficial sin alterar las notas de cata y calificaciones históricas.
 */
export default function WineryClaimPage() {
  const { winery } = useWinery();
  const isApproved = winery?.status === 'Approved';

  const [candidates, setCandidates] = useState<WineResponseDto[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(
    () => Boolean(winery?.id && winery?.status === 'Approved'),
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!winery?.id || winery.status !== 'Approved') return;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoading(true);
      try {
        const data = await getClaimCandidates(winery.id);
        if (!isMounted) return;
        setCandidates(data);
      } catch (err: unknown) {
        console.error('Error al cargar candidatos de reclamo:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [winery?.id, winery?.status]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === candidates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(candidates.map((c) => c.id));
    }
  };

  const handleClaim = async () => {
    if (!winery?.id || selectedIds.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await claimWines(winery.id, { wineIds: selectedIds });
      const claimedCount = selectedIds.length;
      setSuccessMessage(
        `¡Excelente! Se ${
          claimedCount === 1 ? 'certificó 1 vino' : `certificaron ${claimedCount} vinos`
        } para tu bodega. Ya figuran en tu catálogo oficial.`,
      );

      // Remover los reclamados de la lista de candidatos
      setCandidates((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (err: unknown) {
      let detail: string | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }
      setErrorMessage(
        detail ?? 'Ocurrió un error al procesar el reclamo de los vinos seleccionados.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Encabezado Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Adopción y Certificación
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1 text-neutral-100 tracking-tight">
            Reclamo de Vinos Comunitarios
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed max-w-2xl">
            Asumí la titularidad oficial de botellas subidas previamente por aficionados que
            coinciden con el nombre de tu bodega, preservando intacto el historial de reseñas y catas.
          </p>
        </div>

        {isApproved && candidates.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white cursor-pointer transition-colors"
            >
              {selectedIds.length === candidates.length ? 'Desmarcar todos' : 'Seleccionar todos'}
            </button>

            <button
              type="button"
              onClick={handleClaim}
              disabled={selectedIds.length === 0 || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-rose-200/30 border-t-rose-100 rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Reclamar ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Alertas */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs font-sans shadow-lg animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs font-sans shadow-lg animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Estado si la bodega aún NO está aprobada */}
      {!isApproved ? (
        <div className="rounded-2xl bg-[#141416] border border-white/5 p-10 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-amber-300 mx-auto flex items-center justify-center shadow-sm">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-neutral-100">
              Función disponible al certificar tu cuenta
            </h2>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Para reclamar y oficializar botellas comunitarias, tu bodega debe encontrarse en estado{' '}
              <strong className="text-amber-200 font-medium">Oficial</strong>. El equipo de sommeliers
              de AyVino está verificando tu solicitud.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/bodega/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-neutral-200 border border-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <span>Volver al Dashboard</span>
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-[#141416] border border-white/5 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl bg-[#141416] border border-white/5 p-12 text-center shadow-xl space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-stone-900 border border-white/10 text-neutral-400 mx-auto flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif text-xl font-semibold text-neutral-100">
              No hay botellas pendientes de reclamo
            </h2>
            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              No encontramos etiquetas comunitarias huérfanas que coincidan con el nombre de{' '}
              <strong className="text-neutral-200">{winery?.name}</strong>. Podés dar de alta nuevas
              etiquetas oficiales desde tu catálogo.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/bodega/vinos"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              <Wine className="w-4 h-4" />
              <span>Ir a Mis Vinos</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Listado de Candidatos */
        <div className="space-y-3.5">
          {candidates.map((candidate) => {
            const isSelected = selectedIds.includes(candidate.id);
            const badge = getWineTypeBadge(
              typeof candidate.wineType === 'string' ? candidate.wineType : undefined,
            );

            return (
              <div
                key={candidate.id}
                onClick={() => handleToggleSelect(candidate.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#18181c] border-rose-800/60 shadow-lg shadow-black/40'
                    : 'bg-[#141416] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-neutral-400">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-600" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        Cargado por aficionado
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-neutral-100">
                      {candidate.name}
                    </h3>

                    {candidate.description && (
                      <p className="text-xs text-neutral-400 font-sans line-clamp-1">
                        {candidate.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Métricas Comunitarias Conservadas */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-amber-200 font-mono">
                    <Star className="w-3.5 h-3.5 fill-amber-300/30 text-amber-300" />
                    <span className="font-semibold">
                      {candidate.averageRating ? candidate.averageRating.toFixed(1) : '—'}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      ({candidate.reviewCount} catas)
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded">
                    Reseñas intactas
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

