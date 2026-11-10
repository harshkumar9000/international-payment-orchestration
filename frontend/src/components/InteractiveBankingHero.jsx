import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  ArrowRightLeft,
  Zap,
  Globe2,
  Lock,
  ChevronRight,
  Send,
  Eye,
  RefreshCw,
  Wallet
} from 'lucide-react';

export default function InteractiveBankingHero({ onGetStarted, onTryCheckout }) {
  // Active digital card selection
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [transferAmount, setTransferAmount] = useState('1250');
  const [targetCurrency, setTargetCurrency] = useState('USD');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Digital banking cards inspired by Roohi Koohi's digital banking & payment shot
  const cards = [
    {
      id: 'atlas-usd',
      name: 'ATLAS Global Platinum',
      tier: 'Multi-Currency Platinum',
      number: '•••• •••• •••• 8421',
      holder: 'ALEXANDER CHEN',
      expiry: '09/29',
      balance: '$48,250.80',
      currency: 'USD',
      accent: 'from-emerald-600 via-teal-700 to-slate-900',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      type: 'VISA Infinite',
      rail: 'Global USD Rails'
    },
    {
      id: 'rupay-global',
      name: 'RuPay International',
      tier: 'Domestic Bridge Card',
      number: '•••• •••• •••• 6128',
      holder: 'PRIYA SHARMA',
      expiry: '11/28',
      balance: '₹36,40,200.00',
      currency: 'INR',
      accent: 'from-cyan-700 via-teal-800 to-slate-950',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      type: 'RuPay Global',
      rail: 'NPCI Bilateral Bridge'
    },
    {
      id: 'atlas-eur',
      name: 'Euro Corporate Vault',
      tier: 'SEPA Instant Reserve',
      number: '•••• •••• •••• 3390',
      holder: 'ATLAS TECHNOLOGIES',
      expiry: '04/30',
      balance: '€41,120.50',
      currency: 'EUR',
      accent: 'from-indigo-800 via-slate-800 to-slate-950',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      type: 'Mastercard World',
      rail: 'SEPA Instant Rail'
    }
  ];

  const currentCard = cards[activeCardIndex];

  // FX Calculation
  const rates = { USD: 83.42, EUR: 90.15, GBP: 105.80, SGD: 62.40 };
  const rate = rates[targetCurrency] || 83.42;
  const inrEquivalent = (parseFloat(transferAmount || 0) * rate).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });
  const transparentFee = (parseFloat(transferAmount || 0) * 0.0125 * rate).toLocaleString('en-IN', {
    maximumFractionDigits: 2
  });

  // Handle card tilt perspective
  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 14, y: -y * 14 });
  }

  function handleMouseLeave() {
    setMousePos({ x: 0, y: 0 });
  }

  // Handle interactive transfer simulation
  function handleSimulateTransfer() {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationComplete(false);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationComplete(true);
      setTimeout(() => setSimulationComplete(false), 4500);
    }, 1800);
  }

  return (
    <section className="relative pt-6 pb-16 overflow-hidden">
      {/* Background Luminous Gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-teal-500/10 dark:bg-teal-500/15 blur-[130px] rounded-full pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[350px] bg-cyan-500/10 dark:bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none animate-ambient-float" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Core Value Proposition & Digital Banking Actions */}
        <div className="lg:col-span-6 space-y-7 text-left">
          
          {/* Pill Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
            <span>Digital Banking & Global Rails</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
            Your Payments.{' '}
            <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Without Borders.
            </span>
          </h1>

          {/* Supporting Pitch */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            Unify domestic payment instruments with intelligent global orchestration. 
            Spend freely with RuPay Global, bilateral UPI, and transparent currency exchange at institutional rates.
          </p>

          {/* Two Prominent Action CTAs */}
          <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold text-sm shadow-xl shadow-teal-600/25 hover:shadow-teal-500/40 transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTryCheckout}
              className="px-8 py-4 rounded-xl bg-slate-900/90 dark:bg-slate-800/90 text-white hover:bg-slate-800 font-semibold text-sm border border-slate-300 dark:border-slate-700/80 shadow-md transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95 hover:border-teal-500/50"
            >
              <CreditCard className="w-4 h-4 text-teal-400" />
              <span>Try Payment Checkout</span>
            </button>
          </div>

          {/* Real-Time Live Status Strip */}
          <div className="pt-2 grid grid-cols-3 gap-3 border-t border-slate-200 dark:border-slate-800/80">
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Settlement</span>
              <span className="text-base font-black text-slate-900 dark:text-teal-400 font-mono">0.84s</span>
              <span className="text-[10px] text-emerald-500 block">Instant Bilateral</span>
            </div>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">FX Spread</span>
              <span className="text-base font-black text-slate-900 dark:text-teal-400 font-mono">1.25%</span>
              <span className="text-[10px] text-slate-400 block">No Hidden Surcharge</span>
            </div>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Success Rate</span>
              <span className="text-base font-black text-slate-900 dark:text-teal-400 font-mono">99.4%</span>
              <span className="text-[10px] text-emerald-500 block">Smart Multi-Rail</span>
            </div>
          </div>
        </div>

        {/* Right Column: Roohi Koohi Inspired Digital Banking Card & Flow Showcase */}
        <div className="lg:col-span-6 relative">
          
          {/* Card Selection Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs">
              {cards.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCardIndex(i)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    activeCardIndex === i
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {c.currency}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>EMV 3DS Tokenized</span>
            </div>
          </div>

          {/* 3D Interactive Banking Card */}
          <div
            className="perspective-1000 cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={`relative rounded-3xl p-7 text-white shadow-2xl transition-transform duration-200 ease-out preserve-3d overflow-hidden border border-white/10 bg-gradient-to-br ${currentCard.accent}`}
              style={{
                transform: `rotateY(${mousePos.x}deg) rotateX(${mousePos.y}deg)`,
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.7), 0 0 30px -5px rgba(20, 184, 166, 0.25)'
              }}
            >
              {/* Glass Sheen Overlay */}
              <div className="absolute inset-0 banking-card-sheen pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-white text-base border border-white/20">
                    A
                  </div>
                  <div>
                    <span className="font-extrabold text-sm tracking-tight block">
                      ATLAS<span className="text-teal-300">.PAY</span>
                    </span>
                    <span className="text-[10px] text-slate-300 block font-mono">
                      {currentCard.tier}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${currentCard.badgeBg}`}>
                  {currentCard.rail}
                </span>
              </div>

              {/* EMV Chip & Contactless Wave */}
              <div className="my-6 flex items-center justify-between relative z-10">
                {/* Metallic EMV Chip */}
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 border border-amber-300/60 shadow-inner flex flex-col justify-between p-1">
                  <div className="w-full h-[1px] bg-amber-700/40" />
                  <div className="flex justify-between">
                    <div className="w-2.5 h-2.5 rounded-sm border border-amber-800/40" />
                    <div className="w-2.5 h-2.5 rounded-sm border border-amber-800/40" />
                  </div>
                  <div className="w-full h-[1px] bg-amber-700/40" />
                </div>

                {/* Contactless Icon */}
                <div className="flex items-center space-x-1 opacity-70">
                  <svg className="w-5 h-5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2a10 10 0 0 1 10 10M12 6a6 6 0 0 1 6 6M12 10a2 2 0 0 1 2 2" />
                  </svg>
                </div>
              </div>

              {/* Card Number & Balance */}
              <div className="space-y-4 relative z-10">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                      Available Balance
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                      {currentCard.balance}
                    </span>
                  </div>
                  <span className="font-mono text-sm tracking-widest text-slate-200/90 font-semibold">
                    {currentCard.number}
                  </span>
                </div>

                {/* Card Footer: Holder & Expiry */}
                <div className="flex items-end justify-between pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-semibold">
                      Cardholder
                    </span>
                    <span className="font-bold tracking-wider text-white font-mono">
                      {currentCard.holder}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-semibold">
                      Expires
                    </span>
                    <span className="font-mono text-white font-bold">
                      {currentCard.expiry}
                    </span>
                  </div>

                  <div className="font-black text-sm tracking-tight text-teal-200">
                    {currentCard.type}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Quick-Transfer Mini Module (Roohi Koohi Style) */}
          <div className="mt-5 p-5 rounded-2xl bg-white/90 dark:bg-[#0c1322]/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Instant Cross-Border Simulation
                </span>
              </div>
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Live Mid-Market Rate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Amount Input */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Send Amount ({targetCurrency})
                </span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-24 bg-transparent font-mono font-bold text-slate-900 dark:text-white text-base focus:outline-none"
                    />
                  </div>
                  <select
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="SGD">SGD (S$)</option>
                  </select>
                </div>
              </div>

              {/* INR Equivalent */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                  Payable in INR (Domestic)
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono font-black text-slate-900 dark:text-teal-400 text-base">
                    ₹{inrEquivalent}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Fee: ₹{transparentFee}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulation Action Button */}
            <div className="pt-1">
              <button
                onClick={handleSimulateTransfer}
                disabled={isSimulating}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  simulationComplete
                    ? 'bg-emerald-600 text-white'
                    : isSimulating
                    ? 'bg-teal-700 text-white cursor-wait'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 active:scale-98'
                }`}
              >
                {simulationComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Payment Settled Instantly! Digital Receipt Generated</span>
                  </>
                ) : isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>Routing RuPay Domestic → Token Vault → SWIFT/Bilateral...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-white" />
                    <span>Simulate Instant Transfer via RuPay/UPI Rails</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

