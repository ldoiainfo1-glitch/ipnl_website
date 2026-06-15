import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function AdminUsers() {
  // This would use useQuery with adminApi.getUsers()
  const users = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <p className="text-muted-foreground">
          View and manage all platform users
        </p>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-10" />
            </div>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All Tiers</option>
              <option value="OBSERVER">Observer</option>
              <option value="VERIFIED">Verified</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING_VERIFICATION">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No users to display
            </p>
          ) : (
            <div className="space-y-3">
              {/* User items would be mapped here */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
