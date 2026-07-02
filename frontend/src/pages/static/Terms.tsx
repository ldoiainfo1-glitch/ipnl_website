export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing India Property Network Ltd., you agree to these terms of service 
              and our privacy policy. If you disagree with any part, you may not access the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Membership Tiers</h2>
            <p className="text-muted-foreground">
              India Property Network Ltd. offers three tiers: OBSERVER (free, browse-only), VERIFIED (₹24,000/year with 
              full access), and ENTERPRISE (custom pricing with unlimited features).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. KYC Requirements</h2>
            <p className="text-muted-foreground">
              VERIFIED and ENTERPRISE members must complete KYC verification including PAN, 
              GST, and RERA documentation. Admin approval is required before transacting.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Platform Rules</h2>
            <p className="text-muted-foreground">
              Members must conduct all activities professionally and ethically. Off-market 
              mandates are confidential. Misuse may result in suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. No Brokerage Model</h2>
            <p className="text-muted-foreground">
              India Property Network Ltd. operates on subscriptions only. We do not earn brokerage or touch deal 
              financials. All transactions are between members directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              India Property Network Ltd. facilitates connections but is not responsible for deal outcomes. 
              Members conduct due diligence independently.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
