import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Building2,
  TrendingUp,
  IndianRupee,
  CheckCircle,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { formatIndianNumber } from '@/utils/formatters';

function StatCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-amber-500' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <Icon
            className={`w-10 h-10 ${highlight ? 'text-amber-500' : 'text-primary'}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type RevenuePeriod = 'week' | 'month' | 'year';

export default function AdminStats() {
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');

  const { data: stats, isLoading: isLoadingStats, refetch } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: async () => {
      const res = await adminApi.getDashboardStats();
      return res.data;
    },
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['adminRevenue', revenuePeriod],
    queryFn: async () => {
      const res = await adminApi.getRevenueStats(revenuePeriod);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Statistics</h1>
          <p className="text-muted-foreground">Overview of platform metrics and performance</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {isLoadingStats ? (
        <p className="text-muted-foreground text-sm">Loading stats...</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={Users}
          />
          <StatCard
            label="Total Mandates"
            value={stats?.totalMandates ?? 0}
            icon={Building2}
          />
          <StatCard
            label="Total Introductions"
            value={stats?.totalIntros ?? 0}
            icon={TrendingUp}
          />
          <StatCard
            label="Pending KYC"
            value={stats?.pendingKycCount ?? 0}
            icon={CheckCircle}
            highlight={(stats?.pendingKycCount ?? 0) > 0}
          />
          <StatCard
            label="Active Subscribers"
            value={stats?.activeSubscribers ?? 0}
            icon={UserCheck}
          />
          <StatCard
            label="Revenue (MTD)"
            value={formatIndianNumber(stats?.revenueThisMonth ?? 0)}
            icon={IndianRupee}
          />
        </div>
      )}

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Revenue Breakdown</CardTitle>
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              {(['week', 'month', 'year'] as RevenuePeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setRevenuePeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    revenuePeriod === p
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'This Year'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingRevenue ? (
            <p className="text-center text-muted-foreground py-8">Loading revenue data...</p>
          ) : revenueData ? (
            <div className="space-y-4">
              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <span className="font-medium">Total Revenue</span>
                <span className="text-2xl font-bold text-primary">
                  {formatIndianNumber(revenueData.total)}
                </span>
              </div>

              {/* By tier */}
              <div>
                <p className="text-sm font-medium mb-3">By Subscription Tier</p>
                <div className="space-y-2">
                  {Object.entries(revenueData.byTier).map(([tier, amount]) => {
                    const pct =
                      revenueData.total > 0
                        ? Math.round((amount / revenueData.total) * 100)
                        : 0;
                    return (
                      <div key={tier} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{tier}</span>
                          <span className="font-medium">
                            {formatIndianNumber(amount)}{' '}
                            <span className="text-muted-foreground">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trend */}
              {revenueData.trend.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-3">Trend</p>
                  <div className="space-y-1">
                    {revenueData.trend.slice(-7).map((point) => (
                      <div
                        key={point.date}
                        className="flex items-center justify-between text-sm text-muted-foreground"
                      >
                        <span>{point.date}</span>
                        <span className="font-medium text-foreground">
                          {formatIndianNumber(point.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No revenue data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

