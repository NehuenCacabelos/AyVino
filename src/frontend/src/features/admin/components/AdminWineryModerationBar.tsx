import { useState } from 'react';
import { Check, Shield, User, X } from 'lucide-react';
import type { WineryPublicProfileResponseDto } from '../../winery/types/publicCatalog';
import { changeWineryStatus } from '../api/adminWineriesApi';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';
import { AdminToastProvider, useAdminToast } from './AdminToast';
import ConfirmDialog from './ConfirmDialog';
import StatusBadge from './StatusBadge';

export interface AdminWineryModerationBarProps {
  profile: WineryPublicProfileResponseDto;
  onUpdated: () => Promise<void>;
}

function AdminWineryModerationBarContent({
  profile,
  onUpdated,
}: AdminWineryModerationBarProps) {
  const toast = useAdminToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const status = profile.status;
  const canApprove = status === 'Pending' || status === 'Rejected';
  const canReject = status === 'Pending' || status === 'Approved';
  const isApproved = status === 'Approved';

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await changeWineryStatus(profile.id, 'Approved');
      toast.success('Bodega aprobada exitosamente.');
      await onUpdated();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    setIsProcessing(true);
    try {
      await changeWineryStatus(profile.id, 'Rejected');
      toast.success(isApproved ? 'Bodega suspendida.' : 'Bodega rechazada.');
      setRejectDialogOpen(false);
      await onUpdated();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        data-testid="admin-winery-moderation-bar"
        className="w-full bg-[#161219] border-b border-rose-900/40 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-neutral-200"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-rose-300 font-semibold">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              Vista Admin
            </span>

            <StatusBadge status={profile.status} />

            {profile.userId != null && (
              <span className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-300 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                <User className="w-3 h-3 text-neutral-400" />
                <span>{`Usuario #${profile.userId}`}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => void handleApprove()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aprobar</span>
              </button>
            )}

            {canReject && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setRejectDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-900/60 bg-amber-950/50 text-amber-300 hover:bg-amber-900/60 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Rechazar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={rejectDialogOpen}
        title={isApproved ? '¿Suspender bodega?' : '¿Rechazar bodega?'}
        message={
          isApproved
            ? 'La bodega dejará de ser visible para el público y su dueño no podrá publicar vinos. Podés volver a aprobarla cuando quieras.'
            : `¿Estás seguro de que deseás rechazar la bodega "${profile.name}"?`
        }
        confirmLabel={isApproved ? 'Suspender' : 'Rechazar'}
        tone="default"
        isLoading={isProcessing}
        onConfirm={() => void handleConfirmReject()}
        onCancel={() => setRejectDialogOpen(false)}
      />
    </>
  );
}

/**
 * Franja superior de moderación para administradores en `/bodegas/:id`.
 * Incluye su propio `AdminToastProvider` ya que vive fuera de `AdminLayout`.
 */
export default function AdminWineryModerationBar(props: AdminWineryModerationBarProps) {
  return (
    <AdminToastProvider>
      <AdminWineryModerationBarContent {...props} />
    </AdminToastProvider>
  );
}
