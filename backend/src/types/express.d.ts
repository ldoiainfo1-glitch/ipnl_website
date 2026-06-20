import type { User as SupabaseUser } from '@supabase/supabase-js';

// Augments Express's Request type so `req.user` is available and typed
// in every route file after the verifySupabase middleware runs, instead
// of each file doing `(req as any).user`.
declare global {
  namespace Express {
    interface Request {
      user?: SupabaseUser;
    }
  }
}

export {};
