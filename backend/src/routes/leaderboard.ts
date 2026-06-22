import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { serverError, unauthorized } from '../utils/apiError';
import { toUserDTO } from '../models/profile';
import { listIntros } from '../lib/runtimeStore';

const router = express.Router();

router.get('/', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const period = (req.query.period as 'week' | 'month' | 'all' | undefined) || 'month';
    const now = new Date();
    const since =
      period === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        : period === 'month'
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        : '1970-01-01T00:00:00.000Z';

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: mandates } = await supabase.from('mandates').select('user_id,created_at,status');

    const intros = listIntros().filter((i) => i.createdAt >= since);

    const rows = (profiles || []).map((p) => {
      const mandatesPosted = (mandates || []).filter((m) => m.user_id === p.id && m.created_at >= since).length;
      const totalIntros = intros.filter((i) => i.senderId === p.id).length;
      const successfulIntros = intros.filter((i) => i.senderId === p.id && i.status === 'ACCEPTED').length;
      const reputationScore = Math.min(100, 40 + mandatesPosted * 8 + successfulIntros * 6 + totalIntros * 2);
      return {
        userId: p.id,
        user: toUserDTO(p, {
          mandatesPosted,
          introsSent: totalIntros,
          introsReceived: intros.filter((i) => i.receiverId === p.id).length,
        }),
        totalIntros,
        successfulIntros,
        mandatesPosted,
        reputationScore,
      };
    });

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

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: mandates } = await supabase.from('mandates').select('user_id');
    const intros = listIntros();

    const rows = (profiles || []).map((p) => {
      const mandatesPosted = (mandates || []).filter((m) => m.user_id === p.id).length;
      const totalIntros = intros.filter((i) => i.senderId === p.id).length;
      const successfulIntros = intros.filter((i) => i.senderId === p.id && i.status === 'ACCEPTED').length;
      const reputationScore = Math.min(100, 40 + mandatesPosted * 8 + successfulIntros * 6 + totalIntros * 2);
      return { userId: p.id, reputationScore };
    });

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
