import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

export default function Contact() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal nav */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            className="flex items-center space-x-3"
            onClick={() => navigate('/')}
          >
            <img
              src="/assets/ipnl-logo.png?v=1"
              alt="India Property Network Ltd"
              className="h-16 w-auto"
            />
            <span className="font-bold hidden sm:block">India Property Network Ltd.</span>
          </button>
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-14">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">
              Get in touch
            </p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Contact INDIA PROPERTY NETWORK LTD
            </h1>
            <p className="text-xs text-muted-foreground mb-5">
              Last updated · 13 June 2026
            </p>
            <p className="text-muted-foreground max-w-xl leading-relaxed">
              For membership, verification, partnerships or enterprise enquiries — write to us.
              Our team responds within one business day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Contact details */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                  Email
                </p>
                <a
                  href="mailto:hello@indiapropertynetwork.in"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  hello@indiapropertynetwork.in
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                  Phone
                </p>
                <a
                  href="tel:+919867477227"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  +91 9867477227
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
                  Office
                </p>
                <p className="text-foreground leading-relaxed">
                  Range Heights, A605, Link Rd, Behram Baug,
                  Jogeshwari West, Mumbai, Maharashtra 400102
                </p>
              </div>
            </div>

            {/* Contact form */}
            <div>
              {submitted ? (
                <div className="flex flex-col items-start gap-4 py-8">
                  <p className="text-xl font-semibold">Message sent.</p>
                  <p className="text-muted-foreground">
                    Our team will get back to you within one business day.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5"
                    >
                      Your Name
                    </label>
                    <Input id="name" placeholder="Full name" required />
                  </div>
                  <div>
                    <label
                      htmlFor="firm"
                      className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5"
                    >
                      Firm
                    </label>
                    <Input id="firm" placeholder="Company / firm name" required />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5"
                    >
                      Work Email
                    </label>
                    <Input id="email" type="email" placeholder="you@yourfirm.com" required />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5"
                    >
                      Phone
                    </label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5"
                    >
                      How can we help?
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your requirements..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full font-semibold">
                    Send message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-6">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>© 2026 INDIA PROPERTY NETWORK LTD</span>
          <div className="flex gap-5">
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/privacy')}>Privacy</button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/terms')}>Terms</button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/rera-protocol')}>RERA Protocol</button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate('/contact')}>Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
