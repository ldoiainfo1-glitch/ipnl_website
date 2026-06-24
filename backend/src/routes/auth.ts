import express from 'express';
import { getSupabaseAdmin } from '../lib/supabaseServer';
import { v4 as uuidv4 } from 'uuid';
import { LoginRequest, RegisterRequest } from '../models/user';
import { toUserDTO } from '../models/profile';

const router = express.Router();

router.post('/register', async (req, res) => {
  const body = req.body as RegisterRequest;
  if (!body.email || !body.password) return res.status(400).json({ message: 'email and password required' });
  
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });

  try {
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      user_metadata: { name: body.name, companyName: body.companyName },
    });
    
    if (error) return res.status(409).json({ message: error.message });
    
    // Return the user; frontend will login via Supabase
    res.json({ 
      user: { 
        id: data.user?.id, 
        email: data.user?.email,
        name: body.name,
        companyName: body.companyName,
      }, 
      message: 'User created. Please login.' 
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const body = req.body as LoginRequest;
  if (!body.email || !body.password) return res.status(400).json({ message: 'email and password required' });
  
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });

  try {
    // Verify user exists and is active (frontend handles actual login via Supabase)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) return res.status(500).json({ message: error.message });
    
    const user = users?.find(u => u.email?.toLowerCase() === body.email.toLowerCase());
    if (!user) return res.status(401).json({ message: 'invalid credentials' });
    
    res.json({ message: 'Login via Supabase Auth. Use frontend /login flow.' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/demo-login', async (req, res) => {
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });
  
  try {
    const demoEmail = `demo-${uuidv4().slice(0, 8)}@ipnl.local`;
    const demoPassword = 'demopassword123';
    
    // Create temporary demo user
    const { data, error } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      user_metadata: { name: 'Demo User', companyName: 'Demo Co', isDemo: true },
      email_confirm: true,
    });
    
    if (error) return res.status(500).json({ message: error.message });
    
    // Return demo user credentials - frontend will call Supabase to get token
    res.json({
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: 'Demo User',
        companyName: 'Demo Co',
        role: 'user',
        status: 'active',
        kycStatus: 'not_submitted',
      },
      credentials: { email: demoEmail, password: demoPassword },
      message: 'Demo user created. Please login with provided credentials.',
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'invalid auth header' });
  const token = parts[1];
  
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ message: 'invalid token' });
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const metadataRole = String(data.user.user_metadata?.role || data.user.app_metadata?.role || '').toUpperCase();
    const user = profile
      ? await toUserDTO(
          {
            ...profile,
            role: metadataRole === 'ADMIN' ? 'ADMIN' : profile.role,
          },
        )
      : {
          id: data.user.id,
          email: data.user.email,
          companyName: data.user.user_metadata?.companyName || '',
          role: metadataRole || 'DEVELOPER',
          status: 'APPROVED',
          kycStatus: 'NOT_SUBMITTED',
        };

    res.json(user);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

router.get('/admin-access', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ message: 'invalid auth header' });
  const token = parts[1];

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ message: 'invalid token' });

    const metadataRole = String(data.user.user_metadata?.role || data.user.app_metadata?.role || '').toUpperCase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    const profileRole = String(profile?.role || '').toUpperCase();

    res.json({ isAdmin: metadataRole === 'ADMIN' || profileRole === 'ADMIN' });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.json({ ok: true });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
  
  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ message: 'supabase not configured' });

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) return res.status(401).json({ message: 'invalid refresh token' });
    
    res.json({ 
      token: data.session.access_token, 
      refreshToken: data.session.refresh_token 
    });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
});

export default router;
