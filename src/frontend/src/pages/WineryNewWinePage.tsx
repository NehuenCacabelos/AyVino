import { useMemo } from 'react';
import { useWinery } from '../features/winery';
import WineDetailView from '../features/wines/components/WineDetailView';
import type { EditorialWine } from '../features/wines/data/editorialWines';

export default function WineryNewWinePage() {
  const { winery, isLoading } = useWinery();

  const emptyWine: EditorialWine = useMemo(() => {
    return {
      id: 'new',
      slug: 'nuevo',
      name: '',
      type: '' as unknown as EditorialWine['type'],
      description: '',
      wineryNameText: winery?.name || 'Tu Bodega',
      winery: winery
        ? {
            id: String(winery.id),
            name: winery.name,
            region: winery.location
              ? `${winery.location.regionName}, ${winery.location.stateName}`
              : 'Mendoza, Argentina',
            foundedYear: winery.foundationYear ?? 2000,
            websiteUrl: winery.website ?? undefined,
          }
        : null,
      vintages: [],
      pairings: [],
      reviews: [],
    };
  }, [winery]);

  if (isLoading && !winery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0c]">
        <div
          role="status"
          aria-label="Cargando plantilla..."
          className="w-7 h-7 border-2 border-neutral-800 border-t-[#6b1d28] rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    <WineDetailView
      wine={emptyWine}
      ownerMode={true}
      isNewMode={true}
      isRealWine={false}
    />
  );
}
