import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { toUserDTO } from '../models/profile';
import { listIntros } from '../lib/runtimeStore';
import { toMandateDTO } from '../models/mandate';
import { createPrivateObjectViewUrl } from '../lib/objectStorage';
import type { Database } from '../types/database';
import { createNotification } from '../lib/notificationsStore';
import { emitToUsers } from '../lib/realtime';

// ─── DB row mappers ──────────────────────────────────────────────────────────

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

async function signDocumentUrl(url?: string | null) {
  return url ? createPrivateObjectViewUrl(url) : undefined;
}

async function rowToKycDoc(row: any, user?: any) {
  const [panCard, gstCertificate, reraCertificate, incorporationCertificate, addressProof] = await Promise.all([
    signDocumentUrl(row.pan_card),
    signDocumentUrl(row.gst_certificate),
    signDocumentUrl(row.rera_certificate),
    signDocumentUrl(row.incorporation_certificate),
    signDocumentUrl(row.address_proof),
  ]);

  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    panCard,
    gstCertificate,
    reraCertificate,
    incorporationCertificate,
    addressProof,
    reviewNote: row.review_note ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: user ? await toUserDTO(user, { kycStatus: row.status }) : undefined,
  };
}

const KYC_DOCUMENT_COLUMNS = {
  panCard: 'pan_card',
  gstCertificate: 'gst_certificate',
  reraCertificate: 'rera_certificate',
  incorporationCertificate: 'incorporation_certificate',
  addressProof: 'address_proof',
} as const;

type KycDocumentField = keyof typeof KYC_DOCUMENT_COLUMNS;

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

    const userIds = (data ?? []).map((row) => row.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('*').in('id', userIds)
      : { data: [] };
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return res.json(await Promise.all((data ?? []).map((row) => rowToKycDoc(row, profileMap.get(row.user_id)))));
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
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', req.params.userId).maybeSingle();


    return res.json(await rowToKycDoc(data, profile));
  } catch (err: any) { return serverError(res, err.message); }
});

router.get('/kyc/:userId/documents/:field/view-url', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    const field = req.params.field as KycDocumentField;
    const column = KYC_DOCUMENT_COLUMNS[field];
    if (!column) return badRequest(res, 'Invalid KYC document field');

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase
      .from('kyc_reviews')
      .select(column)
      .eq('user_id', req.params.userId)
      .maybeSingle();
    if (error) return badRequest(res, error.message);

    const rawUrl = data?.[column as keyof typeof data] as string | null | undefined;
    if (!rawUrl) return badRequest(res, 'KYC document not found');

    return res.json({ url: await createPrivateObjectViewUrl(rawUrl) });
  } catch (err: any) {
    return serverError(res, err.message);
  }
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

    const profilePatch: ProfileUpdate = {
      kyc_status: body.status,
      updated_at: now,
    };
    if (body.status === 'APPROVED') {
      profilePatch.tier = 'VERIFIED';
      profilePatch.status = 'APPROVED';
    }
    if (body.status === 'REJECTED') profilePatch.status = 'REJECTED';

    await supabase.from('profiles').update(profilePatch).eq('id', body.userId);

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', body.userId).maybeSingle();

    // Fire-and-forget KYC status notification
    if (body.userId) {
      const notifUserId: string = body.userId;
      const notifStatus = body.status;
      ;(async () => {
        try {
          let n;
          if (notifStatus === 'APPROVED') {
            n = await createNotification({ userId: notifUserId, type: 'KYC_APPROVED', title: 'KYC Approved', message: 'Congratulations! Your KYC has been approved. Your account is now Verified.', relatedEntityType: 'kyc' });
          } else if (notifStatus === 'REJECTED') {
            n = await createNotification({ userId: notifUserId, type: 'KYC_REJECTED', title: 'KYC Rejected', message: 'Your KYC was rejected. Reason: ' + (body.rejectionReason || '') + '. Please resubmit.', relatedEntityType: 'kyc' });
          } else if (notifStatus === 'UNDER_REVIEW') {
            n = await createNotification({ userId: notifUserId, type: 'KYC_SUBMITTED', title: 'KYC Under Review', message: 'Your KYC is under review. Note: ' + (body.reviewNote || ''), relatedEntityType: 'kyc' });
          }
          if (n) emitToUsers([notifUserId], 'notification:new', n);
          console.log('[admin] KYC notification sent to', notifUserId, 'status:', notifStatus);
        } catch (e) { console.error('[admin] KYC notif error:', e); }
      })();
    }

        return res.json(await rowToKycDoc(data, profile));
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
        kycStatus: (kycMap.get(row.id) ?? row.kyc_status) as any,
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
      kycStatus: ((kycRow as any)?.status ?? data.kyc_status) as any,
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

router.delete('/users/:id', verifySupabase, async (req, res) => {
  try {
    if (!ensureAdmin(req, res)) return;
    if (req.params.id === req.user!.id) return badRequest(res, 'You cannot delete your own admin account');

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const reason = String((req.body as { reason?: string }).reason || '').trim();
    const { data: profile } = await supabase.from('profiles').select('company_name,email').eq('id', req.params.id).maybeSingle();

    const { error: authError } = await supabase.auth.admin.deleteUser(req.params.id);
    if (authError) return badRequest(res, authError.message);

    await writeAuditLog(
      req.user!.id,
      'USER_DELETED',
      'user',
      req.params.id,
      reason || `Deleted ${profile?.company_name ?? profile?.email ?? req.params.id}`,
    );
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
    const userIds = Array.from(new Set((data ?? []).map((m) => m.user_id).filter(Boolean)));
    const { data: reviewRows } = ids.length
      ? await supabase.from('mandate_reviews').select('*').in('mandate_id', ids)
      : { data: [] };
    const reviewMap = new Map((reviewRows ?? []).map((r: any) => [r.mandate_id, rowToMandateReview(r)]));

    const { data: kycRows } = userIds.length
      ? await supabase.from('kyc_reviews').select('user_id, status').in('user_id', userIds)
      : { data: [] };
    const kycStatusMap = new Map((kycRows ?? []).map((row: any) => [row.user_id, row.status]));
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('*').in('id', userIds)
      : { data: [] };
    const profileById = new Map(
      await Promise.all((profiles ?? []).map(async (profile) => {
        const user = await toUserDTO(profile, { kycStatus: kycStatusMap.get(profile.id) as any });
        return [profile.id, user] as const;
      }))
    );

    return res.json((data ?? []).map((row) => {
      const mandate = toMandateDTO(row);
      const review = reviewMap.get(mandate.id);
      const user = profileById.get(row.user_id);
      return {
        ...mandate,
        user,
        ownerKycStatus: kycStatusMap.get(row.user_id) ?? 'NOT_SUBMITTED',
        moderationStatus: review?.status ?? 'PENDING',
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
    // Fire-and-forget mandate review notification
    ;(async () => {
      try {
        const mandateOwnerId = existing.data.user_id as string;
        const mandateTitle = (existing.data.title || 'Your mandate') as string;
        const reviewStatus = body.status;
        let msg = '';
        if (reviewStatus === 'APPROVED') msg = 'Your mandate "' + mandateTitle + '" has been approved and is now live on the marketplace!';
        else if (reviewStatus === 'REJECTED') msg = 'Your mandate "' + mandateTitle + '" was rejected. Note: ' + (body.note || '');
        else if (reviewStatus === 'UNDER_REVIEW') msg = 'Your mandate "' + mandateTitle + '" is currently under review. Note: ' + (body.note || '');
        if (msg) {
          const n = await createNotification({ userId: mandateOwnerId, type: 'MANDATE_UPDATED', title: 'Mandate ' + reviewStatus, message: msg, relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
          emitToUsers([mandateOwnerId], 'notification:new', n);
          console.log('[admin] mandate review notification sent to', mandateOwnerId, 'status:', reviewStatus);
        }
        // Broadcast to all members when mandate goes APPROVED/ACTIVE
        if (reviewStatus === 'APPROVED') {
          const { data: posterProfile } = await supabase
            .from('profiles').select('company_name').eq('id', mandateOwnerId).maybeSingle();
          const companyName = (posterProfile as any)?.company_name || 'A member';
          const { data: allProfiles } = await supabase
            .from('profiles').select('id').neq('id', mandateOwnerId);
          const otherIds = ((allProfiles as any[]) || []).map((p: any) => p.id);
          await Promise.all(otherIds.map(async (uid: string) => {
            try {
              const nb = await createNotification({
                userId: uid,
                type: 'MANDATE_POSTED',
                title: 'New Mandate Listed',
                message: companyName + ' has posted a new mandate: "' + mandateTitle + '" — check it out on the marketplace!',
                relatedEntityId: req.params.id,
                relatedEntityType: 'mandate',
              });
              emitToUsers([uid], 'notification:new', nb);
            } catch (_) {}
          }));
          console.log('[admin] broadcast mandate-listed notification to', otherIds.length, 'members');
        }
      } catch (e) { console.error('[admin] mandate review notification error:', e); }
    })();

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
    // Fire-and-forget mandate hide notification
    ;(async () => {
      try {
        const mandateOwnerId2 = (data as any).user_id as string;
        const mandateTitle2 = ((data as any).title || 'Your mandate') as string;
        const msg2 = 'Your mandate "' + mandateTitle2 + '" has been rejected/hidden.' + (reason ? ' Reason: ' + reason : '');
        const n2 = await createNotification({ userId: mandateOwnerId2, type: 'MANDATE_UPDATED', title: 'Mandate Rejected', message: msg2, relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
        emitToUsers([mandateOwnerId2], 'notification:new', n2);
        console.log('[admin] mandate hide notification sent to', mandateOwnerId2);
      } catch (e) { console.error('[admin] mandate hide notification error:', e); }
    })();

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
    // Fire-and-forget mandate unhide/approve notification
    ;(async () => {
      try {
        const mandateOwnerId3 = existing.data.user_id as string;
        const mandateTitle3 = ((data as any).title || 'Your mandate') as string;
        const msg3 = 'Your mandate "' + mandateTitle3 + '" has been approved and is now live on the marketplace!';
        const n3 = await createNotification({ userId: mandateOwnerId3, type: 'MANDATE_UPDATED', title: 'Mandate Approved', message: msg3, relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
        emitToUsers([mandateOwnerId3], 'notification:new', n3);
        console.log('[admin] mandate unhide notification sent to', mandateOwnerId3);
        // Broadcast to all members when mandate goes live
        const { data: posterProfile3 } = await supabase.from('profiles').select('company_name').eq('id', mandateOwnerId3).maybeSingle();
        const companyName3 = (posterProfile3 as any)?.company_name || 'A member';
        const mandateTitle3b = ((data as any).title || 'Untitled') as string;
        const { data: allProfiles3 } = await supabase.from('profiles').select('id').neq('id', mandateOwnerId3);
        const otherIds3 = ((allProfiles3 as any[]) || []).map((p: any) => p.id);
        await Promise.all(otherIds3.map(async (uid3: string) => {
          try {
            const nb3 = await createNotification({ userId: uid3, type: 'MANDATE_POSTED', title: 'New Mandate Listed', message: companyName3 + ' has posted a new mandate: "' + mandateTitle3b + '" — check it out on the marketplace!', relatedEntityId: req.params.id, relatedEntityType: 'mandate' });
            emitToUsers([uid3], 'notification:new', nb3);
          } catch (_) {}
        }));
        console.log('[admin] broadcast mandate-listed (unhide) to', otherIds3.length, 'members');
      } catch (e) { console.error('[admin] mandate unhide notification error:', e); }
    })();

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
      kyc: kycRow ? await rowToKycDoc(kycRow) : null,
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

    const logs = data ?? [];
    const adminIds = [...new Set(logs.map((log) => log.admin_id).filter(Boolean))];
    const kycReviewIds = logs
      .filter((log) => log.entity_type === 'kyc_review' && String(log.action).startsWith('KYC_'))
      .map((log) => log.entity_id);
    const mandateIds = logs
      .filter((log) => log.entity_type === 'mandate_review' && String(log.action).startsWith('MANDATE_'))
      .map((log) => log.entity_id);
    const userEntityIds = logs
      .filter((log) => log.entity_type === 'user')
      .map((log) => log.entity_id);

    const [{ data: admins }, { data: kycRows }, { data: mandateRows }, { data: userRows }] = await Promise.all([
      adminIds.length ? supabase.from('profiles').select('*').in('id', adminIds) : Promise.resolve({ data: [] as any[] }),
      kycReviewIds.length ? supabase.from('kyc_reviews').select('id,user_id').in('id', kycReviewIds) : Promise.resolve({ data: [] as any[] }),
      mandateIds.length ? supabase.from('mandates').select('id,user_id,title').in('id', mandateIds) : Promise.resolve({ data: [] as any[] }),
      userEntityIds.length ? supabase.from('profiles').select('*').in('id', userEntityIds) : Promise.resolve({ data: [] as any[] }),
    ]);

    const kycUserIds = (kycRows ?? []).map((row) => row.user_id);
    const mandateUserIds = (mandateRows ?? []).map((row) => row.user_id);
    const targetUserIds = [...new Set([...kycUserIds, ...mandateUserIds])];
    const { data: targetUsers } = targetUserIds.length
      ? await supabase.from('profiles').select('*').in('id', targetUserIds)
      : { data: [] };

    const adminMap = new Map((admins ?? []).map((profile) => [profile.id, profile]));
    const targetUserMap = new Map([...(targetUsers ?? []), ...(userRows ?? [])].map((profile) => [profile.id, profile]));
    const kycMap = new Map((kycRows ?? []).map((row) => [row.id, row]));
    const mandateMap = new Map((mandateRows ?? []).map((row) => [row.id, row]));

    return res.json(logs.map((log) => {
      const admin = adminMap.get(log.admin_id);
      const kycRow = log.entity_type === 'kyc_review' ? kycMap.get(log.entity_id) : null;
      const mandateRow = log.entity_type === 'mandate_review' ? mandateMap.get(log.entity_id) : null;
      const userRow = log.entity_type === 'user' ? targetUserMap.get(log.entity_id) : null;
      const targetUser = kycRow
        ? targetUserMap.get(kycRow.user_id)
        : mandateRow
          ? targetUserMap.get(mandateRow.user_id)
          : userRow;

      return {
        ...log,
        admin: admin ? toUserDTO(admin) : undefined,
        targetUser: targetUser ? toUserDTO(targetUser) : undefined,
        targetCompanyName: targetUser?.company_name ?? undefined,
        targetEmail: targetUser?.email ?? undefined,
        targetMandateTitle: mandateRow?.title ?? undefined,
      };
    }));
  } catch (err: any) { return serverError(res, err.message); }
});

export default router;
