import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Globe,
  ShieldCheck,
  Users,
  Wine as WineIcon,
  Compass,
  ArrowLeft,
  Check,
  UserPlus,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../features/auth';
import {
  getWineryById,
  getWineryFollowers,
  followWinery,
  unfollowWinery,
  getWines,
  getLocationById,
  WineryLogo,
  type WineryResponseDto,
  type WineResponseDto,
  type LocationResponseDto,
} from '../features/winery';
import { WineCard, WineDetailModal } from '../features/wines';
import { mapApiWineToCuratedWine } from '../features/wines/utils/wineMapper';
import type { CuratedWine, WineApiDto } from '../types/wine';

/**
 * WineryPublicProfilePage Component (/bodegas/:id)
 * Vidriera pública oficial de la bodega: exhibe el terruño, historia, botón para seguir
 * y el catálogo de etiquetas oficiales con apertura a ficha técnica interactiva.
 */
export default function WineryPublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const wineryId = Number(id);

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [winery, setWinery] = useState<WineryResponseDto | null>(null);
  const [locationData, setLocationData] = useState<LocationResponseDto | null>(null);
  const [wines, setWines] = useState<WineResponseDto[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(() => !isNaN(wineryId));
  const [isNotFound, setIsNotFound] = useState<boolean>(() => isNaN(wineryId));
  const [isFollowingAction, setIsFollowingAction] = useState<boolean>(false);

  // Modal de Detalle
  const [selectedWine, setSelectedWine] = useState<CuratedWine | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isNaN(wineryId)) return;

    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const [wineryRes, winesRes] = await Promise.all([
          getWineryById(wineryId),
          getWines({ wineryId, pageSize: 100 }),
        ]);

        if (!isMounted) return;
        setWinery(wineryRes);
        setWines(winesRes);

        // Cargar ubicación
        if (wineryRes.locationId) {
          try {
            const loc = await getLocationById(wineryRes.locationId);
            if (isMounted) setLocationData(loc);
          } catch {
            // Ignorar
          }
        }

        // Cargar followers si está aprobada
        if (wineryRes.status === 'Approved') {
          try {
            const followers = await getWineryFollowers(wineryId, { pageSize: 100 });
            if (isMounted) {
              setFollowersCount(followers.length);
              if (user) {
                const userFollows = followers.some((f) => f.userId === user.id);
                setIsFollowing(userFollows);
              }
            }
          } catch {
            // Ignorar
          }
        }
      } catch {
        if (!isMounted) return;
        setIsNotFound(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [wineryId, user]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!winery || isFollowingAction) return;
    setIsFollowingAction(true);

    try {
      if (isFollowing) {
        await unfollowWinery(winery.id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await followWinery(winery.id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error al seguir/dejar de seguir a la bodega:', err);
    } finally {
      setIsFollowingAction(false);
    }
  };

  const handleWineCardSelect = (wine: WineResponseDto) => {
    const locName = locationData
      ? `${locationData.cityName}, ${locationData.stateName}`
      : 'Argentina';

    const apiWine: WineApiDto = {
      id: wine.id,
      name: wine.name,
      wineryId: wine.wineryId,
      wineryNameText: winery?.name ?? null,
      description: wine.description,
      wineType: typeof wine.wineType === 'string' ? wine.wineType : 'Red',
      locationId: wine.locationId,
      sourceType: wine.sourceType,
      duplicateOfWineId: wine.duplicateOfWineId,
      averageRating: wine.averageRating,
      reviewCount: wine.reviewCount,
    };

    const curated = mapApiWineToCuratedWine(apiWine, null, locName);
    setSelectedWine(curated);
  };

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans flex flex-col justify-between">
        <Navbar />
        <div className="max-w-md mx-auto text-center px-4 py-28 space-y-4">
          <Building2 className="w-12 h-12 text-neutral-600 mx-auto" />
          <h1 className="font-serif text-3xl font-semibold text-neutral-100">
            Bodega no encontrada
          </h1>
          <p className="text-sm text-neutral-400 font-sans leading-relaxed">
            El perfil de la bodega que estás buscando no existe o fue dado de baja del catálogo oficial.
          </p>
          <div className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Explorar catálogo</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !winery) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-neutral-800 border-t-[#6b1d28] rounded-full animate-spin" />
      </div>
    );
  }

  const locationLabel = winery.location
    ? `${winery.location.regionName}, ${winery.location.stateName}`
    : locationData
      ? `${locationData.cityName}, ${locationData.stateName}`
      : 'Argentina';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-neutral-100 font-sans selection:bg-[#6b1d28] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
        {/* Enlace de Retorno */}
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        {/* Cabecera Editorial de la Bodega */}
        <section className="relative rounded-3xl bg-[#141416] border border-white/5 p-8 sm:p-12 shadow-2xl overflow-hidden">
          {/* Textura de fondo sutil */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.04] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]"
          />

          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
            {/* Identidad con Logo Oficial */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <WineryLogo
                src={winery.logoUrl}
                name={winery.name}
                size="xl"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl shrink-0"
              />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-neutral-100 tracking-tight">
                    {winery.name}
                  </h1>

                  {winery.status === 'Approved' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Bodega Oficial</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-sans">
                  <span className="flex items-center gap-1.5 text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{locationLabel}</span>
                  </span>

                  {winery.foundationYear && (
                    <span className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                      <span>Fundada en {winery.foundationYear}</span>
                    </span>
                  )}

                  {winery.website && (
                    <a
                      href={
                        /^https?:\/\//i.test(winery.website)
                          ? winery.website
                          : `https://${winery.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-rose-300/90 hover:text-rose-200 underline transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Sitio web oficial</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Botón de Seguir / Seguidores */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={isFollowingAction}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                  isFollowing
                    ? 'bg-stone-900 border border-white/10 text-neutral-200 hover:bg-stone-800'
                    : 'bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Siguiendo</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Seguir bodega</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {followersCount} {followersCount === 1 ? 'seguidor' : 'seguidores'}
                </span>
              </div>
            </div>
          </div>

          {/* Semblanza Histórica y Filosofía */}
          {winery.description && (
            <div className="relative z-10 mt-8 pt-6 border-t border-white/5 space-y-2 max-w-4xl">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold block">
                Filosofía y Terruño
              </span>
              <p className="text-sm text-neutral-300 font-sans leading-relaxed whitespace-pre-line">
                {winery.description}
              </p>
            </div>
          )}
        </section>

        {/* Catálogo de Etiquetas Oficiales */}
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-neutral-100 tracking-tight">
                Vinos de {winery.name}
              </h2>
              <p className="text-xs text-neutral-400 mt-1 font-sans">
                Etiquetas oficiales certificadas por el establecimiento.
              </p>
            </div>

            <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
              {wines.length} {wines.length === 1 ? 'etiqueta' : 'etiquetas'}
            </span>
          </div>

          {wines.length === 0 ? (
            <div className="rounded-2xl bg-[#141416] border border-white/5 p-12 text-center space-y-3">
              <WineIcon className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm font-sans text-neutral-400">
                Esta bodega aún no ha publicado etiquetas en su catálogo oficial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {wines.map((wine) => {
                const apiWine: WineApiDto = {
                  id: wine.id,
                  name: wine.name,
                  wineryId: wine.wineryId,
                  wineryNameText: winery.name,
                  description: wine.description,
                  wineType: typeof wine.wineType === 'string' ? wine.wineType : 'Red',
                  locationId: wine.locationId,
                  sourceType: wine.sourceType,
                  duplicateOfWineId: wine.duplicateOfWineId,
                  averageRating: wine.averageRating,
                  reviewCount: wine.reviewCount,
                };

                const curated = mapApiWineToCuratedWine(apiWine, null, locationLabel);

                return (
                  <WineCard
                    key={wine.id}
                    wine={curated}
                    onSelect={() => handleWineCardSelect(wine)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal de Ficha Técnica */}
      <WineDetailModal wine={selectedWine} onClose={() => setSelectedWine(null)} />

      {/* Footer Minimalista */}
      <footer className="border-t border-neutral-800 bg-[#0c0c0e] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-neutral-500" />
            <span className="font-serif text-sm text-neutral-300">{winery.name}</span>
            <span className="text-xs text-neutral-600">·</span>
            <span className="text-xs text-neutral-500 font-mono">Ficha Oficial AyVino</span>
          </div>
          <p className="text-xs text-neutral-500 font-mono">
            © {new Date().getFullYear()} — Plataforma vitivinícola argentina.
          </p>
        </div>
      </footer>
    </div>
  );
}

