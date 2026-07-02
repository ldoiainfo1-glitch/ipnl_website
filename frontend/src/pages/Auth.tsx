import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/utils/constants';
import { apiClient } from '@/api/client';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  
  const isLogin = location.pathname === '/login';
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    mobile: '',
    role: 'DEVELOPER',
    pan: '',
    gst: '',
    reraNumber: '',
  });

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        console.log('Email:', formData.email);
        console.log('Password:', formData.password);
        console.log('Form Data:', formData);
        await register({
          email: formData.email,
          password: formData.password,
          companyName: formData.companyName,
          mobile: formData.mobile,
          role: formData.role as any,
          pan: formData.pan,
          gst: formData.gst,
          reraNumber: formData.reraNumber,
        });
        // Submit pending mandate enquiry if the user came from a mandate preview
        const pendingEnquiry = localStorage.getItem('pendingMandateEnquiry');
        if (pendingEnquiry) {
          try {
            const enquiryData = JSON.parse(pendingEnquiry);
            await apiClient.post('/leads', {
              ...enquiryData,
              name: formData.companyName,
              mobile: formData.mobile,
              email: formData.email,
            });
          } catch {
            // non-critical — don't block navigation
          } finally {
            localStorage.removeItem('pendingMandateEnquiry');
          }
        }
      }
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.detail || 'Authentication failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLogin ? 'Login' : 'Create Account'}</CardTitle>
        <CardDescription>
          {isLogin 
            ? 'Enter your credentials to access your account' 
            : 'Join India Property Network Ltd.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {USER_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setEmailError(''); }}
              required
            />
            {emailError && <p className="text-destructive text-xs mt-1">{emailError}</p>}
          </div>

          {!isLogin && (
            <div>
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit number"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3"
                style={{ color: '#6b7280' }}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {isLogin && (
              <div className="text-right mt-1">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    if (!formData.email.trim()) {
                      setEmailError('Email is required to reset your password');
                      return;
                    }
                    navigate(`/forgot-password?email=${encodeURIComponent(formData.email)}`);
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {!isLogin && (
            <>
              <div>
                <Label htmlFor="pan">PAN Number (Optional)</Label>
                <Input
                  id="pan"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>

              <div>
                <Label htmlFor="gst">GST Number (Optional)</Label>
                <Input
                  id="gst"
                  value={formData.gst}
                  onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                  placeholder="22AAAAA0000A1Z5"
                  maxLength={15}
                />
              </div>

              <div>
                <Label htmlFor="reraNumber">RERA Number (Optional)</Label>
                <Input
                  id="reraNumber"
                  value={formData.reraNumber}
                  onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value.toUpperCase() })}
                />
              </div>
            </>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoggingIn || isRegistering}
          >
            {isLoggingIn || isRegistering ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
          </Button>
        </form>

        <div className="mt-4 space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => navigate(isLogin ? '/register' : '/login')}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
