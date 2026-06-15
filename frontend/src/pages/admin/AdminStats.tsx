import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  UserCheck 
} from 'lucide-react';

export default function AdminStats() {
  // This would use useQuery with adminApi.getDashboardStats()
  const stats = {
    totalUsers: 0,
    totalMandates: 0,
    totalIntros: 0,
    pendingKycCount: 0,
    activeSubscribers: 0,
    revenueThisMonth: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Statistics</h1>
        <p className="text-muted-foreground">
          Overview of platform metrics and performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mandates</p>
                <p className="text-3xl font-bold">{stats.totalMandates}</p>
              </div>
              <Building2 className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Intros</p>
                <p className="text-3xl font-bold">{stats.totalIntros}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending KYC</p>
                <p className="text-3xl font-bold">{stats.pendingKycCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Subscribers</p>
                <p className="text-3xl font-bold">{stats.activeSubscribers}</p>
              </div>
              <UserCheck className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue (MTD)</p>
                <p className="text-3xl font-bold">₹{stats.revenueThisMonth.toLocaleString('en-IN')}</p>
              </div>
              <DollarSign className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts would go here */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-12">
            Revenue chart would be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
