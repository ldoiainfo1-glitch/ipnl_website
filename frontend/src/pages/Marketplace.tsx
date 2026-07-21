import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMandates } from '@/hooks/useMandates';
import { messagesApi } from '@/api/messages.api';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  MapPin, 
  TrendingUp, 
  Search,
  Filter,
  MessageSquare
} from 'lucide-react';
import { formatIndianNumber, formatRelativeTime, formatPartnerCategory } from '@/utils/formatters';
import { ASSET_CLASSES, INDIAN_CITIES, MANDATE_TYPES } from '@/utils/constants';
import { ShareOnWhatsAppButton } from '@/components/ShareOnWhatsAppButton';
import { Mandate, MandateFilters, MandateType, AssetClass } from '@/types';

export default function Marketplace() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<MandateFilters>({
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sentMandateIds, setSentMandateIds] = useState<Set<string>>(() => new Set());

  const { mandates, isLoading, meta } = useMandates(filters);

  const quickMessageMutation = useMutation({
    mutationFn: (mandate: Mandate) =>
      messagesApi.sendMessage({
        recipientId: mandate.userId,
        content: createOwnerMessage(mandate),
      }),
    onSuccess: (_response, mandate) => {
      setSentMandateIds((current) => new Set(current).add(mandate.id));
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const handleFilterChange = (key: keyof MandateFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleQuickMessage = async (event: React.MouseEvent<HTMLButtonElement>, mandate: Mandate) => {
    event.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (mandate.userId === user.id) {
      alert('This is your own mandate.');
      return;
    }

    try {
      await quickMessageMutation.mutateAsync(mandate);
    } catch (error: any) {
      alert(error.detail || 'Unable to send message to the mandate owner');
    }
  };

  const TYPE_BADGE_VARIANT: Record<string, 'success' | 'default' | 'secondary' | 'outline'> = {
  BUY: 'success',
  SELL: 'default',
  LOOKING_FOR: 'secondary',
  OFFERING: 'outline',
};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Browse exclusive off-market mandates
          </p>
        </div>
        <Button onClick={() => navigate('/post-mandate')} size="sm" className="shrink-0">
          Post Mandate
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search mandates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value as MandateType || undefined)}
              >
                <option value="">All Types</option>
                {MANDATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Asset Class</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.assetClass || ''}
                onChange={(e) => handleFilterChange('assetClass', e.target.value as AssetClass || undefined)}
              >
                <option value="">All Asset Classes</option>
                {ASSET_CLASSES.map((asset) => (
                  <option key={asset.value} value={asset.value}>
                    {asset.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              >
                <option value="">All Cities</option>
                {INDIAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {meta?.total || 0} mandates found
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading mandates...</p>
          </div>
        ) : mandates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No mandates found</p>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or be the first to post a mandate
              </p>
              <Button onClick={() => navigate('/post-mandate')}>
                Post Mandate
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {mandates.map((mandate) => (
              <Card 
                key={mandate.id}
                className="hover:border-primary cursor-pointer transition-colors"
                onClick={() => navigate(`/mandates/${mandate.id}`)}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    {/* Company Logo */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {mandate.user?.logo ? (
                        <>
                          <img
                            src={mandate.user.logo}
                            alt={mandate.user.companyName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <Building2 className="w-7 h-7 text-muted-foreground" style={{ display: 'none' }} />
                        </>
                      ) : (
                        <Building2 className="w-7 h-7 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge variant={TYPE_BADGE_VARIANT[mandate.type] || 'default'}>
                           {mandate.type}
                        </Badge>
                        <Badge variant="outline">{mandate.assetClass}</Badge>
                        <Badge variant="outline">{formatPartnerCategory(mandate.category)}</Badge>
                        {mandate.isOffMarket && (
                          <Badge variant="secondary">Off-Market</Badge>
                        )}
                      </div>

                      <h3 className="text-lg md:text-xl font-semibold mb-2">{mandate.title}</h3>
                      
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {mandate.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Building2 className="w-4 h-4 mr-1 shrink-0" />
                          <span className="truncate max-w-[140px]">{mandate.user?.companyName || 'Unknown company'}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-1 shrink-0" />
                          {mandate.city}, {mandate.state}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <TrendingUp className="w-4 h-4 mr-1 shrink-0" />
                          {mandate.viewCount} views
                        </div>
                        <div className="text-muted-foreground">
                          {formatRelativeTime(mandate.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right flex flex-col items-end gap-2">
                      <p className="text-xl md:text-2xl font-bold text-primary">
                        {formatIndianNumber(mandate.ticketSize)}
                      </p>
                      {mandate.ticketSizeMax && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          to {formatIndianNumber(mandate.ticketSizeMax)}
                        </p>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={(event) => handleQuickMessage(event, mandate)}
                        disabled={quickMessageMutation.isPending || mandate.userId === user?.id || sentMandateIds.has(mandate.id)}
                        title={mandate.userId === user?.id ? 'You own this mandate' : 'Send a message to this mandate owner'}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">{sentMandateIds.has(mandate.id) ? 'Message Sent' : 'Message Owner'}</span>
                      </Button>
                      <ShareOnWhatsAppButton
                        title={mandate.title}
                        url={`${window.location.origin}/mandates/${mandate.id}`}
                        message={`${mandate.title}\n\u{1F4B0} ${formatIndianNumber(mandate.ticketSize)}\n\u{1F4CD} ${mandate.city}\n\n For Full Details of this Deal on IPNL Touch this Link :${window.location.origin}/mandates/${mandate.id}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
            >
              Previous
            </Button>
            <div className="flex items-center px-4">
              Page {filters.page || 1} of {meta.totalPages}
            </div>
            <Button
              variant="outline"
              disabled={filters.page === meta.totalPages}
              onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function createOwnerMessage(mandate: Mandate): string {
  const ownerName = mandate.user?.companyName || 'there';
  return `Hi ${ownerName}, I am interested in ${mandate.title} and want to know more about this.`;
}