import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { toUserDTO } from '../models/profile';
import { listIntros } from '../lib/runtimeStore';
import { toMandateDTO } from '../models/mandate';

// ─── DB row mappers ──────────────────────────────────────────────────────────

function rowToKycDoc(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    panCard: row.pan_card ?? undefined,
    gstCertificate: row.gst_certificate ?? undefined,
    reraCertificate: row.rera_certificate ?? undefined,
    incorporationCertificate: row.incorporation_certificate ?? undefined,
    addressProof: row.address_proof ?? undefined,
    reviewNote: row.review_note ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMandateReview(row: any) {
  return {
    id: row.id,
    mandateId: row.mandate_id,
    status: row.status as 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
    note: row.note ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function writeAuditLog(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  note?: string,
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from('audit_log').insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    note: note ?? null,
  });
}

const router = express.Router();

function ensureAdmin(req: express.Request, res: express.Response): boolean {
  if (!req.user) {
    unauthorized(res);
    return false;
  }
  const role = String(req.user.user_metadata?.role || '').toUpperCase();
  if (role !== 'ADMIN') {
    unauthorized(res, 'Admin access required');
    return false;
  }
  return true;
}

router.get('/kyc/queue', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    const { data, error } = await supabase
      .from('kyc_reviews').select('*').order('created_at', { ascending: false });
    if (error) return badRequest(res, error.message);
    return res.json((data ?? []).map(rowToKycDoc));
  } catch (err: any) { return serverError(res, err.message); }
});

router.get('/kyc/:userId', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    const { data, error } = await supabase
      .from('kyc_reviews').select('*').eq('user_id', req.params.userId).single();
    if (error || !data) return notFound(res, 'KYC document not found');
    return res.json(rowToKycDoc(data));
  } catch (err: any) { return serverError(res, err.message); }
});

router.patch('/kyc/update', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const body = req.body as {
      userId?: string;
      status?: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
      reviewNote?: string;
    };
    if (!body.userId || !body.status) return badRequest(res, 'userId and status are required');
    if (body.status === 'REJECTED' && !body.rejectionReason?.trim())
      return badRequest(res, 'rejectionReason is required when rejecting KYC');
    if (body.status === 'UNDER_REVIEW' && !body.reviewNote?.trim())
      return badRequest(res, 'reviewNote is required when marking KYC UNDER_REVIEW');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('kyc_reviews')
      .update({
        status: body.status,
        review_note: body.reviewNote ?? null,
        rejection_reason: body.rejectionReason ?? null,
        reviewed_by: req.user!.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('user_id', body.userId)
      .select('*')
      .single();
    if (error || !data)
      return badRequest(res, error?.message ?? 'KYC record not found – user may not have submitted yet');

    await writeAuditLog(req.user!.id, `KYC_${body.status}`, 'kyc_review', data.id, body.rejectionReason || body.reviewNote);

    if (body.status === 'APPROVED') {
      await supabase.from('profiles').update({ tier: 'VERIFIED' }).eq('id', body.userId);
    }

    return res.json(rowToKycDoc(data));
  } catch (err: any) { return serverError(res, err.message); }
});

router.get('/users', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) return badRequest(res, error.message);

    const userIds = (data ?? []).map((r) => r.id);
    const { data: kycRows } = userIds.length
      ? await supabase.from('kyc_reviews').select('user_id, status').in('user_id', userIds)
      : { data: [] };
    const kycMap = new Map((kycRows ?? []).map((k) => [k.user_id, k.status]));

    const intros = listIntros();
    const users = await Promise.all((data ?? []).map(async (row) => {
      const { count: mandateCount } = await supabase
        .from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', row.id);
      return toUserDTO(row, {
        mandatesPosted: mandateCount ?? 0,
        introsSent: intros.filter((i) => i.senderId === row.id).length,
        introsReceived: intros.filter((i) => i.receiverId === row.id).length,
        kycStatus: kycMap.get(row.id) as any,
      });
    }));

    return res.json(users);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/users/:id', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error || !data) return notFound(res, 'User not found');

    const [{ count: mandateCount }, { data: kycRow }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', data.id),
      supabase.from('kyc_reviews').select('status').eq('user_id', data.id).maybeSingle(),
    ]);
    const intros = listIntros();
    return res.json(toUserDTO(data, {
      mandatesPosted: mandateCount ?? 0,
      introsSent: intros.filter((i) => i.senderId === data.id).length,
      introsReceived: intros.filter((i) => i.receiverId === data.id).length,
      kycStatus: (kycRow as any)?.status,
    }));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/users/:id/suspend', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    const reason = String((req.body as { reason?: string }).reason || '').trim();
    await supabase.from('profiles').update({ status: 'SUSPENDED' }).eq('id', req.params.id);
    await writeAuditLog(req.user!.id, 'USER_SUSPENDED', 'user', req.params.id, reason);
    return res.json({ success: true });
  } catch (err: any) { return serverError(res, err.message); }
});

router.patch('/users/:id/activate', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    await supabase.from('profiles').update({ status: 'APPROVED' }).eq('id', req.params.id);
    await writeAuditLog(req.user!.id, 'USER_ACTIVATED', 'user', req.params.id);
    return res.json({ success: true });
  } catch (err: any) { return serverError(res, err.message); }
});

router.patch('/users/:id/tier', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const tier = String((req.body as { tier?: string }).tier || '').toUpperCase();
    if (!['OBSERVER', 'VERIFIED', 'ENTERPRISE'].includes(tier)) {
      return badRequest(res, 'tier must be OBSERVER, VERIFIED, or ENTERPRISE');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ tier })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) return badRequest(res, error?.message ?? 'Unable to update tier');

    return res.json(toUserDTO(data));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/mandates', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase.from('mandates').select('*').order('created_at', { ascending: false });
    if (error) return badRequest(res, error.message);

    const ids = (data ?? []).map((m) => m.id);
    const { data: reviewRows } = ids.length
      ? await supabase.from('mandate_reviews').select('*').in('mandate_id', ids)
      : { data: [] };
    const reviewMap = new Map((reviewRows ?? []).map((r: any) => [r.mandate_id, rowToMandateReview(r)]));

    return res.json((data ?? []).map((row) => {
      const mandate = toMandateDTO(row);
      const review = reviewMap.get(mandate.id);
      return {
        ...mandate,
        moderationStatus: review?.status ?? (mandate.status === 'ACTIVE' ? 'APPROVED' : 'PENDING'),
        moderationNote: review?.note,
        moderationReviewedBy: review?.reviewedBy,
        moderationReviewedAt: review?.reviewedAt,
      };
    }));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/mandates/:id/review', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const body = req.body as { status?: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'; note?: string };
    if (!body.status) return badRequest(res, 'status is required');
    if ((body.status === 'UNDER_REVIEW' || body.status === 'REJECTED') && !body.note?.trim()) {
      return badRequest(res, 'note is required for UNDER_REVIEW or REJECTED');
    }

    const existing = await supabase
      .from('mandates')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (existing.error || !existing.data) return notFound(res, 'Mandate not found');

    if (body.status === 'APPROVED') {
      const { data: kycRow } = await supabase
        .from('kyc_reviews').select('status').eq('user_id', existing.data.user_id).single();
      if (!kycRow || kycRow.status !== 'APPROVED')
        return badRequest(res, 'Mandate can only be approved after user KYC is APPROVED');
    }

    const targetMandateStatus = body.status === 'APPROVED' ? 'ACTIVE' : 'DRAFT';
    const now = new Date().toISOString();
    const { data, error: updateErr } = await supabase
      .from('mandates').update({ status: targetMandateStatus }).eq('id', req.params.id).select('*').single();
    if (updateErr || !data) return badRequest(res, updateErr?.message ?? 'Unable to update mandate');

    const { data: reviewRow, error: reviewErr } = await supabase
      .from('mandate_reviews')
      .upsert({ mandate_id: req.params.id, status: body.status, note: body.note ?? null, reviewed_by: req.user!.id, reviewed_at: now, updated_at: now }, { onConflict: 'mandate_id' })
      .select('*').single();
    if (reviewErr || !reviewRow) return badRequest(res, reviewErr?.message ?? 'Unable to save review');

    await writeAuditLog(req.user!.id, `MANDATE_${body.status}`, 'mandate_review', req.params.id, body.note);

    const review = rowToMandateReview(reviewRow);
    return res.json({
      ...toMandateDTO(data),
      moderationStatus: review.status,
      moderationNote: review.note,
      moderationReviewedBy: review.reviewedBy,
      moderationReviewedAt: review.reviewedAt,
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/mandates/:id/hide', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const reason = String((req.body as { reason?: string }).reason || '').trim();

    const { data, error } = await supabase
      .from('mandates')
      .update({ status: 'DRAFT' })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error || !data) return badRequest(res, error?.message ?? 'Unable to hide mandate');

    const now = new Date().toISOString();
    const { data: reviewRow } = await supabase
      .from('mandate_reviews')
      .upsert({ mandate_id: req.params.id, status: 'REJECTED', note: reason, reviewed_by: req.user!.id, reviewed_at: now, updated_at: now }, { onConflict: 'mandate_id' })
      .select('*').single();

    await writeAuditLog(req.user!.id, 'MANDATE_REJECTED', 'mandate_review', req.params.id, reason);

    const review = reviewRow ? rowToMandateReview(reviewRow) : null;
    return res.json({ ...toMandateDTO(data), moderationStatus: 'REJECTED', moderationNote: review?.note, moderationReviewedBy: review?.reviewedBy, moderationReviewedAt: review?.reviewedAt });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/mandates/:id/unhide', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const existing = await supabase
      .from('mandates')
      .select('user_id')
      .eq('id', req.params.id)
      .single();
    if (existing.error || !existing.data) return notFound(res, 'Mandate not found');

    const { data: kycRow2 } = await supabase.from('kyc_reviews').select('status').eq('user_id', existing.data.user_id).single();
    if (!kycRow2 || kycRow2.status !== 'APPROVED')
      return badRequest(res, 'Mandate can only be approved after user KYC is APPROVED');

    const now2 = new Date().toISOString();
    const { data, error } = await supabase
      .from('mandates').update({ status: 'ACTIVE' }).eq('id', req.params.id).select('*').single();
    if (error || !data) return badRequest(res, error?.message ?? 'Unable to unhide mandate');

    const { data: reviewRow2 } = await supabase
      .from('mandate_reviews')
      .upsert({ mandate_id: req.params.id, status: 'APPROVED', note: 'Approved by admin', reviewed_by: req.user!.id, reviewed_at: now2, updated_at: now2 }, { onConflict: 'mandate_id' })
      .select('*').single();

    await writeAuditLog(req.user!.id, 'MANDATE_APPROVED', 'mandate_review', req.params.id);

    const review2 = reviewRow2 ? rowToMandateReview(reviewRow2) : null;
    return res.json({ ...toMandateDTO(data), moderationStatus: 'APPROVED', moderationNote: review2?.note, moderationReviewedBy: review2?.reviewedBy, moderationReviewedAt: review2?.reviewedAt });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/verification/users/:userId', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const [{ data: profile, error: profileError }, { data: kycRow }, { data: mandateRows, error: mandateError }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', req.params.userId).single(),
      supabase.from('kyc_reviews').select('*').eq('user_id', req.params.userId).maybeSingle(),
      supabase.from('mandates').select('*').eq('user_id', req.params.userId).order('created_at', { ascending: false }),
    ]);
    if (profileError || !profile) return notFound(res, 'User not found');
    if (mandateError) return badRequest(res, mandateError.message);

    const intros = listIntros();
    const { count: mandateCount } = await supabase
      .from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', req.params.userId);

    const mandateIds = (mandateRows ?? []).map((m) => m.id);
    const { data: reviewRows } = mandateIds.length
      ? await supabase.from('mandate_reviews').select('*').in('mandate_id', mandateIds)
      : { data: [] };
    const reviewMap = new Map((reviewRows ?? []).map((r: any) => [r.mandate_id, rowToMandateReview(r)]));

    return res.json({
      user: toUserDTO(profile, {
        mandatesPosted: mandateCount ?? 0,
        introsSent: intros.filter((i) => i.senderId === profile.id).length,
        introsReceived: intros.filter((i) => i.receiverId === profile.id).length,
        kycStatus: kycRow ? kycRow.status as any : undefined,
      }),
      kyc: kycRow ? rowToKycDoc(kycRow) : null,
      mandates: (mandateRows ?? []).map((row) => {
        const mandate = toMandateDTO(row);
        const review = reviewMap.get(mandate.id);
        return {
          ...mandate,
          moderationStatus: review?.status ?? (mandate.status === 'ACTIVE' ? 'APPROVED' : 'PENDING'),
          moderationNote: review?.note,
          moderationReviewedBy: review?.reviewedBy,
          moderationReviewedAt: review?.reviewedAt,
        };
      }),
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.delete('/mandates/:id', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { error } = await supabase.from('mandates').delete().eq('id', req.params.id);
    if (error) return badRequest(res, error.message);

    await writeAuditLog(req.user!.id, 'MANDATE_DELETED', 'mandate_review', req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/stats/dashboard', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const [{ count: totalMandates }, { count: totalUsers }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const { count: pendingKycCount } = await supabase
      .from('kyc_reviews').select('id', { count: 'exact', head: true }).in('status', ['SUBMITTED', 'UNDER_REVIEW']);

    const intros = listIntros();
    return res.json({
      totalMandates: totalMandates ?? 0,
      totalUsers: totalUsers ?? 0,
      totalIntros: intros.length,
      pendingKycCount: pendingKycCount ?? 0,
      activeSubscribers: 0,
      revenueThisMonth: 0,
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/stats/revenue', verifySupabase, (req, res) => {
  if (!ensureAdmin(req, res)) return;
  return res.json({
    total: 0,
    byTier: {
      OBSERVER: 0,
      VERIFIED: 0,
      ENTERPRISE: 0,
    },
    trend: [],
  });
});

router.get('/audit-logs', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) return badRequest(res, error.message);
    return res.json(data ?? []);
  } catch (err: any) { return serverError(res, err.message); }
});

export default router;
