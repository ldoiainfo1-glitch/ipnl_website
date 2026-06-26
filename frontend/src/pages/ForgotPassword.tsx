import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) { setErrorMsg('Email is required.'); return; }
    if (newPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setErrorMsg('Passwords do not match.'); return; }

    setStatus('loading');
    try {
      await apiClient.post('/auth/reset-password', { email: email.trim(), newPassword });
      await login(email.trim(), newPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update password. Please try again.');
      setStatus('idle');
    }
  };



  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Update the password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <Label htmlFor="email">Email address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
              placeholder="you@example.com"
              required
              autoFocus={!email}
            />
          </div>

          <div>
            <Label htmlFor="newPassword">New password *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrorMsg(''); }}
                placeholder="Min. 6 characters"
                required
                className="pr-10"
                autoComplete="new-password"
                autoFocus={!!email}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3"
                style={{ color: '#6b7280' }}
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                autoComplete="new-password"
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

          <Button type="submit" className="w-full" disabled={status === 'loading'}>
            {status === 'loading' ? 'Updating…' : 'Update password'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <button type="button" onClick={() => navigate('/login')} className="text-primary hover:underline">
              Back to login
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
