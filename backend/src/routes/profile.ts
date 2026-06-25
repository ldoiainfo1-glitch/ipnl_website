import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { toUserDTO } from '../models/profile';
import { listIntros } from '../lib/runtimeStore';
import { createPrivateLogoObjectViewUrl, createUploadPath, getStorageInfo, uploadLogoObject } from '../lib/objectStorage';
import { upload, uploadErrorHandler } from '../middleware/upload';
import { toMandateDTO } from '../models/mandate';
import type { Database } from '../types/database';

const router = express.Router();
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text : null;
}

async function withSignedLogo<T extends { logo?: string | null }>(input: T): Promise<T> {
  if (!input.logo) return input;

  try {
    return {
      ...input,
      logo: await createPrivateLogoObjectViewUrl(input.logo),
    };
  } catch {
    return input;
  }
}

async function getApprovedLiveMandatesForUser(supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>, userId: string) {
  const { data: reviewRows, error: reviewError } = await supabase
    .from('mandate_reviews')
    .select('mandate_id')
    .eq('status', 'APPROVED');
  if (reviewError) throw new Error(reviewError.message);

  const approvedIds = (reviewRows ?? []).map((review) => review.mandate_id);
  if (approvedIds.length === 0) return [];

  const { data, error } = await supabase
    .from('mandates')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')
    .in('id', approvedIds)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toMandateDTO);
}

router.get('/me', verifySupabase, async (req, res) => {
  console.log('[PROFILE GET /me] Request from user:', req.user?.email);
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !data) return notFound(res, 'Profile not found');

    console.log('[PROFILE GET /me] Logo in DB:', data.logo);

    // Auto-sync company_name from auth user_metadata if missing in profiles table
    if (!data.company_name) {
      const companyName: string = req.user.user_metadata?.companyName || '';
      if (companyName) {
        supabase.from('profiles')
          .update({ company_name: companyName, updated_at: new Date().toISOString() })
          .eq('id', req.user.id)
          .then(undefined, (err: unknown) => console.error('[PROFILE /me] company_name sync failed:', err));
        data.company_name = companyName;
      }
    }

    const [{ count: mandateCount }, { data: kycRow }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('status', 'ACTIVE'),
      supabase.from('kyc_reviews').select('status').eq('user_id', req.user.id).maybeSingle(),
    ]);

    const intros = listIntros();
    const sent = intros.filter((i) => i.senderId === req.user!.id).length;
    const received = intros.filter((i) => i.receiverId === req.user!.id).length;

    const user = await toUserDTO(data, {
      mandatesPosted: mandateCount ?? 0,
      introsSent: sent,
      introsReceived: received,
      kycStatus: (kycRow as any)?.status,
    });

    const result = await withSignedLogo(user);
    console.log('[PROFILE GET /me] Signed logo URL:', result.logo);
    return res.json(result);
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/me', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const {
      companyName,
      mobile,
      companyDescription,
      website,
      linkedin,
      city,
      state,
      assetPreferences,
      ticketSizeMin,
      ticketSizeMax,
    } = req.body as Record<string, any>;

    const patch: ProfileUpdate = {};
    if (companyName !== undefined) patch.company_name = companyName;
    if (mobile !== undefined) patch.mobile = normalizeOptionalText(mobile);
    if (companyDescription !== undefined) patch.company_description = normalizeOptionalText(companyDescription);
    if (website !== undefined) patch.website = normalizeOptionalText(website);
    if (linkedin !== undefined) patch.linkedin = normalizeOptionalText(linkedin);
    if (city !== undefined) patch.city = normalizeOptionalText(city);
    if (state !== undefined) patch.state = normalizeOptionalText(state);
    if (Array.isArray(assetPreferences)) patch.asset_preferences = assetPreferences;
    if (ticketSizeMin !== undefined) patch.ticket_size_min = ticketSizeMin == null || ticketSizeMin === '' ? null : Number(ticketSizeMin);
    if (ticketSizeMax !== undefined) patch.ticket_size_max = ticketSizeMax == null || ticketSizeMax === '' ? null : Number(ticketSizeMax);

    if (Object.keys(patch).length === 0) {
      return badRequest(res, 'No updatable fields provided');
    }

    const { data, error } = await supabase
      .from('profiles').update(patch).eq('id', req.user.id).select('*').single();
    if (error || !data) return badRequest(res, error?.message ?? 'Unable to update profile');

    const [{ count: mandateCount2 }, { data: kycRow2 }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('status', 'ACTIVE'),
      supabase.from('kyc_reviews').select('status').eq('user_id', req.user.id).maybeSingle(),
    ]);
    const intros2 = listIntros();
    const user = await toUserDTO(data, {
      mandatesPosted: mandateCount2 ?? 0,
      introsSent: intros2.filter((i) => i.senderId === req.user!.id).length,
      introsReceived: intros2.filter((i) => i.receiverId === req.user!.id).length,
      kycStatus: (kycRow2 as any)?.status,
    });

    return res.json(await withSignedLogo(user));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/me/logo', verifySupabase, upload.single('logo'), uploadErrorHandler, async (req: express.Request, res: express.Response) => {
  console.log('[LOGO UPLOAD] Request received');
  if (!req.user) return unauthorized(res);
  if (!req.file) {
    console.log('[LOGO UPLOAD] No file in request');
    return badRequest(res, 'logo file is required (multipart/form-data, field name: logo)');
  }

  console.log('[LOGO UPLOAD] File received:', {
    mimetype: req.file.mimetype,
    size: req.file.size,
    originalname: req.file.originalname,
  });

  try {
    const uploadedExt = req.file.mimetype === 'image/jpeg' ? 'jpg' : req.file.mimetype.split('/')[1] || 'webp';
    const path = createUploadPath('logos', req.user.id, uploadedExt);
    console.log('[LOGO UPLOAD] Uploading to path:', path);

    const uploaded = await uploadLogoObject({
      path,
      body: req.file.buffer,
      contentType: req.file.mimetype,
    });

    console.log('[LOGO UPLOAD] Upload result:', uploaded);

    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase
      .from('profiles')
      .update({ logo: uploaded.url, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)
      .select('logo')
      .single();
    if (error || !data) {
      console.log('[LOGO UPLOAD] Database update failed:', error?.message);
      return badRequest(res, error?.message ?? 'Unable to save logo');
    }

    console.log('[LOGO UPLOAD] ✓ Success, returning response');
    return res.json({
      logo: await createPrivateLogoObjectViewUrl(data.logo ?? uploaded.url),
      storage: getStorageInfo(),
    });
  } catch (err: any) {
    console.error('[LOGO UPLOAD] ✗ Error:', err.message);
    return serverError(res, err.message);
  }
});

router.get('/members', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { role, city, assetClass, ticketSizeMin, ticketSizeMax, search, page = '1', limit = '50' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data: approvedKycRows, error: approvedKycError } = await supabase
      .from('kyc_reviews')
      .select('user_id')
      .eq('status', 'APPROVED');
    if (approvedKycError) return badRequest(res, approvedKycError.message);

    const approvedUserIds = (approvedKycRows ?? []).map((row) => row.user_id);
    if (approvedUserIds.length === 0) return res.json([]);

    let query = supabase
      .from('profiles')
      .select('*')
      .in('id', approvedUserIds)
      .neq('status', 'SUSPENDED')
      .neq('role', 'ADMIN')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (role) query = query.eq('role', role);
    if (city) query = query.ilike('city', `%${city}%`);
    if (assetClass) query = query.contains('asset_preferences', [assetClass]);
    if (ticketSizeMin) query = query.gte('ticket_size_max', Number(ticketSizeMin));
    if (ticketSizeMax) query = query.lte('ticket_size_min', Number(ticketSizeMax));
    if (search) query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return badRequest(res, error.message);

    const members = await Promise.all((data || []).map(async (row) => {
      const { count: mandateCount } = await supabase
        .from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', row.id).eq('status', 'ACTIVE');
      const { data: kycRow } = await supabase
        .from('kyc_reviews').select('status').eq('user_id', row.id).maybeSingle();
      const intros = listIntros();
      const user = await toUserDTO(row, {
        mandatesPosted: mandateCount ?? 0,
        introsSent: intros.filter((i) => i.senderId === row.id).length,
        introsReceived: intros.filter((i) => i.receiverId === row.id).length,
        kycStatus: (kycRow as any)?.status,
      });
      return await withSignedLogo(user);
    }));

    return res.json(members.filter((member) => member.kycStatus === 'APPROVED'));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.get('/members/:id', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return notFound(res, 'Member not found');
    if (data.status === 'SUSPENDED') return notFound(res, 'Member not found');

    const [{ count: mandateCount3 }, { data: kycRow3 }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', data.id).eq('status', 'ACTIVE'),
      supabase.from('kyc_reviews').select('status').eq('user_id', data.id).maybeSingle(),
    ]);

    const intros3 = listIntros();
    const user = await toUserDTO(data, {
      mandatesPosted: mandateCount3 ?? 0,
      introsSent: intros3.filter((i) => i.senderId === data.id).length,
      introsReceived: intros3.filter((i) => i.receiverId === data.id).length,
      kycStatus: (kycRow3 as any)?.status,
    });
    const mandates = await getApprovedLiveMandatesForUser(supabase, data.id);
    return res.json({ user: await withSignedLogo(user), mandates });
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;