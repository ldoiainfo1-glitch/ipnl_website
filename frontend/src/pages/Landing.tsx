import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Shield, 
  TrendingUp, 
  CheckCircle,
  ArrowRight 
} from 'lucide-react';
import { TIER_FEATURES, APP_NAME, APP_TAGLINE } from '@/utils/constants';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">IPN</span>
            </div>
            <span className="text-xl font-bold">INDIA PROPERTY NETWORKS</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button onClick={() => navigate('/register')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            {APP_NAME}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {APP_TAGLINE}
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect with verified developers, funds, landowners, REITs, family offices, 
            and investors. Access exclusive off-market mandates in India's real estate market.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={() => navigate('/register')}>
              Join the Network
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/marketplace')}>
              Browse Mandates
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-secondary/20">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose IPN?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <Shield className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">KYC Verified</h3>
                <p className="text-muted-foreground">
                  Every member is KYC-verified and admin-reviewed before they can transact. 
                  Trust and transparency guaranteed.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Building2 className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Off-Market Deals</h3>
                <p className="text-muted-foreground">
                  Access exclusive buy-side and sell-side mandates not available on 
                  public platforms. Private, invite-only marketplace.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">No Brokerage</h3>
                <p className="text-muted-foreground">
                  Subscription-based model, not commission-based. We don't touch your 
                  deal financials. Fair and transparent pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Choose Your Tier
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Start free, upgrade when ready. All tiers include access to the exclusive network.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Object.entries(TIER_FEATURES).map(([tier, features]) => (
              <Card 
                key={tier}
                className={tier === 'VERIFIED' ? 'border-primary border-2' : ''}
              >
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold mb-2">{features.name}</h3>
                    <p className="text-3xl font-bold text-primary">{features.price}</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {features.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier === 'VERIFIED' ? 'default' : 'outline'}
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-3">About IPN</h4>
              <p className="text-sm text-muted-foreground">
                The exclusive verified network for India's real estate deal economy.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/rera-protocol">RERA Protocol</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/contact">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Connect</h4>
              <p className="text-sm text-muted-foreground">
                Join India's most exclusive real estate network
              </p>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 India Property Networks. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
