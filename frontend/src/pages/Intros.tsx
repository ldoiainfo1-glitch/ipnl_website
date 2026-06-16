import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntros } from '@/hooks/useIntros';
import { Introduction, IntroStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/utils/formatters';

const STATUS_CONFIG: Record<
  IntroStatus,
  { label: string; variant: 'success' | 'destructive' | 'secondary' | 'warning'; icon: React.ReactNode }
> = {
  [IntroStatus.PENDING]: {
    label: 'Pending',
    variant: 'warning',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  [IntroStatus.ACCEPTED]: {
    label: 'Accepted',
    variant: 'success',
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  [IntroStatus.DECLINED]: {
    label: 'Declined',
    variant: 'destructive',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  [IntroStatus.EXPIRED]: {
    label: 'Expired',
    variant: 'secondary',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

function StatusBadge({ status }: { status: IntroStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant as any} className="flex items-center gap-1 w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
}

function ReceivedIntroCard({
  intro,
  onAccept,
  onDecline,
  isResponding,
}: {
  intro: Introduction;
  onAccept: () => void;
  onDecline: () => void;
  isResponding: boolean;
}) {
  const navigate = useNavigate();
  const isPending = intro.status === IntroStatus.PENDING;

  return (
    <Card className={isPending ? 'border-primary/50' : ''}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold truncate">
                {intro.sender?.companyName ?? 'Unknown Sender'}
              </span>
              <StatusBadge status={intro.status} />
            </div>

            <p className="text-xs text-muted-foreground">
              {intro.sender?.role?.replace(/_/g, ' ')}
            </p>

            {intro.mandate && (
              <button
                className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                onClick={() => navigate(`/mandates/${intro.mandateId}`)}
              >
                <ExternalLink className="w-3 h-3" />
                {intro.mandate.title}
              </button>
            )}
          </div>

          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>{formatRelativeTime(intro.createdAt)}</p>
            <p className="mt-0.5">Expires {formatDate(intro.expiresAt)}</p>
          </div>
        </div>

        {intro.message && (
          <div className="bg-secondary rounded-md p-3 text-sm text-foreground">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Message</p>
            <p className="whitespace-pre-wrap">{intro.message}</p>
          </div>
        )}

        {intro.respondedAt && (
          <p className="text-xs text-muted-foreground">
            Responded on {formatDate(intro.respondedAt)}
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          {isPending && (
            <>
              <Button
                size="sm"
                disabled={isResponding}
                onClick={onAccept}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isResponding}
                onClick={onDecline}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </>
          )}
          {intro.status === IntroStatus.ACCEPTED && intro.sender && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate('/messages', { state: { recipientId: intro.senderId } })
              }
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Message
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SentIntroCard({ intro }: { intro: Introduction }) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-semibold truncate">
                {intro.receiver?.companyName ?? 'Unknown Recipient'}
              </span>
              <StatusBadge status={intro.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {intro.receiver?.role?.replace(/_/g, ' ')}
            </p>
            {intro.mandate && (
              <button
                className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                onClick={() => navigate(`/mandates/${intro.mandateId}`)}
              >
                <ExternalLink className="w-3 h-3" />
                {intro.mandate.title}
              </button>
            )}
          </div>
          <div className="text-right text-xs text-muted-foreground shrink-0">
            <p>{formatRelativeTime(intro.createdAt)}</p>
            {intro.respondedAt && (
              <p className="mt-0.5">Responded {formatDate(intro.respondedAt)}</p>
            )}
          </div>
        </div>

        {intro.message && (
          <div className="bg-secondary rounded-md p-3 text-sm">
            <p className="text-xs text-muted-foreground mb-1 font-medium">Your message</p>
            <p className="whitespace-pre-wrap text-foreground">{intro.message}</p>
          </div>
        )}

        {intro.status === IntroStatus.ACCEPTED && intro.receiver && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate('/messages', { state: { recipientId: intro.receiverId } })
            }
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Message
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

type Tab = 'received' | 'sent';

export default function Intros() {
  const [activeTab, setActiveTab] = useState<Tab>('received');

  const {
    receivedIntros,
    sentIntros,
    quotaStatus,
    isLoadingReceived,
    isLoadingSent,
    respondToIntro,
    isResponding,
  } = useIntros();

  const pendingReceived = receivedIntros.filter(
    (i) => i.status === IntroStatus.PENDING
  );

  const handleRespond = (id: string, status: IntroStatus) => {
    respondToIntro({ id, status });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Introductions</h1>
          <p className="text-muted-foreground">
            Manage your intro requests and responses
          </p>
        </div>

        {/* Quota badge */}
        {quotaStatus && (
          <div className="bg-secondary rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">Quota Used</p>
            <p className="text-lg font-bold">
              {quotaStatus.used}{' '}
              <span className="text-muted-foreground font-normal text-sm">
                / {quotaStatus.limit}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Resets {formatDate(quotaStatus.resetDate)}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('received')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'received'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Received
          {pendingReceived.length > 0 && (
            <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs">
              {pendingReceived.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sent'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Send className="w-4 h-4" />
          Sent
          {sentIntros.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({sentIntros.length})
            </span>
          )}
        </button>
      </div>

      {/* Received Tab */}
      {activeTab === 'received' && (
        <div className="space-y-4">
          {isLoadingReceived ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Loading received intros...
            </p>
          ) : receivedIntros.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-medium">No received introductions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When someone requests an intro via your mandate, it will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending first */}
              {pendingReceived.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Pending Action ({pendingReceived.length})
                  </h2>
                  {pendingReceived.map((intro) => (
                    <ReceivedIntroCard
                      key={intro.id}
                      intro={intro}
                      isResponding={isResponding}
                      onAccept={() => handleRespond(intro.id, IntroStatus.ACCEPTED)}
                      onDecline={() => handleRespond(intro.id, IntroStatus.DECLINED)}
                    />
                  ))}
                </div>
              )}

              {/* Responded */}
              {receivedIntros.filter((i) => i.status !== IntroStatus.PENDING).length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    History
                  </h2>
                  {receivedIntros
                    .filter((i) => i.status !== IntroStatus.PENDING)
                    .map((intro) => (
                      <ReceivedIntroCard
                        key={intro.id}
                        intro={intro}
                        isResponding={isResponding}
                        onAccept={() => handleRespond(intro.id, IntroStatus.ACCEPTED)}
                        onDecline={() => handleRespond(intro.id, IntroStatus.DECLINED)}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Sent Tab */}
      {activeTab === 'sent' && (
        <div className="space-y-4">
          {isLoadingSent ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Loading sent intros...
            </p>
          ) : sentIntros.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-medium">No sent introductions yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse the marketplace and send intro requests to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Group by status */}
              {([IntroStatus.PENDING, IntroStatus.ACCEPTED, IntroStatus.DECLINED, IntroStatus.EXPIRED] as IntroStatus[])
                .map((status) => {
                  const items = sentIntros.filter((i) => i.status === status);
                  if (items.length === 0) return null;
                  return (
                    <div key={status} className="space-y-3">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {STATUS_CONFIG[status].label} ({items.length})
                      </h2>
                      {items.map((intro) => (
                        <SentIntroCard key={intro.id} intro={intro} />
                      ))}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Introductions Work</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">1</span>
              You browse the marketplace and send an intro request with a personalised message.
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">2</span>
              The mandate owner reviews and accepts or declines within 7 days.
            </li>
            <li className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">3</span>
              On acceptance, direct messaging is unlocked between both parties.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
