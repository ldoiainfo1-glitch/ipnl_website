export default function ReraProtocol() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">RERA Compliance Protocol</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">RERA Compliance Statement</h2>
            <p className="text-muted-foreground">
              India Property Networks (IPN) operates in strict compliance with the Real Estate 
              (Regulation and Development) Act, 2016 (RERA) and all applicable state regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Broker Registration Verification</h2>
            <p className="text-muted-foreground">
              All brokers and channel partners on IPN must provide valid RERA registration 
              certificates. We verify registrations with respective state RERA authorities 
              before approval.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Developer Project Verification</h2>
            <p className="text-muted-foreground">
              Developers posting mandates must provide RERA project registration numbers. 
              Only registered projects are permitted on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Documentation Standards</h2>
            <p className="text-muted-foreground">
              All mandates must include accurate property descriptions, RERA registration 
              details, and compliance certificates. Misleading information results in 
              immediate suspension.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Transaction Transparency</h2>
            <p className="text-muted-foreground">
              IPN maintains audit trails of all introductions and communications. Records 
              are available for regulatory review upon request.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Grievance Redressal</h2>
            <p className="text-muted-foreground">
              Members can report RERA violations to our compliance team at 
              compliance@indiapropertynetworks.com. All complaints are investigated within 
              7 business days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Regulatory Updates</h2>
            <p className="text-muted-foreground">
              IPN continuously monitors RERA amendments and updates our protocols accordingly. 
              Members are notified of any regulatory changes affecting their operations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
