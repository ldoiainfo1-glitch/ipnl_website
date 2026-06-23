import { getSupabaseAdmin } from './supabaseServer';

export interface ReputationStats {
  reputationScore: number;
  averageRating: number;
  reviewCount: number;
  approvedMandates: number;
  scoreBreakdown: {
    verification: number;
    reviews: number;
    activity: number;
  };
}

interface ReviewRow {
  reviewee_id: string;
  rating: number;
}

interface MandateRow {
  user_id: string;
}

const PRIOR_REVIEW_COUNT = 5;
const PRIOR_RATING = 4;

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateReputationStats(input: {
  tier?: string | null;
  kycStatus?: string | null;
  reviews: Array<{ rating: number }>;
  approvedMandates: number;
}): ReputationStats {
  const reviewCount = input.reviews.length;
  const ratingSum = input.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const averageRating = reviewCount > 0 ? ratingSum / reviewCount : 0;
  const weightedRating = reviewCount > 0
    ? (ratingSum + PRIOR_RATING * PRIOR_REVIEW_COUNT) / (reviewCount + PRIOR_REVIEW_COUNT)
    : 0;

  const verification = input.kycStatus === 'APPROVED'
    ? input.tier === 'ENTERPRISE'
      ? 35
      : 30
    : 0;
  const reviews = reviewCount > 0 ? (weightedRating / 5) * 50 : 0;
  const activity = Math.min(15, input.approvedMandates * 3);
  const reputationScore = clampScore(verification + reviews + activity);

  return {
    reputationScore,
    averageRating: Number(averageRating.toFixed(1)),
    reviewCount,
    approvedMandates: input.approvedMandates,
    scoreBreakdown: {
      verification: Math.round(verification),
      reviews: Math.round(reviews),
      activity: Math.round(activity),
    },
  };
}

export async function getReputationStatsForUsers(userIds: string[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase || userIds.length === 0) return new Map<string, ReputationStats>();

  const [{ data: profiles }, { data: reviews }, { data: approvedReviewRows }] = await Promise.all([
    supabase.from('profiles').select('id,tier,kyc_status').in('id', userIds),
    supabase.from('reputation_reviews').select('reviewee_id,rating').in('reviewee_id', userIds).eq('status', 'PUBLISHED'),
    supabase.from('mandate_reviews').select('mandate_id').eq('status', 'APPROVED'),
  ]);

  const approvedMandateIds = (approvedReviewRows ?? []).map((row) => row.mandate_id);
  const { data: approvedMandates } = approvedMandateIds.length > 0
    ? await supabase.from('mandates').select('user_id').in('id', approvedMandateIds).eq('status', 'ACTIVE')
    : { data: [] as MandateRow[] };

  const reviewsByUser = new Map<string, ReviewRow[]>();
  (reviews ?? []).forEach((review) => {
    const existing = reviewsByUser.get(review.reviewee_id) ?? [];
    existing.push(review);
    reviewsByUser.set(review.reviewee_id, existing);
  });

  const approvedMandatesByUser = new Map<string, number>();
  (approvedMandates ?? []).forEach((mandate) => {
    approvedMandatesByUser.set(mandate.user_id, (approvedMandatesByUser.get(mandate.user_id) ?? 0) + 1);
  });

  return new Map((profiles ?? []).map((profile) => [
    profile.id,
    calculateReputationStats({
      tier: profile.tier,
      kycStatus: profile.kyc_status,
      reviews: reviewsByUser.get(profile.id) ?? [],
      approvedMandates: approvedMandatesByUser.get(profile.id) ?? 0,
    }),
  ]));
}
