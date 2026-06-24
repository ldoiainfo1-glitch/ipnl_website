import { useAuthStore } from '@/store/authStore';
import { useMandates } from '@/hooks/useMandates';
import { useIntros } from '@/hooks/useIntros';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '@/lib/features';
import {
  Building2,
  MessageSquare,
  Users,
  PlusCircle,
  Send,
  Inbox,
} from 'lucide-react';
import { formatIndianNumber, formatRelativeTime } from '@/utils/formatters';

const MODERATION_LABELS: Record<string, string> = {
  PENDING: 'Pending Approval',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const MODERATION_VARIANTS: Record<string, 'outline' | 'warning' | 'success' | 'destructive'> = {
  PENDING: 'warning',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myMandates, isLoadingMyMandates } = useMandates();
  const { sentIntros, receivedIntros, quotaStatus } = useIntros(FEATURES.introductions);

  const activeMandates = myMandates.filter((m) => m.status === 'ACTIVE' && m.moderationStatus === 'APPROVED');
  const quotaRemaining = (quotaStatus?.remaining || 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.companyName}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your network
        </p>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 ${FEATURES.introductions ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Mandates</p>
                <p className="text-3xl font-bold">{activeMandates.length}</p>
              </div>
              <Building2 className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        {FEATURES.introductions && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Intros Sent</p>
                    <p className="text-3xl font-bold">{sentIntros.length}</p>
                  </div>
                  <Send className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Intros Received</p>
                    <p className="text-3xl font-bold">{receivedIntros.length}</p>
                  </div>
                  <Inbox className="w-10 h-10 text-primary" />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Quota Remaining</p>
                <p className="text-3xl font-bold">{quotaRemaining}</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button onClick={() => navigate('/post-mandate')} className="h-auto py-4">
              <div className="flex flex-col items-center">
                <PlusCircle className="w-6 h-6 mb-2" />
                <span>Post New Mandate</span>
              </div>
            </Button>
            <Button onClick={() => navigate('/marketplace')} variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center">
                <Building2 className="w-6 h-6 mb-2" />
                <span>Browse Marketplace</span>
              </div>
            </Button>
            <Button onClick={() => navigate('/messages')} variant="outline" className="h-auto py-4">
              <div className="flex flex-col items-center">
                <MessageSquare className="w-6 h-6 mb-2" />
                <span>View Messages</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Recent Mandates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Recent Mandates</CardTitle>
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingMyMandates ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : myMandates.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">You haven't posted any mandates yet</p>
              <Button onClick={() => navigate('/post-mandate')}>
                Post Your First Mandate
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {myMandates.slice(0, 5).map((mandate) => (
                <div
                  key={mandate.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors"
                  onClick={() => navigate(`/mandates/${mandate.id}`)}
                >
                  {/* Company Logo */}
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
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
                        <Building2 className="w-6 h-6 text-muted-foreground" style={{ display: 'none' }} />
                      </>
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={mandate.type === 'BUY' ? 'success' : 'default'}>
                        {mandate.type}
                      </Badge>
                      <Badge variant={MODERATION_VARIANTS[mandate.moderationStatus || 'PENDING']}>
                        {MODERATION_LABELS[mandate.moderationStatus || 'PENDING']}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{mandate.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {mandate.user?.companyName || 'Unknown company'} • {mandate.city} • {formatRelativeTime(mandate.createdAt)}
                    </p>
                    {mandate.moderationStatus === 'REJECTED' && mandate.moderationNote && (
                      <p className="text-sm text-destructive mt-2">
                        Rejection reason: {mandate.moderationNote}
                      </p>
                    )}
                    {mandate.moderationStatus === 'UNDER_REVIEW' && mandate.moderationNote && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Review note: {mandate.moderationNote}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-primary">
                      {formatIndianNumber(mandate.ticketSize)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mandate.viewCount} views
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Introductions */}
      {FEATURES.introductions && <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Intros Received</CardTitle>
          </CardHeader>
          <CardContent>
            {receivedIntros.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No introductions received yet
              </p>
            ) : (
              <div className="space-y-3">
                {receivedIntros.slice(0, 3).map((intro) => (
                  <div
                    key={intro.id}
                    className="p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          intro.status === 'PENDING' ? 'warning' :
                          intro.status === 'ACCEPTED' ? 'success' : 'destructive'
                        }
                      >
                        {intro.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(intro.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">
                      From: {intro.sender?.companyName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Intros Sent</CardTitle>
          </CardHeader>
          <CardContent>
            {sentIntros.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No introductions sent yet
              </p>
            ) : (
              <div className="space-y-3">
                {sentIntros.slice(0, 3).map((intro) => (
                  <div
                    key={intro.id}
                    className="p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          intro.status === 'PENDING' ? 'warning' :
                          intro.status === 'ACCEPTED' ? 'success' : 'destructive'
                        }
                      >
                        {intro.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(intro.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">
                      To: {intro.receiver?.companyName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>}
    </div>
  );
}
