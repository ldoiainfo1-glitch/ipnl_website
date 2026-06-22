import { RequestHandler } from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { unauthorized, serverError } from '../utils/apiError';

/**
 * Verifies the Supabase-issued JWT sent as `Authorization: Bearer <token>`
 * and attaches the Supabase user object to req.user.
 *
 * The frontend obtains this token directly from the Supabase client SDK
 * (supabase.auth.signInWithPassword / signUp — see store/authStore.ts),
 * NOT from this backend. This backend's job is to verify that token on
 * every protected request and serve business data using the service
 * role key. Row Level Security policies in supabase/schema.sql and
 * supabase/migrations/*.sql are the second line of defense.
 */
export const verifySupabase: RequestHandler = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return unauthorized(res, 'Missing Authorization header');

  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return unauthorized(res, 'Invalid Authorization header format');
  }
  const token = parts[1];

  const supabase = getSupabaseAdmin();
  if (!supabase) return serverError(res, 'Supabase is not configured on the server');

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return unauthorized(res, 'Invalid or expired token');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (String(profile?.role || '').toUpperCase() === 'ADMIN') {
      data.user.user_metadata = {
        ...(data.user.user_metadata || {}),
        role: 'ADMIN',
      };
    }

    req.user = data.user;
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
};

export default verifySupabase;
