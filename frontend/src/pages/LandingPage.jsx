import React, { useState } from 'react';
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  DollarSign,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ setActivePage }) {
  const [monthlyVolume, setMonthlyVolume] = useState(250000);

  // ROI Calculator
  const estimatedSavings = Math.round(monthlyVolume * 0.0145);
  const recoveredRevenue = Math.round(monthlyVolume * 0.038);

  return (
    <div className="space-y-24 py-8">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-500/15 dark:bg-blue-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center pt-8 pb-12">
          
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Next-Gen Multi-Rail Payment Orchestration</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-tight">
            Route Globally. <br />
            <span className="bg-clip-text text-transparent fintech-gradient">
              Recover Soft Declines. Zero Loss.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Unify Stripe, Adyen, PayPal Sandbox, Razorpay UPI, and dLocal under an intelligent rule-based routing engine powered by Python AI fraud scoring and automated gateway cascading.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('checkout')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl fintech-gradient text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
            >
              <span>Launch Live Checkout Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Merchant Dashboard</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Key Stat Badges */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">99.99%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Payment Uptime</div>
              <div className="text-[11px] text-emerald-500 font-medium mt-1">Automatic failover</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+1.45%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Interchange Savings</div>
              <div className="text-[11px] text-emerald-500 font-medium mt-1">Via least-cost routing</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">88.2%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Decline Recovery</div>
              <div className="text-[11px] text-purple-500 font-medium mt-1">Automated cascading</div>
            </div>
            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <div className="text-2xl font-bold text-amber-500 dark:text-amber-400">&lt; 35ms</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">AI Risk Scoring</div>
              <div className="text-[11px] text-amber-500 font-medium mt-1">FastAPI microservice</div>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Interactive ROI Calculator</span>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">See Your Orchestration Uplift</h3>
              <p className="text-sm text-slate-400 mt-1">Estimate savings from least-cost routing and revenue saved via cascading decline recovery.</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Monthly Processing Volume</div>
              <div className="text-2xl font-mono font-bold text-white">${monthlyVolume.toLocaleString()} USD</div>
            </div>
          </div>

          <div className="mb-8">
            <input
              type="range"
              min="50000"
              max="2000000"
              step="25000"
              value={monthlyVolume}
              onChange={(e) => setMonthlyVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
              <span>$50,000/mo</span>
              <span>$1,000,000/mo</span>
              <span>$2,000,000/mo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-800">
            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                <DollarSign className="w-4 h-4" />
                <span>Estimated Annual Processing Savings</span>
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">
                ${(estimatedSavings * 12).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                From intelligent routing to lowest-fee local rails (e.g. UPI, SEPA, Adyen).
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold">
                <RotateCcw className="w-4 h-4" />
                <span>Annual Recovered Revenue</span>
              </div>
              <div className="text-3xl font-bold font-mono text-purple-400 mt-2">
                ${(recoveredRevenue * 12).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Via automated cascading to backup providers on network timeouts and soft declines.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Architecture Highlights
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineered for Modern Cross-Border FinTech
          </p>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Every layer is decoupled, fault-tolerant, and designed to maximize authorization rates while cutting processing fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Rule-Based Intelligent Routing
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Multi-factor optimization evaluates gateway health, interchange fees, real-time latency, and currency affinity. Prioritize lowest fee, fastest authorization, or enforce merchant custom corridor rules.
            </p>
            <button
              onClick={() => setActivePage('routing')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
            >
              <span>Configure Routing Rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Python AI Fraud Defense
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Real-time microservice evaluating IP geolocation mismatches, rapid transaction velocity bursts, disposable email detection, OFAC sanctions lists, and ticket size anomalies with 0-100 risk scoring.
            </p>
            <button
              onClick={() => setActivePage('fraud')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
            >
              <span>Test Fraud Scenarios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Automated Cascading Recovery
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Intelligent decline classification automatically identifies soft recoverable errors (network timeouts, temporary processor outages). Instant zero-friction failover reroutes the payment to secondary providers.
            </p>
            <button
              onClick={() => setActivePage('recovery')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
            >
              <span>Inspect Recovery Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Dynamic Currency & Compatibility Engine
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Live mid-market conversion across 20+ currencies with transparent merchant spread. Enforces EU PSD2 Strong Customer Auth, India RBI tokenization, and Brazil Pix instant rails.
            </p>
            <button
              onClick={() => setActivePage('currency')}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center space-x-1 group-hover:translate-x-1 transition-transform"
            >
              <span>Explore FX Engine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* Provider Ecosystem Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Unified Payment Rails</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Connect leading global cards and local payment methods through a single orchestration contract.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <div className="font-bold text-slate-900 dark:text-white text-base">Stripe Global</div>
              <div className="text-xs text-blue-500 font-medium mt-1">Cards, Apple Pay, GPay</div>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">2.9% + $0.30</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <div className="font-bold text-slate-900 dark:text-white text-base">Adyen Enterprise</div>
              <div className="text-xs text-emerald-500 font-medium mt-1">SEPA, iDEAL, EUR Cards</div>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">1.9% + €0.12</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <div className="font-bold text-slate-900 dark:text-white text-base">PayPal Sandbox</div>
              <div className="text-xs text-sky-500 font-medium mt-1">PayPal Wallet, Pay in 4</div>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">3.49% + $0.49</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <div className="font-bold text-slate-900 dark:text-white text-base">Razorpay UPI</div>
              <div className="text-xs text-purple-500 font-medium mt-1">UPI QR, PhonePe, Paytm</div>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">0.50% (Domestic)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <div className="font-bold text-slate-900 dark:text-white text-base">dLocal Emerging</div>
              <div className="text-xs text-amber-500 font-medium mt-1">Pix Brazil, Oxxo Mexico</div>
              <div className="text-[11px] text-slate-400 mt-2 font-mono">2.4% + $0.20</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setActivePage('providers')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Full Benchmark & Corridor Matrix →
            </button>
          </div>
        </div>
      </section>

      {/* Ready to Experience Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-12">
        <div className="p-10 rounded-3xl fintech-gradient text-white shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to test live orchestration?
          </h2>
          <p className="mt-3 text-blue-100 max-w-xl mx-auto text-sm sm:text-base">
            Run real-time checkouts across 15+ countries, trigger simulated soft declines, and watch the platform cascade and recover seamlessly.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setActivePage('checkout')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-blue-600 font-bold text-sm shadow-lg hover:bg-blue-50 transition"
            >
              Open Live Checkout Experience
            </button>
            <button
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-semibold text-sm border border-blue-400/30 transition"
            >
              View Merchant Analytics
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

