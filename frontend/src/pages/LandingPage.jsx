import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import InteractiveSquareCursorGrid from '../components/InteractiveSquareCursorGrid';
import {
  CreditCard,
  Globe2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  ArrowDownLeft,
  ChevronDown,
  ArrowUpRight,
  Smartphone,
  Check,
  Zap,
  Building2,
  Sparkles
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ setActivePage }) {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef(null);

  // Hero refs
  const heroRef = useRef(null);
  const heroNavRef = useRef(null);
  const heroHeadlineRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroButtonsRef = useRef(null);
  const heroCardsWrapRef = useRef(null);
  const heroSquiggleRef = useRef(null);
  const rearCardRef = useRef(null);
  const frontCardRef = useRef(null);
  const heroMetricsRef = useRef(null);
  const heroScrollIndicatorRef = useRef(null);

  // Section refs for ScrollTrigger
  const sectionFeaturesRef = useRef(null);
  const featureCardsRef = useRef([]);
  const sectionPhoneRef = useRef(null);
  const phoneMockupRef = useRef(null);
  const phoneLeftRef = useRef(null);
  const phoneRightRef = useRef(null);
  const sectionThreeCardsRef = useRef(null);
  const threeCardsListRef = useRef([]);
  const sectionTestimonialsRef = useRef(null);
  const testimonialCardsRef = useRef([]);
  const footerRef = useRef(null);

  function handleGetStarted() {
    if (isAuthenticated) {
      setActivePage('dashboard');
    } else {
      setActivePage('signup');
    }
  }

  function handleTryCheckout() {
    if (isAuthenticated) {
      setActivePage('checkout');
    } else {
      sessionStorage.setItem('atlas_redirect_after_login', 'checkout');
      setActivePage('login');
    }
  }

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. HERO ENTRANCE TIMELINE
      const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Step 2: Nav appears
      if (heroNavRef.current) {
        heroTl.from(heroNavRef.current, {
          opacity: 0,
          y: -10,
          duration: 0.35
        });
      }

      // Step 3: Headline reveals line by line
      const lines = heroHeadlineRef.current?.querySelectorAll('.headline-line');
      if (lines && lines.length > 0) {
        heroTl.from(lines, {
          opacity: 0,
          y: 20,
          duration: 0.4,
          stagger: 0.08
        }, '-=0.15');
      }

      // Step 4: Supporting description fades upward
      if (heroDescRef.current) {
        heroTl.from(heroDescRef.current, {
          opacity: 0,
          y: 12,
          duration: 0.3
        }, '-=0.15');
      }

      // Step 5: Buttons enter with slight stagger
      if (heroButtonsRef.current) {
        heroTl.fromTo(
          heroButtonsRef.current.children,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.08, clearProps: 'all' },
          '-=0.1'
        );
      }

      // Step 6: Rear card slides and rotates into position
      if (rearCardRef.current) {
        heroTl.from(rearCardRef.current, {
          opacity: 0,
          x: 50,
          y: 60,
          rotation: -18,
          duration: 0.5
        }, '-=0.2');
      }

      // Step 7: Front card enters and overlaps rear card
      if (frontCardRef.current) {
        heroTl.from(frontCardRef.current, {
          opacity: 0,
          x: -40,
          y: 70,
          rotation: 6,
          duration: 0.5
        }, '-=0.35');
      }

      // Step 7b: Squiggly line & card geometric accents fade in along with the cards
      if (heroSquiggleRef.current) {
        const squigglePath = heroSquiggleRef.current.querySelector('path');
        const pathLen = squigglePath?.getTotalLength ? squigglePath.getTotalLength() : 140;
        if (squigglePath) {
          gsap.set(squigglePath, {
            strokeDasharray: pathLen,
            strokeDashoffset: pathLen
          });
        }
        heroTl.fromTo(
          heroSquiggleRef.current,
          { opacity: 0, y: 18, scale: 0.92 },
          { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power2.out', clearProps: 'transform' },
          '-=0.45'
        );
        if (squigglePath) {
          heroTl.to(
            squigglePath,
            { strokeDashoffset: 0, duration: 0.65, ease: 'power2.out' },
            '<'
          );
        }
      }

      const cardAccents = heroRef.current?.querySelectorAll('.hero-card-accent');
      if (cardAccents && cardAccents.length > 0) {
        heroTl.fromTo(
          cardAccents,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'transform' },
          '<'
        );
      }

      // Step 8 & 9: Bottom indicators and metrics appear
      if (heroMetricsRef.current) {
        heroTl.from(heroMetricsRef.current, {
          opacity: 0,
          y: 12,
          duration: 0.35
        }, '-=0.2');
      }

      // Step 10: Scroll indicator appears last
      if (heroScrollIndicatorRef.current) {
        heroTl.from(heroScrollIndicatorRef.current, {
          opacity: 0,
          y: -8,
          duration: 0.3
        }, '-=0.15');
      }

      // Subtle float on hero cards
      gsap.to(frontCardRef.current, {
        y: -10,
        rotation: -2,
        duration: 3.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
      gsap.to(rearCardRef.current, {
        y: -7,
        rotation: -9,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.3
      });

      // 2. SECTION 02: FEATURES SCROLLTRIGGER
      if (sectionFeaturesRef.current) {
        gsap.fromTo(
          featureCardsRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionFeaturesRef.current,
              start: 'top 75%'
            }
          }
        );
      }

      // 3. SECTION 03: SMARTPHONE SHOWCASE SCROLLTRIGGER
      if (sectionPhoneRef.current) {
        const phoneTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionPhoneRef.current,
            start: 'top 70%'
          }
        });

        phoneTl
          .fromTo(
            phoneLeftRef.current,
            { opacity: 0, x: -40 },
            { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }
          )
          .fromTo(
            phoneMockupRef.current,
            { opacity: 0, y: 80, scale: 0.92 },
            { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
            '-=0.4'
          )
          .fromTo(
            phoneRightRef.current,
            { opacity: 0, x: 40 },
            { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' },
            '-=0.5'
          );
      }

      // 4. SECTION 04: THREE LARGE FEATURE CARDS SCROLLTRIGGER
      if (sectionThreeCardsRef.current) {
        gsap.fromTo(
          threeCardsListRef.current,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.12,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: sectionThreeCardsRef.current,
              start: 'top 80%'
            }
          }
        );
      }

      // 5. SECTION 05: PRODUCT PRINCIPLES SCROLLTRIGGER
      if (sectionTestimonialsRef.current) {
        gsap.fromTo(
          testimonialCardsRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.12,
            ease: 'power2.out',
            clearProps: 'all',
            scrollTrigger: {
              trigger: sectionTestimonialsRef.current,
              start: 'top 85%'
            }
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const marqueeNetworks = [
    'RuPay Global',
    'UPI Bilateral',
    'Visa International',
    'Mastercard Worldwide',
    'SEPA Direct',
    'SWIFT Network',
    'Discover Financial',
    'Diners Club',
    'JCB International',
    'FedNow Rails'
  ];

  return (
    <div ref={containerRef} className="w-full bg-black text-white space-y-12 sm:space-y-16 py-4 sm:py-6 overflow-hidden relative">
      
      {/* =========================================================================
          SECTION 01 — HERO (Monochrome Black Container, ~90% Width, ~90vh Tall)
          ========================================================================= */}
      <section
        ref={heroRef}
        className="w-[94%] max-w-[1440px] mx-auto min-h-[88vh] lg:min-h-[90vh] bg-[#080808] text-white rounded-[36px] sm:rounded-[44px] p-6 sm:p-10 lg:p-12 relative flex flex-col justify-between mono-hero-shadow border border-[#222222] overflow-hidden"
      >
        {/* Interactive Square Cursor Grid System */}
        <InteractiveSquareCursorGrid targetContainerRef={heroRef} />

        {/* Navigation Bar inside the Hero */}
        <header ref={heroNavRef} className="w-full flex items-center justify-between pb-6 border-b border-[#1A1A1A] relative z-20">
          {/* Logo */}
          <div
            onClick={() => setActivePage('landing')}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
          >
            <img
              src="/atlas_pay_favicon.png"
              alt="ATLAS.PAY"
              className="w-8 h-8 rounded-xl object-contain shadow-sm transition-transform group-hover:scale-105"
            />
            <span className="font-bold text-lg tracking-tight text-white">
              ATLAS<span className="text-[#999999]">.PAY</span>
            </span>
          </div>

          {/* Nav Links (Desktop: 400-500 weight, 14-15px) */}
          <nav className="hidden md:flex items-center space-x-8 text-[14.5px] font-medium text-[#999999]">
            <button onClick={() => scrollToSection('features-section')} className="hover:text-white transition-colors cursor-pointer">
              Product
            </button>
            <button onClick={() => scrollToSection('features-section')} className="hover:text-white transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('cards-showcase')} className="hover:text-white transition-colors cursor-pointer">
              Global Payments
            </button>
            <button onClick={() => scrollToSection('phone-showcase')} className="hover:text-white transition-colors cursor-pointer">
              Security
            </button>
          </nav>

          {/* Right Action Buttons (500-600 weight, 14-15px) */}
          <div className="flex items-center space-x-4 text-[14.5px] font-semibold">
            {isAuthenticated ? (
              <button
                onClick={() => setActivePage('dashboard')}
                className="btn-comic-white px-5 py-2.5 rounded-full bg-white text-black font-semibold border-2 border-black cursor-pointer"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActivePage('login')}
                  className="px-4 py-2 text-white hover:text-[#999999] transition-colors cursor-pointer font-medium"
                >
                  Log in
                </button>
                <button
                  onClick={() => setActivePage('signup')}
                  className="btn-comic-white px-6 py-2.5 rounded-full bg-white text-black font-semibold border-2 border-black cursor-pointer shadow-sm"
                >
                  Sign up
                </button>
              </>
            )}
          </div>
        </header>

        {/* Hero Main Body: Two-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-8 sm:py-12 flex-1 relative z-20">
          
          {/* Left Column: Typography & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            
            {/* Eyebrow */}
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#999999]">
              ATLAS.PAY / INTERNATIONAL PAYMENTS
            </div>

            {/* Headline (Specification: 600-700 weight, 58-64px desktop, 1.02-1.10 line height, -0.045em tracking) */}
            <div ref={heroHeadlineRef} className="space-y-1">
              <h1 className="hero-headline text-4xl sm:text-5xl lg:text-[60px] xl:text-[64px] font-bold text-white leading-[1.05] tracking-[-0.045em]">
                <span className="block headline-line">International banking</span>
                <span className="block headline-line">made for global</span>
                <span className="block headline-line flex items-center gap-3">
                  <span>payments.</span>
                  {/* Subtle directional badge matching reference */}
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#333333] text-white">
                    <ArrowDownLeft className="w-5 h-5 text-white" />
                  </span>
                </span>
              </h1>
            </div>

            {/* Supporting Text (Specification: 400 weight, 15-17px size, 1.45-1.6 line height) */}
            <p ref={heroDescRef} className="text-[15.5px] sm:text-[16.5px] text-[#999999] max-w-lg leading-[1.55] font-normal tracking-[-0.01em]">
              Your domestic payment methods, connected to a world of possibilities.
            </p>

            {/* Buttons (Specification: 500-600 weight, 14-15px size) */}
            <div ref={heroButtonsRef} className="flex flex-wrap items-center gap-5 pt-3 relative z-30">
              
              {/* Get Started Button Wrapper with Comic Pop-Up & Comic Drop Shadow */}
              <div className="relative group inline-block">
                {/* Comic Speech-Bubble Pop-Up on Hover */}
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out z-40">
                  <div className="relative px-3 py-1 bg-white text-black font-semibold text-[11.5px] tracking-wide rounded-md border-2 border-black shadow-[3px_3px_0px_0px_#FFFFFF] whitespace-nowrap">
                    Instant Global Pay ⚡
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                  </div>
                </div>

                <button
                  id="hero-get-started-btn"
                  data-cursor="get-started"
                  onClick={handleGetStarted}
                  className="btn-comic-white px-8 py-3.5 rounded-full bg-white text-black font-semibold text-[14.5px] tracking-tight flex items-center space-x-2.5 cursor-pointer border-2 border-black"
                >
                  <span>Get Started</span>
                  <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Learn More Button with Comic Pop-Up & Comic Drop Shadow */}
              <div className="relative group inline-block">
                {/* Comic Speech-Bubble Pop-Up on Hover */}
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out z-40">
                  <div className="relative px-3 py-1 bg-black text-white font-semibold text-[11.5px] tracking-wide rounded-md border-2 border-white shadow-[3px_3px_0px_0px_#FFFFFF] whitespace-nowrap">
                    Explore Features ↓
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
                  </div>
                </div>

                <button
                  data-cursor="get-started"
                  onClick={() => scrollToSection('features-section')}
                  className="btn-comic-outline px-7 py-3.5 rounded-full bg-transparent text-white font-medium text-[14.5px] tracking-tight border-2 border-[#555555] cursor-pointer"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Two Overlapping Physical Payment Cards */}
          <div ref={heroCardsWrapRef} className="lg:col-span-6 relative flex items-center justify-center min-h-[360px] sm:min-h-[440px]">
            
            {/* Background Hand-drawn Squiggly Line SVG matching the reference */}
            <svg
              ref={heroSquiggleRef}
              className="absolute -bottom-4 left-6 w-36 h-20 text-white/40 pointer-events-none hidden sm:block"
              viewBox="0 0 120 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M10 40 Q 30 10, 60 30 T 110 20" />
            </svg>

            {/* Rear Physical Card (Tilted ~-11deg) */}
            <div
              ref={rearCardRef}
              className="absolute z-10 w-[290px] sm:w-[380px] lg:w-[420px] transition-transform duration-300"
              style={{
                top: '12%',
                right: '4%',
                filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.65))'
              }}
            >
              <img
                src="/assets/atlas-card-back.png"
                alt="ATLAS.PAY Physical Card Artwork Rear"
                className="w-full h-auto object-contain rounded-2xl select-none pointer-events-none"
              />
            </div>

            {/* Front Physical Card (Overlapping, Tilted ~-4deg) */}
            <div
              ref={frontCardRef}
              className="relative z-20 w-[300px] sm:w-[400px] lg:w-[450px] transition-transform duration-300"
              style={{
                filter: 'drop-shadow(0 30px 45px rgba(0,0,0,0.8))'
              }}
            >
              <img
                src="/assets/atlas-card-front.png"
                alt="ATLAS.PAY Physical Card Artwork Front"
                className="w-full h-auto object-contain rounded-2xl select-none pointer-events-none"
              />
            </div>
          </div>

        </div>

        {/* Bottom of Hero: Metrics, Indicators & Centered Scroll Notch */}
        <div ref={heroMetricsRef} className="pt-6 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-6 text-xs relative z-20">
          
          {/* Active Users Avatar Group */}
          <div className="flex items-center space-x-3.5">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#1E1E1E] border-2 border-[#080808] flex items-center justify-center text-[10px] font-bold text-white">
                RP
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2A2A2A] border-2 border-[#080808] flex items-center justify-center text-[10px] font-bold text-white">
                VI
              </div>
              <div className="w-8 h-8 rounded-full bg-[#383838] border-2 border-[#080808] flex items-center justify-center text-[10px] font-bold text-white">
                MC
              </div>
            </div>
            <div>
              <div className="font-bold text-white text-xs">10.2k+</div>
              <div className="text-[10px] text-[#999999]">Active users around the globe</div>
            </div>
          </div>

          {/* Three Concise Metrics */}
          <div className="flex items-center space-x-8 text-center sm:text-right">
            <div>
              <div className="text-sm font-black font-mono text-white">16y</div>
              <div className="text-[10px] text-[#999999] uppercase tracking-wider">Experience</div>
            </div>
            <div>
              <div className="text-sm font-black font-mono text-white">250+</div>
              <div className="text-[10px] text-[#999999] uppercase tracking-wider">Merchant Corridors</div>
            </div>
            <div>
              <div className="text-sm font-black font-mono text-white">100%</div>
              <div className="text-[10px] text-[#999999] uppercase tracking-wider">Encrypted Tokens</div>
            </div>
          </div>

          {/* Minimal Downward Scroll Indicator (Notch Capsule at Bottom Center) */}
          <div
            ref={heroScrollIndicatorRef}
            onClick={() => scrollToSection('features-section')}
            className="btn-comic-white absolute -bottom-10 sm:-bottom-12 left-1/2 -translate-x-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-white text-black flex items-center justify-center border-2 border-black shadow-lg cursor-pointer z-30"
            title="Scroll Down"
          >
            <ChevronDown className="w-5 h-5 text-black animate-bounce" />
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 02 — FEATURES (Large White Rounded Container)
          ========================================================================= */}
      <section
        id="features-section"
        ref={sectionFeaturesRef}
        className="w-[94%] max-w-[1440px] mx-auto bg-white rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 lg:p-16 mono-card-shadow border border-[#DEDEDE] space-y-12 text-left"
      >
        {/* Horizontally Scrolling Payment-Network Text Marquee (Workbench Font, No Boxes) */}
        <div className="overflow-hidden border-b border-[#EEEEEE] pb-8 pt-2">
          <div className="animate-marquee flex items-center gap-12 sm:gap-16">
            {[...marqueeNetworks, ...marqueeNetworks, ...marqueeNetworks].map((net, i) => (
              <span
                key={i}
                className="font-workbench text-base sm:text-lg lg:text-xl text-[#111111] tracking-wider uppercase whitespace-nowrap select-none hover:text-[#666666] transition-colors"
              >
                {net}
              </span>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="section-heading text-3xl sm:text-4xl lg:text-[42px] font-semibold text-[#111111] leading-[1.1] tracking-[-0.035em]">
            What do we offer?
          </h2>
          <p className="text-[15.5px] sm:text-[16.5px] text-[#666666] leading-[1.5] font-normal">
            Everything you need for simpler international payments.
          </p>
        </div>

        {/* Exactly Three White Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          
          {/* Card 1: Domestic Card Support */}
          <div
            ref={(el) => (featureCardsRef.current[0] = el)}
            className="p-8 rounded-[28px] bg-white border border-[#DEDEDE] mono-card-shadow space-y-5 hover:border-black transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <h3 className="card-heading text-[20px] font-semibold text-[#111111] leading-[1.3] tracking-[-0.015em]">
              Domestic Card Support
            </h3>
            <p className="text-[14.5px] sm:text-[15px] text-[#666666] leading-[1.55] font-normal">
              Link domestic Indian RuPay, Visa, and Mastercard debit and credit cards. Identify international e-commerce readiness instantly and avoid declined foreign charges.
            </p>
          </div>

          {/* Card 2: International Payments */}
          <div
            ref={(el) => (featureCardsRef.current[1] = el)}
            className="p-8 rounded-[28px] bg-white border border-[#DEDEDE] mono-card-shadow space-y-5 hover:border-black transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="card-heading text-[20px] font-semibold text-[#111111] leading-[1.3] tracking-[-0.015em]">
              International Payments
            </h3>
            <p className="text-[14.5px] sm:text-[15px] text-[#666666] leading-[1.55] font-normal">
              Pay international merchants with real-time settlement and digital receipts. Support for bilateral cross-border UPI corridors and global payment rails.
            </p>
          </div>

          {/* Card 3: Transparent Currency Conversion */}
          <div
            ref={(el) => (featureCardsRef.current[2] = el)}
            className="p-8 rounded-[28px] bg-white border border-[#DEDEDE] mono-card-shadow space-y-5 hover:border-black transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <h3 className="card-heading text-[20px] font-semibold text-[#111111] leading-[1.3] tracking-[-0.015em]">
              Transparent Currency Conversion
            </h3>
            <p className="text-[14.5px] sm:text-[15px] text-[#666666] leading-[1.55] font-normal">
              Real-time exchange rates with complete visibility into markup and fees before paying. No unexpected hidden bank surcharges or post-transaction deductions.
            </p>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 03 — SMARTPHONE SHOWCASE (Black Inset Container)
          ========================================================================= */}
      <section
        id="phone-showcase"
        ref={sectionPhoneRef}
        className="w-[94%] max-w-[1440px] mx-auto bg-white rounded-[36px] sm:rounded-[44px] p-4 sm:p-6 mono-card-shadow border border-[#DEDEDE]"
      >
        <div className="w-full bg-[#080808] text-white rounded-[32px] sm:rounded-[40px] p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
            
            {/* Left Column: Find the right payment method */}
            <div ref={phoneLeftRef} className="lg:col-span-4 space-y-6 text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-semibold text-white leading-[1.1] tracking-[-0.035em]">
                Find the right<br />
                payment method.
              </h2>
              <p className="text-[14.5px] sm:text-[15.5px] text-[#999999] leading-[1.55] max-w-sm font-normal">
                You have the freedom to personalize your payment experience, ensuring seamless international checkout with your trusted domestic instruments.
              </p>

              {/* Decorative Monochrome Asterisk / Starburst matching reference */}
              <div className="w-10 h-10 text-white select-none">
                <svg viewBox="0 0 40 40" fill="currentColor">
                  <path d="M18 0h4v40h-4z" />
                  <path d="M0 18h40v4H0z" />
                  <path d="M5.858 31.314l2.828 2.828L34.142 8.686l-2.828-2.828z" />
                  <path d="M8.686 5.858l25.456 25.456-2.828 2.828L5.858 8.686z" />
                </svg>
              </div>

              {/* Two Compact Download / Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={handleTryCheckout}
                  className="btn-comic-outline px-5 py-3 rounded-xl bg-[#1E1E1E] text-white text-[13.5px] font-semibold border border-[#333333] transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-white" />
                  <div className="text-left leading-tight">
                    <span className="text-[9.5px] text-[#999999] block font-medium">Checkout on</span>
                    <span className="font-semibold">Web Platform</span>
                  </div>
                </button>

                <button
                  onClick={handleGetStarted}
                  className="btn-comic-outline px-5 py-3 rounded-xl bg-[#1E1E1E] text-white text-[13.5px] font-semibold border border-[#333333] transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-white" />
                  <div className="text-left leading-tight">
                    <span className="text-[9.5px] text-[#999999] block font-medium">Instant Access</span>
                    <span className="font-semibold">Live Dashboard</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Center Column: Large Smartphone Mockup */}
            <div ref={phoneMockupRef} className="lg:col-span-4 flex items-center justify-center py-4">
              <div className="w-[280px] sm:w-[320px] lg:w-[340px] max-w-full drop-shadow-2xl">
                <img
                  src="/assets/atlas-phone-mockup.png"
                  alt="ATLAS.PAY Banking Smartphone Mockup"
                  className="w-full h-auto object-contain select-none pointer-events-none"
                />
              </div>
            </div>

            {/* Right Column: Your payments, beautifully simplified */}
            <div ref={phoneRightRef} className="lg:col-span-4 space-y-6 text-left lg:text-left">
              {/* Curved Hand-drawn Squiggly Line */}
              <svg
                className="w-24 h-12 text-white/50"
                viewBox="0 0 100 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M10 20 Q 30 45, 60 15 T 90 35" />
              </svg>

              <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-semibold text-white leading-[1.1] tracking-[-0.035em]">
                Your payments,<br />
                beautifully simplified.
              </h2>
              <p className="text-[14.5px] sm:text-[15.5px] text-[#999999] leading-[1.55] max-w-sm font-normal">
                Experience unified domestic-to-international routing, automated currency exchange, and biometric 3D Secure verification all in one intuitive workflow.
              </p>

              {/* Pill CTA button */}
              <div className="pt-2">
                <button
                  onClick={handleGetStarted}
                  className="btn-comic-white px-7 py-3 rounded-full bg-white text-black font-semibold text-[14.5px] tracking-tight flex items-center space-x-2.5 cursor-pointer border-2 border-black"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 04 — THREE LARGE FEATURE CARDS ("Banking without boundaries.")
          ========================================================================= */}
      <section
        id="cards-showcase"
        ref={sectionThreeCardsRef}
        className="w-[94%] max-w-[1440px] mx-auto bg-white rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 lg:p-16 mono-card-shadow border border-[#DEDEDE] space-y-10 text-left"
      >
        {/* Centered Italic Heading matching reference */}
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-[38px] font-normal italic text-[#111111] tracking-[-0.035em] leading-[1.1]">
            Banking without boundaries.
          </h2>
        </div>

        {/* Exactly Three Tall Cards with Oversized Multi-Card Stack Artwork */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Card 1: White/Light-Grey Surface (Domestic Card Support - 3-Card Iridescent Stack) */}
          <div
            ref={(el) => (threeCardsListRef.current[0] = el)}
            className="h-[460px] sm:h-[500px] rounded-[32px] bg-[#F7F7F7] border border-[#DEDEDE] p-8 relative overflow-hidden flex flex-col justify-between group hover:border-black transition-all"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#999999]">
                  01 / INGESTION
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#EEEEEE] text-[#111111] border border-[#DEDEDE]">
                  RuPay · Visa · MC
                </span>
              </div>
              <h3 className="text-2xl sm:text-[26px] font-semibold text-[#111111] tracking-[-0.025em] leading-[1.2] mb-2">
                Domestic Card<br />Support
              </h3>
              <p className="text-[14px] text-[#666666] max-w-[230px] leading-[1.5] font-normal">
                Seamlessly ingest domestic payment instruments with instant cross-border tokenization.
              </p>
            </div>

            {/* Oversized Multi-Card Stack Artwork filling empty space */}
            <div className="absolute -bottom-8 -right-8 w-[340px] sm:w-[380px] lg:w-[420px] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-3">
              <img
                src="/assets/card-stack-iridescent.png"
                alt="Domestic Card Stack"
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.12)]"
              />
            </div>
          </div>

          {/* Card 2: Light-Grey Surface (Transparent Currency Conversion - 3-Card Standing Fan) */}
          <div
            ref={(el) => (threeCardsListRef.current[1] = el)}
            className="h-[460px] sm:h-[500px] rounded-[32px] bg-[#EEEEEE] border border-[#DEDEDE] p-8 relative overflow-hidden flex flex-col justify-between group hover:border-black transition-all"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#666666]">
                  02 / FX ENGINE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white text-[#111111] border border-[#DEDEDE]">
                  20+ Currencies
                </span>
              </div>
              <h3 className="text-2xl sm:text-[26px] font-semibold text-[#111111] tracking-[-0.025em] leading-[1.2] mb-2">
                Transparent Currency<br />Conversion
              </h3>
              <p className="text-[14px] text-[#666666] max-w-[230px] leading-[1.5] font-normal">
                Real-time interbank mid-market exchange with upfront lock and zero hidden conversion surcharges.
              </p>
            </div>

            {/* Oversized Standing Multi-Card Trio Artwork filling empty space */}
            <div className="absolute -bottom-10 -right-4 sm:-right-8 w-[320px] sm:w-[360px] lg:w-[400px] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-3">
              <img
                src="/assets/card-stack-glossy-trio.png"
                alt="Multi-Currency Card Trio"
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_25px_35px_rgba(0,0,0,0.15)]"
              />
            </div>
          </div>

          {/* Card 3: Black Surface (Global Payments - Holographic Mirrored Stack) */}
          <div
            ref={(el) => (threeCardsListRef.current[2] = el)}
            className="h-[460px] sm:h-[500px] rounded-[32px] bg-[#080808] text-white border border-[#222222] p-8 relative overflow-hidden flex flex-col justify-between group hover:border-white transition-all"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#999999]">
                  03 / ORCHESTRATION
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#1E1E1E] text-white border border-[#333333]">
                  Sub-Second Routing
                </span>
              </div>
              <h3 className="text-2xl sm:text-[26px] font-semibold text-white tracking-[-0.025em] leading-[1.2] mb-2">
                Global<br />Payments
              </h3>
              <p className="text-[14px] text-[#999999] max-w-[230px] leading-[1.5] font-normal">
                Autonomous cross-border transaction routing across global clearing corridors with instant settlement.
              </p>
            </div>

            {/* Oversized Holographic Mirrored Multi-Card Stack filling empty space */}
            <div className="absolute -bottom-8 -right-6 w-[340px] sm:w-[390px] lg:w-[430px] transition-transform duration-500 ease-out group-hover:scale-105 group-hover:-translate-y-3">
              <img
                src="/assets/card-stack-mirrored-dark.png"
                alt="Global Payments Holographic Stack"
                className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_25px_45px_rgba(0,0,0,0.8)]"
              />
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 05 — PRODUCT PRINCIPLES (Three-Column Testimonial Style)
          ========================================================================= */}
      <section
        ref={sectionTestimonialsRef}
        className="w-[94%] max-w-[1440px] mx-auto bg-white rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 lg:p-16 mono-card-shadow border border-[#DEDEDE] space-y-10 text-left"
      >
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="section-heading text-3xl sm:text-4xl font-semibold text-[#111111] leading-[1.1] tracking-[-0.035em]">
            What our clients are<br />
            saying about us!
          </h2>
        </div>

        {/* Three White Cards with Top Black Circle and Quote Marks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Principle 1 */}
          <div
            ref={(el) => (testimonialCardsRef.current[0] = el)}
            className="p-8 rounded-[28px] bg-white border border-[#DEDEDE] mono-card-shadow space-y-5 flex flex-col justify-between hover:border-black transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full bg-black text-white font-serif text-lg font-bold flex items-center justify-center select-none">
                “
              </div>
              <h4 className="card-heading text-[18px] sm:text-[19px] font-semibold text-[#111111] tracking-[-0.015em] leading-[1.3]">
                Transparent payment costs.
              </h4>
              <p className="text-[14.5px] sm:text-[15px] text-[#666666] leading-[1.55] font-normal">
                "Every exchange rate is locked to interbank mid-market benchmarks with upfront 1.25% fixed margin and zero hidden surcharges."
              </p>
            </div>
            <div className="pt-4 border-t border-[#EEEEEE] text-[11px] text-[#999999] font-mono">
              FINANCIAL PRINCIPLE 01
            </div>
          </div>

          {/* Principle 2 */}
          <div
            ref={(el) => (testimonialCardsRef.current[1] = el)}
            className="p-8 rounded-[28px] bg-white border border-[#DEDEDE] mono-card-shadow space-y-5 flex flex-col justify-between hover:border-black transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full bg-black text-white font-serif text-lg font-bold flex items-center justify-center select-none">
                “
              </div>
              <h4 className="card-heading text-[18px] sm:text-[19px] font-semibold text-[#111111] tracking-[-0.015em] leading-[1.3]">
                Secure card management.
              </h4>
              <p className="text-[14.5px] sm:text-[15px] text-[#666666] leading-[1.55] font-normal">
                "Hardware-grade tokenization and automated EMV 3D Secure 2.2 eliminate raw PAN exposure across international boundaries."
              </p>
            </div>
            <div className="pt-4 border-t border-[#EEEEEE] text-[11px] text-[#999999] font-mono">
              FINANCIAL PRINCIPLE 02
            </div>
          </div>

          {/* Principle 3 */}
          <div
            ref={(el) => (testimonialCardsRef.current[2] = el)}
            className="p-8 rounded-[28px] bg-white border border-[#DEDEDE] mono-card-shadow space-y-5 flex flex-col justify-between hover:border-black transition-all"
          >
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-full bg-black text-white font-serif text-lg font-bold flex items-center justify-center select-none">
                “
              </div>
              <h4 className="card-heading text-[18px] sm:text-[19px] font-semibold text-[#111111] tracking-[-0.015em] leading-[1.3]">
                Simpler global payments.
              </h4>
              <p className="text-[14.5px] sm:text-[15px] text-[#666666] leading-[1.55] font-normal">
                "Bilateral clearing and automated routing allow Indian domestic cards and UPI to settle overseas in sub-second time."
              </p>
            </div>
            <div className="pt-4 border-t border-[#EEEEEE] text-[11px] text-[#999999] font-mono">
              FINANCIAL PRINCIPLE 03
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 06 — FOOTER (Large Black Rounded Footer Container)
          ========================================================================= */}
      <footer
        ref={footerRef}
        className="w-[94%] max-w-[1440px] mx-auto bg-[#080808] text-white rounded-[36px] sm:rounded-[44px] p-8 sm:p-14 lg:p-16 border border-[#222222] mono-hero-shadow text-left space-y-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-[#1A1A1A]">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-2.5">
              <img
                src="/atlas_pay_favicon.png"
                alt="ATLAS.PAY"
                className="w-8 h-8 rounded-xl object-contain shadow-sm"
              />
              <span className="font-extrabold text-lg tracking-tight text-white">
                ATLAS<span className="text-[#999999]">.PAY</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#999999] leading-relaxed max-w-sm">
              Discover the power of our secure, transparent, and seamless international payment orchestration platform.
            </p>
          </div>

          {/* Three Compact Navigation Columns */}
          <div className="md:col-span-7 grid grid-cols-3 gap-6 text-xs">
            
            {/* Column 1: About Us */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">About us</h5>
              <ul className="space-y-2 text-[#999999]">
                <li><button onClick={() => setActivePage('dashboard')} className="hover:text-white transition-colors cursor-pointer">Overview</button></li>
                <li><button onClick={() => scrollToSection('features-section')} className="hover:text-white transition-colors cursor-pointer">Features</button></li>
                <li><button onClick={() => setActivePage('rupay-upi')} className="hover:text-white transition-colors cursor-pointer">Security</button></li>
                <li><button onClick={() => setActivePage('settings')} className="hover:text-white transition-colors cursor-pointer">Contact</button></li>
              </ul>
            </div>

            {/* Column 2: Products */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Products</h5>
              <ul className="space-y-2 text-[#999999]">
                <li><button onClick={() => setActivePage('cards')} className="hover:text-white transition-colors cursor-pointer">Domestic Cards</button></li>
                <li><button onClick={() => setActivePage('rupay-upi')} className="hover:text-white transition-colors cursor-pointer">RuPay & UPI</button></li>
                <li><button onClick={() => setActivePage('checkout')} className="hover:text-white transition-colors cursor-pointer">Global Checkout</button></li>
                <li><button onClick={() => setActivePage('transactions')} className="hover:text-white transition-colors cursor-pointer">Transactions</button></li>
              </ul>
            </div>

            {/* Column 3: Useful Links */}
            <div className="space-y-3">
              <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Useful Links</h5>
              <ul className="space-y-2 text-[#999999]">
                <li><button onClick={() => setActivePage('student-payments')} className="hover:text-white transition-colors cursor-pointer">Student Portal</button></li>
                <li><button onClick={() => setActivePage('settings')} className="hover:text-white transition-colors cursor-pointer">API Keys</button></li>
                <li><button onClick={() => setActivePage('login')} className="hover:text-white transition-colors cursor-pointer">Merchant Sign In</button></li>
                <li><button onClick={() => setActivePage('signup')} className="hover:text-white transition-colors cursor-pointer">Create Account</button></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#666666]">
          <div>
            © {new Date().getFullYear()} ATLAS.PAY. All rights reserved. Monochromatic International Banking Edition.
          </div>
          <div className="flex items-center space-x-6">
            <span>PCI-DSS Level 1</span>
            <span>•</span>
            <span>EMV 3DS 2.2</span>
            <span>•</span>
            <span>RBI LRS Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
