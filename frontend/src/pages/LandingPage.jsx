import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Globe2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRightLeft,
  Sparkles,
  Zap,
  Building2,
  Check
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  const { isAuthenticated } = useAuth();

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

  return (
    <div className="space-y-24 py-6">
      
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-teal-500/10 dark:bg-teal-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Brand Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cross-Border FinTech Platform</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Your Payments.{' '}
              <span className="bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Without Borders.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              Make international payments simpler with domestic payment support, transparent currency conversion and secure payment processing.
            </p>

            {/* Two Prominent CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                onClick={handleGetStarted}
                className="px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/20 hover:shadow-teal-600/35 transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleTryCheckout}
                className="px-7 py-3.5 rounded-xl bg-slate-900 dark:bg-slate-800/90 text-white hover:bg-slate-800 font-semibold text-sm border border-slate-300 dark:border-slate-700/80 shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span>Try Payment Checkout</span>
              </button>
            </div>

            {/* Micro Feature Indicators */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-500" />
                <span>RuPay Global & UPI Bilateral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-500" />
                <span>Real-Time FX Breakdown</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-500" />
                <span>Tokenized Card Security</span>
              </div>
            </div>
          </div>

          {/* Right Column: Abstract Payment-Network Graphic */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md p-6 rounded-2xl bg-gradient-to-br from-white/80 dark:from-[#111827]/90 to-slate-50/90 dark:to-[#0a1120]/90 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
              
              {/* Top Bar of Graphic */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Cross-Border Network
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 rounded border border-teal-500/20">
                  Live Corridor
                </span>
              </div>

              {/* Graphic Nodes: Origin -> Platform Core -> Destination */}
              <div className="space-y-3 font-mono text-xs">
                
                {/* Domestic Origin Node */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 font-bold">
                      IN
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">RuPay Global / UPI</div>
                      <div className="text-[10px] text-slate-400">Domestic Instrument • INR</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold">
                    Verified
                  </span>
                </div>

                {/* Animated Flow Connector */}
                <div className="flex justify-center items-center py-0.5">
                  <div className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-400 flex items-center gap-1.5 font-bold">
                    <ArrowRightLeft className="w-3 h-3 text-teal-500 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>ATLAS.PAY FX & Token Vault</span>
                  </div>
                </div>

                {/* Global Merchant Destination Node */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold">
                      GL
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">International Merchant</div>
                      <div className="text-[10px] text-slate-400">20+ Currencies • USD, EUR, SGD</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded font-semibold">
                    Instant
                  </span>
                </div>
              </div>

              {/* Status Metric Strip */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-slate-900/40 text-center">
                  <span className="text-slate-400 block text-[10px]">Conversion Markup</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">1.25% Transparent</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-100/60 dark:bg-slate-900/40 text-center">
                  <span className="text-slate-400 block text-[10px]">Security Standard</span>
                  <span className="font-mono font-bold text-teal-600 dark:text-teal-400">EMV 3DS Tokenized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Core Feature Highlights */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Built for Modern Cross-Border Payments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A unified solution providing domestic card interoperability, transparent currency exchange, and secure checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1: Domestic Card Support */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Domestic Card Support
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Link domestic Indian RuPay, Visa, and Mastercard debit and credit cards. Identify international e-commerce readiness instantly and avoid declined foreign charges.
            </p>
          </div>

          {/* Feature 2: International Payment Checkout */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              International Payment Checkout
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Pay international merchants with real-time settlement and digital receipts. Support for bilateral cross-border UPI corridors and global payment rails.
            </p>
          </div>

          {/* Feature 3: Transparent Currency Conversion */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Transparent Currency Conversion
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time exchange rates with complete visibility into markup and fees before paying. No unexpected hidden bank surcharges or post-transaction deductions.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section: 3 Steps */}
      <section className="p-8 sm:p-10 rounded-2xl bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Simple 3-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Link Your Domestic Card
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add your RuPay, Visa, or Mastercard. The system validates the BIN and verifies whether the card is enabled for international transactions.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Choose Currency & Destination
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select the merchant country and currency. View the real-time mid-market exchange rate, conversion fee, and total payable in INR.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Pay Securely with Instant Receipt
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complete the payment with simulated tokenization and 3D Secure verification. Receive an itemized transaction receipt instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Compact CTA Banner */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-teal-600/10">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black">
            Ready to experience seamless global payments?
          </h3>
          <p className="text-xs text-teal-100">
            Open the dashboard or test a live multi-rail payment checkout in seconds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGetStarted}
            className="px-5 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs shadow-md hover:bg-teal-50 transition-all cursor-pointer"
          >
            {isAuthenticated ? 'Launch Dashboard' : 'Get Started Free'}
          </button>
          <button
            onClick={handleTryCheckout}
            className="px-5 py-2.5 rounded-xl bg-teal-800/80 text-white font-semibold text-xs border border-teal-400/40 hover:bg-teal-800 transition-all cursor-pointer"
          >
            Try Payment Checkout
          </button>
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="pt-8 pb-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">ATLAS.PAY</span>
          <span>•</span>
          <span>International Payment Orchestration Platform</span>
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => setActivePage('dashboard')} className="hover:text-teal-400 cursor-pointer">Dashboard</button>
          <button onClick={() => setActivePage('checkout')} className="hover:text-teal-400 cursor-pointer">Checkout</button>
          <button onClick={() => setActivePage('cards')} className="hover:text-teal-400 cursor-pointer">My Cards</button>
          <button onClick={() => setActivePage('rupay-upi')} className="hover:text-teal-400 cursor-pointer">RuPay & UPI</button>
          <button onClick={() => setActivePage('settings')} className="hover:text-teal-400 cursor-pointer">Settings</button>
        </div>
      </footer>
    </div>
  );
}
