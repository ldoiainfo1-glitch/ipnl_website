import { Router } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';

const router = Router();

// POST /api/contact — public endpoint, no auth required
router.post('/', async (req, res) => {
  const { name, firm, email, phone, message, plan_context } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'name, email and message are required' });
  }

  // Basic email format check
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase.from('contact_enquiries' as any).insert({
        name: String(name).slice(0, 200),
        firm: firm ? String(firm).slice(0, 200) : null,
        email: String(email).slice(0, 254),
        phone: phone ? String(phone).slice(0, 30) : null,
        message: String(message).slice(0, 2000),
        plan_context: plan_context ? String(plan_context).slice(0, 300) : null,
      });
    }
  } catch (err) {
    // Non-fatal — still return 200 so the user gets a confirmation
    console.error('[contact] Supabase insert error:', err);
  }

  return res.json({ ok: true });
});

export default router;
