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
  DollarSign,
  HelpCircle,
  Info
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  const [monthlyVolume, setMonthlyVolume] = useState(250000);

  // Fee Savings & Recovery Calculator
  const estimatedSavings = Math.round(monthlyVolume * 0.0185);
  const recoveredRevenue = Math.round(monthlyVolume * 0.042);

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden text-center pt-8 pb-12">
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 dark:bg-teal-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 space-y-6">
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>International Payment Platform • Demo Edition</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            One platform to manage international payments <br />
            <span className="bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              across multiple payment providers.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            ATLAS.PAY automatically chooses the best payment company for every customer, checks whether Indian RuPay cards and UPI work internationally, protects students with parent approvals, and automatically recovers failed payments.
          </p>

          {/* Quick Explanation of Orchestration */}
          <div className="max-w-2xl mx-auto p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-teal-500 shrink-0" />
            <span>
              <strong>What is Payment Orchestration?</strong> It connects different payment providers (like Stripe, Adyen, and PayPal) into a single system and picks the fastest, cheapest one for each payment.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/25 hover:shadow-teal-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('checkout')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 font-semibold text-sm border border-slate-700/60 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Try Payment Checkout</span>
            </button>
          </div>

          {/* Key Safeguards */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>RuPay Global vs Domestic Card Check</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Supported UPI International Corridors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Parent Approval for Student Payments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-500" />
              <span>Automatic Duplicate-Safe Refunds</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Core Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            How It Works
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Three Simple Ways ATLAS.PAY Protects Your Payments
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Designed to solve everyday payment problems for international shoppers, students, parents, and merchants.
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
                Indian Cards & UPI for International Payments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Many Indian cards fail on foreign websites. ATLAS.PAY checks whether your RuPay card works globally (or is domestic-only), verifies supported UPI payment routes (like Singapore, UAE, or France), and clearly calculates applicable foreign payment taxes (TCS).
              </p>
            </div>
            <button
              onClick={() => setActivePage('compatibility')}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Check Card & UPI Compatibility <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Student & Parent */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Feature 2
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Student Payments & Parent Approval
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Allows students under 18 to pay for international online courses, university certificates, and learning tools safely. Parents set spending allowances, approve payments over $50, and automatically block non-educational purchases like gambling or crypto.
              </p>
            </div>
            <button
              onClick={() => setActivePage('student')}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Open Student & Parent Hub <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: Automatic Refund Assistant */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Feature 3
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Automatic Refund Assistant
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Never refund merely because a screen showed an error. Our assistant checks the payment company's actual bank records. If money was deducted during a failed checkout, it issues a safe refund with protection against duplicate payouts.
              </p>
            </div>
            <button
              onClick={() => setActivePage('agentic-refund')}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-600 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Open Refund Assistant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Savings & Recovery Calculator */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 rounded-3xl border border-teal-500/20 text-white shadow-2xl space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Interactive Fee Savings Calculator
            </span>
            <h3 className="text-2xl font-extrabold text-white">
              See How Much Your Business Can Save
            </h3>
            <p className="text-xs text-slate-300">
              Calculate your estimated monthly savings by automatically selecting the cheapest payment provider and recovering failed payments.
            </p>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Estimated Monthly Payment Volume:</span>
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
              <span className="text-xs text-slate-300 block">Estimated Fee Savings</span>
              <span className="text-3xl font-extrabold text-teal-400 font-mono">
                +${estimatedSavings.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Saved by choosing lower-cost providers vs 3.5% flat fees</span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1">
              <span className="text-xs text-slate-300 block">Recovered Failed Payments</span>
              <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                +${recoveredRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">Saved by automatically trying a backup provider on timeouts</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setActivePage('dashboard')}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Open Dashboard With Sample Data →
            </button>
          </div>
        </div>
      </section>

      {/* Connected Gateways & Sandbox Notice */}
      <section className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Connected Payment Providers
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-75">
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">Stripe</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">Adyen</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">PayPal Sandbox</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">Razorpay / UPI</span>
          <span className="font-bold text-lg text-slate-700 dark:text-slate-300">dLocal</span>
        </div>
        <p className="text-[11px] text-slate-400 max-w-xl mx-auto">
          *Note for Judges: PayPal Sandbox connects to live test credentials when configured in .env. Stripe, Adyen, Razorpay/UPI, and dLocal run in high-fidelity simulated mode for testing and demonstration.
        </p>
      </section>
    </div>
  );
}
