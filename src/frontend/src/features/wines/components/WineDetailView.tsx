import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Star,
  Wine,
  MapPin,
  BookmarkPlus,
  Share2,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Utensils,
  Sparkles,
  Soup,
  ExternalLink,
  Send,
  X,
  ArrowUpRight,
  Activity,
  Plus,
  Trash2,
  Camera,
  Search,
} from 'lucide-react';
import type { EditorialWine, WineReviewItem, WineVintageDetail } from '../data/editorialWines';
import { useAuth } from '../../auth';
import type { AppOutletContext } from '../../../components/layout/AppLayout';
import type { CellarWine } from '../../cava';
import { imageUrl } from '../../../lib/image';
import { createReview } from '../api/reviewsApi';
import WineEditBar from './WineEditBar';
import {
  createWine,
  updateWine,
  updateWineVintage,
  createWineVintage,
  getWineVintages,
} from '../../winery/api/wineApi';
import { uploadVintageImage, deleteVintageImage } from '../../winery/api/imageApi';
import {
  addWinePairing,
  removeWinePairing,
  getPairingsCatalog,
} from '../../winery/api/wineryWinePairingsApi';
import { getGrapes } from '../../winery/api/grapeApi';
import ConfirmDialog from '../../admin/components/ConfirmDialog';
import {
  createNewBlendRow,
  calculateTotalPercentage,
  validateGrapeBlend,
  type BlendRow,
} from '../../winery/utils/grapeBlendUtils';
import {
  parseAlcohol,
  parseServingTemperature,
  parseYear,
} from '../utils/vintageFormatUtils';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  GrapeResponseDto,
  WineryWinePairingDto,
  CreateWineRequestDto,
  CreateWineVintageRequestDto,
} from '../../winery/types';

interface ToastState {
  message: string;
  actionLabel?: string;
  actionTo?: string;
}

interface SensoryAttribute {
  key: string;
  label: string;
  value: number; // 1.0 a 5.0
}

function calculateRating(reviews: WineReviewItem[]): string | null {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

export function getWineTypeLabel(type: string): string {
  switch (type) {
    case 'Red':
      return 'Tinto Noble';
    case 'White':
      return 'Blanco & Mineral';
    case 'Rose':
      return 'Rosado & Criolla';
    case 'Sparkling':
      return 'Espumoso Método Tradicional';
    case 'Orange':
      return 'Naranjo';
    default:
      return type.toUpperCase();
  }
}

function getPairingIcon(iconName?: string) {
  switch (iconName) {
    case 'flame':
      return <Flame className="w-4 h-4 text-[#ffb2b8]" />;
    case 'utensils':
      return <Utensils className="w-4 h-4 text-[#ffb2b8]" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-[#ffb2b8]" />;
    case 'soup':
      return <Soup className="w-4 h-4 text-[#ffb2b8]" />;
    default:
      return <Utensils className="w-4 h-4 text-[#ffb2b8]" />;
  }
}

function FractionalStar({ fillPercent }: { fillPercent: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(fillPercent)));
  return (
    <div className="relative inline-block w-4 h-4 text-neutral-700">
      <Star className="w-4 h-4 text-neutral-700" />
      {percent > 0 && (
        <div
          className="absolute top-0 left-0 overflow-hidden h-full text-amber-400 fill-amber-400"
          style={{ width: `${percent}%` }}
        >
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        </div>
      )}
    </div>
  );
}

function WineSensoryRadarChart({ attributes }: { attributes: SensoryAttribute[] }) {
  const size = 260;
  const center = size / 2;
  const maxRadius = 88;
  const count = attributes.length;

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, ratio: number) => {
    const angle = index * (2 * Math.PI / count) - Math.PI / 2;
    const r = maxRadius * ratio;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPolygonPoints = attributes
    .map((attr, i) => {
      const ratio = Math.max(0.1, Math.min(1.0, attr.value / 5.0));
      const { x, y } = getCoordinates(i, ratio);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[270px] h-auto drop-shadow-lg"
        aria-label="Gráfico de telaraña del perfil sensorial del vino"
      >
        {rings.map((ringRatio, rIdx) => {
          const ringPoints = attributes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, ringRatio);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={rIdx}
              points={ringPoints}
              fill="none"
              stroke="#26262b"
              strokeWidth={rIdx === rings.length - 1 ? '1.25' : '0.75'}
              strokeDasharray={rIdx === rings.length - 1 ? 'none' : '2,2'}
            />
          );
        })}

        {attributes.map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#2c2c34"
              strokeWidth="0.75"
            />
          );
        })}

        <polygon
          points={dataPolygonPoints}
          fill="rgba(114, 47, 55, 0.45)"
          stroke="#ffb2b8"
          strokeWidth="2"
          className="transition-all duration-700"
        />

        {attributes.map((attr, i) => {
          const ratio = Math.max(0.1, Math.min(1.0, attr.value / 5.0));
          const { x, y } = getCoordinates(i, ratio);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#fbbf24"
              stroke="#0a0a0c"
              strokeWidth="1.5"
            />
          );
        })}

        {attributes.map((attr, i) => {
          const { x, y } = getCoordinates(i, 1.25);
          const isTop = y < center - 10;
          const isBottom = y > center + 10;
          const isRight = x > center + 10;
          const isLeft = x < center - 10;

          let textAnchor: 'middle' | 'start' | 'end' = 'middle';
          if (isRight) textAnchor = 'start';
          if (isLeft) textAnchor = 'end';

          return (
            <text
              key={i}
              x={x}
              y={y + (isTop ? -2 : isBottom ? 8 : 4)}
              textAnchor={textAnchor}
              className="fill-neutral-400 font-mono text-[9px] uppercase tracking-wider select-none font-medium"
            >
              {attr.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function getConciseAging(advice: string): string {
  const match = advice.match(/^(\d+(?:\s*(?:a|-)\s*\d+)?\+?\s*años?)/i);
  if (match) {
    return match[1];
  }
  return advice.split('.')[0]?.split(' en ')[0]?.trim() || advice;
}

export interface EditableVintageDraft {
  id: string; // id o draft-xxx
  isNew?: boolean;
  year: number;
  alcoholContent: string;
  servingTemperature: string;
  agingAdvice: string;
  blend: BlendRow[];
  imageFile?: File | null;
  imageRemoved?: boolean;
  previewUrl?: string | null;
}

export interface WineDetailViewProps {
  wine: EditorialWine;
  reviews?: WineReviewItem[];
  ownerMode?: boolean;
  isRealWine?: boolean;
  isNewMode?: boolean;
  rawWine?: WineResponseDto | null;
  rawVintages?: WineVintageResponseDto[];
  onReload?: () => Promise<void>;
  onReviewPublished?: () => void | Promise<void>;
  onPublishNewWine?: (data: {
    wine: EditorialWine;
    firstVintage: EditableVintageDraft;
    pairings: WineryWinePairingDto[];
  }) => Promise<void>;
}

export default function WineDetailView({
  wine,
  reviews: propReviews,
  ownerMode = false,
  isRealWine = false,
  isNewMode = false,
  rawWine,
  rawVintages,
  onReload,
  onReviewPublished,
  onPublishNewWine,
}: WineDetailViewProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const outletCtx = useOutletContext<AppOutletContext | null>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const isPublishedRef = useRef<boolean>(false);

  // Estados de vista
  const [selectedVintageYear, setSelectedVintageYear] = useState<number>(
    () => wine.vintages[0]?.year ?? (isNewMode ? ('' as unknown as number) : 2020)
  );
  const [toast, setToast] = useState<ToastState | null>(null);
  const [starFilter, setStarFilter] = useState<'all' | '5' | '4' | '3'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState<boolean>(false);

  // Formulario de nueva reseña
  const [newReviewRating, setNewReviewRating] = useState<number>(4.5);
  const [newReviewComment, setNewReviewComment] = useState<string>('');

  // Reseñas añadidas localmente en modo editorial
  const [submittedReviews, setSubmittedReviews] = useState<WineReviewItem[]>([]);

  // ==========================================
  // ESTADOS DEL MODO EDICIÓN (Paso 2 y Paso 3)
  // ==========================================
  const [isEditing, setIsEditing] = useState<boolean>(isNewMode);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: boolean;
    type?: boolean;
    year?: boolean;
  }>({});
  const [confirmAddVintage, setConfirmAddVintage] = useState<{
    existingWineId: number;
    name: string;
    year: number;
  } | null>(null);
  const [isAddingVintage, setIsAddingVintage] = useState<boolean>(false);

  // Campos del vino
  const [draftName, setDraftName] = useState<string>(wine.name);
  const [draftType, setDraftType] = useState<EditorialWine['type']>(wine.type);
  const [draftDescription, setDraftDescription] = useState<string>(wine.description);

  // Maridajes
  const [draftPairings, setDraftPairings] = useState<WineryWinePairingDto[]>(() =>
    wine.pairings.map((p) => ({ id: Number(p.id), name: p.name, category: 'Other' }))
  );
  const [isPairingPanelOpen, setIsPairingPanelOpen] = useState(false);
  const [pairingSearch, setPairingSearch] = useState('');
  const [pairingCategoryFilter, setPairingCategoryFilter] = useState<string>('all');
  const [pairingsCatalog, setPairingsCatalog] = useState<WineryWinePairingDto[]>([]);

  // Catálogo maestro de uvas
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);

  // Cosechas en borrador (indexadas por id o año)
  const [vintageDrafts, setVintageDrafts] = useState<Record<string, EditableVintageDraft>>(() => {
    const initial: Record<string, EditableVintageDraft> = {};
    if (isNewMode) {
      initial.new = {
        id: 'draft-new',
        isNew: true,
        year: '' as unknown as number,
        alcoholContent: '',
        servingTemperature: '',
        agingAdvice: '',
        blend: [],
      };
    }
    return initial;
  });

  // Cargar catálogo de uvas al editar o en modo nuevo
  useEffect(() => {
    if (isEditing || isNewMode) {
      void getGrapes({ pageSize: 200 }).then((res) => {
        setGrapesCatalog(res);
      });
      void getPairingsCatalog({ pageSize: 100 }).then((res) => {
        setPairingsCatalog(res);
      });
    }
  }, [isEditing, isNewMode]);

  // Inicializar borradores de cosechas a partir de wine.vintages
  const initVintageDrafts = () => {
    const drafts: Record<string, EditableVintageDraft> = {};
    wine.vintages.forEach((v) => {
      // Buscar uvas desde rawVintages o por coincidencia de nombre
      const rawV = rawVintages?.find((rv) => String(rv.id) === v.id);
      let blend: BlendRow[] = [];
      if (rawV?.grapes && rawV.grapes.length > 0) {
        blend = rawV.grapes.map((g, idx) => ({
          id: `blend-${v.id}-${g.grapeId}-${idx}`,
          grapeId: g.grapeId,
          percentage: Number(g.percentage ?? 100),
        }));
      } else if (v.grapes && v.grapes.length > 0) {
        blend = v.grapes.map((g, idx) => {
          const found = grapesCatalog.find((gc) => gc.name.toLowerCase() === g.variety.toLowerCase());
          return {
            id: `blend-${v.id}-${idx}`,
            grapeId: found ? found.id : '',
            percentage: g.percentage,
          };
        });
      }

      drafts[String(v.year)] = {
        id: v.id,
        year: v.year,
        alcoholContent: v.alcoholContent,
        servingTemperature: v.servingTemperature,
        agingAdvice: v.agingAdvice,
        blend,
        imageFile: null,
        imageRemoved: false,
        previewUrl: v.imageUrl || null,
      };
    });

    if (Object.keys(drafts).length === 0) {
      const defaultYear = isNewMode ? ('' as unknown as number) : 2020;
      drafts[String(defaultYear || 'new')] = {
        id: 'draft-0',
        isNew: true,
        year: defaultYear,
        alcoholContent: isNewMode ? '' : '14.0% Vol.',
        servingTemperature: isNewMode ? '' : '16°C – 18°C',
        agingAdvice: '',
        blend: [],
      };
    }

    setVintageDrafts(drafts);
    setDraftName(wine.name);
    setDraftType(wine.type);
    setDraftDescription(wine.description);
    setDraftPairings(
      wine.pairings.map((p) => ({ id: Number(p.id), name: p.name, category: 'Other' }))
    );
  };

  const handleStartEdit = () => {
    initVintageDrafts();
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsPairingPanelOpen(false);
  };

  // Año de cosecha efectivo: si el seleccionado existe en wine.vintages o en vintageDrafts, usarlo; sino el primero
  const effectiveSelectedYear = useMemo(() => {
    if (wine.vintages.some((v) => v.year === selectedVintageYear) || vintageDrafts[String(selectedVintageYear)]) {
      return selectedVintageYear;
    }
    return wine.vintages[0]?.year ?? selectedVintageYear;
  }, [wine.vintages, selectedVintageYear, vintageDrafts]);

  // Clave del borrador activo
  const activeVintageDraftKey = useMemo(() => {
    if (vintageDrafts[String(effectiveSelectedYear)]) {
      return String(effectiveSelectedYear);
    }
    const keys = Object.keys(vintageDrafts);
    return keys.length > 0 ? keys[0] : 'new';
  }, [vintageDrafts, effectiveSelectedYear]);

  const activeVintageDraft = vintageDrafts[activeVintageDraftKey] || {
    id: 'draft-new',
    isNew: true,
    year: effectiveSelectedYear,
    alcoholContent: isNewMode ? '' : '14.0% Vol.',
    servingTemperature: isNewMode ? '' : '16°C – 18°C',
    agingAdvice: '',
    blend: [],
  };

  // Actualizar un campo de la cosecha activa en edición
  const updateActiveVintageDraft = (patch: Partial<EditableVintageDraft>) => {
    setVintageDrafts((prev) => {
      const current = prev[activeVintageDraftKey] || {
        id: 'draft-new',
        isNew: true,
        year: effectiveSelectedYear,
        alcoholContent: isNewMode ? '' : '14.0% Vol.',
        servingTemperature: isNewMode ? '' : '16°C – 18°C',
        agingAdvice: '',
        blend: [],
      };
      const updated = { ...current, ...patch };
      // Si cambia el año, reindexar la clave
      if (patch.year !== undefined && patch.year !== current.year) {
        const newDrafts = { ...prev };
        delete newDrafts[activeVintageDraftKey];
        newDrafts[String(patch.year || 'new')] = updated;
        setSelectedVintageYear(patch.year);
        return newDrafts;
      }
      return {
        ...prev,
        [activeVintageDraftKey]: updated,
      };
    });
  };

  // Cosecha activa seleccionada en modo lectura
  const activeVintage: WineVintageDetail = useMemo(() => {
    return wine.vintages.find((v) => v.year === effectiveSelectedYear) || wine.vintages[0] || {
      id: '0',
      wineId: wine.id,
      year: effectiveSelectedYear,
      alcoholContent: '14.0% Vol.',
      servingTemperature: '16°C – 18°C',
      agingAdvice: '',
      grapes: [],
    };
  }, [wine, effectiveSelectedYear]);

  // Detección de cambios sin guardar
  const hasChanges = useMemo(() => {
    if (isPublishedRef.current) return false;
    if (!isEditing && !isNewMode) return false;
    if (isNewMode) {
      return Boolean(
        draftName.trim() ||
        draftType ||
        draftDescription.trim() ||
        activeVintageDraft.year ||
        activeVintageDraft.blend.length > 0 ||
        activeVintageDraft.imageFile ||
        draftPairings.length > 0
      );
    }
    if (draftName !== wine.name) return true;
    if (draftType !== wine.type) return true;
    if (draftDescription !== wine.description) return true;
    if (draftPairings.length !== wine.pairings.length) return true;
    return true;
  }, [isEditing, isNewMode, draftName, draftType, draftDescription, activeVintageDraft, draftPairings, wine]);

  // Manejo de Uvas en el Blend
  const handleAddGrape = () => {
    const currentBlend = activeVintageDraft.blend;
    const newRow = createNewBlendRow('', currentBlend.length, `blend-${selectedVintageYear}`);
    updateActiveVintageDraft({ blend: [...currentBlend, newRow] });
  };

  const handleUpdateGrape = (rowId: string, patch: Partial<BlendRow>) => {
    const currentBlend = activeVintageDraft.blend;
    const updated = currentBlend.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
    updateActiveVintageDraft({ blend: updated });
  };

  const handleRemoveGrape = (rowId: string) => {
    const currentBlend = activeVintageDraft.blend;
    const updated = currentBlend.filter((row) => row.id !== rowId);
    updateActiveVintageDraft({ blend: updated });
  };

  const blendTotal = calculateTotalPercentage(activeVintageDraft.blend);
  const blendValidation = validateGrapeBlend(activeVintageDraft.blend);

  // Manejo de Imagen de Botella
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      showToast('Formato inválido. Usá PNG, JPEG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen supera el límite máximo de 5 MB.');
      return;
    }

    const preview = URL.createObjectURL(file);
    updateActiveVintageDraft({
      imageFile: file,
      imageRemoved: false,
      previewUrl: preview,
    });
  };

  const handleRemoveImage = () => {
    updateActiveVintageDraft({
      imageFile: null,
      imageRemoved: true,
      previewUrl: null,
    });
  };

  // Manejo de Añadas en Edición (+ Añada)
  const handleAddVintageChip = () => {
    const existingYears = Object.values(vintageDrafts).map((d) => d.year);
    const nextYear = existingYears.length > 0 ? Math.max(...existingYears) + 1 : 2024;
    const newKey = String(nextYear);

    const newDraft: EditableVintageDraft = {
      id: `draft-new-${Date.now()}`,
      isNew: true,
      year: nextYear,
      alcoholContent: '14.0% Vol.',
      servingTemperature: '16°C – 18°C',
      agingAdvice: '',
      blend: [],
    };

    setVintageDrafts((prev) => ({
      ...prev,
      [newKey]: newDraft,
    }));
    setSelectedVintageYear(nextYear);
  };

  // Manejo de Maridajes
  const handleRemovePairing = (pairingId: number) => {
    setDraftPairings((prev) => prev.filter((p) => p.id !== pairingId));
  };

  const handleAddPairing = (pairing: WineryWinePairingDto) => {
    if (draftPairings.some((p) => p.id === pairing.id)) return;
    setDraftPairings((prev) => [...prev, pairing]);
  };

  const filteredPairingsCatalog = useMemo(() => {
    return pairingsCatalog.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(pairingSearch.toLowerCase());
      const matchesCategory =
        pairingCategoryFilter === 'all' ||
        p.category?.toLowerCase() === pairingCategoryFilter.toLowerCase();
      const notAlreadyAdded = !draftPairings.some((dp) => dp.id === p.id);
      return matchesSearch && matchesCategory && notAlreadyAdded;
    });
  }, [pairingsCatalog, pairingSearch, pairingCategoryFilter, draftPairings]);

  // ==========================================
  // GUARDAR EDICIÓN (Punto 2.3)
  // ==========================================
  const handleSaveEdit = async () => {
    if (!draftName.trim()) {
      showToast('El nombre del vino es obligatorio.');
      return;
    }

    // Validar blend de la cosecha activa
    if (activeVintageDraft.blend.length > 0) {
      if (!blendValidation.isValid) {
        showToast(blendValidation.errorMessage || 'Verificá el porcentaje de las uvas.');
        return;
      }
    }

    setIsSaving(true);
    const numericWineId = Number(wine.id);
    const savedSteps: string[] = [];
    const failedSteps: string[] = [];

    try {
      // 1. PUT /api/wines/{id} si cambió algo del vino
      const wineChanged =
        draftName !== wine.name ||
        draftType !== wine.type ||
        draftDescription !== wine.description;

      if (wineChanged) {
        try {
          await updateWine(numericWineId, {
            name: draftName.trim(),
            wineType: draftType,
            description: draftDescription.trim(),
            locationId: rawWine?.locationId ?? undefined,
            wineryId: rawWine?.wineryId ?? undefined,
          });
          savedSteps.push('vino');
        } catch (err: unknown) {
          failedSteps.push('vino');
          throw err;
        }
      }

      // 2. PUT /api/wines/{wineId}/vintages/{vintageId} o createWineVintage
      for (const draft of Object.values(vintageDrafts)) {
        const grapesPayload = draft.blend
          .filter((b) => typeof b.grapeId === 'number' && typeof b.percentage === 'number')
          .map((b) => ({
            grapeId: b.grapeId as number,
            percentage: b.percentage as number,
          }));

        const alcoholNum = parseAlcohol(draft.alcoholContent);
        const tempNum = parseServingTemperature(draft.servingTemperature);
        const yearNum = parseYear(draft.year) ?? draft.year;

        if (draft.isNew) {
          try {
            const createdV = await createWineVintage(numericWineId, {
              year: yearNum,
              alcoholContent: alcoholNum,
              servingTemperature: tempNum,
              agingAdvice: draft.agingAdvice?.trim() || null,
              grapes: grapesPayload.length > 0 ? grapesPayload : null,
            });
            savedSteps.push(`cosecha ${yearNum}`);

            // Subir imagen si se seleccionó para la nueva añada
            if (draft.imageFile) {
              await uploadVintageImage(numericWineId, createdV.id, draft.imageFile);
            }
          } catch (err: unknown) {
            failedSteps.push(`cosecha ${yearNum}`);
            const maybeAxios = err as {
              response?: { status?: number; data?: { code?: string; detail?: string } };
            };
            if (
              maybeAxios?.response?.status === 409 ||
              maybeAxios?.response?.data?.code === 'WINE_VINTAGE_DUPLICATE'
            ) {
              showToast(`Ya registraste la cosecha ${yearNum} para esta etiqueta.`);
              return;
            }
            throw err;
          }
        } else {
          // Actualizar cosecha existente
          const targetVintageId = Number(draft.id);
          if (targetVintageId > 0) {
            try {
              await updateWineVintage(numericWineId, targetVintageId, {
                year: yearNum,
                alcoholContent: alcoholNum,
                servingTemperature: tempNum,
                agingAdvice: draft.agingAdvice?.trim() || null,
                grapes: grapesPayload.length > 0 ? grapesPayload : null,
              });
              savedSteps.push(`cosecha ${yearNum}`);

              // Imagen: subir, reemplazar o quitar
              if (draft.imageFile) {
                await uploadVintageImage(numericWineId, targetVintageId, draft.imageFile);
              } else if (draft.imageRemoved) {
                await deleteVintageImage(numericWineId, targetVintageId);
              }
            } catch (err: unknown) {
              failedSteps.push(`cosecha ${yearNum}`);
              const maybeAxios = err as {
                response?: { status?: number; data?: { code?: string; detail?: string } };
              };
              if (
                maybeAxios?.response?.status === 409 ||
                maybeAxios?.response?.data?.code === 'WINE_VINTAGE_DUPLICATE'
              ) {
                showToast(`Ya registraste la cosecha ${yearNum} para esta etiqueta.`);
                return;
              }
              throw err;
            }
          }
        }
      }

      // 3. Maridajes: addWinePairing y removeWinePairing según diferencia
      const initialPairingIds = new Set(wine.pairings.map((p) => Number(p.id)));
      const currentPairingIds = new Set(draftPairings.map((p) => p.id));

      const toAdd = draftPairings.filter((p) => !initialPairingIds.has(p.id));
      const toRemove = wine.pairings.filter((p) => !currentPairingIds.has(Number(p.id)));

      for (const p of toAdd) {
        try {
          await addWinePairing(numericWineId, p.id);
        } catch {
          // Ignorar si ya estaba asociado
        }
      }

      for (const p of toRemove) {
        try {
          await removeWinePairing(numericWineId, Number(p.id));
        } catch {
          // Ignorar si ya fue removido
        }
      }

      showToast('¡Edición guardada exitosamente!');
      setIsEditing(false);
      if (onReload) {
        await onReload();
      }
    } catch (err: unknown) {
      const maybeAxios = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      const msg =
        maybeAxios?.response?.data?.detail ||
        maybeAxios?.response?.data?.message ||
        'Ocurrió un error al guardar la edición. Verificá los datos e intentá de nuevo.';
      showToast(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // PUBLICAR ETIQUETA NUEVA (Paso 3)
  // ==========================================
  const handlePublish = async () => {
    if (isSubmittingRef.current || isSaving) return;

    // Validación de campos obligatorios
    const missing: string[] = [];
    if (!draftName.trim()) missing.push('Nombre del vino');
    if (!draftType) missing.push('Tipo de vino');
    const yearNum = parseYear(activeVintageDraft.year) ?? Number(activeVintageDraft.year);
    if (!yearNum || isNaN(yearNum)) missing.push('Año de la primera cosecha');

    if (missing.length > 0) {
      setValidationErrors({
        name: !draftName.trim(),
        type: !draftType,
        year: !yearNum || isNaN(yearNum),
      });
      showToast(`Completá los campos obligatorios: ${missing.join(', ')}.`);
      return;
    }

    setValidationErrors({});

    // Validar blend si tiene uvas cargadas
    if (activeVintageDraft.blend.length > 0) {
      if (!blendValidation.isValid) {
        showToast(blendValidation.errorMessage || 'Verificá el porcentaje de las uvas.');
        return;
      }
    }

    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      const validGrapes = activeVintageDraft.blend
        .filter((b) => typeof b.grapeId === 'number' && typeof b.percentage === 'number' && b.percentage > 0)
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: b.percentage as number,
        }));

      const alcoholNum = parseAlcohol(activeVintageDraft.alcoholContent);
      const tempNum = parseServingTemperature(activeVintageDraft.servingTemperature);
      const targetWineryId = rawWine?.wineryId ?? (wine.winery ? Number(wine.winery.id) : user?.id);

      const payload: CreateWineRequestDto = {
        name: draftName.trim(),
        wineType: draftType,
        wineryId: targetWineryId as number,
        locationId: rawWine?.locationId ?? null,
        description: draftDescription.trim() || null,
        firstVintage: {
          year: yearNum,
          alcoholContent: alcoholNum,
          servingTemperature: tempNum,
          agingAdvice: activeVintageDraft.agingAdvice?.trim() || null,
          grapes: validGrapes.length > 0 ? validGrapes : null,
        },
      };

      const created = await createWine(payload);
      isPublishedRef.current = true;

      // 2. Si hay imagen seleccionada: uploadVintageImage
      let imageFailed = false;
      if (activeVintageDraft.imageFile) {
        try {
          const vintages = await getWineVintages(created.id);
          const firstV = vintages.find((v) => v.year === yearNum) ?? vintages[0];
          if (firstV) {
            await uploadVintageImage(created.id, firstV.id, activeVintageDraft.imageFile);
          }
        } catch {
          imageFailed = true;
        }
      }

      // 3. Si hay maridajes seleccionados: addWinePairing por cada uno
      let pairingFailed = false;
      for (const p of draftPairings) {
        try {
          await addWinePairing(created.id, p.id);
        } catch {
          pairingFailed = true;
        }
      }

      // 4. Navegar a /bodega/vinos/{id}
      if (imageFailed && pairingFailed) {
        showToast('Se creó el vino, pero no se pudo subir la foto ni asociar maridajes.');
      } else if (imageFailed) {
        showToast('Se creó el vino, pero no se pudo subir la foto.');
      } else if (pairingFailed) {
        showToast('Se creó el vino, pero no se pudieron asociar algunos maridajes.');
      }

      navigate(`/bodega/vinos/${created.id}`);
    } catch (err: unknown) {
      const maybeAxios = err as {
        response?: {
          status?: number;
          data?: { code?: string; detail?: string; existingWineId?: number };
        };
      };
      const status = maybeAxios?.response?.status;
      const data = maybeAxios?.response?.data;
      const code = data?.code;

      if (status === 409) {
        if (code === 'WINE_VINTAGE_DUPLICATE') {
          const existingId = data?.existingWineId;
          showToast(
            `Ya registraste este vino con la cosecha ${yearNum}.`,
            existingId ? 'Ver etiqueta' : undefined,
            existingId ? `/bodega/vinos/${existingId}` : undefined
          );
          return;
        }

        if (code === 'WINE_EXISTS_ADD_VINTAGE' && data?.existingWineId) {
          setConfirmAddVintage({
            existingWineId: data.existingWineId,
            name: draftName.trim(),
            year: yearNum,
          });
          return;
        }
      }

      const msg = data?.detail || 'No se pudo crear la etiqueta de vino. Verificá los campos ingresados.';
      showToast(msg);
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  const handleConfirmAddVintage = async () => {
    if (!confirmAddVintage || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsAddingVintage(true);

    try {
      const validGrapes = activeVintageDraft.blend
        .filter((b) => typeof b.grapeId === 'number' && typeof b.percentage === 'number' && b.percentage > 0)
        .map((b) => ({
          grapeId: b.grapeId as number,
          percentage: b.percentage as number,
        }));

      const alcoholNum = parseAlcohol(activeVintageDraft.alcoholContent);
      const tempNum = parseServingTemperature(activeVintageDraft.servingTemperature);

      const vintagePayload: CreateWineVintageRequestDto = {
        year: confirmAddVintage.year,
        alcoholContent: alcoholNum,
        servingTemperature: tempNum,
        agingAdvice: activeVintageDraft.agingAdvice?.trim() || null,
        grapes: validGrapes.length > 0 ? validGrapes : null,
      };

      const createdVintage = await createWineVintage(confirmAddVintage.existingWineId, vintagePayload);
      isPublishedRef.current = true;

      // Subir imagen si hay
      if (activeVintageDraft.imageFile) {
        try {
          await uploadVintageImage(confirmAddVintage.existingWineId, createdVintage.id, activeVintageDraft.imageFile);
        } catch {
          // No crítico
        }
      }

      // Asociar maridajes si hay
      for (const p of draftPairings) {
        try {
          await addWinePairing(confirmAddVintage.existingWineId, p.id);
        } catch {
          // No crítico
        }
      }

      setConfirmAddVintage(null);
      navigate(`/bodega/vinos/${confirmAddVintage.existingWineId}`);
    } catch (err: unknown) {
      const maybeAxios = err as { response?: { data?: { detail?: string } } };
      showToast(maybeAxios?.response?.data?.detail || 'No se pudo agregar la cosecha a la etiqueta existente.');
    } finally {
      isSubmittingRef.current = false;
      setIsAddingVintage(false);
    }
  };

  const reviews = propReviews ?? (submittedReviews.length > 0 ? [...submittedReviews, ...wine.reviews] : wine.reviews);
  const REVIEWS_PER_PAGE = 3;

  const averageRating = useMemo(() => calculateRating(reviews), [reviews]);

  // Perfil sensorial (en vivo con draftType en edición)
  const currentEffectiveType = isEditing ? draftType : wine.type;
  const sensoryAttributes: SensoryAttribute[] = useMemo(() => {
    if (!currentEffectiveType) {
      return [
        { key: 'body', label: 'Cuerpo', value: 0 },
        { key: 'tannins', label: 'Taninos', value: 0 },
        { key: 'acidity', label: 'Acidez', value: 0 },
        { key: 'fruit', label: 'Fruta', value: 0 },
        { key: 'oak', label: 'Crianza', value: 0 },
        { key: 'persistence', label: 'Persistencia', value: 0 },
      ];
    }

    const isWhite = currentEffectiveType === 'White' || currentEffectiveType === 'Orange';
    const isRose = currentEffectiveType === 'Rose';

    if (isWhite) {
      return [
        { key: 'body', label: 'Cuerpo', value: 3.2 },
        { key: 'tannins', label: 'Taninos', value: 1.2 },
        { key: 'acidity', label: 'Acidez', value: 4.8 },
        { key: 'fruit', label: 'Fruta', value: 4.6 },
        { key: 'oak', label: 'Crianza', value: 3.5 },
        { key: 'persistence', label: 'Persistencia', value: 4.4 },
      ];
    }

    if (isRose) {
      return [
        { key: 'body', label: 'Cuerpo', value: 2.8 },
        { key: 'tannins', label: 'Taninos', value: 2.0 },
        { key: 'acidity', label: 'Acidez', value: 4.6 },
        { key: 'fruit', label: 'Fruta', value: 4.7 },
        { key: 'oak', label: 'Crianza', value: 1.8 },
        { key: 'persistence', label: 'Persistencia', value: 3.9 },
      ];
    }

    return [
      { key: 'body', label: 'Cuerpo', value: 4.7 },
      { key: 'tannins', label: 'Taninos', value: 4.8 },
      { key: 'acidity', label: 'Acidez', value: 4.3 },
      { key: 'fruit', label: 'Fruta', value: 4.4 },
      { key: 'oak', label: 'Crianza', value: 4.1 },
      { key: 'persistence', label: 'Persistencia', value: 4.9 },
    ];
  }, [currentEffectiveType]);

  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    const targetStar = parseInt(starFilter, 10);
    return reviews.filter((rev) => Math.floor(rev.rating) === targetStar);
  }, [reviews, starFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE));

  const displayedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    return filteredReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  const showToast = (message: string, actionLabel?: string, actionTo?: string) => {
    setToast({ message, actionLabel, actionTo });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleSaveToCellar = () => {
    if (ownerMode || isNewMode) return;

    if (outletCtx?.setStockCount) {
      outletCtx.setStockCount((prev) => prev + 1);
    }

    try {
      const storedWinesRaw = localStorage.getItem('ayvino_vault_wines');
      const existingWines: CellarWine[] = storedWinesRaw ? JSON.parse(storedWinesRaw) : [];

      const newCellarWine: CellarWine = {
        id: `vault-added-${Date.now()}`,
        name: `${wine.name} ${activeVintage.year}`,
        winery: wine.winery?.name || wine.wineryNameText,
        region: wine.winery?.region || 'Valle de Uco, Mendoza',
        varietal: activeVintage.grapes[0]?.variety || 'Malbec',
        vintage: activeVintage.year,
        rating: Math.round((parseFloat(averageRating || '4.8') / 5) * 100),
        units: 1,
        location: 'Cava Principal · Estante de Selección',
        temperatureConst: '15°C CONSTANTE',
        terroirNote: wine.description.slice(0, 80) + '...',
        agingStatus: 'aging',
        agingStatusLabel: `Guarda recomendada: ${activeVintage.agingAdvice.split('.')[0]}`,
        isJewel: false,
        bottle: 'red-black',
        imageUrl: (activeVintage.imageId ? imageUrl(activeVintage.imageId, 'bottle') : activeVintage.imageUrl) || undefined,
        alcoholContent: activeVintage.alcoholContent,
      };

      const updated = [newCellarWine, ...existingWines];
      localStorage.setItem('ayvino_vault_wines', JSON.stringify(updated));
    } catch {
      // Manejo silencioso de storage
    }

    showToast(
      `¡"${wine.name} (${activeVintage.year})" guardado en tu Cava!`,
      'Ver en mi Cava',
      '/cava'
    );
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Enlace de ficha enológica copiado al portapapeles.');
    } else {
      showToast('Enlace listo para compartir.');
    }
  };

  const handleOpenReviewForm = () => {
    setIsReviewFormOpen(true);
    const el = document.getElementById('reviews-editorial-section');
    if (typeof el?.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewComment.trim()) return;

    if (isRealWine) {
      try {
        const roundedRating = Math.max(1, Math.min(5, Math.round(newReviewRating)));
        const vintageId = Number(activeVintage.id);
        await createReview({
          wineVintageId: vintageId,
          rating: roundedRating,
          comment: newReviewComment.trim(),
        });
        showToast(`¡Tu cata (${roundedRating} ★) fue publicada en la bitácora!`);
        setNewReviewComment('');
        setNewReviewRating(4.5);
        setIsReviewFormOpen(false);
        if (onReviewPublished) {
          await onReviewPublished();
        }
      } catch (err: unknown) {
        const maybeAxios = err as { response?: { data?: { detail?: string; message?: string } } };
        const serverMessage =
          maybeAxios?.response?.data?.detail ||
          maybeAxios?.response?.data?.message ||
          'No se pudo registrar la cata. Verificá si ya tenés una reseña para esta cosecha.';
        showToast(serverMessage);
      }
      return;
    }

    const authorName = user?.username?.trim() || 'Sommelier Coleccionista';
    const createdReview: WineReviewItem = {
      id: `rev-${Date.now()}`,
      userName: authorName,
      vintageYear: activeVintage.year,
      rating: newReviewRating,
      createdAt: new Date().toISOString().split('T')[0],
      comment: newReviewComment.trim(),
    };

    setSubmittedReviews((prev) => [createdReview, ...prev]);
    setNewReviewComment('');
    setNewReviewRating(4.5);
    setIsReviewFormOpen(false);
    showToast(`¡Tu cata (${newReviewRating.toFixed(1)} ★) fue publicada en la bitácora!`);
  };

  // Imagen activa a renderizar
  const displayImageUrl = isEditing
    ? activeVintageDraft.previewUrl
    : (activeVintage.imageId ? imageUrl(activeVintage.imageId, 'bottle')! : activeVintage.imageUrl!);

  return (
    <main className="w-full min-h-screen bg-[#0a0a0c] text-[#e5e1e4] antialiased selection:bg-[#722f37] selection:text-white pt-24 sm:pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Navegación de Retorno Minimalista */}
        <div className="mb-8">
          <Link
            to={ownerMode ? '/bodega/vinos' : '/dashboard#catalogo'}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
          >
            ← Volver a explorar
          </Link>
        </div>

        {/* 1. SECCIÓN PRINCIPAL: Grid de 2 Columnas Balanceado (5 y 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA (lg:col-span-5): Botella, Acciones & Bodega */}
          {/* ========================================================= */}
          <aside className="lg:col-span-5 flex flex-col lg:sticky lg:top-28 space-y-6">
            
            {/* Contenedor Visual de la Botella (Radio suave rounded-lg y borde sutil) */}
            <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-lg p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center group">
              <div
                aria-hidden="true"
                className="absolute w-72 h-80 rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-rose-950/5 to-transparent blur-2xl pointer-events-none group-hover:from-rose-900/30 transition-all duration-700"
              />

              {/* Escaparate de la botella */}
              <div className="w-full h-84 sm:h-96 flex items-center justify-center relative z-10 py-6">
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt={`${isEditing ? draftName : wine.name} Cosecha ${isEditing ? activeVintageDraft.year : activeVintage.year}`}
                    className="max-h-full object-contain filter drop-shadow-[0_28px_45px_rgba(0,0,0,0.95)] transition-transform duration-700 hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-xs border-y border-neutral-800/80">
                    <Wine className="w-10 h-10 text-rose-300/80 stroke-[1.25] mb-3" />
                    <span className="font-serif text-base text-neutral-200">Cosecha en Cava Privada</span>
                    <span className="text-xs text-neutral-500 mt-1 font-mono">
                      Añada {isEditing ? activeVintageDraft.year : activeVintage.year} certificada
                    </span>
                  </div>
                )}

                {/* Controles de Imagen en Modo Edición */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity z-20 rounded-lg">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      aria-label="Subir foto de botella"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Camera className="w-4 h-4 text-rose-300" />
                      <span>Cambiar foto</span>
                    </button>
                    {displayImageUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-mono underline"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción Principales */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSaveToCellar}
                  disabled={ownerMode || isNewMode ? true : undefined}
                  title={ownerMode ? 'No podés guardar tus propios vinos en tu cava personal' : undefined}
                  className={
                    ownerMode || isNewMode
                      ? 'h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-neutral-800/40 border border-neutral-700/40 text-neutral-500 flex items-center justify-center gap-2 w-full cursor-not-allowed opacity-60'
                      : 'h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50 flex items-center justify-center gap-2 w-full cursor-pointer'
                  }
                >
                  <BookmarkPlus className="w-4 h-4 text-rose-200" />
                  <span>Guardar en cava</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenReviewForm}
                  disabled={isNewMode}
                  className={
                    isNewMode
                      ? 'h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-300 flex items-center justify-center gap-2 w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-300 flex items-center justify-center gap-2 w-full cursor-pointer'
                  }
                >
                  <Edit3 className="w-4 h-4 text-neutral-400" />
                  <span>Escribir reseña</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="h-10 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm border border-neutral-700/60 bg-transparent hover:bg-neutral-800/40 text-neutral-300 flex items-center justify-center gap-2 w-full cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Compartir ficha</span>
              </button>
            </div>

            {/* Selector de Añadas Disponibles */}
            <div className="space-y-2 pt-2">
              <span className="text-xs tracking-widest text-neutral-400 uppercase font-medium block">
                Añadas disponibles
              </span>
              <div className={`flex flex-wrap gap-2${isEditing ? ' items-center' : ''}`}>
                {(isEditing ? Object.values(vintageDrafts) : wine.vintages).map((vintage) => {
                  const isSelected = vintage.year === selectedVintageYear;
                  return (
                    <button
                      key={vintage.id}
                      type="button"
                      onClick={() => setSelectedVintageYear(vintage.year)}
                      className={`rounded-sm px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800 border border-neutral-600 text-white'
                          : 'border border-neutral-800 hover:border-neutral-700 text-neutral-400'
                      }`}
                    >
                      <span>{vintage.year}</span>
                    </button>
                  );
                })}

                {/* Chip "+ Añada" en modo edición */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddVintageChip}
                    className="rounded-sm px-3 py-1.5 text-xs font-mono border border-dashed border-rose-500/60 text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añada</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bloque Espacioso de Bodega & Terruño */}
            <div className="rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-6 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block font-medium">
                Bodega Elaboradora
              </span>

              {wine.winery ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-2xl text-neutral-100 font-semibold tracking-tight hover:text-amber-200 transition-colors cursor-pointer flex items-center justify-between group/winery">
                      <span>{wine.winery.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover/winery:text-amber-200 transition-transform group-hover/winery:translate-x-0.5 group-hover/winery:-translate-y-0.5" />
                    </h3>
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5 font-sans mt-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-300" />
                      <span>{wine.winery.region}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2 text-xs font-mono text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span>Fundación histórica:</span>
                      <strong className="text-neutral-200 font-normal">{wine.winery.foundedYear}</strong>
                    </div>
                    <div className="flex items-center gap-2 text-amber-300/90 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Trazabilidad de origen verificada</span>
                    </div>
                  </div>

                  {wine.winery.websiteUrl && (
                    <div className="pt-1">
                      <a
                        href={wine.winery.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-white transition-colors font-mono tracking-wider"
                      >
                        <span>Sitio web oficial</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs text-neutral-400">
                  <p className="font-serif text-xl text-neutral-200">{wine.wineryNameText}</p>
                  <p className="text-neutral-500 text-[11px] font-sans">
                    Productor artesanal independiente registrado en AyVino.
                  </p>
                </div>
              )}
            </div>

            {/* Sello de trazabilidad al pie */}
            <p className="text-[11px] text-neutral-500 font-mono text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Trazabilidad y estiba enológica garantizada por AyVino</span>
            </p>
          </aside>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA (lg:col-span-7): Header, Specs & Varietal */}
          {/* ========================================================= */}
          <section className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* Header del Vino */}
            <header className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-rose-300 uppercase font-semibold">
                {isEditing ? (
                  <select
                    value={draftType}
                    onChange={(e) => {
                      setDraftType(e.target.value as EditorialWine['type']);
                      if (validationErrors.type) {
                        setValidationErrors((prev) => ({ ...prev, type: false }));
                      }
                    }}
                    className={`bg-[#121015] border ${
                      validationErrors.type ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-700'
                    } text-rose-300 text-xs font-mono uppercase tracking-widest px-2 py-1 rounded focus:border-rose-500 focus:outline-none cursor-pointer`}
                    aria-label="Seleccionar tipo de vino"
                  >
                    <option value="">Elegí un tipo</option>
                    <option value="Red">Tinto Noble</option>
                    <option value="White">Blanco & Mineral</option>
                    <option value="Rose">Rosado & Criolla</option>
                    <option value="Sparkling">Espumoso Método Tradicional</option>
                    <option value="Orange">Naranjo</option>
                  </select>
                ) : (
                  <span>{getWineTypeLabel(wine.type || 'Red')}</span>
                )}
                <span className="text-neutral-600" aria-hidden="true">·</span>
                {isEditing ? (
                  <span className="text-neutral-400 font-normal flex items-center gap-1.5">
                    <span>Cosecha</span>
                    <input
                      type="number"
                      value={activeVintageDraft.year ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? ('' as unknown as number) : Number(e.target.value);
                        updateActiveVintageDraft({ year: val });
                        if (validationErrors.year) {
                          setValidationErrors((prev) => ({ ...prev, year: false }));
                        }
                      }}
                      placeholder="Ej.: 2020"
                      className={`w-24 bg-[#121015] border ${
                        validationErrors.year ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-700'
                      } text-neutral-200 text-xs font-mono px-2 py-0.5 rounded focus:border-rose-500 focus:outline-none placeholder:text-neutral-600`}
                      aria-label="Año de cosecha"
                    />
                  </span>
                ) : (
                  <span className="text-neutral-400 font-normal">
                    Cosecha {activeVintage.year}
                  </span>
                )}
              </div>

              {isEditing ? (
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => {
                    setDraftName(e.target.value);
                    if (validationErrors.name) {
                      setValidationErrors((prev) => ({ ...prev, name: false }));
                    }
                  }}
                  placeholder="Ej.: Gran Reserva Malbec"
                  className={`w-full text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight bg-neutral-900/60 border ${
                    validationErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-neutral-700'
                  } rounded p-2 focus:border-rose-500 focus:outline-none placeholder:text-neutral-600`}
                  aria-label="Nombre del vino"
                />
              ) : (
                <h1 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight text-neutral-100 leading-tight">
                  {wine.name}
                </h1>
              )}

              <p className="text-sm text-neutral-400 font-sans">
                Elaborado por <span className="text-neutral-200 font-medium">{wine.winery?.name || wine.wineryNameText}</span>
              </p>
            </header>

            {/* Tira de Especificaciones Técnicas */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-3 border-y border-neutral-800/80">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Calificación
                </span>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {averageRating ? (
                    <>
                      <span className="text-sm font-medium text-neutral-200 font-mono">
                        {averageRating}
                      </span>
                      <span className="text-amber-400 text-xs">★</span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        ({reviews.length})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-neutral-500">Sin calificar</span>
                  )}
                </div>
              </div>

              {/* Graduación */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Graduación
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={activeVintageDraft.alcoholContent}
                    onChange={(e) => updateActiveVintageDraft({ alcoholContent: e.target.value })}
                    placeholder="14.5% Vol."
                    className="w-28 text-sm font-medium text-neutral-200 font-mono bg-neutral-900/60 border border-neutral-700 rounded px-2 py-0.5 focus:border-rose-500 focus:outline-none"
                    aria-label="Graduación alcohólica"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                    {activeVintage.alcoholContent}
                  </span>
                )}
              </div>

              {/* Servicio */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Servicio
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={activeVintageDraft.servingTemperature}
                    onChange={(e) => updateActiveVintageDraft({ servingTemperature: e.target.value })}
                    placeholder="16°C – 18°C"
                    className="w-28 text-sm font-medium text-neutral-200 font-mono bg-neutral-900/60 border border-neutral-700 rounded px-2 py-0.5 focus:border-rose-500 focus:outline-none"
                    aria-label="Temperatura de servicio"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                    {activeVintage.servingTemperature}
                  </span>
                )}
              </div>

              {/* Guarda */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
                  Guarda
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={activeVintageDraft.agingAdvice}
                    onChange={(e) => updateActiveVintageDraft({ agingAdvice: e.target.value })}
                    placeholder="10 a 15 años."
                    className="w-36 text-sm font-medium text-neutral-200 font-mono bg-neutral-900/60 border border-neutral-700 rounded px-2 py-0.5 focus:border-rose-500 focus:outline-none"
                    aria-label="Consejo de guarda"
                  />
                ) : (
                  <span className="text-sm font-medium text-neutral-200 font-mono whitespace-nowrap">
                    {getConciseAging(activeVintage.agingAdvice)}
                  </span>
                )}
              </div>
            </div>

            {/* Composición Varietal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                  Composición Varietal
                </h2>
                <span className="text-xs font-mono text-neutral-500">
                  Añada {isEditing ? activeVintageDraft.year : activeVintage.year}
                </span>
              </div>

              {isEditing ? (
                /* Editor de Blend en Modo Edición */
                <div className="space-y-3 bg-neutral-900/40 border border-neutral-800/80 p-4 rounded-lg">
                  <div className="space-y-2">
                    {activeVintageDraft.blend.length === 0 && (
                      <p className="text-xs text-neutral-500 font-mono py-1">
                        Agregá la primera uva
                      </p>
                    )}
                    {activeVintageDraft.blend.map((row) => (
                      <div key={row.id} className="flex items-center gap-3">
                        <select
                          value={row.grapeId}
                          onChange={(e) =>
                            handleUpdateGrape(row.id, {
                              grapeId: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          className="flex-1 bg-[#121015] border border-neutral-700 rounded px-3 py-1.5 text-xs font-mono text-neutral-200 focus:border-rose-500 focus:outline-none"
                          aria-label="Seleccionar uva"
                        >
                          <option value="">Elegí una cepa...</option>
                          {grapesCatalog.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.colorType})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1 w-24">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.percentage}
                            onChange={(e) =>
                              handleUpdateGrape(row.id, {
                                percentage: e.target.value === '' ? '' : Number(e.target.value),
                              })
                            }
                            className="w-full bg-[#121015] border border-neutral-700 rounded px-2 py-1.5 text-xs font-mono text-white text-right focus:border-rose-500 focus:outline-none"
                            aria-label="Porcentaje de uva"
                          />
                          <span className="text-xs font-mono text-neutral-400">%</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveGrape(row.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors rounded"
                          aria-label="Quitar uva"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                    <button
                      type="button"
                      onClick={handleAddGrape}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-300 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar uva</span>
                    </button>

                    <div className="text-xs font-mono">
                      <span>Total: </span>
                      <strong
                        className={
                          Math.abs(blendTotal - 100) < 0.001
                            ? 'text-emerald-400 font-bold'
                            : 'text-amber-400 font-bold'
                        }
                      >
                        {blendTotal}%
                      </strong>
                    </div>
                  </div>

                  {!blendValidation.isValid && activeVintageDraft.blend.length > 0 && (
                    <p className="text-[11px] text-amber-400 font-mono">
                      {blendValidation.errorMessage}
                    </p>
                  )}
                </div>
              ) : (
                /* Barra Visual Estándar en Modo Lectura */
                <>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-900 border border-neutral-800/60">
                    {activeVintage.grapes.map((grape, i) => {
                      const colors = ['bg-[#722f37]', 'bg-[#b43747]', 'bg-[#e3aa00]', 'bg-[#d8c1c2]'];
                      return (
                        <div
                          key={grape.variety}
                          style={{ width: `${grape.percentage}%` }}
                          className={`${colors[i % colors.length]} h-full transition-all duration-500`}
                          title={`${grape.variety}: ${grape.percentage}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
                    {activeVintage.grapes.map((grape, i) => {
                      const dotColors = ['text-rose-300', 'text-amber-400', 'text-rose-200'];
                      return (
                        <div key={grape.variety} className="flex items-center gap-2">
                          <span className={dotColors[i % dotColors.length]} aria-hidden="true">●</span>
                          <span className="text-neutral-200 font-medium">{grape.variety}</span>
                          <span className="font-mono text-neutral-400">{grape.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Descripción & Terruño */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                Descripción & Terruño
              </h2>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Describí las características de la etiqueta, su elaboración y terruño..."
                  className="w-full text-base text-neutral-300 leading-relaxed font-sans font-light bg-neutral-900/60 border border-neutral-700 rounded p-3 focus:border-rose-500 focus:outline-none"
                  aria-label="Descripción del vino"
                />
              ) : (
                <p className="text-base text-neutral-300 leading-relaxed font-sans font-light">
                  {wine.description}
                </p>
              )}
            </div>

            {/* Maridajes Sugeridos */}
            <div className={`space-y-3 pt-2${isEditing ? ' relative' : ''}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium tracking-wider uppercase text-neutral-400 font-mono">
                  Maridajes Sugeridos
                </h2>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">Armonías recomendadas</span>
              </div>

              {isEditing ? (
                /* Chips de Maridajes en Modo Edición con Panel Flotante Absoluto */
                <div className="space-y-3">
                  <div className={`flex flex-wrap gap-2${isEditing ? ' items-center' : ''}`}>
                    {draftPairings.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-200"
                      >
                        <span>{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePairing(p.id)}
                          className="text-neutral-500 hover:text-rose-400 transition-colors"
                          aria-label={`Quitar maridaje ${p.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIsPairingPanelOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-rose-500/60 text-xs font-mono text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar</span>
                    </button>
                  </div>

                  {/* Panel Flotante de Catálogo de Maridajes (Posición absoluta para no empujar contenido) */}
                  {isPairingPanelOpen && (
                    <div className="absolute left-0 top-full mt-2 z-40 w-full sm:w-96 bg-[#121015] border border-neutral-700 rounded-lg p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                        <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-semibold">
                          Catálogo de Maridajes
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsPairingPanelOpen(false)}
                          className="text-neutral-500 hover:text-white"
                          aria-label="Cerrar catálogo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={pairingSearch}
                            onChange={(e) => setPairingSearch(e.target.value)}
                            placeholder="Buscar plato o ingrediente..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        <select
                          value={pairingCategoryFilter}
                          onChange={(e) => setPairingCategoryFilter(e.target.value)}
                          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          <option value="all">Todas</option>
                          <option value="Meat">Carnes</option>
                          <option value="Fish">Pescados</option>
                          <option value="Cheese">Quesos</option>
                          <option value="Pasta">Pastas</option>
                          <option value="Vegetarian">Vegetarianos</option>
                          <option value="Dessert">Postres</option>
                        </select>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {filteredPairingsCatalog.length > 0 ? (
                          filteredPairingsCatalog.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddPairing(p)}
                              className="w-full text-left px-3 py-2 rounded bg-neutral-900/60 hover:bg-rose-950/40 border border-neutral-800/80 hover:border-rose-800/60 text-xs font-mono text-neutral-200 flex items-center justify-between group transition-colors"
                            >
                              <span>{p.name}</span>
                              <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-rose-300" />
                            </button>
                          ))
                        ) : (
                          <p className="text-center py-4 text-xs font-mono text-neutral-500">
                            No se encontraron maridajes en el catálogo.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Grilla Estándar en Modo Lectura */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wine.pairings.map((p, idx) => (
                    <div
                      key={p.id}
                      className="group rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-3.5 space-y-2 hover:border-rose-900/60 hover:bg-neutral-900/70 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-sm bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center group-hover:border-rose-300/40 transition-colors">
                          {getPairingIcon(p.icon)}
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                          Armonía 0{idx + 1}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-serif text-base text-neutral-100 font-semibold tracking-tight group-hover:text-amber-200 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-xs text-neutral-400 font-sans mt-0.5 leading-relaxed">
                          Afinidad enológica perfecta con la acidez y estructura tánica de esta añada.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </section>
        </div>

        {/* 2. SECCIÓN: Reseñas de la Comunidad (lg:col-span-7) + Perfil Sensorial (lg:col-span-5) */}
        <section id="reviews-editorial-section" className="border-t border-neutral-800/80 pt-12 mt-12">
          <div className="grid grid-cols-12 gap-10 items-start">
            
            {/* col-span-12 lg:col-span-7: Bitácora & Reseñas de la Comunidad */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-neutral-100 font-semibold tracking-tight">
                    Catas & Bitácora de la Comunidad
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">
                    {reviews.length} anotaciones enológicas verificadas
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen((prev) => !prev)}
                  disabled={isNewMode}
                  className={
                    isNewMode
                      ? 'rounded-sm border border-rose-800/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40 text-xs uppercase tracking-wider px-3.5 py-2 font-medium flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'rounded-sm border border-rose-800/60 bg-rose-950/30 text-rose-200 hover:bg-rose-900/40 text-xs uppercase tracking-wider px-3.5 py-2 font-medium flex items-center gap-2 cursor-pointer transition-colors'
                  }
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isReviewFormOpen ? 'Cerrar formulario' : '+ Registrar mi cata'}</span>
                </button>
              </div>

              {/* Formulario Interactivo */}
              {isReviewFormOpen && (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-lg space-y-5 animate-in fade-in duration-300 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-rose-900/80 border border-rose-700/60 text-rose-100 flex items-center justify-center text-xs font-serif font-bold">
                        {(user?.username || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <span className="text-neutral-200 font-medium block">
                          {user?.username || 'Miembro Sommelier'}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                          Registrando como usuario verificado · Cosecha {activeVintage.year}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-neutral-500 hover:text-neutral-300 p-1 rounded-sm"
                      aria-label="Cerrar formulario"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Puntuación Decimal Flotante */}
                  <div className="space-y-2 bg-[#0a0a0c]/60 p-4 rounded-lg border border-neutral-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-neutral-400 uppercase tracking-wider">
                        Calificación organoléptica
                      </span>
                      <span className="font-mono text-sm text-amber-300 font-bold">
                        {newReviewRating.toFixed(1)} / 5.0 ★
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starIndex) => {
                          const fillPercent = Math.max(0, Math.min(1, newReviewRating - (starIndex - 1))) * 100;
                          return <FractionalStar key={starIndex} fillPercent={fillPercent} />;
                        })}
                      </div>

                      <span className="text-[11px] font-mono text-neutral-500">
                        Deslizá con precisión de décimas
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(parseFloat(e.target.value))}
                      className="w-full accent-rose-700 h-1.5 bg-neutral-800 rounded-lg cursor-pointer mt-1"
                      aria-label="Seleccionar puntuación decimal"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-comment" className="block text-xs font-mono text-neutral-400 mb-1.5">
                      Nota de Cata & Sensaciones en boca
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={3}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Describí aromas primarios, textura en el paladar, estructura de taninos y guarda..."
                      className="w-full bg-[#0a0a0c] border border-neutral-800 text-neutral-200 text-xs p-3.5 rounded-sm focus:border-rose-700 focus:outline-none font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 transition-colors rounded-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="h-9 px-4 text-xs font-medium uppercase tracking-wider transition-colors rounded-sm bg-rose-900/40 border border-rose-700/60 text-rose-100 hover:bg-rose-800/50 flex items-center gap-2 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publicar Anotación</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Filtro minimalista por estrellas */}
              <div className="flex items-center justify-between py-2 border-b border-neutral-900 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500">Filtrar:</span>
                  {(
                    [
                      { id: 'all', label: 'Todas' },
                      { id: '5', label: '5 ★' },
                      { id: '4', label: '4 ★' },
                      { id: '3', label: '3 ★' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setStarFilter(tab.id);
                        setCurrentPage(1);
                      }}
                      className={`py-1 px-2.5 transition-colors cursor-pointer ${
                        starFilter === tab.id
                          ? 'border-b-2 border-rose-400 text-white font-medium'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px]">
                  Mostrando {displayedReviews.length} de {filteredReviews.length}
                </span>
              </div>

              {/* Feed de reseñas en tarjetas individuales limpias */}
              <div className="space-y-3">
                {displayedReviews.length > 0 ? (
                  displayedReviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="bg-neutral-900/40 border border-neutral-800/80 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-serif text-neutral-300 flex items-center justify-center font-semibold shrink-0">
                            {rev.userName.charAt(0)}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-neutral-200 block">
                              {rev.userName}
                            </span>
                            <span className="text-xs text-neutral-500 font-mono">
                              {rev.createdAt} · Cosecha {rev.vintageYear}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-400 text-xs whitespace-nowrap">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                className={i < Math.floor(rev.rating) ? 'text-amber-400' : 'text-neutral-700'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="font-mono text-neutral-200 text-xs font-semibold">
                            {rev.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                        {rev.comment}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs font-mono text-neutral-500 bg-neutral-900/20 border border-neutral-800/40 rounded-lg">
                    No hay reseñas registradas para el filtro seleccionado.
                  </div>
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-neutral-900 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className={`transition-colors cursor-pointer ${
                      currentPage === 1
                        ? 'text-neutral-700 cursor-not-allowed'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    ← Anterior
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-7 h-7 flex items-center justify-center transition-colors cursor-pointer rounded-sm ${
                          currentPage === idx + 1
                            ? 'bg-rose-900/60 border border-rose-700/60 text-white font-bold'
                            : 'text-neutral-500 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`transition-colors cursor-pointer rounded-sm px-2 py-1 ${
                      currentPage === totalPages
                        ? 'text-neutral-700 cursor-not-allowed'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>

            {/* col-span-12 lg:col-span-5: Perfil Sensorial Enológico (Radar Chart) */}
            <aside className="col-span-12 lg:col-span-5 rounded-lg bg-neutral-900/40 border border-neutral-800/80 p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-300" />
                  <h3 className="font-mono text-xs uppercase tracking-wider text-neutral-300 font-semibold">
                    Perfil Sensorial
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase">
                  Escala 1 a 5
                </span>
              </div>

              {/* Gráfico Radar SVG */}
              <WineSensoryRadarChart attributes={sensoryAttributes} />

              {/* Desglose de Atributos */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-800/80">
                {sensoryAttributes.map((attr) => (
                  <div key={attr.key} className="flex items-center justify-between text-xs font-mono text-neutral-300">
                    <span>{attr.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-900 to-rose-400 rounded-full"
                          style={{ width: `${(attr.value / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-neutral-200 font-semibold w-7 text-right">
                        {attr.value.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dictamen Enológico al pie del gráfico */}
              <div className="bg-[#0a0a0c]/80 border border-neutral-800/60 p-3 rounded-lg text-center">
                <span className="text-[11px] font-serif italic text-neutral-300 block">
                  "Expresión de gran tensión y concentración con nervio mineral característico."
                </span>
              </div>
            </aside>
          </div>
        </section>

        {/* Barra de Acciones Flotante (Solo ownerMode con vino real o isNewMode) */}
        {((ownerMode && isRealWine) || isNewMode) && (
          <WineEditBar
            isEditing={isEditing}
            isSaving={isSaving}
            hasChanges={hasChanges}
            onStartEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            isNewMode={isNewMode}
            onPublish={() => {
              if (onPublishNewWine) {
                return onPublishNewWine({
                  wine: {
                    ...wine,
                    name: draftName,
                    type: draftType,
                    description: draftDescription,
                  },
                  firstVintage: activeVintageDraft,
                  pairings: draftPairings,
                });
              }
              return handlePublish();
            }}
          />
        )}

        {/* Diálogo de confirmación en caso de que el vino ya exista con otra cosecha */}
        {confirmAddVintage && (
          <ConfirmDialog
            open={true}
            title="Etiqueta existente"
            message={`Ya tenés «${confirmAddVintage.name}» en tu catálogo. ¿Querés agregar la cosecha ${confirmAddVintage.year} a ese vino?`}
            confirmLabel="Agregar cosecha"
            tone="default"
            isLoading={isAddingVintage}
            onConfirm={() => void handleConfirmAddVintage()}
            onCancel={() => setConfirmAddVintage(null)}
          />
        )}

        {/* Notificación Toast Flotante */}
        {toast && (
          <aside
            role="status"
            aria-live="polite"
            className="fixed bottom-6 right-6 z-50 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 text-white text-xs px-5 py-3.5 shadow-2xl flex items-center gap-3 font-mono rounded-sm animate-in slide-in-from-bottom-5 duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            {toast.actionLabel && toast.actionTo && (
              <Link
                to={toast.actionTo}
                className="ml-2 text-[#ffb2b8] hover:text-white underline font-semibold transition-colors"
              >
                {toast.actionLabel} &rarr;
              </Link>
            )}
          </aside>
        )}
      </div>
    </main>
  );
}
