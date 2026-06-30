import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { verifySupabase } from '../middleware/verifySupabase';
import { badRequest, serverError, unauthorized } from '../utils/apiError';

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

// POST /leads — authenticated user submits a mandate enquiry lead
router.post('/', verifySupabase, async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase || !req.user) return unauthorized(res);

  const { mandateTitle, mandateType, mandateCompany, mandateAsset } = req.body;
  if (!mandateTitle || !mandateType || !mandateCompany) {
    return badRequest(res, 'Mandate details are required');
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, mobile, email')
      .eq('id', req.user.id)
      .single();

    const { error } = await supabase.from('leads').insert({
      user_id: req.user.id,
      name: profile?.company_name || req.user.email || 'Unknown',
      mobile: profile?.mobile || '',
      email: req.user.email || '',
      mandate_title: mandateTitle,
      mandate_type: mandateType,
      mandate_company: mandateCompany,
      mandate_asset: mandateAsset || '',
    });

    if (error) return serverError(res, error.message);
    res.json({ success: true });
  } catch (err: any) {
    serverError(res, err.message);
  }
});

// GET /leads — admin only
router.get('/', verifySupabase, async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) return serverError(res, 'DB unavailable');

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return serverError(res, error.message);
    res.json(data);
  } catch (err: any) {
    serverError(res, err.message);
  }
});

export default router;
