import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { KycDocument, KycStatus, User, UserStatus, UserTier, UserFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, Ban, CheckCircle, Building2, Eye, FileText, X, Trash2 } from 'lucide-react';
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

const KYC_VARIANT: Record<KycStatus, string> = {
  [KycStatus.NOT_SUBMITTED]: 'outline',
  [KycStatus.SUBMITTED]: 'secondary',
  [KycStatus.UNDER_REVIEW]: 'warning',
  [KycStatus.APPROVED]: 'success',
  [KycStatus.REJECTED]: 'destructive',
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UserFilters>({});
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dangerUser, setDangerUser] = useState<User | null>(null);

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

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.deleteUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setDangerUser(null);
    },
    onError: (error: any) => {
      alert(error?.detail || error?.message || 'Unable to delete user');
    },
  });

  const handleSuspend = (user: User) => {
    const reason = prompt(`Reason for suspending "${user.companyName}":`);
    if (reason?.trim()) {
      suspendMutation.mutate({ id: user.id, reason: reason.trim() });
      setDangerUser(null);
    }
  };

  const handlePermanentDelete = (user: User) => {
    const typed = prompt(`Type DELETE to permanently delete "${user.companyName}" from the database. This cannot be undone.`);
    if (typed !== 'DELETE') return;
    const reason = prompt('Optional audit note for this deletion:', 'Deleted by admin') ?? '';
    deleteMutation.mutate({ id: user.id, reason: reason.trim() });
  };

  const isMutating =
    suspendMutation.isPending ||
    activateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border">
              <CardTitle>KYC Dossier</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedUserId(null)}
                title="Close KYC dossier"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto p-5">
              {isLoadingSelectedUser && (
                <p className="text-sm text-muted-foreground">Loading KYC dossier...</p>
              )}
              {selectedUserDetail && (
                <>
                  <div className="border border-border rounded-md p-4 space-y-1">
                    <p className="font-medium text-sm">{selectedUserDetail.user.companyName}</p>
                    <p className="text-xs text-muted-foreground">{selectedUserDetail.user.email}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant={KYC_VARIANT[selectedUserDetail.user.kycStatus] as any}>
                        KYC: {selectedUserDetail.user.kycStatus.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant={STATUS_VARIANT[selectedUserDetail.user.status] as any}>
                        Account: {selectedUserDetail.user.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  {selectedUserDetail.kyc ? (
                    <div className="space-y-3">
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
      )}

      {dangerUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border">
              <CardTitle>Account Action</CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={() => setDangerUser(null)} title="Close">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="font-medium">{dangerUser.companyName}</p>
                <p className="text-sm text-muted-foreground">{dangerUser.email}</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {dangerUser.status === UserStatus.SUSPENDED ? (
                  <Button
                    type="button"
                    variant="default"
                    disabled={isMutating}
                    onClick={() => {
                      activateMutation.mutate(dangerUser.id);
                      setDangerUser(null);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Account
                  </Button>
                ) : (
                  <Button type="button" variant="outline" disabled={isMutating} onClick={() => handleSuspend(dangerUser)}>
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend Account
                  </Button>
                )}
                <Button type="button" variant="destructive" disabled={isMutating} onClick={() => handlePermanentDelete(dangerUser)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Suspend keeps the user record and blocks activity. Delete permanently removes the auth user and related profile data.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
      <Card>
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
            <div>
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="w-[27%] py-3 pr-3 text-left font-medium">Company</th>
                    <th className="w-[12%] py-3 px-2 text-left font-medium">Role</th>
                    <th className="w-[10%] py-3 px-2 text-left font-medium">Tier</th>
                    <th className="w-[13%] py-3 px-2 text-left font-medium">KYC</th>
                    <th className="w-[16%] py-3 px-2 text-left font-medium">Account</th>
                    <th className="w-[10%] py-3 px-2 text-left font-medium">Joined</th>
                    <th className="w-[12%] py-3 pl-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 align-middle">
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                            {user.logo ? (
                              <img src={user.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/members/${user.id}`)}
                                className="font-semibold truncate text-left hover:text-primary hover:underline"
                                title="Open member profile"
                              >
                                {user.companyName}
                              </button>
                              {user.kycStatus === 'APPROVED' && (
                                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-muted-foreground">
                        {user.role.replace(/_/g, ' ')}
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant={TIER_VARIANT[user.tier] as any} className="whitespace-nowrap">{user.tier}</Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant={KYC_VARIANT[user.kycStatus] as any} className="whitespace-nowrap">{user.kycStatus.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant={STATUS_VARIANT[user.status] as any} className="whitespace-nowrap">{user.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-4 px-2 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 pl-2">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" disabled={isMutating} onClick={() => setSelectedUserId(user.id)} title="View KYC documents">
                            <Eye className="w-4 h-4 mr-1" />
                            KYC
                          </Button>
                          <Button size="sm" variant="destructive" disabled={isMutating} onClick={() => setDangerUser(user)} title="Suspend or delete user">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

