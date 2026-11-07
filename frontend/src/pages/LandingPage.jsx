import React, { useState } from 'react';
import {
  Globe2,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  RotateCcw,
  Sparkles,
  CreditCard,
  QrCode,
  GraduationCap,
  Users2,
  Bot,
  Layers,
  ChevronRight,
  CheckCircle2,
  Lock,
  DollarSign
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  const [monthlyVolume, setMonthlyVolume] = useState(250000);

  // ROI Calculator
  const estimatedSavings = Math.round(monthlyVolume * 0.0185);
  const recoveredRevenue = Math.round(monthlyVolume * 0.042);

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center pt-8 pb-12">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 dark:bg-teal-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-6">
          {/* Top Brand Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Next-Gen FinTech Orchestration • v2.5</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Smarter Payments. <br />
            <span className="bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Borderless Possibilities.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            ATLAS.PAY orchestrates multi-gateway routing (Stripe, Adyen, PayPal, Razorpay, dLocal), unlocks cross-border RuPay & bilateral UPI rails, enforces Under-18 educational guardrails, and recovers stuck funds with autonomous agentic refunds.
          </p>

          {/* Action Callouts */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Explore AI Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('checkout')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 font-semibold text-sm border border-slate-700/60 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Live Multi-Rail Checkout</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>RuPay Global BIN Check</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Bilateral NIPL UPI Corridors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Under-18 Guardian Consent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Idempotent Agentic Refunds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1, 2, 3 Deep Dives */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Engine Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Three Pillars of Cross-Border Financial Intelligence
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Engineered specifically to solve real-world international payment failure points and regulatory friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Domestic Card & UPI Integration */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500/50 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <Globe2 className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                Feature 1
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Domestic Card & UPI Cross-Border Rails
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Solves Indian domestic checkout failure abroad. Validates RuPay Global (6521/6522 Discover co-badged) vs Domestic-only PMJDY, checks bilateral UPI corridors (Singapore PayNow, UAE NeoPay, France Lyra), and itemizes RBI LRS 20% & 5% TCS tax breakdowns.
              </p>
            </div>
            <button
              onClick={() => setActivePage('compatibility')}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Test Corridor Inspector <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Under-18 & Student Payments */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Feature 2
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Under-18 & Student Payment Support
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dedicated youth financial framework. Minor DOB verification, guardian approval workflow for tuition & global courses (Coursera, edX), velocity spending limits, and automated category whitelisting blocking gambling/crypto.
              </p>
            </div>
            <button
              onClick={() => setActivePage('student')}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Explore Student Hub <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Agentic Refund & Payment Recovery */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Feature 3
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Agentic Refund & Payment Recovery
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Never issue false refunds on client error screens. Autonomous AI verifies provider capture state, generates SHA256 idempotency keys (`idem_...`), prevents duplicate payouts, and routes &gt;$500 charges to a human compliance officer.
              </p>
            </div>
            <button
              onClick={() => setActivePage('agentic-refund')}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Open Refund Center <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ROI & Cost Savings Interactive Simulator */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 rounded-3xl border border-teal-500/20 text-white shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Interactive ROI Calculator
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              Calculate Smart Routing & Auto-Recovery Gains
            </h3>
            <p className="text-xs text-slate-300">
              See what intelligent multi-rail cascading and idempotent recovery adds to your monthly margin.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Monthly International Gross Volume:</span>
              <span className="font-mono text-teal-300 text-sm font-bold">
                ${monthlyVolume.toLocaleString()} USD
              </span>
            </div>
            <input
              type="range"
              min="50000"
              max="2000000"
              step="50000"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full accent-teal-400 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <span className="text-xs text-slate-300 block">FX & Gateway Fee Savings</span>
              <span className="text-3xl font-extrabold text-teal-400 font-mono">
                +${estimatedSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Saved vs flat 3.5% non-orchestrated baseline</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <span className="text-xs text-slate-300 block">Recovered Soft Declines</span>
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                +${recoveredRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Autonomous retry + cascaded acquiring rails</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Launch Platform With Test Volume →
            </button>
          </div>
        </div>
      </section>

      {/* Supported Payment Gateway Integrations */}
      <section className="max-w-7xl mx-auto px-4 text-center space-y-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Supported Gateways & Sandbox Environments
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-75">
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">Stripe</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">Adyen</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">PayPal Sandbox</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">Razorpay / UPI</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">dLocal</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">NPCI / NIPL</span>
        </div>
      </section>
    </div>
  );
}
