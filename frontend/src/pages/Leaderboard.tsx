import { useState } from 'react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { Trophy, Star, Shield, CheckCircle2, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Leaderboard() {
  const [filter, setFilter] = useState<'all' | 'verified' | 'enterprise' | 'observer'>('all');
  const { leaderboard, isLoading } = useLeaderboard('all');

  const filters = [
    { value: 'all', label: 'ALL TIERS' },
    { value: 'enterprise', label: 'ENTERPRISE' },
    { value: 'verified', label: 'VERIFIED' },
    { value: 'observer', label: 'OBSERVER' },
  ];

  const filteredLeaderboard = leaderboard.filter(entry => {
    if (filter === 'all') return true;
    const tier = entry.user?.tier?.toUpperCase();
    return tier === filter.toUpperCase();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          TRUST LAYER
        </p>
        <div className="flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-serif font-bold">Member Ranking</h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Top verified members by reputation, calculated from verification strength, peer reviews, and approved marketplace activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Verification
          </div>
          <p className="text-xs text-muted-foreground mt-2">KYC approved members receive the trust base. Enterprise members receive a small tier lift.</p>
          <p className="text-xs font-semibold mt-3">Up to 35 points</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            Reviews
          </div>
          <p className="text-xs text-muted-foreground mt-2">Peer ratings use a weighted average, so review quality and review volume both matter.</p>
          <p className="text-xs font-semibold mt-3">Up to 50 points</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="w-4 h-4 text-primary" />
            Activity
          </div>
          <p className="text-xs text-muted-foreground mt-2">Approved live mandates add contribution points without rewarding unmoderated listings.</p>
          <p className="text-xs font-semibold mt-3">Up to 15 points</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value as any)}
            className={`
              px-6 py-2.5 rounded text-xs uppercase tracking-wider font-semibold transition-all
              ${filter === f.value
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-0 border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            Loading ranking...
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No members found for this tier
          </div>
        ) : (
          filteredLeaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className={`
                flex items-center px-6 py-5 transition-colors
                ${index !== filteredLeaderboard.length - 1 ? 'border-b border-border' : ''}
                hover:bg-secondary/30
              `}
            >
              {/* Rank Number */}
              <div className="w-16 h-16 flex items-center justify-center bg-blue-500/10 rounded text-2xl font-bold text-blue-400 mr-6">
                {entry.rank}
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-lg">{entry.user?.companyName}</h3>
                  <Badge 
                    variant="outline" 
                    className={`
                      text-xs uppercase tracking-wide
                      ${entry.user?.tier === 'ENTERPRISE' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-green-500 text-green-400'
                      }
                    `}
                  >
                    {entry.user?.tier === 'ENTERPRISE' ? 'ENTERPRISE' : 'KYC ✓'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">
                  {entry.user?.role?.replace(/_/g, ' ')} • {entry.user?.companyName} • INDIA
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                  <span>Verification {entry.scoreBreakdown.verification}</span>
                  <span>Reviews {entry.scoreBreakdown.reviews}</span>
                  <span>Activity {entry.scoreBreakdown.activity}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8">
                {/* Star Rating */}
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-lg">{entry.averageRating > 0 ? entry.averageRating.toFixed(1) : '—'}</span>
                  <span className="text-sm text-muted-foreground">({entry.reviewCount})</span>
                </div>

                {/* Shield Score */}
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-lg">{entry.reputationScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
