import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useProfile';
import { KycStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ASSET_CLASSES, USER_ROLES } from '@/utils/constants';
import { formatDate, formatIndianNumber } from '@/utils/formatters';
import {
  ShieldCheck,
  Building2,
  Star,
  Globe,
  Linkedin,
  MapPin,
  ArrowLeft,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useUserProfile(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Profile not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  const isVerified = user.kycStatus === KycStatus.APPROVED;
  const roleLabel = USER_ROLES.find((r) => r.value === user.role)?.label ?? user.role;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Hero card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border shrink-0">
              {user.logo ? (
                <img src={user.logo} alt={user.companyName} className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-10 h-10 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{user.companyName}</h1>
                {isVerified && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground mt-0.5">{roleLabel}</p>

              {(user.city || user.state) && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {[user.city, user.state].filter(Boolean).join(', ')}
                </p>
              )}

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="flex items-center gap-1 text-sm font-medium text-amber-500">
                  <Star className="w-4 h-4 fill-amber-500" />
                  {user.reputationScore} reputation score
                </span>
                <Badge variant="secondary">{user.tier} Tier</Badge>
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
                {user.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 mt-5">
            <Button
              onClick={() => navigate('/messages', { state: { recipientId: user.id } })}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace', { state: { requestIntroFor: user.id } })}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Request Intro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      {user.companyDescription && (
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {user.companyDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Asset Preferences */}
      {user.assetPreferences && user.assetPreferences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Asset Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {user.assetPreferences.map((cls) => (
                <Badge key={cls} variant="secondary">
                  {ASSET_CLASSES.find((a) => a.value === cls)?.label ?? cls}
                </Badge>
              ))}
            </div>
            {(user.ticketSizeMin || user.ticketSizeMax) && (
              <p className="text-sm text-muted-foreground">
                Ticket size:{' '}
                <span className="font-medium text-foreground">
                  {user.ticketSizeMin ? formatIndianNumber(user.ticketSizeMin) : '—'}
                  {' – '}
                  {user.ticketSizeMax ? formatIndianNumber(user.ticketSizeMax) : '—'}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{user.totalMandatesPosted}</p>
              <p className="text-xs text-muted-foreground mt-1">Mandates Posted</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.totalIntrosSent}</p>
              <p className="text-xs text-muted-foreground mt-1">Intros Sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user.totalIntrosReceived}</p>
              <p className="text-xs text-muted-foreground mt-1">Intros Received</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member since */}
      <p className="text-xs text-muted-foreground text-center">
        Member since {formatDate(user.createdAt)}
      </p>
    </div>
  );
}
