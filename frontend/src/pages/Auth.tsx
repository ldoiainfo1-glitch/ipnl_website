import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/utils/constants';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, demoLogin, isLoggingIn, isRegistering } = useAuth();
  
  const isLogin = location.pathname === '/login';
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
      }
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.detail || 'Authentication failed');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (error: any) {
      alert(error.detail || 'Demo login failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isLogin ? 'Login' : 'Create Account'}</CardTitle>
        <CardDescription>
          {isLogin 
            ? 'Enter your credentials to access your account' 
            : 'Join the exclusive IPN network'}
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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
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
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
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
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleDemoLogin}
          >
            Try Demo Account
          </Button>

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
