import { useParams } from 'react-router-dom';
import { useWinery } from '../features/winery';
import { RealWineEditView } from '../features/wines';

export default function WineryWineDetailPage() {
  const { wineId } = useParams<{ wineId: string }>();
  const { winery } = useWinery();

  return (
    <RealWineEditView
      wineId={wineId}
      backTo="/bodega/vinos"
      ownerCheckWineryId={winery?.id}
    />
  );
}
