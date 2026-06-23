import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { toUserDTO } from '../models/profile';
import { getReputationStatsForUsers } from '../lib/reputation';

const router = express.Router();

function toReviewDTO(row: any, reviewer?: any) {
  return {
    id: row.id,
    reviewerId: row.reviewer_id,
    revieweeId: row.reviewee_id,
    mandateId: row.mandate_id ?? undefined,
    rating: row.rating,
    comment: row.comment ?? undefined,
    status: row.status,
    reviewer: reviewer ? toUserDTO(reviewer) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get('/members/:userId/reviews', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.userId)
      .eq('kyc_status', 'APPROVED')
      .neq('status', 'SUSPENDED')
      .neq('role', 'ADMIN')
      .maybeSingle();
    if (memberError) return badRequest(res, memberError.message);
    if (!member) return notFound(res, 'Member not found');

    const { data: reviews, error: reviewsError } = await supabase
      .from('reputation_reviews')
      .select('*')
      .eq('reviewee_id', req.params.userId)
      .eq('status', 'PUBLISHED')
      .order('created_at', { ascending: false });
    if (reviewsError) return badRequest(res, reviewsError.message);

    const reviewerIds = [...new Set((reviews ?? []).map((review) => review.reviewer_id))];
    const { data: reviewers } = reviewerIds.length > 0
      ? await supabase.from('profiles').select('*').in('id', reviewerIds)
      : { data: [] };
    const reviewerById = new Map((reviewers ?? []).map((reviewer) => [reviewer.id, reviewer]));
    const stats = (await getReputationStatsForUsers([req.params.userId])).get(req.params.userId);

    return res.json({
      stats,
      reviews: (reviews ?? []).map((review) => toReviewDTO(review, reviewerById.get(review.reviewer_id))),
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.post('/members/:userId/reviews', verifySupabase, async (req, res) => {
  try {
    if (!req.user) return unauthorized(res);

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const rating = Number((req.body as { rating?: number }).rating);
    const comment = String((req.body as { comment?: string }).comment ?? '').trim();
    const mandateId = String((req.body as { mandateId?: string }).mandateId ?? '').trim() || null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return badRequest(res, 'rating must be an integer from 1 to 5');
    if (comment.length > 1000) return badRequest(res, 'comment must be 1000 characters or fewer');
    if (req.params.userId === req.user.id) return badRequest(res, 'You cannot review your own profile');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,kyc_status,status,role')
      .in('id', [req.user.id, req.params.userId]);
    if (profilesError) return badRequest(res, profilesError.message);

    const reviewer = (profiles ?? []).find((profile) => profile.id === req.user!.id);
    const reviewee = (profiles ?? []).find((profile) => profile.id === req.params.userId);
    if (!reviewer || reviewer.kyc_status !== 'APPROVED' || reviewer.status === 'SUSPENDED') {
      return badRequest(res, 'Only approved verified members can leave reviews');
    }
    if (!reviewee || reviewee.kyc_status !== 'APPROVED' || reviewee.status === 'SUSPENDED' || reviewee.role === 'ADMIN') {
      return notFound(res, 'Member not found');
    }

    const { data, error } = await supabase
      .from('reputation_reviews')
      .insert({
        reviewer_id: req.user.id,
        reviewee_id: req.params.userId,
        mandate_id: mandateId,
        rating,
        comment: comment || null,
        status: 'PUBLISHED',
      })
      .select('*')
      .single();
    if (error || !data) return badRequest(res, error?.message ?? 'Unable to create review');

    const stats = (await getReputationStatsForUsers([req.params.userId])).get(req.params.userId);
    if (stats) {
      await supabase
        .from('profiles')
        .update({ reputation_score: stats.reputationScore, updated_at: new Date().toISOString() })
        .eq('id', req.params.userId);
    }

    return res.status(201).json({ review: toReviewDTO(data), stats });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;
