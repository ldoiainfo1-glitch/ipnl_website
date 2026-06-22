import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, notFound, serverError, unauthorized } from '../utils/apiError';
import { toUserDTO } from '../models/profile';
import { listIntros } from '../lib/runtimeStore';
import { createUploadPath, getStorageInfo, uploadObject } from '../lib/objectStorage';
import { upload, uploadErrorHandler } from '../middleware/upload';

const router = express.Router();

router.get('/me', verifySupabase, async (req, res) => {
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

    const [{ count: mandateCount }, { data: kycRow }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id),
      supabase.from('kyc_reviews').select('status').eq('user_id', req.user.id).maybeSingle(),
    ]);

    const intros = listIntros();
    const sent = intros.filter((i) => i.senderId === req.user!.id).length;
    const received = intros.filter((i) => i.receiverId === req.user!.id).length;

    return res.json(toUserDTO(data, {
      mandatesPosted: mandateCount ?? 0,
      introsSent: sent,
      introsReceived: received,
      kycStatus: (kycRow as any)?.status,
    }));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/me', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');
    if (!req.user) return unauthorized(res);

    const { companyName } = req.body as { companyName?: string };
    const patch: { company_name?: string } = {};
    if (companyName !== undefined) patch.company_name = companyName;

    if (Object.keys(patch).length === 0) {
      return badRequest(res, 'No updatable fields provided');
    }

    const { data, error } = await supabase
      .from('profiles').update(patch).eq('id', req.user.id).select('*').single();
    if (error || !data) return badRequest(res, error?.message ?? 'Unable to update profile');

    const [{ count: mandateCount2 }, { data: kycRow2 }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id),
      supabase.from('kyc_reviews').select('status').eq('user_id', req.user.id).maybeSingle(),
    ]);
    const intros2 = listIntros();
    return res.json(toUserDTO(data, {
      mandatesPosted: mandateCount2 ?? 0,
      introsSent: intros2.filter((i) => i.senderId === req.user!.id).length,
      introsReceived: intros2.filter((i) => i.receiverId === req.user!.id).length,
      kycStatus: (kycRow2 as any)?.status,
    }));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

router.patch('/me/logo', verifySupabase, upload.single('logo'), uploadErrorHandler, async (req: express.Request, res: express.Response) => {
  if (!req.user) return unauthorized(res);
  if (!req.file) return badRequest(res, 'logo file is required (multipart/form-data, field name: logo)');

  const ext = req.file.mimetype === 'image/png'
    ? 'png'
    : req.file.mimetype === 'image/webp'
      ? 'webp'
      : 'jpg';

  const path = createUploadPath('logos', req.user.id, ext);
  const uploaded = await uploadObject({
    path,
    body: req.file.buffer,
    contentType: req.file.mimetype,
  });

  return res.json({
    logo: uploaded.url,
    storage: getStorageInfo(),
  });
});

router.get('/members', verifySupabase, async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return serverError(res, 'Supabase not configured');

    const { role, city, search, page = '1', limit = '50' } = req.query as Record<string, string | undefined>;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).range(from, to);

    if (role) query = query.eq('role', role);
    if (city) {
      // City is not in profile table yet; kept for API compatibility.
    }
    if (search) query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) return badRequest(res, error.message);

    const members = await Promise.all((data || []).map(async (row) => {
      const { count: mandateCount } = await supabase
        .from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', row.id);
      const { data: kycRow } = await supabase
        .from('kyc_reviews').select('status').eq('user_id', row.id).maybeSingle();
      const intros = listIntros();
      return toUserDTO(row, {
        mandatesPosted: mandateCount ?? 0,
        introsSent: intros.filter((i) => i.senderId === row.id).length,
        introsReceived: intros.filter((i) => i.receiverId === row.id).length,
        kycStatus: (kycRow as any)?.status,
      });
    }));

    return res.json(members);
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

    const [{ count: mandateCount3 }, { data: kycRow3 }] = await Promise.all([
      supabase.from('mandates').select('id', { count: 'exact', head: true }).eq('user_id', data.id),
      supabase.from('kyc_reviews').select('status').eq('user_id', data.id).maybeSingle(),
    ]);
    const intros3 = listIntros();
    return res.json(toUserDTO(data, {
      mandatesPosted: mandateCount3 ?? 0,
      introsSent: intros3.filter((i) => i.senderId === data.id).length,
      introsReceived: intros3.filter((i) => i.receiverId === data.id).length,
      kycStatus: (kycRow3 as any)?.status,
    }));
  } catch (err: any) {
    return serverError(res, err.message);
  }
});

export default router;
