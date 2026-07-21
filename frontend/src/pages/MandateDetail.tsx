import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMandate } from '@/hooks/useMandates';
import { useIntros } from '@/hooks/useIntros';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  TrendingUp,
  Calendar,
  User,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { formatIndianNumber, formatDate, formatArea, formatPartnerCategory } from '@/utils/formatters';
import { ShareOnWhatsAppButton } from '@/components/ShareOnWhatsAppButton';

export default function MandateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { mandate, isLoading } = useMandate(id!);
  const { sendIntro, quotaStatus, isSending } = useIntros();
  
  const [showIntroForm, setShowIntroForm] = useState(false);
  const [introMessage, setIntroMessage] = useState('');
  const TYPE_BADGE_VARIANT: Record<string, 'success' | 'default' | 'secondary' | 'outline'> = {
  BUY: 'success',
  SELL: 'default',
  LOOKING_FOR: 'secondary',
  OFFERING: 'outline',
};

  const handleSendIntro = async () => {
    if (!mandate || !introMessage.trim()) return;

    try {
      await sendIntro({
        mandateId: mandate.id,
        receiverId: mandate.userId,
        message: introMessage,
      });
      alert('Introduction request sent successfully!');
      setShowIntroForm(false);
      setIntroMessage('');
    } catch (error: any) {
      alert(error.detail || 'Failed to send introduction');
    }
  };

  const handleSendEnquiry = () => {
  if (!mandate) return;

  localStorage.setItem(
    'pendingMandateEnquiry',
    JSON.stringify({
      mandateId: mandate.id,
      mandateTitle: mandate.title,
      mandateCompany: mandate.user?.companyName,
      mandateType: mandate.type,
      mandateAsset: mandate.assetClass,
    })
  );

  navigate('/register', {
    state: {
      from: `/mandates/${mandate.id}`,
    },
  });
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading mandate details...</p>
      </div>
    );
  }

  if (!mandate) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium mb-2">Mandate not found</p>
        <Button onClick={() => navigate('/marketplace')}>
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const isMyMandate = mandate.userId === user?.id;
  const canSendIntro = !isMyMandate && user?.tier !== 'OBSERVER' && (quotaStatus?.remaining || 0) > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <ShareOnWhatsAppButton
  title={mandate.title}
  url={window.location.href}
  message={`${window.location.href}\n\n\u{1F4C4} Title: ${mandate.title}\n\u{1F4B5} Ticket Size: ${formatIndianNumber(mandate.ticketSize)}\n\u{1F4CC} City: ${mandate.city}\n\n\u{2705} Check out this mandate on IPNL.`}
/>
      </div>

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={TYPE_BADGE_VARIANT[mandate.type] || 'default'}>
                    {mandate.type}
                </Badge>
                <Badge variant="outline">{mandate.assetClass}</Badge>
                <Badge variant="outline">{formatPartnerCategory(mandate.category)}</Badge>
                <Badge variant="secondary">{mandate.status}</Badge>
                {mandate.isOffMarket && (
                  <Badge>Off-Market</Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{mandate.title}</h1>
            </div>
            <div className="sm:text-right">
              <p className="text-2xl md:text-3xl font-bold text-primary">
                {formatIndianNumber(mandate.ticketSize)}
              </p>
              {mandate.ticketSizeMax && (
                <p className="text-muted-foreground">
                  to {formatIndianNumber(mandate.ticketSizeMax)}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-5 h-5 mr-2" />
              <div>
                <p className="text-sm font-medium text-foreground">{mandate.city}</p>
                <p className="text-xs">{mandate.state}</p>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="w-5 h-5 mr-2" />
              <div>
                <p className="text-sm font-medium text-foreground">Posted</p>
                <p className="text-xs">{formatDate(mandate.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="w-5 h-5 mr-2" />
              <div>
                <p className="text-sm font-medium text-foreground">{mandate.viewCount} views</p>
                <p className="text-xs">{mandate.introCount} introductions</p>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {mandate.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {mandate.builtUpArea && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Built-up Area</p>
                <p className="font-medium">{formatArea(mandate.builtUpArea)}</p>
              </div>
            )}
            {mandate.plotArea && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Plot Area</p>
                <p className="font-medium">{formatArea(mandate.plotArea)}</p>
              </div>
            )}
            {mandate.locality && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Locality</p>
                <p className="font-medium">{mandate.locality}</p>
              </div>
            )}
            <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="font-medium">{formatPartnerCategory(mandate.category)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tags</p>
              <div className="flex flex-wrap gap-2">
                {mandate.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posted By */}
      {mandate.user && !isMyMandate && (
        <Card>
          <CardHeader>
            <CardTitle>Posted By</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold">{mandate.user.companyName}</p>
                <p className="text-sm text-muted-foreground">{mandate.user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isMyMandate && (
  <Card>
    <CardContent className="p-6">

      {!isAuthenticated ? (

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleSendEnquiry}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Enquiry
          </Button>

          <p className="text-sm text-muted-foreground mt-3">
            Register for free to send your enquiry directly to the mandate owner.
          </p>
        </div>

      ) : user?.tier === 'OBSERVER' ? (

        <div className="text-center py-4">
          <p className="text-muted-foreground mb-4">
            Upgrade to VERIFIED tier to send introductions
          </p>

          <Button onClick={() => navigate('/settings')}>
            Upgrade Account
          </Button>
        </div>

      ) : showIntroForm ? (

        <div className="space-y-4">

          <div>
            <Label>Introduction Message</Label>

            <Textarea
              placeholder="Introduce yourself and explain your interest in this mandate..."
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex space-x-3">

            <Button
              onClick={handleSendIntro}
              disabled={!introMessage.trim() || isSending}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Introduction'}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowIntroForm(false)}
            >
              Cancel
            </Button>

          </div>

          <p className="text-sm text-muted-foreground">
            {quotaStatus?.remaining || 0} introductions remaining this month
          </p>

        </div>

      ) : (

        <div className="text-center">

          <Button
            size="lg"
            onClick={() => setShowIntroForm(true)}
            disabled={!canSendIntro}
          >
            <Send className="w-4 h-4 mr-2" />
            Request Introduction
          </Button>

          {!canSendIntro && quotaStatus?.remaining === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              You've used all your introductions this month
            </p>
          )}

        </div>

      )}

    </CardContent>
  </Card>
)}
    </div>
  );
}