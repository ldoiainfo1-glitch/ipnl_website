import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Handshake, Star, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: '₹1,00,000',
    period: '/ year',
    tagline: 'Get discovered on the network',
    cta: 'Get started',
    popular: false,
    features: [
      'Verified directory listing with firm badge',
      'Browse all live mandates & deal feed',
      '5 introduction requests per month',
      '5 post mandates requests per month',
      '1 city access',
      'Read-only access to asset-class trends',
      'Email support within 48 hours',
      'Single user seat',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '₹1,50,000',
    period: '/ year',
    tagline: 'Transact and build reputation',
    cta: 'Choose Pro',
    popular: true,
    features: [
      'Everything in Basic, plus —',
      '15 introduction requests per month',
      '15 post mandates requests per month',
      '5 city access',
      'NDA Vault for confidential mandate sharing',
      'Real-time deal alerts by asset class & geography',
      '2–3 team seats with role-based access',
      'Reputation score & verified track record',
      'Priority email + chat support',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '₹2,00,000',
    period: '/ year',
    tagline: 'Top-of-network visibility & concierge',
    cta: 'Go Premium',
    popular: false,
    features: [
      'Everything in Pro, plus —',
      '25 introduction requests per month',
      '25 post mandates requests per month',
      '10 city access',
      'Priority placement in search & feeds',
      'Dedicated Relationship Manager',
      'Early access to off-market mandates',
      '5+ team seats with custom workflows',
      'Advanced analytics & market intelligence',
      'Concierge mandate curation',
      'SLA-backed phone support',
    ],
  },
];

const CATEGORIES = [
  { key: 'developers', label: 'Developers / Builders' },
  { key: 'brokers', label: 'Brokers & Channel Partners' },
  { key: 'investors', label: 'Investors / HNIs / Family Offices & Institutions' },
  { key: 'landowners', label: 'Landowners' },
  { key: 'society', label: 'Society Redevelopment Committees' },
  { key: 'financial', label: 'Financial Institutions & Lenders' },
  { key: 'institutional', label: 'Institutional & Corporate Partners (REITs, Asset Managers, Hospitality)' },
  { key: 'architects', label: 'Architects & Designers' },
  { key: 'pmc', label: 'PMC & Consultants' },
  { key: 'construction', label: 'Construction Contractors' },
  { key: 'technical', label: 'Technical & Survey Experts' },
  { key: 'legal', label: 'Legal & Compliance Professionals' },
  { key: 'vendors', label: 'Vendors & Suppliers' },
  { key: 'marketing', label: 'Marketing & Sales Partners' },
  { key: 'technology', label: 'Technology Partners' },
];

const TRUST_POINTS = [
  {
    icon: Shield,
    title: 'Verified principals only',
    desc: 'Every firm passes KYC and a manual admin review before they can transact on the network.',
  },
  {
    icon: Handshake,
    title: 'Direct, no brokerage',
    desc: 'Connect principal-to-principal. INDIA PROPERTY NETWORKS holds no brokerage on closed deals.',
  },
  {
    icon: Star,
    title: 'Concierge onboarding',
    desc: 'Pro and Premium members get hands-on onboarding within 48 hours.',
  },
];

const FAQS = [
  {
    q: 'Why does pricing vary by category?',
    a: 'Different member categories have different use-cases, mandate volumes, and network value. The pricing is calibrated to reflect the depth of access and features relevant to each category.',
  },
  {
    q: 'Is GST included in the membership price?',
    a: 'No. All prices listed are exclusive of GST. Applicable GST will be added at the time of invoicing.',
  },
  {
    q: 'Can I upgrade or downgrade mid-cycle?',
    a: 'You can upgrade at any time — the difference is billed on a pro-rata basis. Downgrades take effect at the start of the next annual cycle.',
  },
  {
    q: 'Do you take brokerage on closed transactions?',
    a: 'No. INDIA PROPERTY NETWORKS is a subscription-based platform. We do not participate in, track, or charge brokerage on any deal closed through the network.',
  },
  {
    q: 'What does manual admin review include?',
    a: 'Our team verifies your PAN, GST, RERA registration (where applicable), company documents, and director details before granting transactional access.',
  },
  {
    q: 'How are seats counted for Pro and Premium?',
    a: 'Each seat is a named user login under your firm account. Pro includes 2–3 seats; Premium includes 5+ seats with custom role workflows. Additional seats can be added on request.',
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function PlanCard({ plan, onCta }: { plan: typeof PLANS[0]; onCta: () => void }) {
  return (
    <Card
      className={`relative flex flex-col h-full ${
        plan.popular
          ? 'border-2 border-primary shadow-lg shadow-primary/10'
          : 'border border-border'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold tracking-wider uppercase">
            Most Popular
          </Badge>
        </div>
      )}
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-5">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">
            Annual membership — per firm, exclusive of GST.
          </p>
          <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold text-primary">{plan.price}</span>
            <span className="text-muted-foreground text-sm">{plan.period}</span>
          </div>
          <p className="text-sm text-muted-foreground">{plan.tagline}</p>
        </div>

        <Button
          className={`w-full mb-6 font-semibold ${
            plan.popular ? '' : 'bg-secondary text-foreground hover:bg-secondary/80'
          }`}
          variant={plan.popular ? 'default' : 'outline'}
          onClick={onCta}
        >
          {plan.cta}
        </Button>

        <ul className="space-y-3 flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              {feature.endsWith('—') || feature.startsWith('Everything in') ? (
                <span className="text-sm text-muted-foreground font-medium">{feature}</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            className="flex items-center space-x-3"
            onClick={() => navigate('/')}
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">IPN</span>
            </div>
            <span className="text-xl font-bold hidden sm:block">INDIA PROPERTY NETWORKS</span>
          </button>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>
              Opportunities
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Join the network
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center border-b border-border">
        <div className="container mx-auto max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-4">
            Category-wise Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Annual membership by role
          </h1>
          <p className="text-muted-foreground text-lg">
            All prices are per firm, per year, exclusive of GST. Billed annually.
          </p>
        </div>
      </section>

      {/* Enterprise Banner */}
      <div className="bg-secondary/40 border-b border-border py-4 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-center sm:text-left">
            Special unlimited package for Big Corporates
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/contact')}>
            Talk to sales
          </Button>
        </div>
      </div>

      {/* Category Tabs + Plans */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <TabsPrimitive.Root defaultValue="developers">
            {/* Tab List — scrollable on mobile */}
            <div className="overflow-x-auto pb-1 mb-10">
              <TabsPrimitive.List className="flex gap-1 min-w-max border border-border rounded-lg p-1 bg-secondary/20">
                {CATEGORIES.map((cat) => (
                  <TabsPrimitive.Trigger
                    key={cat.key}
                    value={cat.key}
                    className="px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all
                      text-muted-foreground
                      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    {cat.label}
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>
            </div>

            {/* One content block per category — all share the same plan structure */}
            {CATEGORIES.map((cat) => (
              <TabsPrimitive.Content key={cat.key} value={cat.key}>
                <h2 className="text-xl font-semibold mb-8 text-center">
                  {cat.label}
                </h2>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {PLANS.map((plan) => (
                    <PlanCard
                      key={plan.key}
                      plan={plan}
                      onCta={() => navigate('/register')}
                    />
                  ))}
                </div>
              </TabsPrimitive.Content>
            ))}
          </TabsPrimitive.Root>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-14 px-4 bg-secondary/20 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8">
            {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-border">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently asked</h2>
          <div className="divide-y divide-border rounded-lg border border-border px-6">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to join India's most trusted B2B real estate network?
          </h2>
          <Button
            size="lg"
            variant="secondary"
            className="font-semibold mt-2"
            onClick={() => navigate('/register')}
          >
            Start verification
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2026 INDIA PROPERTY NETWORK LTD</span>
          <div className="flex gap-6">
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/privacy')}>Privacy</button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/terms')}>Terms</button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/pricing')}>Pricing</button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/contact')}>Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
