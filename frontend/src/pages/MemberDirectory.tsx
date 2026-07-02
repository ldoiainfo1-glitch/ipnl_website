import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMembers } from '@/hooks/useProfile';
import { MemberFilters, PropertyType, User, UserRole } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ASSET_CLASSES, USER_ROLES } from '@/utils/constants';
import { formatIndianNumber } from '@/utils/formatters';
import { ShieldCheck, Building2, Star, Search, SlidersHorizontal, X } from 'lucide-react';

function MemberCard({ user, onView }: { user: User; onView: () => void }) {
  const isVerified = user.kycStatus === 'APPROVED';

  return (
    <Card className="hover:border-primary transition-colors cursor-pointer" onClick={onView}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar / Logo */}
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
            {user.logo ? (
              <img src={user.logo} alt={user.companyName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{user.companyName}</h3>
              {isVerified && (
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {USER_ROLES.find((r) => r.value === user.role)?.label ?? user.role}
            </p>

            {(user.city || user.state) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {[user.city, user.state].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Asset preferences */}
            {user.assetPreferences && user.assetPreferences.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {user.assetPreferences.slice(0, 3).map((cls) => (
                  <Badge key={cls} variant="secondary" className="text-xs">
                    {ASSET_CLASSES.find((a) => a.value === cls)?.label ?? cls}
                  </Badge>
                ))}
                {user.assetPreferences.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.assetPreferences.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Ticket size */}
            {(user.ticketSizeMin || user.ticketSizeMax) && (
              <p className="text-xs text-muted-foreground mt-1">
                Ticket:{' '}
                {user.ticketSizeMin ? formatIndianNumber(user.ticketSizeMin) : '—'}
                {' – '}
                {user.ticketSizeMax ? formatIndianNumber(user.ticketSizeMax) : '—'}
              </p>
            )}
          </div>

          {/* Reputation */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              {user.reputationScore}
            </span>
            <Badge variant="outline" className="text-xs">{user.tier}</Badge>
          </div>
        </div>

        {user.companyDescription && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {user.companyDescription}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function MemberDirectory() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState<MemberFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const activeFilters: MemberFilters = {
    ...filters,
    search: search || undefined,
  };

  const { data: members = [], isLoading } = useMembers(activeFilters);

  const clearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const hasFilters =
    search ||
    filters.role ||
    filters.city ||
    filters.assetClass;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Member Directory</h1>
        <p className="text-muted-foreground">
          Discover verified real estate professionals on India Property Network Ltd.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name..."
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters((p) => !p)}
          className={showFilters ? 'border-primary text-primary' : ''}
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Role filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Role</label>
              <select
                value={filters.role ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, role: (e.target.value as UserRole) || undefined })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All roles</option>
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Asset class filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Asset Class</label>
              <select
                value={filters.assetClass ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, assetClass: (e.target.value as PropertyType) || undefined })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All asset classes</option>
                {ASSET_CLASSES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* City filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">City</label>
              <Input
                value={filters.city ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, city: e.target.value || undefined })
                }
                placeholder="e.g. Mumbai"
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active filter pills */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 text-sm">
          {search && (
            <Badge variant="secondary">
              Search: "{search}"
              <button className="ml-1 hover:text-destructive" onClick={() => setSearch('')}>×</button>
            </Badge>
          )}
          {filters.role && (
            <Badge variant="secondary">
              {USER_ROLES.find((r) => r.value === filters.role)?.label}
              <button className="ml-1 hover:text-destructive" onClick={() => setFilters({ ...filters, role: undefined })}>×</button>
            </Badge>
          )}
          {filters.assetClass && (
            <Badge variant="secondary">
              {ASSET_CLASSES.find((a) => a.value === filters.assetClass)?.label}
              <button className="ml-1 hover:text-destructive" onClick={() => setFilters({ ...filters, assetClass: undefined })}>×</button>
            </Badge>
          )}
          {filters.city && (
            <Badge variant="secondary">
              {filters.city}
              <button className="ml-1 hover:text-destructive" onClick={() => setFilters({ ...filters, city: undefined })}>×</button>
            </Badge>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading members...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No members found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{members.length} member{members.length !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                user={member}
                onView={() => navigate(`/members/${member.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
