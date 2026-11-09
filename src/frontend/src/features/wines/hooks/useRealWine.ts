import { useState, useEffect, useCallback } from 'react';
import type { EditorialWine } from '../data/editorialWines';
import { apiWineToEditorial } from '../adapters/apiWineToEditorial';
import { getWineById, getWineVintages } from '../../winery/api/wineApi';
import { getWineryById } from '../../winery/api/wineryApi';
import { getWinePairings } from '../../winery/api/wineryWinePairingsApi';
import { getGrapes } from '../../winery/api/grapeApi';
import { getWineReviews } from '../api/reviewsApi';
import type {
  WineResponseDto,
  WineVintageResponseDto,
  WineryResponseDto,
  GrapeResponseDto,
} from '../../winery/types';
import type { ReviewResponseDto } from '../types/review';

export interface UseRealWineReturn {
  wine: EditorialWine | null;
  rawWine: WineResponseDto | null;
  rawVintages: WineVintageResponseDto[];
  rawWinery: WineryResponseDto | null;
  reviewsList: ReviewResponseDto[];
  isLoading: boolean;
  error: string | null;
  isNotFound: boolean;
  reload: () => Promise<void>;
  reloadReviews: () => Promise<void>;
}

export function useRealWine(wineIdInput: string | number | undefined): UseRealWineReturn {
  const numericId = typeof wineIdInput === 'number'
    ? wineIdInput
    : Number(wineIdInput);

  const isValidNumericId = !isNaN(numericId) && numericId > 0;

  const [wine, setWine] = useState<EditorialWine | null>(null);
  const [rawWine, setRawWine] = useState<WineResponseDto | null>(null);
  const [rawVintages, setRawVintages] = useState<WineVintageResponseDto[]>([]);
  const [rawWinery, setRawWinery] = useState<WineryResponseDto | null>(null);
  const [grapesCatalog, setGrapesCatalog] = useState<GrapeResponseDto[]>([]);
  const [pairingsList, setPairingsList] = useState<{ id: number; name: string; category?: string }[]>([]);
  const [reviewsList, setReviewsList] = useState<ReviewResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(isValidNumericId));
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const fetchWineData = useCallback(async (isMounted = { current: true }) => {
    if (!isValidNumericId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      // 1. Obtener la etiqueta de vino
      const wineData = await getWineById(numericId);
      if (!isMounted.current) return;
      setRawWine(wineData);

      // 2. Cargar en paralelo cosechas, bodega, maridajes, uvas y reseñas
      const [vintagesRes, wineryRes, pairingsRes, grapesRes, reviewsRes] = await Promise.allSettled([
        getWineVintages(numericId),
        wineData.wineryId ? getWineryById(wineData.wineryId) : Promise.resolve(null),
        getWinePairings(numericId),
        getGrapes({ pageSize: 200 }),
        getWineReviews(numericId, 1, 100),
      ]);

      if (!isMounted.current) return;

      const loadedVintages = vintagesRes.status === 'fulfilled' ? vintagesRes.value : [];
      const loadedWinery = wineryRes.status === 'fulfilled' ? wineryRes.value : null;
      const loadedPairings = pairingsRes.status === 'fulfilled' ? pairingsRes.value : [];
      const loadedGrapes = grapesRes.status === 'fulfilled' ? grapesRes.value : [];
      const loadedReviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value : [];

      setRawVintages(loadedVintages);
      setRawWinery(loadedWinery);
      setGrapesCatalog(loadedGrapes);
      setPairingsList(loadedPairings);
      setReviewsList(loadedReviews);

      const adapted = apiWineToEditorial(
        wineData,
        loadedVintages,
        loadedWinery,
        loadedPairings,
        loadedGrapes,
        loadedReviews
      );

      if (isMounted.current) {
        setWine(adapted);
      }
    } catch (err: unknown) {
      if (!isMounted.current) return;
      const maybeAxios = err as { response?: { status?: number; data?: { message?: string } } };
      if (maybeAxios?.response?.status === 404) {
        setIsNotFound(true);
        setError('La etiqueta solicitada no existe.');
      } else {
        setError('Ocurrió un error al cargar la información del vino.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [numericId, isValidNumericId]);

  const reloadReviews = useCallback(async () => {
    if (!isValidNumericId || !rawWine) return;
    try {
      const updatedReviews = await getWineReviews(numericId, 1, 100);
      setReviewsList(updatedReviews);
      setWine((prev) => {
        if (!prev) return null;
        return apiWineToEditorial(
          rawWine,
          rawVintages,
          rawWinery,
          pairingsList,
          grapesCatalog,
          updatedReviews
        );
      });
    } catch {
      // Manejo silencioso de recarga de reseñas
    }
  }, [numericId, isValidNumericId, rawWine, rawVintages, rawWinery, pairingsList, grapesCatalog]);

  const reload = useCallback(async () => {
    await fetchWineData();
  }, [fetchWineData]);

  useEffect(() => {
    const isMounted = { current: true };
    if (isValidNumericId) {
      void fetchWineData(isMounted);
    }
    return () => {
      isMounted.current = false;
    };
  }, [isValidNumericId, fetchWineData]);

  return {
    wine,
    rawWine,
    rawVintages,
    rawWinery,
    reviewsList,
    isLoading,
    error,
    isNotFound,
    reload,
    reloadReviews,
  };
}
