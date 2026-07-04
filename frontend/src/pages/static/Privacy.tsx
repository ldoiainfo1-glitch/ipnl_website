export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              India Property Network Ltd. collects information necessary to provide our exclusive
              real estate networking platform. This includes company details, contact information, 
              KYC documents (PAN, GST, RERA), and transaction data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information to verify your identity, facilitate introductions, 
              enable secure messaging, and improve our platform services. We never share 
              your data without explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Data Security</h2>
            <p className="text-muted-foreground">
              All sensitive documents are stored securely using industry-standard encryption. 
              We implement strict access controls and regular security audits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the right to access, correct, or delete your personal data at any time. 
              Contact our support team for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Contact Us</h2>
            <p className="text-muted-foreground">
              For privacy-related questions, email us at privacy@indiapropertynetworks.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
