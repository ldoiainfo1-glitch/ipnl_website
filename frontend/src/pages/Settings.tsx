import { useAuthStore } from '@/store/authStore';
import { useMyProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { TIER_FEATURES } from '@/utils/constants';
import { UserTier } from '@/types';

export default function Settings() {
  const { user } = useAuthStore();
  const { profile } = useMyProfile();
  const effectiveUser = profile ?? user;

  const handleUpgrade = (tier: string) => {
    alert(`Upgrade to ${tier} tier\n\nIn production, this would:\n- Redirect to payment gateway\n- Process subscription payment\n- Update your account tier\n\nContact: sales@ipnl.com for Enterprise`);
  };

  // const handleChangePassword = () => {
  //   alert('Change Password feature\n\nIn production, this would:\n- Send a password reset email\n- Or show a password change form');
  // };

  const handleDeleteAccount = () => {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmed) {
      alert('Account deletion would be processed here.\n\nIn production, this would:\n- Mark account for deletion\n- Send confirmation email\n- Schedule data removal');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
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
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
              {effectiveUser?.logo ? (
                <img src={effectiveUser.logo} alt={effectiveUser.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-semibold text-lg">{effectiveUser?.companyName || '—'}</p>
            </div>
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Membership Tiers</CardTitle>
          <CardDescription>
            Choose the plan that fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(TIER_FEATURES).map(([tier, features]) => {
              const isCurrentTier = tier === user?.tier;
              return (
                <Card 
                  key={tier} 
                  className={isCurrentTier ? 'border-primary border-2' : ''}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold">{features.name}</h3>
                      {isCurrentTier && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-amber-500 mb-4">
                      {features.price}
                    </p>
                    <ul className="space-y-2 mb-6 min-h-[120px]">
                      {features.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full font-semibold ${
                        isCurrentTier 
                          ? 'bg-secondary text-muted-foreground cursor-not-allowed' 
                          : 'bg-amber-500 hover:bg-amber-600 text-black'
                      }`}
                      onClick={() => !isCurrentTier && handleUpgrade(features.name)}
                      disabled={isCurrentTier}
                    >
                      {isCurrentTier ? 'Current Plan' : `Upgrade to ${features.name}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* <Button 
            variant="outline" 
            className="w-full"
            onClick={handleChangePassword}
          >
            Change Password
          </Button> */}
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
