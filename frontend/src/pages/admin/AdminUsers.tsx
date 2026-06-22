import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { KycDocument, User, UserStatus, UserTier, UserFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, Ban, CheckCircle, Building2, Eye, FileText } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

type KycDocumentField = 'panCard' | 'gstCertificate' | 'reraCertificate' | 'incorporationCertificate' | 'addressProof';

function KycDocumentLinks({ doc }: { doc: KycDocument }) {
  const fields = ([
    { field: 'panCard', label: 'PAN Card', url: doc.panCard },
    { field: 'gstCertificate', label: 'GST Certificate', url: doc.gstCertificate },
    { field: 'reraCertificate', label: 'RERA Certificate', url: doc.reraCertificate },
    { field: 'incorporationCertificate', label: 'Incorporation Cert.', url: doc.incorporationCertificate },
    { field: 'addressProof', label: 'Address Proof', url: doc.addressProof },
  ] satisfies { field: KycDocumentField; label: string; url: string | undefined }[]).filter((field) => field.url);

  const openDocument = async (field: KycDocumentField) => {
    try {
      const res = await adminApi.getKycDocumentViewUrl(doc.userId, field);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Unable to open this document. Please refresh the page and try again.');
    }
  };

  if (fields.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No KYC documents uploaded.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {fields.map(({ field, label }) => (
        <button
          type="button"
          key={field}
          onClick={() => openDocument(field)}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline border border-border rounded px-2 py-1"
        >
          <FileText className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

const STATUS_VARIANT: Record<UserStatus, string> = {
  [UserStatus.APPROVED]: 'success',
  [UserStatus.PENDING_VERIFICATION]: 'warning',
  [UserStatus.REJECTED]: 'destructive',
  [UserStatus.SUSPENDED]: 'destructive',
};

const TIER_VARIANT: Record<UserTier, string> = {
  [UserTier.OBSERVER]: 'secondary',
  [UserTier.VERIFIED]: 'default',
  [UserTier.ENTERPRISE]: 'success',
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UserFilters>({});
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers', filters, search],
    queryFn: async () => {
      const res = await adminApi.getUsers({ ...filters, search: search || undefined });
      return res.data;
    },
  });

  const { data: selectedUserDetail, isLoading: isLoadingSelectedUser } = useQuery({
    queryKey: ['adminVerificationDetail', selectedUserId],
    queryFn: async () => {
      const res = await adminApi.getUserVerificationDetail(selectedUserId!);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.suspendUser(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const upgradeTierMutation = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: string }) =>
      adminApi.updateUserTier(id, tier),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }),
  });

  const handleSuspend = (user: User) => {
    const reason = prompt(`Reason for suspending "${user.companyName}":`);
    if (reason?.trim()) {
      suspendMutation.mutate({ id: user.id, reason: reason.trim() });
    }
  };

  const handleUpgrade = (user: User) => {
    const tier = prompt(
      `Set tier for "${user.companyName}" (OBSERVER / VERIFIED / ENTERPRISE):`,
      user.tier
    );
    if (tier && ['OBSERVER', 'VERIFIED', 'ENTERPRISE'].includes(tier.toUpperCase())) {
      upgradeTierMutation.mutate({ id: user.id, tier: tier.toUpperCase() });
    }
  };

  const isMutating =
    suspendMutation.isPending ||
    activateMutation.isPending ||
    upgradeTierMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground">View and manage all platform users</p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by company name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filters.tier ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, tier: (e.target.value as UserTier) || undefined })
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Tiers</option>
              <option value="OBSERVER">Observer</option>
              <option value="VERIFIED">Verified</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select
              value={filters.status ?? ''}
              onChange={(e) =>
                setFilters({ ...filters, status: (e.target.value as UserStatus) || undefined })
              }
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_VERIFICATION">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>
            All Users{' '}
            {!isLoading && (
              <span className="text-muted-foreground text-base font-normal">
                ({users.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                    {user.logo ? (
                      <img src={user.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{user.companyName}</span>
                      {user.kycStatus === 'APPROVED' && (
                        <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.role.replace(/_/g, ' ')} · Joined {formatDate(user.createdAt)}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <Badge variant={TIER_VARIANT[user.tier] as any}>{user.tier}</Badge>
                    <Badge variant={STATUS_VARIANT[user.status] as any}>
                      {user.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      onClick={() => setSelectedUserId(user.id)}
                      title="View KYC documents"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      KYC
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isMutating}
                      onClick={() => handleUpgrade(user)}
                      title="Change tier"
                    >
                      Tier
                    </Button>
                    {user.status === UserStatus.SUSPENDED ? (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={isMutating}
                        onClick={() => activateMutation.mutate(user.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isMutating}
                        onClick={() => handleSuspend(user)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle>KYC Dossier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!selectedUserId && (
            <p className="text-sm text-muted-foreground">Select KYC on any user to view uploaded documents.</p>
          )}
          {isLoadingSelectedUser && (
            <p className="text-sm text-muted-foreground">Loading KYC dossier...</p>
          )}
          {selectedUserDetail && (
            <>
              <div className="border border-border rounded-md p-3 space-y-1">
                <p className="font-medium text-sm">{selectedUserDetail.user.companyName}</p>
                <p className="text-xs text-muted-foreground">{selectedUserDetail.user.email}</p>
                <p className="text-xs text-muted-foreground">KYC: {selectedUserDetail.user.kycStatus}</p>
              </div>
              {selectedUserDetail.kyc ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Uploaded Documents</p>
                  <KycDocumentLinks doc={selectedUserDetail.kyc} />
                  {selectedUserDetail.kyc.reviewNote && (
                    <p className="text-xs text-amber-600">Review note: {selectedUserDetail.kyc.reviewNote}</p>
                  )}
                  {selectedUserDetail.kyc.rejectionReason && (
                    <p className="text-xs text-destructive">Rejection reason: {selectedUserDetail.kyc.rejectionReason}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No KYC record yet.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

