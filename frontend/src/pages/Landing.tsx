import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { 
  Building2, 
  Shield, 
  Users,
  TrendingUp,
  // CheckCircle,
  ArrowRight,
  MapPin,
  // Clock,
  ChevronLeft,
  ChevronRight,
  Home,
  DollarSign,
  Briefcase,
  PenTool,
  ClipboardCheck,
  HardHat,
  Landmark,
  Scale,
  Package,
  Megaphone,
  Laptop,
  FileSearch,
  // Briefcase as BriefcaseIcon,
  Moon,
  Sun
} from 'lucide-react';

const heroSlides = [
  {
    badge: 'For Developers & Investors',
    heading: "India's First B2B Real Estate Business Network",
    description: "Connecting everyone who builds, funds, sells and grows real estate. India's exclusive B2B real estate business network for verified principals only.",
    primaryButton: 'Register your firm',
    primaryAction: '/register',
    secondaryButton: 'Browse opportunities',
    secondaryAction: '/marketplace'
  },
  {
    badge: 'Off-Market Mandates',
    heading: 'Discover deals before they hit the market',
    description: "Access curated land parcels, redevelopment RFPs and institutional acquisition mandates from verified principals across India's top metros.",
    primaryButton: 'Explore mandates',
    primaryAction: '/marketplace',
    secondaryButton: 'How it works',
    secondaryAction: '#how'
  },
  {
    badge: 'Verified Principals Only',
    heading: "A trusted network of India's real estate decision-makers",
    description: "Developers, funds, landowners, societies, brokers and architects — all KYC'd, tier-rated and ready to transact directly with you.",
    primaryButton: 'Join the network',
    primaryAction: '/register',
    secondaryButton: 'View leaderboard',
    secondaryAction: '/leaderboard'
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from localStorage — default is light
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Toggle theme
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

  // Auto-rotate slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border bg-background">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="/assets/ipnl-logo.png?v=1" 
              alt="India Property Network Ltd" 
              className="h-12 md:h-16 w-auto"
              onError={(e) => {
                // Fallback if image not found
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `
                  <div class="flex items-center space-x-2">
                    <div class="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>
                    <div class="text-sm font-bold">India Property Network Ltd</div>
                  </div>
                `;
              }}
            />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <button onClick={() => navigate('/marketplace')} className="hover:text-primary transition-colors">
              Opportunities
            </button>
            <a href="#how" className="hover:text-primary transition-colors">How it works</a>
            <a href="#categories" className="hover:text-primary transition-colors">Network</a>
            <button onClick={() => navigate('/pricing')} className="hover:text-primary transition-colors">
              Pricing
            </button>
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="hidden sm:inline-flex w-9 h-9 p-0"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-[#FF9900]" />
              ) : (
                <Moon className="w-5 h-5 text-[#003366]" />
              )}
            </Button>
            
            {isAuthenticated ? (
              // Authenticated user - show name and logout
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')} 
                  className="hidden sm:inline-flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  { user?.email}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    logout();
                    navigate('/');
                  }} 
                  className="hidden md:inline-flex"
                >
                  Logout
                </Button>
                <Button 
                  size="sm" 
                  className="bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold" 
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              // Not authenticated - show login buttons
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="hidden md:inline-flex">
                  Sign in
                </Button>
                <Button size="sm" className="bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold" onClick={() => navigate('/register')}>
                  Join the network
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section className="relative py-20 md:py-32 px-4 bg-gradient-to-br from-[#003366] via-[#004080] to-[#0055AA] overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          {/* Carousel Slides */}
          <div className="relative">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ease-in-out ${
                  index === currentSlide 
                    ? 'opacity-100 translate-x-0' 
                    : 'opacity-0 absolute top-0 left-0 translate-x-full'
                }`}
              >
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/20 rounded-full border border-blue-400/30">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                    </svg>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                      {slide.badge}
                    </p>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight text-white">
                    {slide.heading}
                  </h1>
                  
                  <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-10 leading-relaxed">
                    {slide.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      size="lg" 
                      className="bg-[#FF9900] hover:bg-[#FF8800] text-white font-semibold text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all"
                      onClick={() => navigate(slide.primaryAction)}
                    >
                      {slide.primaryButton}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      className="bg-white hover:bg-gray-100 text-[#003366] font-semibold text-base px-8 h-12 shadow-lg hover:shadow-xl transition-all"
                      onClick={() => {
                        if (slide.secondaryAction.startsWith('#')) {
                          document.querySelector(slide.secondaryAction)?.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          navigate(slide.secondaryAction);
                        }
                      }}
                    >
                      {slide.secondaryButton}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="mt-12 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="flex gap-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-white w-8' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className="text-white hover:bg-white/10 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Trusted By Section - White Background with Horizontal Scrolling Animation */}
      <section className="py-12 px-4 bg-background overflow-hidden">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground mb-6">
            Trusted by principals from
          </p>
          <div className="relative">
            <div className="flex items-center gap-4 md:gap-6 text-sm md:text-base animate-scroll-horizontal whitespace-nowrap">
              {/* Duplicate companies 3 times for seamless infinite scroll */}
              {[...Array(3)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-4 md:gap-6">
                  <span className="font-medium text-foreground/80">Lodha</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">Godrej Properties</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">Brookfield</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">HDFC Capital</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">Prestige</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">Kotak Realty</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">Mahindra Lifespaces</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="font-medium text-foreground/80">Oberoi Realty</span>
                  {setIdx < 2 && <span className="text-muted-foreground/30">·</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* One Network Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-black">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-3 tracking-tight">
            <span className="text-[#003366] dark:text-white">ONE NETWORK. </span>
            <span className="text-green-600 dark:text-green-500">EVERY REAL ESTATE SOLUTION.</span>
          </h2>
          <p className="text-center text-base md:text-lg text-muted-foreground mb-14 max-w-3xl mx-auto">
            Connecting Everyone Who Builds, Funds, Sells and Grows Real Estate.
          </p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <Card className="border-2 hover:border-[#FF9900]/50 hover:shadow-lg transition-all">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#FF9900]" />
                </div>
                <h3 className="text-lg font-bold mb-3">Wider Network</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connect with 5,000+ verified professionals across every real estate vertical in India.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-[#FF9900]/50 hover:shadow-lg transition-all">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#FF9900]" />
                </div>
                <h3 className="text-lg font-bold mb-3">Strong Partnerships</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Build lasting relationships with developers, funds, brokers and institutional partners.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-[#FF9900]/50 hover:shadow-lg transition-all">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[#FF9900]" />
                </div>
                <h3 className="text-lg font-bold mb-3">Maximum Opportunities</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Access thousands of deals and off-market mandates posted every month.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-[#FF9900]/50 hover:shadow-lg transition-all">
              <CardContent className="p-6 md:p-8">
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-[#FF9900]" />
                </div>
                <h3 className="text-lg font-bold mb-3">Grow Your Business</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Expand your reach with pan-India presence and data-driven matchmaking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Dark Background */}
      <section id="how" className="py-16 md:py-24 px-4 bg-gray-900 dark:bg-black text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-3 tracking-tight text-white">
            Discover → Verify → Connect
          </h2>
          <p className="text-center text-base md:text-lg text-gray-300 mb-14 max-w-3xl mx-auto">
            A simple, direct workflow. Browse verified mandates, see who the principal is, and request an introduction in one click.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center p-8 border-2 border-gray-700 rounded-2xl hover:border-[#FF9900]/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF9900] text-white font-bold text-2xl mb-6 shadow-lg">
                01
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Discover</h3>
              <p className="text-gray-300 leading-relaxed">
                Browse off-market opportunities filtered by city, asset class, ticket size and mandate type — all from verified principals.
              </p>
            </div>
            <div className="text-center p-8 border-2 border-gray-700 rounded-2xl hover:border-[#FF9900]/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF9900] text-white font-bold text-2xl mb-6 shadow-lg">
                02
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Verify</h3>
              <p className="text-gray-300 leading-relaxed">
                Every firm is KYC'd and tier-rated. See verification status, firm credentials and track record before reaching out.
              </p>
            </div>
            <div className="text-center p-8 border-2 border-gray-700 rounded-2xl hover:border-[#FF9900]/50 transition-all">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF9900] text-white font-bold text-2xl mb-6 shadow-lg">
                03
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">Connect</h3>
              <p className="text-gray-300 leading-relaxed">
                Request an introduction or message the principal directly. Take the conversation forward off-platform — no brokerage held by India Property Network Ltd.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Mandates - Vertical Marquee Animation */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight">
              Live on the network
            </h2>
            <p className="mt-4 opacity-60">
              Verified principals posting and seeking mandates right now.
            </p>
          </div>
          
          {/* Two Columns: Buy-side and Sell-side */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Buy-side Column */}
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-lg">
              <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-semibold tracking-tight text-[#003366] dark:text-white">Buy-side mandates</h3>
                <p className="text-sm opacity-60 mt-1">Developers, funds & investors seeking opportunities</p>
              </div>
              
              <div className="h-[520px] overflow-hidden relative">
                <div className="flex flex-col divide-y animate-marquee-vertical">
                  {/* Duplicate cards for seamless loop */}
                  {[...Array(2)].map((_, setIdx) => (
                    [
                      { company: 'Lodha Capital Partners', type: 'JV Mandate', asset: 'Land · BKC, Mumbai', ticket: 'Ticket Rs.200–250 Cr · 8–10 ac', time: '2 min ago', initial: 'L' },
                      { company: 'Brookfield India REIT', type: 'Acquisition', asset: 'Grade-A Office · Bengaluru', ticket: 'Ticket Rs.1,500+ Cr · 1.5M sqft', time: '5 min ago', initial: 'B' },
                      { company: 'Godrej Properties', type: 'Redev DM', asset: 'Society Redev · Andheri W', ticket: '4.2 FSI · Tier-1 dev', time: '8 min ago', initial: 'G' },
                      { company: 'HDFC Capital', type: 'Equity', asset: 'Residential Platform · Pune', ticket: 'Mid-income · 5-yr horizon', time: '12 min ago', initial: 'H' },
                      { company: 'Prestige Group', type: 'Land', asset: 'Whitefield, Bengaluru', ticket: '10–15 ac · Group Housing', time: '15 min ago', initial: 'P' },
                      { company: 'Kotak Realty Fund', type: 'Logistics', asset: 'Logistics Park · NH48', ticket: '50–80 ac · Grade-A', time: '18 min ago', initial: 'K' },
                      { company: 'Mahindra Lifespaces', type: 'Township', asset: 'OMR · Chennai', ticket: '20–30 ac · Plotted', time: '21 min ago', initial: 'M' },
                      { company: 'Oberoi Realty', type: 'Premium Resi', asset: 'Sea-facing · Worli', ticket: '3–5 ac · Outright', time: '24 min ago', initial: 'O' },
                    ].map((mandate, idx) => (
                      <div key={`${setIdx}-${idx}`} className="px-6 py-4 flex items-center gap-4 hover:bg-[#FF9900]/5 cursor-pointer transition-colors" onClick={() => navigate('/mandate-preview', { state: { mandate: { ...mandate, side: 'buy' } } })}>
                        <div className="size-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 bg-[#003366] text-white dark:bg-[#FF9900] dark:text-[#003366]">
                          {mandate.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              {mandate.company}
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0 text-[#FF9900]">
                                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                                <path d="m9 12 2 2 4-4"></path>
                              </svg>
                            </div>
                            <div className="text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-orange-100 text-[#FF9900] dark:bg-[#FF9900]/20 dark:text-[#FF9900]">
                              {mandate.type}
                            </div>
                          </div>
                          <div className="text-xs opacity-60 mt-0.5 truncate">{mandate.asset}</div>
                          <div className="text-[11px] opacity-50 mt-0.5">{mandate.ticket} · {mandate.time}</div>
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 text-center border-t border-gray-200 dark:border-gray-800">
                <button className="text-sm font-medium text-[#FF9900] hover:text-[#FF8800]" onClick={() => navigate('/marketplace')}>
                  See all buy-side →
                </button>
              </div>
            </div>

            {/* Sell-side Column */}
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-lg">
              <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-xl font-semibold tracking-tight text-[#003366] dark:text-white">Sell-side mandates</h3>
                <p className="text-sm opacity-60 mt-1">Landowners, societies & owners with mandates</p>
              </div>
              
              <div className="h-[520px] overflow-hidden relative">
                <div className="flex flex-col divide-y animate-marquee-vertical-reverse">
                  {/* Duplicate cards for seamless loop */}
                  {[...Array(2)].map((_, setIdx) => (
                    [
                      { company: 'Vijayanagar CHS', type: 'Redev RFP', asset: 'Society · Dadar E', ticket: '3.5 FSI · 96 flats · OC 1984', time: '1 min ago', initial: 'V' },
                      { company: 'Sunteck Landholdings', type: 'Land Sale', asset: 'TDR-loaded · Goregaon', ticket: '2.8 ac · Clear title', time: '4 min ago', initial: 'S' },
                      { company: 'Rajagiri Estates', type: 'Land', asset: 'Hill Plot · Lonavala', ticket: '40 ac · Resort use', time: '7 min ago', initial: 'R' },
                      { company: 'Coastal Realty LLP', type: 'JV', asset: 'Beachfront · Alibaug', ticket: '18 ac · Resort licence', time: '10 min ago', initial: 'C' },
                      { company: 'NRI Family Office', type: 'Asset Sale', asset: 'CBD Tower · Lower Parel', ticket: '1.1L sqft · 100% leased', time: '13 min ago', initial: 'N' },
                      { company: 'Tata Housing JV Desk', type: 'Co-develop', asset: 'Mixed-use · Gurgaon', ticket: '9.2 ac · Approvals in place', time: '16 min ago', initial: 'T' },
                      { company: 'Adarsh Heritage Trust', type: 'Land', asset: 'Heritage Plot · Bandra', ticket: '1.4 ac · Title clear', time: '19 min ago', initial: 'A' },
                      { company: 'DLF Land Bank', type: 'Land', asset: 'NH8 · Gurgaon', ticket: '70 ac · Sector land', time: '22 min ago', initial: 'D' },
                    ].map((mandate, idx) => (
                      <div key={`${setIdx}-${idx}`} className="px-6 py-4 flex items-center gap-4 hover:bg-[#FF9900]/5 cursor-pointer transition-colors" onClick={() => navigate('/mandate-preview', { state: { mandate: { ...mandate, side: 'sell' } } })}>
                        <div className="size-10 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 bg-[#003366] text-white dark:bg-[#FF9900] dark:text-[#003366]">
                          {mandate.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="font-medium truncate flex items-center gap-1.5">
                              {mandate.company}
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0 text-[#FF9900]">
                                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                                <path d="m9 12 2 2 4-4"></path>
                              </svg>
                            </div>
                            <div className="text-[10px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full bg-orange-100 text-[#FF9900] dark:bg-[#FF9900]/20 dark:text-[#FF9900]">
                              {mandate.type}
                            </div>
                          </div>
                          <div className="text-xs opacity-60 mt-0.5 truncate">{mandate.asset}</div>
                          <div className="text-[11px] opacity-50 mt-0.5">{mandate.ticket} · {mandate.time}</div>
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 text-center border-t border-gray-200 dark:border-gray-800">
                <button className="text-sm font-medium text-[#FF9900] hover:text-[#FF8800]" onClick={() => navigate('/marketplace')}>
                  See all sell-side →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholder Categories */}
      <section id="categories" className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
            <span className="text-foreground">One Network. </span>
            <span className="text-green-600 dark:text-green-500">Every Real Estate Solution.</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            India Property Network Ltd. connects every stakeholder in India's real estate ecosystem — from developers and investors to vendors and technology partners.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[
              { title: 'Developers / Builders', icon: Building2, items: ['JV Opportunities', 'Funding Partners', 'Redevelopment', 'Channel Sales', 'Looking for Land', 'Bulk Sale Connect'] },
              { title: 'Brokers & Channel Partners', icon: Users, items: ['Project Tie-ups', 'Inventory Access', 'Higher Commissions', 'Relationship Growth'] },
              { title: 'Investors / HNIs / Family Offices', icon: DollarSign, items: ['Exclusive Deals', 'Bulk Investments', 'Direct Connect', 'Co-investment Opportunities'] },
              { title: 'Landowners', icon: MapPin, items: ['Right Developers', 'Best Value', 'Joint Ventures', 'Hassle-free Transactions', 'Agriculture Development with Income Generation', 'Develop and sale NA Land'] },
              { title: 'Society Redevelopment Committees', icon: Home, items: ['Trusted Developers', 'Top Redevelopment Consultants', 'Better Terms', 'Transparent Process'] },
              { title: 'Architects & Designers', icon: PenTool, items: ['Project Collaborations', 'Design Opportunities', 'Business Expansion'] },
              { title: 'PMC & Consultants', icon: ClipboardCheck, items: ['Project Management', 'Cost Optimization', 'Quality Assurance', 'Timely Delivery'] },
              { title: 'Construction Contractors', icon: HardHat, items: ['Civil / EPC / Turnkey Projects', 'Subcontracting Opportunities', 'Capacity Utilization'] },
              { title: 'Financial Institutions & Lenders', icon: Landmark, items: ['Project Finance', 'Construction Finance', 'Working Capital Solutions', 'Secure Investments'] },
              { title: 'Legal & Compliance Professionals', icon: Scale, items: ['Legal Advisory', 'Due Diligence', 'RERA & Regulatory Support', 'Documentation'] },
              { title: 'Vendors & Suppliers', icon: Package, items: ['Quality Suppliers', 'Bulk Requirements', 'Long Term Tie-ups'] },
              { title: 'Marketing & Sales Partners', icon: Megaphone, items: ['Branding', 'Digital Marketing', 'Lead Generation', 'Sales Acceleration'] },
              { title: 'Technology Partners', icon: Laptop, items: ['PropTech Solutions', 'CRM / ERP Systems', 'Digital Transformation', 'Data & Analytics'] },
              { title: 'Technical & Survey Experts', icon: FileSearch, items: ['Land Survey', 'Valuation', 'Geo-technical Reports', 'Feasibility Studies'] },
              { title: 'Institutional & Corporate Partners', icon: Briefcase, items: ['REITs & Asset Managers', 'Corporate Occupiers', 'Hospitality Operators', 'Long Term Leases'] },
            ].map((category, idx) => {
              const IconComponent = category.icon;
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow border-2 hover:border-[#FF9900]/50">
                  <CardContent className="p-5">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center mb-3">
                      <IconComponent className="w-6 h-6 text-[#FF9900]" />
                    </div>
                    <h3 className="text-xs font-bold uppercase mb-3 text-[#003366] dark:text-[#FF9900]">{category.title}</h3>
                    <ul className="space-y-1">
                      {category.items.map((item, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start">
                          <span className="mr-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-orange-50/30 to-background dark:from-[#003366]/10 dark:to-background">
        <div className="container mx-auto max-w-7xl text-center">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-24 md:gap-40 mb-28">
            <div>
              <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 text-[#FF9900]">5000+</p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium whitespace-nowrap">
                Verified Professionals
              </p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 text-[#FF9900]">Thousands</p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium whitespace-nowrap">
                Deals & Opportunities Every Month
              </p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 text-[#FF9900] whitespace-nowrap">Pan India</p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">
                Presence
              </p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 text-[#FF9900]">Trusted</p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium whitespace-nowrap">
                Verified Network
              </p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 text-[#FF9900] whitespace-nowrap">Real Growth</p>
              <p className="text-xs md:text-sm text-muted-foreground font-medium whitespace-nowrap">
                Real Connections. Real Results.
              </p>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-6 tracking-tight text-[#003366] dark:text-white">
            BE A PART OF INDIA'S LARGEST<br className="hidden sm:block" /> B2B REAL ESTATE NETWORK
          </h2>
          <Button size="lg" className="bg-[#FF9900] hover:bg-[#FF8800] text-white text-base md:text-lg font-bold px-12 h-14 shadow-xl hover:shadow-2xl transition-all" onClick={() => navigate('/register')}>
            JOIN. CONNECT. GROW.
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          {/* Asset Classes Section */}
          <div className="mb-12">
            <h3 className="text-sm font-bold mb-6">Asset Classes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>Residential Land</span>
              <span>Commercial Land</span>
              <span>Industrial Land</span>
              <span>Society Redevelopment</span>
              <span>Slum Rehabilitation</span>
              <span>Grade-A Office</span>
              <span>IT Parks</span>
              <span>Co-working Assets</span>
              <span>Warehousing & Logistics</span>
              <span>Data Centres</span>
              <span>Hospitality & Resorts</span>
              <span>Branded Residences</span>
              <span>Retail / Mall</span>
              <span>Mixed-use Townships</span>
              <span>Senior Living</span>
              <span>Student Housing</span>
              <span>Plotted Development</span>
              <span>Affordable Housing</span>
              <span>Premium Residential</span>
              <span>Luxury Villas</span>
              <span>Farmland & Agri</span>
              <span>Healthcare Real Estate</span>
              <span>Education Campuses</span>
              <span>Religious Trust Land</span>
              <span>TDR / FSI Trading</span>
              <span>Distressed Assets</span>
              <span>Pre-leased Assets</span>
              <span>Holiday Homes</span>
              <span>Co-living</span>
              <span>Heritage Properties</span>
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              {/* Logo */}
              <div className="flex items-center">
                <img 
                  src="/assets/ipnl-logo.png?v=1" 
                  alt="India Property Network Ltd" 
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              {/* Links */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm">
                <button onClick={() => navigate('/privacy')} className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy
                </button>
                <button onClick={() => navigate('/terms')} className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </button>
                <button onClick={() => navigate('/pricing')} className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </button>
                <button onClick={() => navigate('/rera-protocol')} className="text-muted-foreground hover:text-foreground transition-colors">
                  RERA Protocol
                </button>
                <button onClick={() => navigate('/contact')} className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </button>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="text-center text-xs text-muted-foreground">
              © 2026 INDIA PROPERTY NETWORK LTD
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
