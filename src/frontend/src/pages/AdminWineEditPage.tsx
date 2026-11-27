import { useParams } from 'react-router-dom';
import { RealWineEditView } from '../features/wines';

export default function AdminWineEditPage() {
  const { wineId } = useParams<{ wineId: string }>();

  return <RealWineEditView wineId={wineId} backTo="/admin/vinos" />;
}
