import { useState, useEffect, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  Building2,
  Globe,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  useWinery,
  updateWinery,
  getLocationById,
  LocationCascadeSelect,
  type UpdateWineryRequestDto,
  type LocationResponseDto,
} from '../features/winery';

/**
 * Obtiene las iniciales de la bodega para su monograma en la vista previa.
 */
function getWineryInitials(name?: string): string {
  if (!name) return 'BO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * WineryProfilePage Component (/bodega/perfil)
 * Permite al productor editar la identidad y metadatos de su bodega en tiempo real
 * con previsualización editorial interactiva de la vidriera pública.
 */
export default function WineryProfilePage() {
  const { winery, reload } = useWinery();

  // Estados del formulario inicializados de forma perezosa
  const [name, setName] = useState<string>(() => winery?.name ?? '');
  const [locationId, setLocationId] = useState<number | null>(() => winery?.locationId ?? null);
  const [foundationYear, setFoundationYear] = useState<string>(
    () => winery?.foundationYear?.toString() ?? '',
  );
  const [website, setWebsite] = useState<string>(() => winery?.website ?? '');
  const [description, setDescription] = useState<string>(() => winery?.description ?? '');

  // Estado auxiliar para la previsualización editorial
  const [resolvedLocationName, setResolvedLocationName] = useState<string | null>(null);

  // Estados de validación y feedback
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar formulario si cambia o se hidrata la bodega
  useEffect(() => {
    let isMounted = true;
    if (!winery) return;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      setName(winery.name ?? '');
      setLocationId(winery.locationId ?? null);
      setFoundationYear(winery.foundationYear ? winery.foundationYear.toString() : '');
      setWebsite(winery.website ?? '');
      setDescription(winery.description ?? '');
    });

    return () => {
      isMounted = false;
    };
  }, [winery]);

  // Resolver nombre de ubicación para la vista previa
  useEffect(() => {
    let isMounted = true;
    if (!winery?.locationId) return;

    getLocationById(winery.locationId)
      .then((loc) => {
        if (!isMounted) return;
        setResolvedLocationName(`${loc.cityName}, ${loc.stateName}`);
      })
      .catch(() => {
        // Ignorar
      });

    return () => {
      isMounted = false;
    };
  }, [winery?.locationId]);

  // Limpiar mensajes tras interacción
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReset = () => {
    if (!winery) return;
    setName(winery.name ?? '');
    setLocationId(winery.locationId ?? null);
    setFoundationYear(winery.foundationYear ? winery.foundationYear.toString() : '');
    setWebsite(winery.website ?? '');
    setDescription(winery.description ?? '');
    setErrors({});
    setErrorMessage(null);
    setSuccessMessage(null);

    if (winery.locationId) {
      getLocationById(winery.locationId)
        .then((loc) => {
          setResolvedLocationName(`${loc.cityName}, ${loc.stateName}`);
        })
        .catch(() => {
          // Ignorar
        });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre de la bodega es obligatorio.';
    } else if (name.trim().length > 150) {
      newErrors.name = 'El nombre no puede superar los 150 caracteres.';
    }

    if (!locationId) {
      newErrors.locationId = 'Debés seleccionar la provincia y ciudad/terruño de la bodega.';
    }

    if (foundationYear.trim()) {
      const year = Number(foundationYear);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || !Number.isInteger(year) || year < 1500 || year > currentYear) {
        newErrors.foundationYear = `El año de fundación debe ser un número entre 1500 y ${currentYear}.`;
      }
    }

    if (website.trim()) {
      const urlPattern =
        /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/i;
      if (!urlPattern.test(website.trim())) {
        newErrors.website = 'Ingresá una dirección web válida (ej: https://bodegaejemplo.com.ar).';
      }
    }

    if (description.length > 2000) {
      newErrors.description = 'La semblanza histórica no puede exceder los 2000 caracteres.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!winery) return;
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      // Normalizar website
      let normalizedWebsite = website.trim();
      if (normalizedWebsite && !/^https?:\/\//i.test(normalizedWebsite)) {
        normalizedWebsite = `https://${normalizedWebsite}`;
      }

      const payload: UpdateWineryRequestDto = {
        name: name.trim(),
        locationId: locationId!,
        foundationYear: foundationYear.trim() ? Number(foundationYear) : null,
        website: normalizedWebsite || null,
        description: description.trim() || null,
      };

      await updateWinery(winery.id, payload);
      await reload();

      setSuccessMessage('Los datos de tu bodega se actualizaron correctamente.');
    } catch (err: unknown) {
      let detail: string | undefined;
      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }
      setErrorMessage(
        detail ??
          'Ocurrió un error al actualizar los datos de la bodega. Verificá que los campos sean válidos.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const initials = getWineryInitials(name || winery?.name);
  const isApproved = winery?.status === 'Approved';
  const isPending = winery?.status === 'Pending';
  const isRejected = winery?.status === 'Rejected';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Encabezado Editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
            Configuración Institucional
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-1 text-neutral-100 tracking-tight">
            Perfil de la Bodega
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed">
            Actualizá la semblanza histórica, terruño y canales de contacto oficiales de tu viñedo.
          </p>
        </div>

        {isApproved && winery?.id && (
          <a
            href={`/bodegas/${winery.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-300 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-xl self-start md:self-auto cursor-pointer"
          >
            <span>Ver vidriera en vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </a>
        )}
      </div>

      {/* Alertas de Éxito / Error */}
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

      {/* Layout Split: Formulario de Edición (Izq) + Vista Previa Editorial (Der) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario (7/12) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#141416] border border-white/5 p-6 sm:p-8 shadow-xl">
          <form noValidate onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Nombre de la Bodega */}
            <div>
              <label
                htmlFor="winery-name"
                className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium mb-2"
              >
                Nombre Oficial de la Bodega <span className="text-rose-400">*</span>
              </label>
              <input
                id="winery-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError('name');
                }}
                placeholder="Ej: Bodega Catena Zapata"
                aria-label="Nombre de la bodega"
                className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                  errors.name
                    ? 'border-rose-500/70 focus:border-rose-500'
                    : 'border-zinc-800/80 focus:border-zinc-500'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.name}</p>}
            </div>

            {/* 2. Ubicación / Terruño en Cascada */}
            <div>
              <label
                htmlFor="winery-state"
                className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium mb-2"
              >
                Terruño y Región Geográfica <span className="text-rose-400">*</span>
              </label>
              <LocationCascadeSelect
                value={locationId}
                onChange={(newId: number | null, resolvedLoc?: LocationResponseDto | null) => {
                  setLocationId(newId);
                  clearError('locationId');
                  if (resolvedLoc) {
                    setResolvedLocationName(`${resolvedLoc.cityName}, ${resolvedLoc.stateName}`);
                  } else {
                    setResolvedLocationName(null);
                  }
                }}
                error={errors.locationId}
              />
            </div>

            {/* 3. Año de Fundación y Sitio Web */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="foundation-year"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium mb-2"
                >
                  Año de Fundación <span className="text-neutral-500">(Opcional)</span>
                </label>
                <input
                  id="foundation-year"
                  type="number"
                  min="1500"
                  max={new Date().getFullYear()}
                  value={foundationYear}
                  onChange={(e) => {
                    setFoundationYear(e.target.value);
                    clearError('foundationYear');
                  }}
                  placeholder="Ej: 1902"
                  aria-label="Año de fundación"
                  className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                    errors.foundationYear
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-zinc-800/80 focus:border-zinc-500'
                  }`}
                />
                {errors.foundationYear && (
                  <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.foundationYear}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="website"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium mb-2"
                >
                  Sitio Web Oficial <span className="text-neutral-500">(Opcional)</span>
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    clearError('website');
                  }}
                  placeholder="https://tuestablecimiento.com.ar"
                  aria-label="Sitio web"
                  className={`h-12 w-full rounded-xl px-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors ${
                    errors.website
                      ? 'border-rose-500/70 focus:border-rose-500'
                      : 'border-zinc-800/80 focus:border-zinc-500'
                  }`}
                />
                {errors.website && (
                  <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.website}</p>
                )}
              </div>
            </div>

            {/* 4. Semblanza y Filosofía Enológica */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="description"
                  className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium"
                >
                  Historia y Filosofía del Viñedo
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    description.length > 2000 ? 'text-rose-400' : 'text-neutral-500'
                  }`}
                >
                  {description.length} / 2000
                </span>
              </div>
              <textarea
                id="description"
                rows={5}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearError('description');
                }}
                placeholder="Narrá la trayectoria, orígenes y particularidades enológicas de tu bodega..."
                aria-label="Historia y descripción de la bodega"
                className={`w-full rounded-xl p-4 text-sm font-sans bg-zinc-900/50 hover:bg-zinc-900/70 text-zinc-100 placeholder:text-zinc-500 border focus:outline-none focus:bg-zinc-900 transition-colors resize-y ${
                  errors.description
                    ? 'border-rose-500/70 focus:border-rose-500'
                    : 'border-zinc-800/80 focus:border-zinc-500'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-rose-400 mt-1 pl-1">{errors.description}</p>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 hover:text-white px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Descartar cambios</span>
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#6e1a24] hover:bg-[#831823] text-zinc-100 border border-rose-800/40 px-7 py-3 text-xs font-semibold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-rose-200/30 border-t-rose-100 rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Columna Derecha: Vista Previa Editorial en Vivo (5/12) */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-medium">
              Vista Previa
            </span>
            <span className="text-[10px] font-mono text-amber-200/70 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded">
              En Vivo
            </span>
          </div>

          <div className="rounded-2xl bg-[#141416] border border-white/10 p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-6">
            {/* Cabecera de la Ficha */}
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-2xl bg-stone-900 border border-white/10 flex items-center justify-center font-serif text-2xl font-semibold text-rose-200 shadow-md shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-2xl font-semibold text-neutral-100 tracking-tight break-words">
                  {name.trim() || 'Nombre de la Bodega'}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {isApproved && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Oficial</span>
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/40">
                      <Clock className="w-3 h-3" />
                      <span>En Revisión</span>
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-rose-950/40 text-rose-300 border border-rose-800/40">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Observaciones</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Metadatos Geográficos y de Contacto */}
            <div className="space-y-2.5 pt-2 border-t border-white/5 text-xs text-neutral-300 font-sans">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resolvedLocationName || 'Terruño aún no seleccionado'}</span>
              </div>

              {foundationYear.trim() && (
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-300/80 shrink-0" />
                  <span className="font-mono">Fundada en {foundationYear.trim()}</span>
                </div>
              )}

              {website.trim() && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                  <a
                    href={
                      /^https?:\/\//i.test(website.trim())
                        ? website.trim()
                        : `https://${website.trim()}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rose-300/90 hover:text-rose-200 underline truncate transition-colors"
                  >
                    {website.trim()}
                  </a>
                </div>
              )}
            </div>

            {/* Semblanza Histórica */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400 font-semibold">
                Historia y Terruño
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed whitespace-pre-line">
                {description.trim() ||
                  'Acá se exhibirá la semblanza histórica, métodos de crianza y filosofía enológica de tu bodega.'}
              </p>
            </div>

            {/* Micro Nota al Pie */}
            <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span>Ficha visualizada por aficionados y sommeliers.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
