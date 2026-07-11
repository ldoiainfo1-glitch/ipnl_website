import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MapPin, ArrowLeft, Send, Building2, Tag, DollarSign, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

interface MandatePreviewData {
  company: string;
  type: string;
  asset: string;
  ticket: string;
  initial: string;
  side: 'buy' | 'sell' | 'looking_for' | 'offering';
}

export default function PublicMandatePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    setIsDarkMode(theme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const SIDE_BADGE_CONFIG: Record<MandatePreviewData['side'], { label: string; className: string }> = {
  buy: {
    label: 'Buy-side Mandate',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0',
  },
  sell: {
    label: 'Sell-side Mandate',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0',
  },
  looking_for: {
    label: 'Looking For',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-0',
  },
  offering: {
    label: 'Offering',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0',
  },
};

  const mandate: MandatePreviewData | undefined = location.state?.mandate;

  if (!mandate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg font-medium">Mandate details not available</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handleSendEnquiry = () => {
    if (isAuthenticated) {
      // Already logged in — go to marketplace
      navigate('/marketplace');
      return;
    }
    localStorage.setItem(
      'pendingMandateEnquiry',
      JSON.stringify({
        mandateTitle: `${mandate.type} – ${mandate.asset}`,
        mandateType: mandate.type,
        mandateCompany: mandate.company,
        mandateAsset: mandate.asset,
      })
    );
    navigate('/register');
  };

  const [location1, location2] = mandate.asset.split(' · ');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div
              className="flex items-center cursor-pointer"
              onClick={() => navigate('/')}
            >
              <img
                src="/assets/ipnl-logo.png?v=1"
                alt="India Property Network Ltd"
                className="h-16 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-[#FF9900]" />
              ) : (
                <Moon className="w-5 h-5 text-[#003366]" />
              )}
            </Button>
            <Button
              className="bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold"
              onClick={handleSendEnquiry}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Enquiry
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Mandate Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge className={SIDE_BADGE_CONFIG[mandate.side].className}>
                    {SIDE_BADGE_CONFIG[mandate.side].label}
                </Badge>
                <Badge variant="outline">{mandate.type}</Badge>
              </div>
              <div className="size-12 rounded-full flex items-center justify-center font-bold text-lg bg-[#003366] text-white dark:bg-[#FF9900] dark:text-[#003366]">
                {mandate.initial}
              </div>
            </div>
            <h1 className="text-2xl font-bold">{mandate.company}</h1>
            <p className="text-muted-foreground">{mandate.asset}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-[#FF9900] mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Ticket Size</p>
                  <p className="font-semibold text-sm">{mandate.ticket.split(' · ')[0]}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#FF9900] mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Asset</p>
                  <p className="font-semibold text-sm">{location1 || mandate.asset}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#FF9900] mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Location</p>
                  <p className="font-semibold text-sm">{location2 || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-[#FF9900] mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Details</p>
                  <p className="font-semibold text-sm">{mandate.ticket.split(' · ')[1] || '—'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification note */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/30">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF9900] shrink-0">
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          This mandate is posted by a <strong className="mx-1">KYC-verified principal</strong> on India Property Network Ltd. Contact details are available to verified members.
        </div>

        {/* CTA Card */}
        <Card className="border-2 border-[#FF9900]/40 bg-orange-50/50 dark:bg-[#FF9900]/5">
          <CardContent className="py-10 text-center space-y-4">
            <h2 className="text-2xl font-bold text-[#003366] dark:text-white">
              Interested in this mandate?
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Register on India Property Network Ltd. to send your enquiry directly to the principal. Join 5,000+ verified real estate professionals.
            </p>
            <Button
              size="lg"
              className="bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold px-10 h-12 shadow-lg"
              onClick={handleSendEnquiry}
            >
              <Send className="w-5 h-5 mr-2" />
              {isAuthenticated ? 'View on Marketplace' : 'Send Enquiry — Register Free'}
            </Button>
            {!isAuthenticated && (
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <button
                  className="text-[#FF9900] hover:underline font-medium"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
