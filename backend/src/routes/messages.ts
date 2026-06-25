import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { createNotification } from '../lib/notificationsStore';
import { emitToUsers } from '../lib/realtime';
import { toUserDTO } from '../models/profile';
import { createPrivateLogoObjectViewUrl } from '../lib/objectStorage';

const router = express.Router();
const PROFILE_CARD_MESSAGE_TYPE = 'IPNL_PROFILE_CARD_V1';
const MESSAGE_SEEN_TTL_DAYS = 7;

function mapMessage(row: { id: string; conversation_id: string; sender_id: string; content: string | null; seen_at?: string | null; expires_at?: string | null; created_at: string }) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content ?? '',
    status: row.seen_at ? 'READ' : 'SENT',
    seenAt: row.seen_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

async function deleteExpiredSeenMessages(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  await supabase
    .from('messages')
    .delete()
    .not('seen_at', 'is', null)
    .not('expires_at', 'is', null)
    .lte('expires_at', new Date().toISOString());
}

function createProfileCardContent(user: any): string {
  return JSON.stringify({
    type: PROFILE_CARD_MESSAGE_TYPE,
    profile: {
      companyName: user.companyName,
      role: user.role,
      tier: user.tier,
      kycStatus: user.kycStatus,
      companyDescription: user.companyDescription,
      website: user.website,
      linkedin: user.linkedin,
      city: user.city,
      state: user.state,
      assetPreferences: user.assetPreferences,
      ticketSizeMin: user.ticketSizeMin,
      ticketSizeMax: user.ticketSizeMax,
      reputationScore: user.reputationScore,
      totalMandatesPosted: user.totalMandatesPosted,
    },
  });
}

async function mapConversation(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, row: { id: string; participant_ids: string[]; created_at: string; updated_at: string }, currentUserId: string) {
  const { data: participants } = await supabase
    .from('profiles')
    .select('*')
    .in('id', row.participant_ids);

    // Fetch real mandate counts for all participants in one query (ACTIVE only)
    const { data: mandateRows } = await supabase
      .from('mandates')
      .select('user_id')
      .in('user_id', row.participant_ids)
      .eq('status', 'ACTIVE');
    const mandateCountByUser = new Map<string, number>();
    (mandateRows ?? []).forEach((m) => {
      mandateCountByUser.set(m.user_id, (mandateCountByUser.get(m.user_id) ?? 0) + 1);
    });

  const { data: lastMessage } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, created_at, seen_at, expires_at')
    .eq('conversation_id', row.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: unreadCount } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', row.id)
    .neq('sender_id', currentUserId)
    .is('seen_at', null);

  return {
    id: row.id,
    participants: await Promise.all((participants || []).map(async (p) => ({
      id: p.id,
      email: p.email ?? '',
      mobile: p.mobile ?? '',
      companyName: p.company_name ?? 'Unknown Company',
      role: p.role ?? 'DEVELOPER',
      tier: p.tier ?? 'OBSERVER',
      status: p.status ?? 'APPROVED',
      kycStatus: p.kyc_status ?? 'NOT_SUBMITTED',
      companyDescription: p.company_description ?? '',
      website: p.website ?? '',
      linkedin: p.linkedin ?? '',
      city: p.city ?? '',
      state: p.state ?? '',
      assetPreferences: p.asset_preferences ?? [],
      ticketSizeMin: p.ticket_size_min ?? undefined,
      ticketSizeMax: p.ticket_size_max ?? undefined,
      reputationScore: p.reputation_score ?? 50,
      totalIntrosSent: 0,
      totalIntrosReceived: 0,
      totalMandatesPosted: mandateCountByUser.get(p.id) ?? 0,
      introQuotaLimit: 10,
      introQuotaUsed: 0,
      logo: p.logo ? (await createPrivateLogoObjectViewUrl(p.logo)) : null,
      isAnonymous: false,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }))),
    participantIds: row.participant_ids,
    lastMessage: lastMessage
      ? mapMessage(lastMessage)
      : undefined,
    unreadCount: unreadCount ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _forUser: currentUserId,
  };
}

router.get('/conversations', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [req.user.id])
      .order('updated_at', { ascending: false });

    if (error) return badRequest(res, error.message);

  await deleteExpiredSeenMessages(supabase);

    const result = await Promise.all((data || []).map((c) => mapConversation(supabase, c, req.user!.id)));
    return res.json(result.map(({ _forUser, ...rest }) => rest));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.post('/conversations', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const body = req.body as { participantIds?: string[] };
    const participantIds = Array.from(new Set([req.user.id, ...(body.participantIds || [])]));
    if (participantIds.length < 2) return badRequest(res, 'At least two participants are required');

    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', participantIds)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const mapped = await mapConversation(supabase, existing, req.user.id);
      const { _forUser, ...rest } = mapped;
      return res.json(rest);
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ participant_ids: participantIds })
      .select('*')
      .single();

    if (error || !data) return badRequest(res, error?.message ?? 'Unable to create conversation');

    const mapped = await mapConversation(supabase, data, req.user.id);
    const { _forUser, ...rest } = mapped;
    return res.status(201).json(rest);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/conversations/:id', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return notFound(res, 'Conversation not found');
    if (!data.participant_ids.includes(req.user.id)) return unauthorized(res, 'Not part of this conversation');

    const mapped = await mapConversation(supabase, data, req.user.id);
    const { _forUser, ...rest } = mapped;
    return res.json(rest);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/:conversationId', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10) || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', req.params.conversationId)
      .single();

    if (!conversation) return notFound(res, 'Conversation not found');
    if (!conversation.participant_ids.includes(req.user.id)) return unauthorized(res, 'Not part of this conversation');

    await deleteExpiredSeenMessages(supabase);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.conversationId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) return badRequest(res, error.message);

    return res.json((data || []).map(mapMessage));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.post('/profile-details', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const body = req.body as { conversationId?: string };
    if (!body.conversationId) return badRequest(res, 'conversationId is required');

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', body.conversationId)
      .single();

    if (!conversation) return notFound(res, 'Conversation not found');
    if (!conversation.participant_ids.includes(req.user.id)) return unauthorized(res, 'Not part of this conversation');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) return notFound(res, 'Profile not found');

    const { count: mandatesPosted } = await supabase
      .from('mandates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('status', 'ACTIVE');

    const content = createProfileCardContent(await toUserDTO(profile, { mandatesPosted: mandatesPosted ?? 0 }));
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: body.conversationId,
        sender_id: req.user.id,
        content,
      })
      .select('*')
      .single();

    if (error || !data) return badRequest(res, error?.message ?? 'Unable to send profile details');

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', body.conversationId);

    const message = mapMessage(data);
    const recipientIds = conversation.participant_ids.filter((id) => id !== req.user!.id);
    for (const recipientId of recipientIds) {
      const notification = await createNotification({
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: 'Profile Details Shared',
        message: `${profile.company_name ?? 'A member'} shared company profile details`,
        relatedEntityId: body.conversationId,
        relatedEntityType: 'conversation',
      });
      emitToUsers([recipientId], 'notification:new', notification);
    }

    emitToUsers(conversation.participant_ids, 'message:new', {
      conversationId: body.conversationId,
      message,
    });

    return res.status(201).json(message);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.post('/', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const body = req.body as { conversationId?: string; recipientId?: string; content?: string };
    if (!body.content?.trim()) return badRequest(res, 'content is required');

    let conversationId = body.conversationId;
    if (!conversationId && body.recipientId) {
      const participantIds = Array.from(new Set([req.user.id, body.recipientId]));
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', participantIds)
        .limit(1)
        .maybeSingle();

      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: created, error: createError } = await supabase
          .from('conversations')
          .insert({ participant_ids: participantIds })
          .select('*')
          .single();
        if (createError || !created) return badRequest(res, createError?.message ?? 'Unable to create conversation');
        conversationId = created.id;
      }
    }

    if (!conversationId) return badRequest(res, 'conversationId or recipientId is required');

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) return notFound(res, 'Conversation not found');
    if (!conversation.participant_ids.includes(req.user.id)) return unauthorized(res, 'Not part of this conversation');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: req.user.id,
        content: body.content.trim(),
      })
      .select('*')
      .single();

    if (error || !data) return badRequest(res, error?.message ?? 'Unable to send message');

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const message = mapMessage(data);

    const recipientIds = conversation.participant_ids.filter((id) => id !== req.user!.id);
    for (const recipientId of recipientIds) {
      const notification = await createNotification({
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: body.content.trim().slice(0, 120),
        relatedEntityId: conversationId,
        relatedEntityType: 'conversation',
      });
      emitToUsers([recipientId], 'notification:new', notification);
    }

    emitToUsers(conversation.participant_ids, 'message:new', {
      conversationId,
      message,
    });

    return res.status(201).json(message);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/:conversationId/read', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', req.params.conversationId)
      .single();

    if (!conversation) return notFound(res, 'Conversation not found');
    if (!conversation.participant_ids.includes(req.user.id)) return unauthorized(res, 'Not part of this conversation');

    await deleteExpiredSeenMessages(supabase);

    const now = new Date();
    const seenAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + MESSAGE_SEEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('messages')
      .update({ seen_at: seenAt, expires_at: expiresAt })
      .eq('conversation_id', req.params.conversationId)
      .neq('sender_id', req.user.id)
      .is('seen_at', null)
      .select('id');

    if (error) return badRequest(res, error.message);

    return res.json({ success: true, seenAt, expiresAt, updatedCount: data?.length ?? 0 });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;

