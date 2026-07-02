import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, forbidden, notFound, serverError, unauthorized } from '../utils/apiError';
import { toMandateDTO, toMandateInsertPayload, toMandateUpdatePayload, hasAnyUpdateFields } from '../models/mandate';
import { toUserDTO } from '../models/profile';
import { createNotification } from '../lib/notificationsStore';
import { emitToUsers } from '../lib/realtime';

const router = express.Router();

async function getAdminUserIds(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('id').eq('role', 'ADMIN');
  return (data ?? []).map((p: { id: string }) => p.id);
}

const MANDATE_TYPES = ['BUY', 'SELL'] as const;
const ASSET_CLASSES = [
  'RESIDENTIAL',
  'COMMERCIAL',
  'INDUSTRIAL',
  'HOSPITALITY',
  'RETAIL',
  'LAND',
  'MIXED_USE',
] as const;

const SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'created_at',
  ticketSize: 'ticket_size',
  viewCount: 'view_count',
};

function attachMandateReviewMetadata(mandate: ReturnType<typeof toMandateDTO>, review?: any) {
  return {
    ...mandate,
    moderationStatus: review?.status ?? 'PENDING',
    moderationNote: review?.note ?? undefined,
    moderationReviewedBy: review?.reviewed_by ?? undefined,
    moderationReviewedAt: review?.reviewed_at ?? undefined,
  };
}

async function attachMandateOwners(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, mandates: ReturnType<typeof toMandateDTO>[]) {
  const userIds = Array.from(new Set(mandates.map((mandate) => mandate.userId)));
  if (userIds.length === 0) return mandates;

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);
  if (profilesError) console.error('[attachMandateOwners] profiles query failed:', profilesError.message);

  // Back-fill company_name from Supabase auth user_metadata for any profile missing it
  const profilesWithName = await Promise.all((profiles ?? []).map(async (profile) => {
    if (profile.company_name) return profile;
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
      const companyName = authData?.user?.user_metadata?.companyName || '';
      if (companyName) {
        supabase.from('profiles').update({ company_name: companyName, updated_at: new Date().toISOString() })
          .eq('id', profile.id)
          .then(undefined, (err: unknown) => console.error('[attachMandateOwners] backfill failed:', err));
        return { ...profile, company_name: companyName };
      }
    } catch (err: any) {
      console.warn('[attachMandateOwners] auth lookup failed for', profile.id);
    }
    return profile;
  }));
  const profileById = new Map(
    await Promise.all(profilesWithName.map(async (profile) => [profile.id, await toUserDTO(profile)] as const)),
  );

  return mandates.map((mandate) => ({
    ...mandate,
    user: profileById.get(mandate.userId),
  }));
}

// ---------------------------------------------------------------------
// GET /api/mandates  — public, supports MandateFilters via query string
// Returns: { items: Mandate[], meta: PaginationMeta }
// ---------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const {
      type,
      assetClass,
      city,
      state,
      minTicketSize,
      maxTicketSize,
      tags,
      sortBy,
      sortOrder,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data: approvedReviews, error: approvedReviewsError } = await supabase
      .from('mandate_reviews')
      .select('mandate_id')
      .eq('status', 'APPROVED');
    if (approvedReviewsError) return badRequest(res, approvedReviewsError.message);

    const approvedMandateIds = (approvedReviews ?? []).map((review) => review.mandate_id);
    if (approvedMandateIds.length === 0) {
      return res.json({
        items: [],
        meta: { total: 0, page: pageNum, limit: limitNum, totalPages: 1 },
      });
    }

    // Show only active mandates that have been explicitly approved by admin.
    // Off-market here means "not listed on public internet portals",
    // not hidden from authenticated India Property Network Ltd. users.
    let query = supabase
      .from('mandates')
      .select('*', { count: 'exact' })
      .eq('status', 'ACTIVE')
      .in('id', approvedMandateIds);

    if (type) {
      if (!(MANDATE_TYPES as readonly string[]).includes(type)) {
        return badRequest(res, `Invalid type filter: ${type}`);
      }
      query = query.eq('type', type as 'BUY' | 'SELL');
    }
    if (assetClass) {
      if (!(ASSET_CLASSES as readonly string[]).includes(assetClass)) {
        return badRequest(res, `Invalid assetClass filter: ${assetClass}`);
      }
      query = query.eq('asset_class', assetClass as typeof ASSET_CLASSES[number]);
    }
    if (city) query = query.ilike('city', `%${city}%`);
    if (state) query = query.ilike('state', `%${state}%`);
    if (minTicketSize) query = query.gte('ticket_size', Number(minTicketSize));
    if (maxTicketSize) query = query.lte('ticket_size', Number(maxTicketSize));
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : String(tags).split(',');
      query = query.overlaps('tags', tagList);
    }

    const sortColumn = (sortBy && SORT_COLUMN_MAP[sortBy]) || 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(sortColumn, { ascending }).range(from, to);

    const { data, error, count } = await query;
    if (error) return badRequest(res, error.message);

    const total = count ?? data?.length ?? 0;

    const items = await attachMandateOwners(
      supabase,
      (data || []).map((row) => attachMandateReviewMetadata(toMandateDTO(row), { status: 'APPROVED' })),
    );

    return res.json({
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// ---------------------------------------------------------------------
// GET /api/mandates/my  — requires auth. Returns the caller's own
// mandates regardless of status/visibility, with the same MandateFilters
// support as the public list (minus the public-only visibility limits).
// ---------------------------------------------------------------------
router.get('/my', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const {
      type,
      assetClass,
      city,
      state,
      minTicketSize,
      maxTicketSize,
      tags,
      sortBy,
      sortOrder,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase.from('mandates').select('*', { count: 'exact' }).eq('user_id', req.user.id);

    if (type) {
      if (!(MANDATE_TYPES as readonly string[]).includes(type)) {
        return badRequest(res, `Invalid type filter: ${type}`);
      }
      query = query.eq('type', type as 'BUY' | 'SELL');
    }
    if (assetClass) {
      if (!(ASSET_CLASSES as readonly string[]).includes(assetClass)) {
        return badRequest(res, `Invalid assetClass filter: ${assetClass}`);
      }
      query = query.eq('asset_class', assetClass as typeof ASSET_CLASSES[number]);
    }
    if (city) query = query.ilike('city', `%${city}%`);
    if (state) query = query.ilike('state', `%${state}%`);
    if (minTicketSize) query = query.gte('ticket_size', Number(minTicketSize));
    if (maxTicketSize) query = query.lte('ticket_size', Number(maxTicketSize));
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : String(tags).split(',');
      query = query.overlaps('tags', tagList);
    }

    const sortColumn = (sortBy && SORT_COLUMN_MAP[sortBy]) || 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(sortColumn, { ascending }).range(from, to);

    const { data, error, count } = await query;

    if (error) return badRequest(res, error.message);

    const total = count ?? data?.length ?? 0;

    const ids = (data ?? []).map((mandate) => mandate.id);
    const { data: reviewRows, error: reviewRowsError } = ids.length
      ? await supabase.from('mandate_reviews').select('*').in('mandate_id', ids)
      : { data: [], error: null };
    if (reviewRowsError) return badRequest(res, reviewRowsError.message);
    const reviewMap = new Map((reviewRows ?? []).map((review: any) => [review.mandate_id, review]));

    const items = await attachMandateOwners(
      supabase,
      (data || []).map((row) => attachMandateReviewMetadata(toMandateDTO(row), reviewMap.get(row.id))),
    );

    return res.json({
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// ---------------------------------------------------------------------
// GET /api/mandates/:id  — public. Increments view_count (best-effort,
// fire-and-forget so a slow counter update never blocks the response).
// Returns: Mandate
// ---------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase
      .from('mandates')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return notFound(res, 'Mandate not found');

    // Fire-and-forget view count increment — don't await, don't fail the request on error
    supabase
      .from('mandates')
      .update({ view_count: (data.view_count ?? 0) + 1 })
      .eq('id', req.params.id)
      .then(undefined, (err: unknown) => {
        // eslint-disable-next-line no-console
        console.error('Failed to increment mandate view_count:', err);
      });

    return res.json(toMandateDTO(data));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// ---------------------------------------------------------------------
// POST /api/mandates  — requires auth.
// Body: CreateMandateRequest. Returns: Mandate
// ---------------------------------------------------------------------
router.post('/', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const { type, title, description, city, state, propertyType, ticketSize, tags, isOffMarket } = req.body;
    if (!type || !title || !description || !city || !state || !propertyType || ticketSize == null) {
      return badRequest(
        res,
        'type, title, description, city, state, propertyType, and ticketSize are required'
      );
    }

    const payload = toMandateInsertPayload(req.user.id, {
      ...req.body,
      tags: Array.isArray(tags) ? tags : [],
      isOffMarket: !!isOffMarket,
    });
    payload.status = 'DRAFT';

    const { data, error } = await supabase
      .from('mandates')
      .insert(payload)
      .select()
      .single();

    if (error) return badRequest(res, error.message);

    const { data: reviewRow, error: reviewError } = await supabase
      .from('mandate_reviews')
      .insert({ mandate_id: data.id, status: 'PENDING' })
      .select('*')
      .single();
    if (reviewError || !reviewRow) {
      await supabase.from('mandates').delete().eq('id', data.id);
      return badRequest(res, reviewError?.message ?? 'Unable to create mandate review');
    }

    const mandateDTO = attachMandateReviewMetadata(toMandateDTO(data), reviewRow);

    // Fire-and-forget notifications — never block the 201 response
    const posterId = req.user!.id;
    const mandateTitle = data.title as string;
    const mandateId = data.id as string;
    ;(async () => {
      try {
        const posterNotif = await createNotification({
          userId: posterId,
          type: 'MANDATE_POSTED',
          title: 'Mandate Submitted for Review',
          message: `Your mandate "${mandateTitle}" has been submitted and is pending admin approval.`,
          relatedEntityId: mandateId,
          relatedEntityType: 'mandate',
        });
        emitToUsers([posterId], 'notification:new', posterNotif);

        const { data: posterProfile } = await supabase.from('profiles').select('company_name').eq('id', posterId).maybeSingle();
        const companyName = (posterProfile as any)?.company_name ?? 'A member';
        const adminIds = await getAdminUserIds(supabase);
        console.log('[mandates] admin IDs found:', adminIds);
        for (const adminId of adminIds) {
          const adminNotif = await createNotification({
            userId: adminId,
            type: 'MANDATE_POSTED',
            title: 'New Mandate Pending Review',
            message: `${companyName} has posted a new mandate: "${mandateTitle}". Review it in the admin panel.`,
            relatedEntityId: mandateId,
            relatedEntityType: 'mandate',
          });
          emitToUsers([adminId], 'notification:new', adminNotif);
          console.log('[mandates] admin notif created for', adminId);
        }
      } catch (notifErr: any) {
        console.error('[mandates] notification error (non-fatal):', notifErr?.message);
      }
    })();

    return res.status(201).json(mandateDTO);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// ---------------------------------------------------------------------
// PATCH /api/mandates/:id  — requires auth + ownership.
// Body: Partial<CreateMandateRequest>. Returns: Mandate
// ---------------------------------------------------------------------
router.patch('/:id', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const existing = await supabase
      .from('mandates')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (existing.error || !existing.data) return notFound(res, 'Mandate not found');
    if (existing.data.user_id !== req.user.id) {
      return forbidden(res, 'You can only edit your own mandates');
    }

    const updatePayload = toMandateUpdatePayload(req.body);
    if (!hasAnyUpdateFields(updatePayload)) {
      return badRequest(res, 'No valid fields provided to update');
    }

    updatePayload.status = 'DRAFT';

    const { data, error } = await supabase
      .from('mandates')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return badRequest(res, error.message);

    const { data: reviewRow, error: reviewError } = await supabase
      .from('mandate_reviews')
      .upsert(
        {
          mandate_id: req.params.id,
          status: 'PENDING',
          note: null,
          reviewed_by: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'mandate_id' },
      )
      .select('*')
      .single();
    if (reviewError || !reviewRow) return badRequest(res, reviewError?.message ?? 'Unable to reset mandate review');

    return res.json(attachMandateReviewMetadata(toMandateDTO(data), reviewRow));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// ---------------------------------------------------------------------
// PATCH /api/mandates/:id/close  — requires auth + ownership.
// Returns: Mandate
// ---------------------------------------------------------------------
router.patch('/:id/close', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const existing = await supabase
      .from('mandates')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (existing.error || !existing.data) return notFound(res, 'Mandate not found');
    if (existing.data.user_id !== req.user.id) {
      return forbidden(res, 'You can only close your own mandates');
    }

    const { data, error } = await supabase
      .from('mandates')
      .update({ status: 'CLOSED' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return badRequest(res, error.message);

    return res.json(toMandateDTO(data));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

// ---------------------------------------------------------------------
// DELETE /api/mandates/:id  — requires auth + ownership.
// ---------------------------------------------------------------------
router.delete('/:id', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const existing = await supabase
      .from('mandates')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (existing.error || !existing.data) return notFound(res, 'Mandate not found');
    if (existing.data.user_id !== req.user.id) {
      return forbidden(res, 'You can only delete your own mandates');
    }

    const { error } = await supabase.from('mandates').delete().eq('id', req.params.id);
    if (error) return badRequest(res, error.message);

    return res.json({ success: true });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;
