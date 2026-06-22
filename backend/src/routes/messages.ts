import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { putNotification } from '../lib/runtimeStore';

const router = express.Router();

async function mapConversation(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, row: { id: string; participant_ids: string[]; created_at: string; updated_at: string }, currentUserId: string) {
  const { data: participants } = await supabase
    .from('profiles')
    .select('*')
    .in('id', row.participant_ids);

  const { data: lastMessage } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', row.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    id: row.id,
    participants: (participants || []).map((p) => ({
      id: p.id,
      email: p.email ?? '',
      mobile: '',
      companyName: p.company_name ?? 'Unknown Company',
      role: p.role === 'ADMIN' ? 'ADMIN' : 'DEVELOPER',
      tier: p.tier === 'ENTERPRISE' || p.tier === 'VERIFIED' || p.tier === 'OBSERVER' ? p.tier : 'OBSERVER',
      status: 'APPROVED',
      kycStatus: 'SUBMITTED',
      reputationScore: 50,
      totalIntrosSent: 0,
      totalIntrosReceived: 0,
      totalMandatesPosted: 0,
      introQuotaLimit: 10,
      introQuotaUsed: 0,
      isAnonymous: false,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
    participantIds: row.participant_ids,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          conversationId: lastMessage.conversation_id,
          senderId: lastMessage.sender_id,
          content: lastMessage.content ?? '',
          status: 'SENT',
          createdAt: lastMessage.created_at,
          updatedAt: lastMessage.created_at,
        }
      : undefined,
    unreadCount: 0,
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

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.conversationId)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) return badRequest(res, error.message);

    return res.json((data || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content ?? '',
      status: 'SENT',
      createdAt: m.created_at,
      updatedAt: m.created_at,
    })));
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

    const recipientId = conversation.participant_ids.find((id) => id !== req.user!.id);
    if (recipientId) {
      putNotification({
        userId: recipientId,
        type: 'MESSAGE_RECEIVED',
        title: 'New Message',
        message: body.content.trim().slice(0, 120),
        relatedEntityId: conversationId,
        relatedEntityType: 'conversation',
      });
    }

    return res.status(201).json({
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: data.content ?? '',
      status: 'SENT',
      createdAt: data.created_at,
      updatedAt: data.created_at,
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/:conversationId/read', verifySupabase, async (req, res) => {
  if (!req.user) return unauthorized(res);
  return res.json({ success: true });
});

export default router;
