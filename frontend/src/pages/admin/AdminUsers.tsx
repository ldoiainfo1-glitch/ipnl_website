import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { User, UserStatus, UserTier, UserFilters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, Ban, CheckCircle, Building2 } from 'lucide-react';
import { formatDate } from '@/utils/formatters';

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

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers', filters, search],
    queryFn: async () => {
      const res = await adminApi.getUsers({ ...filters, search: search || undefined });
      return res.data;
    },
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
    </div>
  );
}

