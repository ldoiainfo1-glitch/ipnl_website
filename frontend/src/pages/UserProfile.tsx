import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useProfile';
import { useMemberReviews } from '@/hooks/useReputation';
import { useAuthStore } from '@/store/authStore';
import { KycStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ASSET_CLASSES, USER_ROLES } from '@/utils/constants';
import { formatDate, formatIndianNumber } from '@/utils/formatters';
import { FEATURES } from '@/lib/features';
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
  const { user: currentUser } = useAuthStore();
  const { data: memberProfile, isLoading, error } = useUserProfile(id);
  const { reviews, stats, isLoading: isLoadingReviews, createReview, isCreatingReview, createReviewError } = useMemberReviews(id);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSaved, setReviewSaved] = useState(false);
  const user = memberProfile?.user;
  const mandates = memberProfile?.mandates ?? [];

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
  const canReview = currentUser?.id !== user.id && currentUser?.kycStatus === KycStatus.APPROVED;
  const displayedScore = stats?.reputationScore ?? user.reputationScore;
  const displayedAverageRating = stats?.averageRating ?? 0;
  const displayedReviewCount = stats?.reviewCount ?? reviews.length;

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    await createReview({ rating, comment: comment || undefined });
    setComment('');
    setRating(5);
    setReviewSaved(true);
    setTimeout(() => setReviewSaved(false), 2500);
  };

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
                  {displayedScore} reputation score
                </span>
                <span className="text-sm text-muted-foreground">
                  {displayedAverageRating > 0 ? `${displayedAverageRating.toFixed(1)} avg` : 'No reviews yet'} ({displayedReviewCount})
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
            {FEATURES.introductions && (
              <Button
                variant="outline"
                onClick={() => navigate('/marketplace', { state: { requestIntroFor: user.id } })}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Request Intro
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Member Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xl font-bold">{displayedScore}</p>
              <p className="text-xs text-muted-foreground">Reputation</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xl font-bold">{displayedAverageRating > 0 ? displayedAverageRating.toFixed(1) : '—'}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xl font-bold">{displayedReviewCount}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xl font-bold">{stats?.approvedMandates ?? mandates.length}</p>
              <p className="text-xs text-muted-foreground">Approved Mandates</p>
            </div>
          </div>

          {canReview ? (
            <form onSubmit={handleSubmitReview} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-medium">Leave a verified member review</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-1 text-amber-500"
                      aria-label={`${value} star rating`}
                    >
                      <Star className={`w-5 h-5 ${value <= rating ? 'fill-amber-500' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Share concise feedback about professionalism, responsiveness, or deal quality."
                maxLength={1000}
              />
              {createReviewError && (
                <p className="text-sm text-destructive">{(createReviewError as any).detail ?? 'Unable to submit review.'}</p>
              )}
              {reviewSaved && <p className="text-sm text-green-500">Review submitted.</p>}
              <Button type="submit" disabled={isCreatingReview}>{isCreatingReview ? 'Submitting...' : 'Submit Review'}</Button>
            </form>
          ) : currentUser?.id === user.id ? (
            <p className="text-sm text-muted-foreground">You cannot review your own profile.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Only KYC-approved members can leave reviews.</p>
          )}

          {isLoadingReviews ? (
            <p className="text-sm text-muted-foreground">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No peer reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-medium">{review.reviewer?.companyName ?? 'Verified member'}</p>
                    <span className="flex items-center gap-1 text-amber-500 text-sm">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {review.rating}.0
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{review.comment}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(review.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
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
          <div className={`grid gap-4 text-center ${FEATURES.introductions ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <p className="text-2xl font-bold">{user.totalMandatesPosted}</p>
              <p className="text-xs text-muted-foreground mt-1">Mandates Posted</p>
            </div>
            {FEATURES.introductions && (
              <>
                <div>
                  <p className="text-2xl font-bold">{user.totalIntrosSent}</p>
                  <p className="text-xs text-muted-foreground mt-1">Intros Sent</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.totalIntrosReceived}</p>
                  <p className="text-xs text-muted-foreground mt-1">Intros Received</p>
                </div>
              </>
            )}
            <div>
              <p className="text-2xl font-bold">{mandates.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Live Mandates</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approved live mandates */}
      <Card>
        <CardHeader>
          <CardTitle>Live Mandates</CardTitle>
        </CardHeader>
        <CardContent>
          {mandates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved live mandates from this member yet.</p>
          ) : (
            <div className="space-y-3">
              {mandates.map((mandate) => (
                <button
                  key={mandate.id}
                  type="button"
                  onClick={() => navigate(`/mandates/${mandate.id}`)}
                  className="w-full text-left rounded-lg border border-border p-4 hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={mandate.type === 'BUY' ? 'success' : 'default'}>{mandate.type}</Badge>
                    <Badge variant="outline">{mandate.assetClass}</Badge>
                    {mandate.isOffMarket && <Badge variant="secondary">Off-Market</Badge>}
                  </div>
                  <p className="font-medium">{mandate.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {[mandate.city, mandate.state].filter(Boolean).join(', ')} · {formatIndianNumber(mandate.ticketSize)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member since */}
      <p className="text-xs text-muted-foreground text-center">
        Member since {formatDate(user.createdAt)}
      </p>
    </div>
  );
}
