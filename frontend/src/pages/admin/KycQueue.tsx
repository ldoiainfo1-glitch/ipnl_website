import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { KycDocument, KycStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Eye, FileText, Clock } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

function RejectionModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold">Reject KYC Submission</h3>
        <div className="space-y-2">
          <Label htmlFor="rejectionReason">Rejection Reason *</Label>
          <Textarea
            id="rejectionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why the documents are being rejected..."
            rows={4}
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || isLoading}
            onClick={() => onConfirm(reason.trim())}
          >
            {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function KycDocumentLinks({ doc }: { doc: KycDocument }) {
  const fields: { label: string; url: string | undefined }[] = [
    { label: 'PAN Card', url: doc.panCard },
    { label: 'GST Certificate', url: doc.gstCertificate },
    { label: 'RERA Certificate', url: doc.reraCertificate },
    { label: 'Incorporation Cert.', url: doc.incorporationCertificate },
    { label: 'Address Proof', url: doc.addressProof },
  ].filter((f) => f.url);

  if (fields.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No documents uploaded</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {fields.map(({ label, url }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline border border-border rounded px-2 py-1"
        >
          <FileText className="w-3 h-3" />
          {label}
        </a>
      ))}
    </div>
  );
}

export default function KycQueue() {
  const queryClient = useQueryClient();
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  const {
    data: kycQueue = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminKycQueue'],
    queryFn: async () => {
      const res = await adminApi.getKycQueue();
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: adminApi.updateKycStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminKycQueue'] });
      setRejectingUserId(null);
    },
  });

  const handleApprove = (userId: string) => {
    updateStatusMutation.mutate({ userId, status: KycStatus.APPROVED });
  };

  const handleReject = (userId: string, reason: string) => {
    updateStatusMutation.mutate({
      userId,
      status: KycStatus.REJECTED,
      rejectionReason: reason,
    });
  };

  const statusBadgeVariant = (status: KycStatus) => {
    switch (status) {
      case KycStatus.APPROVED: return 'success';
      case KycStatus.UNDER_REVIEW: return 'warning';
      case KycStatus.SUBMITTED: return 'secondary';
      case KycStatus.REJECTED: return 'destructive';
    }
  };

  const pendingItems = kycQueue.filter(
    (d) => d.status === KycStatus.SUBMITTED || d.status === KycStatus.UNDER_REVIEW
  );
  const reviewedItems = kycQueue.filter(
    (d) => d.status === KycStatus.APPROVED || d.status === KycStatus.REJECTED
  );

  return (
    <div className="space-y-6">
      {rejectingUserId && (
        <RejectionModal
          isLoading={updateStatusMutation.isPending}
          onConfirm={(reason) => handleReject(rejectingUserId, reason)}
          onCancel={() => setRejectingUserId(null)}
        />
      )}

      <div>
        <h1 className="text-3xl font-bold">KYC Queue</h1>
        <p className="text-muted-foreground">
          Review and approve pending KYC verifications
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{pendingItems.length}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {kycQueue.filter((d) => d.status === KycStatus.APPROVED).length}
            </p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {kycQueue.filter((d) => d.status === KycStatus.REJECTED).length}
            </p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Verification ({pendingItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-muted-foreground text-sm py-6 text-center">Loading queue...</p>
          )}
          {error && (
            <p className="text-destructive text-sm py-6 text-center">
              Failed to load KYC queue.
            </p>
          )}
          {!isLoading && pendingItems.length === 0 && (
            <div className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium">All Clear!</p>
              <p className="text-muted-foreground text-sm">
                No pending KYC verifications.
              </p>
            </div>
          )}
          {pendingItems.map((doc) => (
            <div
              key={doc.id}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">User ID: {doc.userId}</span>
                    <Badge variant={statusBadgeVariant(doc.status) as any}>
                      {doc.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {doc.createdAt ? formatDate(doc.createdAt) : '—'}
                  </p>
                  <KycDocumentLinks doc={doc} />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => handleApprove(doc.userId)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => setRejectingUserId(doc.userId)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reviewed Items */}
      {reviewedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              Recently Reviewed ({reviewedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviewedItems.map((doc) => (
              <div
                key={doc.id}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">User ID: {doc.userId}</span>
                      <Badge variant={statusBadgeVariant(doc.status) as any}>
                        {doc.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reviewed: {doc.reviewedAt ? formatDate(doc.reviewedAt) : '—'}
                      {doc.reviewedBy && ` by ${doc.reviewedBy}`}
                    </p>
                    {doc.rejectionReason && (
                      <p className="text-xs text-destructive">
                        Reason: {doc.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
