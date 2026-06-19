import { RequestHandler } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';

export const verifySupabase: RequestHandler = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'missing auth header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'invalid auth header' });
  const token = parts[1];
  
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ message: 'invalid token' });
  // attach supabase user
  (req as any).user = data.user;
  next();
};

export default verifySupabase;
