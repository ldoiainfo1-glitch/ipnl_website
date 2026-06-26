import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase embeds the recovery token in the URL hash.
  // Listening for PASSWORD_RECOVERY sets the session so updateUser works.
  useEffect(() => {
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw error;
      setStatus('success');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. The link may have expired.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <Card>
        <CardContent className="pt-8 text-center space-y-3">
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
            <p className="text-sm font-medium text-primary">Password updated successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Redirecting you to login…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          {sessionReady
            ? 'Choose a new password for your account.'
            : 'Loading your reset link…'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Min. 6 characters"
                required
                className="pr-10"
                disabled={!sessionReady}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3"
                style={{ color: '#6b7280' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm">Confirm new password *</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setErrorMsg(''); }}
                placeholder="Repeat your new password"
                required
                className="pr-10"
                disabled={!sessionReady}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3"
                style={{ color: '#6b7280' }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {errorMsg && <p className="text-destructive text-sm">{errorMsg}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={status === 'loading' || !sessionReady}
          >
            {status === 'loading' ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
