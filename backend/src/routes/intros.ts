import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { getIntro, listIntros, putIntro, putNotification } from '../lib/runtimeStore';
import { toMandateDTO } from '../models/mandate';
import { toUserDTO } from '../models/profile';

const router = express.Router();

router.post('/', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const body = req.body as { mandateId?: string; receiverId?: string; message?: string };
    if (!body.mandateId || !body.receiverId) {
      return badRequest(res, 'mandateId and receiverId are required');
    }

    const { data: mandate } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', body.mandateId)
      .single();

    if (!mandate) return notFound(res, 'Mandate not found');

    const intro = putIntro({
      mandateId: body.mandateId,
      senderId: req.user.id,
      receiverId: body.receiverId,
      message: body.message,
      status: 'PENDING',
    });

    putNotification({
      userId: body.receiverId,
      type: 'INTRO_RECEIVED',
      title: 'New Introduction Request',
      message: body.message?.slice(0, 120) || `New intro request for ${mandate.title}`,
      relatedEntityId: intro.id,
      relatedEntityType: 'intro',
    });

    const { data: senderProfile } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
    const { data: receiverProfile } = await supabase.from('profiles').select('*').eq('id', body.receiverId).single();

    return res.status(201).json({
      id: intro.id,
      mandateId: intro.mandateId,
      mandate: toMandateDTO(mandate),
      senderId: intro.senderId,
      sender: senderProfile ? toUserDTO(senderProfile) : undefined,
      receiverId: intro.receiverId,
      receiver: receiverProfile ? toUserDTO(receiverProfile) : undefined,
      status: intro.status,
      message: intro.message,
      expiresAt: intro.expiresAt,
      respondedAt: intro.respondedAt,
      createdAt: intro.createdAt,
      updatedAt: intro.updatedAt,
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/my/:type', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const type = req.params.type;
    if (type !== 'sent' && type !== 'received') {
      return badRequest(res, 'type must be sent or received');
    }

    const intros = listIntros().filter((i) =>
      type === 'sent' ? i.senderId === req.user!.id : i.receiverId === req.user!.id,
    );

    const result = await Promise.all(
      intros.map(async (intro) => {
        const { data: mandate } = await supabase.from('mandates').select('*').eq('id', intro.mandateId).maybeSingle();
        const { data: senderProfile } = await supabase.from('profiles').select('*').eq('id', intro.senderId).maybeSingle();
        const { data: receiverProfile } = await supabase.from('profiles').select('*').eq('id', intro.receiverId).maybeSingle();

        return {
          id: intro.id,
          mandateId: intro.mandateId,
          mandate: mandate ? toMandateDTO(mandate) : undefined,
          senderId: intro.senderId,
          sender: senderProfile ? toUserDTO(senderProfile) : undefined,
          receiverId: intro.receiverId,
          receiver: receiverProfile ? toUserDTO(receiverProfile) : undefined,
          status: intro.status,
          message: intro.message,
          expiresAt: intro.expiresAt,
          respondedAt: intro.respondedAt,
          createdAt: intro.createdAt,
          updatedAt: intro.updatedAt,
        };
      }),
    );

    return res.json(result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/:id/respond', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const body = req.body as { status?: 'ACCEPTED' | 'DECLINED' };
    if (!body.status || (body.status !== 'ACCEPTED' && body.status !== 'DECLINED')) {
      return badRequest(res, 'status must be ACCEPTED or DECLINED');
    }

    const intro = getIntro(req.params.id);
    if (!intro) return notFound(res, 'Introduction not found');
    if (intro.receiverId !== req.user.id) return unauthorized(res, 'Only receiver can respond');

    const updated = putIntro({
      ...intro,
      status: body.status,
      respondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    putNotification({
      userId: updated.senderId,
      type: body.status === 'ACCEPTED' ? 'INTRO_ACCEPTED' : 'INTRO_DECLINED',
      title: body.status === 'ACCEPTED' ? 'Introduction Accepted' : 'Introduction Declined',
      message: body.status === 'ACCEPTED' ? 'Your introduction request was accepted.' : 'Your introduction request was declined.',
      relatedEntityId: updated.id,
      relatedEntityType: 'intro',
    });

    const { data: mandate } = await supabase.from('mandates').select('*').eq('id', updated.mandateId).maybeSingle();
    const { data: senderProfile } = await supabase.from('profiles').select('*').eq('id', updated.senderId).maybeSingle();
    const { data: receiverProfile } = await supabase.from('profiles').select('*').eq('id', updated.receiverId).maybeSingle();

    return res.json({
      id: updated.id,
      mandateId: updated.mandateId,
      mandate: mandate ? toMandateDTO(mandate) : undefined,
      senderId: updated.senderId,
      sender: senderProfile ? toUserDTO(senderProfile) : undefined,
      receiverId: updated.receiverId,
      receiver: receiverProfile ? toUserDTO(receiverProfile) : undefined,
      status: updated.status,
      message: updated.message,
      expiresAt: updated.expiresAt,
      respondedAt: updated.respondedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/quota', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const used = listIntros().filter((i) => i.senderId === req.user!.id && i.createdAt >= monthStart.toISOString()).length;
  const limit = 10;
  return res.json({
    limit,
    used,
    remaining: Math.max(0, limit - used),
    resetDate: nextMonthStart.toISOString(),
  });
});

router.get('/:id', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const intro = getIntro(req.params.id);
    if (!intro) return notFound(res, 'Introduction not found');
    if (intro.senderId !== req.user.id && intro.receiverId !== req.user.id) {
      return unauthorized(res, 'Not allowed to view this introduction');
    }

    const { data: mandate } = await supabase.from('mandates').select('*').eq('id', intro.mandateId).maybeSingle();
    const { data: senderProfile } = await supabase.from('profiles').select('*').eq('id', intro.senderId).maybeSingle();
    const { data: receiverProfile } = await supabase.from('profiles').select('*').eq('id', intro.receiverId).maybeSingle();

    return res.json({
      id: intro.id,
      mandateId: intro.mandateId,
      mandate: mandate ? toMandateDTO(mandate) : undefined,
      senderId: intro.senderId,
      sender: senderProfile ? toUserDTO(senderProfile) : undefined,
      receiverId: intro.receiverId,
      receiver: receiverProfile ? toUserDTO(receiverProfile) : undefined,
      status: intro.status,
      message: intro.message,
      expiresAt: intro.expiresAt,
      respondedAt: intro.respondedAt,
      createdAt: intro.createdAt,
      updatedAt: intro.updatedAt,
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;
