import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Handshake, Star, ChevronDown, ChevronUp, Star as StarIcon, Zap, Crown } from 'lucide-react';

// ─── Pricing Data ─────────────────────────────────────────────────────────────

const PLAN_FEATURES = {
  basic: [
    'Verified directory listing with firm badge',
    'Browse all live mandates & deal feed',
    '5 introduction requests per month',
    '5 post mandates requests per month',
    '1 city access',
    'Read-only access to asset-class trends',
    'Email support within 48 hours',
    'Single user seat',
  ],
  pro: [
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
  premium: [
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
};

// type FeatureValue = boolean | string;
// type TableRow = { feature: string; basic: FeatureValue; pro: FeatureValue; premium: FeatureValue };

// const COMPARISON_ROWS: TableRow[] = [
//   { feature: 'Verified directory listing', basic: true, pro: true, premium: true },
//   { feature: 'Browse live mandates & deal feed', basic: true, pro: true, premium: true },
//   { feature: 'Introduction requests / month', basic: '5', pro: '15', premium: '25' },
//   { feature: 'Post mandate requests / month', basic: '5', pro: '15', premium: '25' },
//   { feature: 'City access', basic: '1 city', pro: '5 cities', premium: '10 cities' },
//   { feature: 'Asset-class trend reports', basic: 'Read-only', pro: 'Read-only', premium: 'Advanced analytics' },
//   { feature: 'NDA Vault', basic: false, pro: true, premium: true },
//   { feature: 'Real-time deal alerts', basic: false, pro: true, premium: true },
//   { feature: 'Reputation score & track record', basic: false, pro: true, premium: true },
//   { feature: 'Team seats', basic: '1 seat', pro: '2–3 seats', premium: '5+ seats' },
//   { feature: 'Priority placement in search', basic: false, pro: false, premium: true },
//   { feature: 'Dedicated Relationship Manager', basic: false, pro: false, premium: true },
//   { feature: 'Early access to off-market mandates', basic: false, pro: false, premium: true },
//   { feature: 'Concierge mandate curation', basic: false, pro: false, premium: true },
//   { feature: 'Support', basic: 'Email (48h)', pro: 'Email + chat', premium: 'Phone SLA' },
// ];

const CATEGORIES = [
  {
    key: 'developers',
    label: 'Developers / Builders',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹1,00,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹1,50,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹2,00,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'brokers',
    label: 'Brokers & Channel Partners',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹18,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹36,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹60,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'investors',
    label: 'Investors / HNIs / Family Offices & Institutions',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹24,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹60,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹1,20,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'landowners',
    label: 'Landowners',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹12,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹24,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹48,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'society',
    label: 'Society Redevelopment Committees',
    subtitle: 'Annual membership — per committee, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹12,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹24,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹40,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'financial',
    label: 'Financial Institutions & Lenders',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹75,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹1,50,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹2,50,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'institutional',
    label: 'Institutional & Corporate Partners (REITs, Asset Managers, Hospitality)',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹60,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹1,25,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹2,00,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'architects',
    label: 'Architects & Designers',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹12,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹24,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹40,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'pmc',
    label: 'PMC & Consultants',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹15,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹30,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹50,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'construction',
    label: 'Construction Contractors',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹18,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹36,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹60,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'technical',
    label: 'Technical & Survey Experts',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹12,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹24,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹40,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'legal',
    label: 'Legal & Compliance Professionals',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹18,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹36,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹60,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'vendors',
    label: 'Vendors & Suppliers',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹10,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹20,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹36,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing & Sales Partners',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹15,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹30,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹50,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
  {
    key: 'technology',
    label: 'Technology Partners',
    subtitle: 'Annual membership — per firm, exclusive of GST.',
    plans: [
      { key: 'basic', name: 'Basic', price: '₹18,000', period: '/ year', tagline: 'Get discovered on the network', cta: 'Get started', popular: false, features: PLAN_FEATURES.basic },
      { key: 'pro', name: 'Pro', price: '₹36,000', period: '/ year', tagline: 'Transact and build reputation', cta: 'Choose Pro', popular: true, features: PLAN_FEATURES.pro },
      { key: 'premium', name: 'Premium', price: '₹60,000', period: '/ year', tagline: 'Top-of-network visibility & concierge', cta: 'Go Premium', popular: false, features: PLAN_FEATURES.premium },
    ],
  },
];

const TRUST_POINTS = [
  { icon: Shield, title: 'Verified principals only', desc: 'Every firm passes KYC and a manual admin review before they can transact on the network.' },
  { icon: Handshake, title: 'Direct, no brokerage', desc: 'Connect principal-to-principal. India Property Network Ltd. holds no brokerage on closed deals.' },
  { icon: Star, title: 'Concierge onboarding', desc: 'Pro and Premium members get hands-on onboarding within 48 hours.' },
];

const FAQS = [
  { q: 'Why does pricing vary by category?', a: 'Different member categories have different use-cases, mandate volumes, and network value. The pricing is calibrated to reflect the depth of access and features relevant to each category.' },
  { q: 'Is GST included in the membership price?', a: 'No. All prices listed are exclusive of GST. Applicable GST will be added at the time of invoicing.' },
  { q: 'Can I upgrade or downgrade mid-cycle?', a: 'You can upgrade at any time — the difference is billed on a pro-rata basis. Downgrades take effect at the start of the next annual cycle.' },
  { q: 'Do you take brokerage on closed transactions?', a: 'No. India Property Network Ltd. is a subscription-based platform. We do not participate in, track, or charge brokerage on any deal closed through the network.' },
  { q: 'What does manual admin review include?', a: 'Our team verifies your PAN, GST, RERA registration (where applicable), company documents, and director details before granting transactional access.' },
  { q: 'How are seats counted for Pro and Premium?', a: 'Each seat is a named user login under your firm account. Pro includes 2–3 seats; Premium includes 5+ seats with custom role workflows. Additional seats can be added on request.' },
];

// ─── Plan icon map ─────────────────────────────────────────────────────────────

const PLAN_ICONS: Record<string, React.ReactNode> = {
  basic: <StarIcon className="w-5 h-5 text-primary" />,
  pro: <Zap className="w-5 h-5 text-primary" />,
  premium: <Crown className="w-5 h-5 text-primary" />,
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type Plan = {
  key: string;
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  popular: boolean;
  features: string[];
};

type Category = {
  key: string;
  label: string;
  subtitle: string;
  plans: Plan[];
};

// // ─── Plan Feature Comparison Table (within selected category) ─────────────────

// function PlanComparisonTable({ plans, onCta }: { plans: Plan[]; onCta: () => void }) {
//   const basic = plans.find(p => p.key === 'basic')!;
//   const pro = plans.find(p => p.key === 'pro')!;
//   const premium = plans.find(p => p.key === 'premium')!;

//   const renderCell = (val: FeatureValue) => {
//     if (val === true) return <Check className="w-4 h-4 text-primary mx-auto" />;
//     if (val === false) return <span className="text-muted-foreground/40 text-lg block text-center">—</span>;
//     return <span className="text-sm text-center block">{val}</span>;
//   };

//   return (
//     <div className="mt-12">
//       <h3 className="text-xl font-bold mb-1">Plan comparison</h3>
//       <p className="text-sm text-muted-foreground mb-6">See exactly what's included in each tier.</p>
//       <div className="overflow-x-auto rounded-xl border border-border">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-border bg-secondary/10">
//               <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-2/5">Feature</th>
//               {[basic, pro, premium].map((plan) => (
//                 <th key={plan.key} className="px-4 py-4 text-center w-1/5">
//                   <div className="flex flex-col items-center gap-1">
//                     <div className={`flex items-center gap-1.5 ${plan.popular ? 'text-primary' : ''}`}>
//                       {PLAN_ICONS[plan.key]}
//                       <span className="font-bold text-base">{plan.name}</span>
//                       {plan.popular && (
//                         <span className="ml-1 text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
//                           Popular
//                         </span>
//                       )}
//                     </div>
//                     <span className="font-bold text-primary text-lg">{plan.price}</span>
//                     <span className="text-muted-foreground text-xs">{plan.period}</span>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {COMPARISON_ROWS.map((row, idx) => (
//               <tr key={row.feature} className={`border-b border-border last:border-0 ${idx % 2 === 0 ? 'bg-background' : 'bg-secondary/5'}`}>
//                 <td className="px-6 py-3.5 font-medium">{row.feature}</td>
//                 <td className="px-4 py-3.5 text-center">{renderCell(row.basic)}</td>
//                 <td className="px-4 py-3.5 text-center">{renderCell(row.pro)}</td>
//                 <td className="px-4 py-3.5 text-center">{renderCell(row.premium)}</td>
//               </tr>
//             ))}
//           </tbody>
//           <tfoot>
//             <tr className="border-t-2 border-border bg-secondary/10">
//               <td className="px-6 py-4 text-sm font-semibold text-muted-foreground">Ready to join?</td>
//               {[basic, pro, premium].map((plan) => (
//                 <td key={plan.key} className="px-4 py-4 text-center">
//                   <Button size="sm" variant={plan.popular ? 'default' : 'outline'} className="w-full font-semibold" onClick={onCta}>
//                     {plan.cta}
//                   </Button>
//                 </td>
//               ))}
//             </tr>
//           </tfoot>
//         </table>
//       </div>
//     </div>
//   );
// }

// ─── All-Categories Pricing Overview Table ────────────────────────────────────

function AllCategoriesPricingTable({ categories, activeKey, onCategoryClick }: {
  categories: Category[];
  activeKey: string;
  onCategoryClick: (key: string) => void;
}) {
  return (
    <div className="mt-14">
      <h3 className="text-xl font-bold mb-1">Pricing across all member categories</h3>
      <p className="text-sm text-muted-foreground mb-6">
        All prices per firm per year, exclusive of GST. Click any category to explore its plans.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/10">
              <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-2/5">Member Category</th>
              <th className="px-4 py-4 text-center w-1/5">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    {PLAN_ICONS['basic']}
                    <span className="font-bold">Basic</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">/ year + GST</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center w-1/5">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5 text-primary">
                    {PLAN_ICONS['pro']}
                    <span className="font-bold">Pro</span>
                    <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">/ year + GST</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center w-1/5">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    {PLAN_ICONS['premium']}
                    <span className="font-bold">Premium</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">/ year + GST</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat, idx) => {
              const isActive = cat.key === activeKey;
              const basic = cat.plans.find(p => p.key === 'basic')!;
              const pro = cat.plans.find(p => p.key === 'pro')!;
              const premium = cat.plans.find(p => p.key === 'premium')!;
              return (
                <tr
                  key={cat.key}
                  onClick={() => onCategoryClick(cat.key)}
                  className={`border-b border-border last:border-0 cursor-pointer transition-colors group
                    ${isActive
                      ? 'bg-primary/5 border-l-4 border-l-primary'
                      : idx % 2 === 0
                        ? 'bg-background hover:bg-secondary/10'
                        : 'bg-secondary/5 hover:bg-secondary/10'
                    }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>
                        {cat.label}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Viewing
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {basic.price}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-bold ${isActive ? 'text-primary' : 'text-primary/70'}`}>
                      {pro.price}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`font-semibold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {premium.price}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onCta }: { plan: Plan; onCta: () => void }) {
  return (
    <Card
      className={`relative flex flex-col h-full ${
        plan.popular ? 'border-2 border-primary shadow-lg shadow-primary/10' : 'border border-border'
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
        <div className="flex items-center gap-2 mb-4">
          {PLAN_ICONS[plan.key]}
          <h3 className="text-xl font-bold">{plan.name}</h3>
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold">{plan.price}</span>
          <span className="text-muted-foreground text-sm">{plan.period}</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{plan.tagline}</p>
        <Button
          className={`w-full mb-6 font-semibold ${plan.popular ? '' : 'bg-background text-foreground border border-border hover:bg-secondary/50'}`}
          variant={plan.popular ? 'default' : 'outline'}
          onClick={onCta}
        >
          {plan.cta}
        </Button>
        <ul className="space-y-3 flex-1">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              {feature.startsWith('Everything in') ? (
                <span className="text-sm text-muted-foreground font-medium">{feature}</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
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

// ─── FAQ Item ──────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-5 h-5 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />}
      </button>
      {open && <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Pricing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('developers');

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
  className="flex items-center"
  onClick={() => navigate('/')}
>
  <img
    src="/assets/ipnl-logo.png?v=1"
    alt="India Property Network Ltd"
    className="h-16 md:h-20 w-auto origin-left scale-125 md:scale-140"
    onError={(e) => {
      console.error("Logo failed to load", e);
    }}
  />
</button>
          <nav className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="hidden sm:inline-flex">Home</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')} className="hidden sm:inline-flex">Opportunities</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
            <Button size="sm" onClick={() => navigate('/register')}>Join</Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4 border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="relative container mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold tracking-wider text-primary mb-6">Category-wise Pricing</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Annual membership by role</h1>
          <p className="text-muted-foreground text-lg">All prices are per firm, per year, exclusive of GST. Billed annually.</p>
        </div>
      </section>

      {/* Enterprise Banner */}
      <div className="bg-secondary/40 border-b border-border py-4 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium text-center sm:text-left">Special unlimited package for Big Corporates</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/contact')}>Talk to sales</Button>
        </div>
      </div>

      {/* Category Tabs + Plans */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <TabsPrimitive.Root
            value={activeTab}
            onValueChange={(val) => setActiveTab(val)}
          >
            {/* Tab List — wrapping pills */}
            <div className="mb-10">
              <TabsPrimitive.List className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <TabsPrimitive.Trigger
                    key={cat.key}
                    value={cat.key}
                    className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-background whitespace-nowrap transition-all
                      text-foreground hover:border-primary/50
                      data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
                  >
                    {cat.label}
                  </TabsPrimitive.Trigger>
                ))}
              </TabsPrimitive.List>
            </div>

            {/* Tab content per category */}
            {CATEGORIES.map((cat) => (
              <TabsPrimitive.Content key={cat.key} value={cat.key}>
                <div className="max-w-5xl mx-auto">

                  {/* Category heading */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-1">{cat.label}</h2>
                    <p className="text-sm text-muted-foreground">{cat.subtitle}</p>
                  </div>

                  {/* Plan cards */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {cat.plans.map((plan) => (
                      <PlanCard
                        key={plan.key}
                        plan={plan}
                        onCta={() =>
                          navigate(
                            `/contact?plan=${encodeURIComponent(plan.name)}&category=${encodeURIComponent(cat.label)}&price=${encodeURIComponent(plan.price)}`
                          )
                        }
                      />
                    ))}
                  </div>

                  {/* Table 1: Plan feature comparison for this category */}
                  {/* <PlanComparisonTable plans={cat.plans} onCta={() => navigate('/register')} /> */}

                  {/* Table 2: All categories pricing overview */}
                  <AllCategoriesPricingTable
                    categories={CATEGORIES}
                    activeKey={cat.key}
                    onCategoryClick={(key) => setActiveTab(key)}
                  />

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
          <Button size="lg" variant="secondary" className="font-semibold mt-2" onClick={() => navigate('/register')}>
            Start verification
          </Button>
        </div>
      </section>

      {/* Footer */}
     {/* Footer */}
<footer className="border-t border-border bg-secondary/10">
  <div className="container mx-auto px-4 py-12">

    <div className="grid md:grid-cols-3 gap-10 mb-10">

      {/* Brand */}
      <div>
        <img
          src="/assets/ipnl-logo.png?v=1"
          alt="India Property Network Ltd"
          className="h-20 w-auto mb-4"
        />

        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
          India's trusted B2B real estate networking platform connecting
          developers, investors, brokers, landowners and industry partners.
        </p>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="font-semibold mb-4">Quick Links</h3>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/')}
          >
            Home
          </button>

          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/marketplace')}
          >
            Opportunities
          </button>

          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/pricing')}
          >
            Pricing
          </button>

          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/contact')}
          >
            Contact
          </button>
        </div>
      </div>

      {/* Legal */}
      <div>
        <h3 className="font-semibold mb-4">Legal</h3>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/privacy')}
          >
            Privacy Policy
          </button>

          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/terms')}
          >
            Terms & Conditions
          </button>

          <button
            className="text-left hover:text-primary transition-colors"
            onClick={() => navigate('/register')}
          >
            Join Network
          </button>
        </div>
      </div>

    </div>

    <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-sm text-muted-foreground">
        © 2026 INDIA PROPERTY NETWORK LTD. All rights reserved.
      </p>

      <p className="text-sm text-muted-foreground">
        Verified • Secure • Principal-to-Principal
      </p>
    </div>

  </div>
</footer>
    </div>
  );
}