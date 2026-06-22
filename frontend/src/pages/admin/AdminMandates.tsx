import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Mandate, MandateStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle,
  Clock,
  EyeOff,
  RotateCcw,
  Trash2,
  XCircle,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatIndianNumber, formatRelativeTime } from '@/utils/formatters';
import { FEATURES } from '@/lib/features';

const STATUS_VARIANT: Record<MandateStatus, string> = {
  [MandateStatus.ACTIVE]: 'success',
  [MandateStatus.DRAFT]: 'secondary',
  [MandateStatus.CLOSED]: 'warning',
  [MandateStatus.EXPIRED]: 'destructive',
};

export default function AdminMandates() {
  const queryClient = useQueryClient();

  const { data: mandates = [], isLoading } = useQuery({
    queryKey: ['adminMandates'],
    queryFn: async () => {
      const res = await adminApi.getAllMandates();
      return res.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'; note?: string }) =>
      adminApi.reviewMandate(id, { status, note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandates'] }),
    onError: (error: any) => {
      alert(error?.detail || error?.message || 'Unable to update mandate review');
    },
  });

  const hideMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.hideMandate(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandates'] }),
    onError: (error: any) => {
      alert(error?.detail || error?.message || 'Unable to hide mandate');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMandate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandates'] }),
    onError: (error: any) => {
      alert(error?.detail || error?.message || 'Unable to delete mandate');
    },
  });

  const markUnderReview = (mandate: Mandate) => {
    const note = prompt(`Why is "${mandate.title}" still in progress?`);
    if (!note?.trim()) return;
    reviewMutation.mutate({ id: mandate.id, status: 'UNDER_REVIEW', note: note.trim() });
  };

  const rejectMandate = (mandate: Mandate) => {
    const note = prompt(`Rejection reason for "${mandate.title}":`);
    if (!note?.trim()) return;
    reviewMutation.mutate({ id: mandate.id, status: 'REJECTED', note: note.trim() });
  };

  const approveMandate = (mandate: Mandate) => {
    if (mandate.ownerKycStatus !== 'APPROVED') {
      alert('Mandate can only be approved after the owner KYC is APPROVED. Review this user in Admin > KYC Queue first.');
      return;
    }
    reviewMutation.mutate({ id: mandate.id, status: 'APPROVED' });
  };

  const hideMandate = (mandate: Mandate) => {
    const reason = prompt(`Reason for hiding "${mandate.title}" from the marketplace:`, 'Hidden by admin');
    if (!reason?.trim()) return;
    hideMutation.mutate({ id: mandate.id, reason: reason.trim() });
  };

  const deleteMandate = (mandate: Mandate) => {
    const confirmed = window.confirm(`Delete "${mandate.title}" permanently? This cannot be undone.`);
    if (!confirmed) return;
    deleteMutation.mutate(mandate.id);
  };

  const isMutating = reviewMutation.isPending || hideMutation.isPending || deleteMutation.isPending;

  const renderActions = (mandate: Mandate) => {
    if (mandate.moderationStatus === 'APPROVED') {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isMutating}
            onClick={() => hideMandate(mandate)}
            title="Hide from marketplace"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isMutating}
            onClick={() => deleteMandate(mandate)}
            title="Delete mandate"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      );
    }

    if (mandate.moderationStatus === 'REJECTED') {
      return (
        <>
          <Button
            size="sm"
            variant="default"
            disabled={isMutating || mandate.ownerKycStatus !== 'APPROVED'}
            onClick={() => approveMandate(mandate)}
            title={mandate.ownerKycStatus === 'APPROVED' ? 'Restore and approve mandate' : 'Approve owner KYC before restoring this mandate'}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isMutating}
            onClick={() => deleteMandate(mandate)}
            title="Delete mandate"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </>
      );
    }

    return (
      <>
        <Button
          size="sm"
          variant="outline"
          disabled={isMutating}
          onClick={() => markUnderReview(mandate)}
          title="Mark in progress"
        >
          <Clock className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="default"
          disabled={isMutating || mandate.ownerKycStatus !== 'APPROVED'}
          onClick={() => approveMandate(mandate)}
          title={mandate.ownerKycStatus === 'APPROVED' ? 'Approve mandate' : 'Approve owner KYC before approving this mandate'}
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={isMutating}
          onClick={() => rejectMandate(mandate)}
          title="Reject mandate"
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </>
    );
  };

  const liveCount = mandates.filter((m) => m.moderationStatus === 'APPROVED').length;
  const pendingCount = mandates.filter(
    (m) => m.moderationStatus === 'PENDING' || m.moderationStatus === 'UNDER_REVIEW',
  ).length;
  const rejectedCount = mandates.filter((m) => m.moderationStatus === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Mandates</h1>
        <p className="text-muted-foreground">Review and moderate all platform mandates</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{mandates.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending / In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">{liveCount}</p>
            <p className="text-sm text-muted-foreground">Live</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Mandates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading mandates...</p>
          ) : mandates.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No mandates to display</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mandates.map((mandate) => (
                <div
                  key={mandate.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={mandate.type === 'BUY' ? 'success' : 'default'}>
                        {mandate.type}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[mandate.status] as any}>
                        {mandate.status}
                      </Badge>
                      <Badge variant={mandate.moderationStatus === 'APPROVED' ? 'success' : mandate.moderationStatus === 'REJECTED' ? 'destructive' : 'warning'}>
                        {mandate.moderationStatus ?? 'PENDING'}
                      </Badge>
                      <Badge variant={mandate.ownerKycStatus === 'APPROVED' ? 'success' : 'outline'}>
                        Owner KYC: {mandate.ownerKycStatus ?? 'NOT_SUBMITTED'}
                      </Badge>
                      {mandate.isOffMarket && (
                        <Badge variant="outline">Off-Market</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{mandate.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {mandate.city}, {mandate.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {mandate.viewCount} views
                        {FEATURES.introductions && ` · ${mandate.introCount} intros`}
                      </span>
                      <span>{formatRelativeTime(mandate.createdAt)}</span>
                    </div>
                    {mandate.user && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        By: {mandate.user.companyName}
                      </p>
                    )}
                    {mandate.moderationNote && (
                      <p className="text-xs text-muted-foreground mt-1">Review note: {mandate.moderationNote}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary">
                      {formatIndianNumber(mandate.ticketSize)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(mandate.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {renderActions(mandate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

