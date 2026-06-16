import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Mandate, MandateStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Eye,
  EyeOff,
  Trash2,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { formatDate, formatIndianNumber, formatRelativeTime } from '@/utils/formatters';

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

  const hideMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.hideMandate(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandates'] }),
  });

  const unhideMutation = useMutation({
    mutationFn: (id: string) => adminApi.unhideMandate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandates'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteMandate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminMandates'] }),
  });

  const handleHide = (mandate: Mandate) => {
    const reason = prompt(`Reason for hiding "${mandate.title}":`);
    if (reason?.trim()) {
      hideMutation.mutate({ id: mandate.id, reason: reason.trim() });
    }
  };

  const handleDelete = (mandate: Mandate) => {
    if (confirm(`Permanently delete "${mandate.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(mandate.id);
    }
  };

  const isMutating =
    hideMutation.isPending || unhideMutation.isPending || deleteMutation.isPending;

  const activeCount = mandates.filter((m) => m.status === MandateStatus.ACTIVE).length;
  const closedCount = mandates.filter(
    (m) => m.status === MandateStatus.CLOSED || m.status === MandateStatus.EXPIRED
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Mandates</h1>
        <p className="text-muted-foreground">Review and moderate all platform mandates</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{mandates.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-500">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{closedCount}</p>
            <p className="text-sm text-muted-foreground">Closed / Expired</p>
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
                        {mandate.viewCount} views · {mandate.introCount} intros
                      </span>
                      <span>{formatRelativeTime(mandate.createdAt)}</span>
                    </div>
                    {mandate.user && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        By: {mandate.user.companyName}
                      </p>
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
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      onClick={() =>
                        mandate.status === MandateStatus.ACTIVE
                          ? handleHide(mandate)
                          : unhideMutation.mutate(mandate.id)
                      }
                      title={mandate.status === MandateStatus.ACTIVE ? 'Hide mandate' : 'Unhide mandate'}
                    >
                      {mandate.status === MandateStatus.ACTIVE ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isMutating}
                      onClick={() => handleDelete(mandate)}
                      title="Delete mandate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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

