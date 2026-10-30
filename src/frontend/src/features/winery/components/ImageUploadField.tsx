import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { isAxiosError } from 'axios';
import { Upload, X, Loader2, AlertCircle, ImageIcon } from 'lucide-react';
import { imageUrl, type ImageVariant } from '../../../lib/image';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageUploadFieldProps {
  currentImageId?: string | null;
  /** @deprecated usar currentImageId */
  value?: string | null;
  variant?: ImageVariant;
  onUpload?: (file: File) => Promise<string>;
  onDelete?: () => Promise<void>;
  /** @deprecated usar onUpload / onDelete */
  onChange?: (value: string) => void;
  /** @deprecated compatibilidad con llamadas previas */
  folder?: 'wineries' | 'vintages' | 'banners';
  label?: string;
  helperText?: string;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
  aspectRatio?: 'square' | 'bottle' | 'banner';
}

/**
 * Componente reutilizable para carga y vista previa de imágenes oficiales.
 * Soporta selector de archivo tradicional y arrastrar y soltar (drag & drop).
 * Valida formato (JPG, PNG, WEBP) y tamaño (máx 5 MB) en el cliente antes del envío.
 * Maneja respuestas de error RFC 7807 (413, 415, 422, 503).
 */
export default function ImageUploadField({
  currentImageId,
  value,
  variant,
  onUpload,
  onDelete,
  onChange,
  folder,
  label = 'Imagen oficial',
  helperText = 'Formatos admitidos: JPG, PNG o WEBP hasta 5 MB.',
  disabled = false,
  onUploadingChange,
  aspectRatio = 'square',
}: ImageUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derivar variante adecuada según aspectRatio si no se especificó
  const effectiveVariant: ImageVariant | undefined =
    variant ??
    (aspectRatio === 'banner'
      ? 'banner'
      : aspectRatio === 'bottle'
        ? 'bottle'
        : 'logo');

  // Resolver URL de vista previa: prioridad a currentImageId con helper imageUrl()
  const effectivePreviewUrl: string | null = (() => {
    if (currentImageId) {
      return imageUrl(currentImageId, effectiveVariant);
    }
    if (value && value.trim().length > 0) {
      return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/')
        ? value
        : imageUrl(value, effectiveVariant);
    }
    return null;
  })();

  const setUploadingState = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return 'Formato no permitido. Solo se aceptan archivos JPG, PNG o WEBP.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'La imagen supera el tamaño máximo permitido de 5 MB.';
    }
    return null;
  };

  const handleProcessFile = async (file: File) => {
    setUploadError(null);

    const validationMsg = validateFile(file);
    if (validationMsg) {
      setUploadError(validationMsg);
      return;
    }

    setUploadingState(true);

    try {
      if (onUpload) {
        const newImageId = await onUpload(file);
        onChange?.(newImageId);
      }
    } catch (err: unknown) {
      let status: number | undefined;
      let detail: string | undefined;

      if (isAxiosError<{ detail?: string; title?: string }>(err)) {
        status = err.response?.status;
        detail = err.response?.data?.detail ?? err.response?.data?.title;
      }

      if (status === 413) {
        setUploadError(detail ?? 'La imagen supera el límite de 5 MB permitido por el servidor.');
      } else if (status === 415) {
        setUploadError(detail ?? 'El formato de archivo no es compatible. Usá JPG, PNG o WEBP.');
      } else if (status === 422) {
        setUploadError(detail ?? 'El archivo enviado no es una imagen válida.');
      } else if (status === 403) {
        setUploadError(detail ?? 'No tenés permisos para modificar esta imagen.');
      } else if (status === 503) {
        setUploadError(
          'La carga de imágenes no está disponible por ahora. Podés continuar y subirla más tarde.',
        );
      } else {
        setUploadError(
          detail ?? 'No se pudo subir la imagen. Verificá tu conexión y volvé a intentar.',
        );
      }
    } finally {
      setUploadingState(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleProcessFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleProcessFile(file);
    }
  };

  const handleRemoveImage = async () => {
    if (disabled || isUploading) return;
    setUploadError(null);

    if (onDelete) {
      setUploadingState(true);
      try {
        await onDelete();
        onChange?.('');
      } catch (err: unknown) {
        let detail: string | undefined;
        if (isAxiosError<{ detail?: string; title?: string }>(err)) {
          detail = err.response?.data?.detail ?? err.response?.data?.title;
        }
        setUploadError(detail ?? 'No se pudo eliminar la imagen.');
      } finally {
        setUploadingState(false);
      }
    } else {
      onChange?.('');
    }
  };

  const hasImage = Boolean(effectivePreviewUrl && effectivePreviewUrl.trim().length > 0);

  const getLoadedLabel = () => {
    if (folder === 'banners' || effectiveVariant === 'banner') return 'Banner oficial cargado';
    if (folder === 'wineries' || effectiveVariant === 'logo') return 'Logo oficial cargado';
    return 'Fotografía de cosecha cargada';
  };

  const getRemoveLabel = () => {
    if (folder === 'banners' || effectiveVariant === 'banner') return 'Quitar banner';
    if (folder === 'wineries' || effectiveVariant === 'logo') return 'Quitar logo';
    return 'Quitar imagen';
  };

  const getAspectRatioClasses = () => {
    if (aspectRatio === 'banner') return 'w-36 h-12 aspect-[3/1]';
    if (aspectRatio === 'bottle') return 'w-16 h-22';
    return 'w-16 h-16';
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-[11px] font-mono uppercase tracking-widest text-neutral-300 font-medium">
          {label}
        </label>
      )}

      {/* Input nativo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label={label || 'Cargar imagen'}
      />

      {hasImage ? (
        /* Vista Previa con opción de Quitar */
        <div className="relative flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-900/40 border border-white/10">
          <div
            className={`overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shrink-0 ${getAspectRatioClasses()}`}
          >
            <img
              src={effectivePreviewUrl!}
              alt="Vista previa de imagen"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-xs font-medium text-zinc-200 truncate">
              {getLoadedLabel()}
            </p>
            <p className="text-[11px] text-zinc-500 font-mono truncate">{effectivePreviewUrl}</p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="text-xs text-amber-200/90 hover:text-amber-100 font-medium underline transition-colors cursor-pointer disabled:opacity-50"
              >
                {folder === 'banners' || effectiveVariant === 'banner'
                  ? 'Cambiar banner'
                  : folder === 'wineries' || effectiveVariant === 'logo'
                    ? 'Cambiar logo'
                    : 'Cambiar imagen'}
              </button>
              <span className="text-zinc-600">·</span>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={disabled || isUploading}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors cursor-pointer disabled:opacity-50"
                aria-label={getRemoveLabel()}
              >
                {getRemoveLabel()}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Eliminar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Zona de Arrastrar y Soltar / Clic */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-300 bg-amber-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-white/20 bg-zinc-900/30 hover:bg-zinc-900/50'
          } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-200">
              <Loader2 className="w-6 h-6 text-amber-200 animate-spin" />
              <p className="text-xs font-mono tracking-wider text-amber-200/90">
                Procesando imagen...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                {isDragging ? <Upload className="w-5 h-5 text-amber-200" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">
                  <span className="text-amber-200 underline">Elegí un archivo</span> o arrastralo acá
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{helperText}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerta de Error de Subida */}
      {uploadError && (
        <div className="flex items-start gap-2 text-xs text-rose-400 pl-1 pt-0.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
}
