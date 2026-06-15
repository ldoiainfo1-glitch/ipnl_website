import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIER_FEATURES } from '@/utils/constants';
import { UserTier } from '@/types';

export default function Settings() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and subscription
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Company Name</p>
            <p className="font-medium">{user?.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Mobile</p>
            <p className="font-medium">{user?.mobile}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              variant={
                user?.status === 'APPROVED'
                  ? 'success'
                  : user?.status === 'PENDING_VERIFICATION'
                  ? 'warning'
                  : 'destructive'
              }
            >
              {user?.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Current Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold">{user?.tier} Tier</p>
              <p className="text-muted-foreground">
                {TIER_FEATURES[user?.tier as UserTier]?.price || 'Free'}
              </p>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2">
              {user?.introQuotaUsed || 0} / {user?.introQuotaLimit || 0} Intros Used
            </Badge>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Features:</p>
            <ul className="space-y-1">
              {TIER_FEATURES[user?.tier as UserTier]?.features.map((feature, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {user?.tier !== 'ENTERPRISE' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Unlock more features and grow your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(TIER_FEATURES)
                .filter(([tier]) => tier !== user?.tier)
                .map(([tier, features]) => (
                  <Card key={tier}>
                    <CardContent className="p-4">
                      <h3 className="text-xl font-bold mb-2">{features.name}</h3>
                      <p className="text-2xl font-bold text-primary mb-4">
                        {features.price}
                      </p>
                      <ul className="space-y-2 mb-4">
                        {features.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            • {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full">
                        Upgrade to {features.name}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full">
            Change Password
          </Button>
          <Button variant="destructive" className="w-full">
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
