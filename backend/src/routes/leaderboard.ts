import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer.js';
import { verifySupabase } from '../middleware/verifySupabase.js';
import { serverError, unauthorized } from '../utils/apiError.js';
import { toUserDTO } from '../models/profile.js';
import { getReputationStatsForUsers } from '../lib/reputation.js';

const router = express.Router();

router.get('/', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('kyc_status', 'APPROVED')
      .neq('status', 'SUSPENDED')
      .neq('role', 'ADMIN');
    if (profilesError) return serverError(res, profilesError.message);

    const reputationByUser = await getReputationStatsForUsers((profiles ?? []).map((profile) => profile.id));

    const rows = await Promise.all((profiles || []).map(async (p) => {
      const reputation = reputationByUser.get(p.id) ?? {
        reputationScore: p.reputation_score ?? 0,
        averageRating: 0,
        reviewCount: 0,
        approvedMandates: 0,
        scoreBreakdown: { verification: 0, reviews: 0, activity: 0 },
      };
      const user = await toUserDTO(p, {
        mandatesPosted: reputation.approvedMandates,
        introsSent: 0,
        introsReceived: 0,
        kycStatus: p.kyc_status as any,
      });
      return {
        userId: p.id,
        user: { ...user, reputationScore: reputation.reputationScore },
        totalIntros: 0,
        successfulIntros: 0,
        mandatesPosted: reputation.approvedMandates,
        reputationScore: reputation.reputationScore,
        averageRating: reputation.averageRating,
        reviewCount: reputation.reviewCount,
        scoreBreakdown: reputation.scoreBreakdown,
      };
    }));

    rows.sort((a, b) => b.reputationScore - a.reputationScore);

    return res.json(
      rows.map((r, idx) => ({
        rank: idx + 1,
        ...r,
      })),
    );
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/my-rank', verifySupabase, async (req, res) => {
  try {
    if (!req.user) return unauthorized(res);

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('kyc_status', 'APPROVED')
      .neq('status', 'SUSPENDED')
      .neq('role', 'ADMIN');
    if (profilesError) return serverError(res, profilesError.message);

    const reputationByUser = await getReputationStatsForUsers((profiles ?? []).map((profile) => profile.id));
    const rows = (profiles || []).map((p) => ({
      userId: p.id,
      reputationScore: reputationByUser.get(p.id)?.reputationScore ?? p.reputation_score ?? 0,
    }));

    rows.sort((a, b) => b.reputationScore - a.reputationScore);

    const index = rows.findIndex((r) => r.userId === req.user!.id);
    const rank = index >= 0 ? index + 1 : rows.length + 1;
    const totalUsers = rows.length;
    const percentile = totalUsers > 0 ? Math.max(0, Math.round(((totalUsers - rank) / totalUsers) * 100)) : 0;

    return res.json({ rank, totalUsers, percentile });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;
