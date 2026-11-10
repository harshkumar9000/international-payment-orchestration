import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
  Globe2,
  Sparkles,
  Play,
  Pause,
  ChevronRight,
  ArrowRight,
  FileCheck,
  Server,
  Layers
} from 'lucide-react';

export default function PaymentJourneyScroller({ onTryCheckout }) {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scrubProgress, setScrubProgress] = useState(0);
  const autoPlayRef = useRef(null);

  const stages = [
    {
      id: 'domestic-intake',
      step: '01',
      title: 'Domestic Card Intake & BIN Intelligence',
      subtitle: 'Instant recognition of RuPay Global, UPI, and Indian bank cards.',
      badge: 'Step 1: Ingestion',
      icon: CreditCard,
      color: 'teal',
      accentBg: 'from-teal-500/20 to-emerald-500/5',
      accentBorder: 'border-teal-500/40',
      description:
        'When an Indian domestic card is entered, ATLAS.PAY performs millisecond BIN lookup. It detects whether the card is RuPay Global (Discover/Diners/JCB co-badged) or international-enabled, bypassing customary payment blocks.',
      metrics: [
        { label: 'BIN Detection', value: '< 24ms' },
        { label: 'Supported Rails', value: 'RuPay / UPI / Visa / MC' },
        { label: 'Decline Prevention', value: '99.4%' }
      ],
      interactiveVisual: {
        header: 'Card Intelligence Analysis',
        tag: 'NPCI & RBI Compliant',
        cardTitle: 'RuPay Platinum Global • 6521 ••••',
        items: [
          { name: 'Issuer Bank', status: 'State Bank of India', ok: true },
          { name: 'Co-Badged Network', status: 'Discover / Diners Club International', ok: true },
          { name: 'E-Commerce Cross-Border', status: 'Active (LRS Compliant)', ok: true }
        ]
      }
    },
    {
      id: 'fx-lock',
      step: '02',
      title: 'Mid-Market FX Engine & Fee Transparency',
      subtitle: 'Zero hidden foreign transaction fees. Locked mid-market rate.',
      badge: 'Step 2: Conversion',
      icon: ArrowRightLeft,
      color: 'cyan',
      accentBg: 'from-cyan-500/20 to-blue-500/5',
      accentBorder: 'border-cyan-500/40',
      description:
        'Traditional bank cards levy 3.5% hidden foreign currency markups. ATLAS.PAY locks the institutional mid-market exchange rate with an upfront, transparent 1.25% fee. Every rupee is accounted for before authorization.',
      metrics: [
        { label: 'Mid-Market USD/INR', value: '₹83.42' },
        { label: 'Markup Transparency', value: '1.25% Fixed' },
        { label: 'Avg Customer Savings', value: '₹1,850 / tx' }
      ],
      interactiveVisual: {
        header: 'Real-Time FX Lock',
        tag: 'Guaranteed 15 Min Lock',
        cardTitle: 'Mid-Market Conversion breakdown',
        items: [
          { name: 'Interbank Benchmark Rate', status: '1 USD = ₹83.42', ok: true },
          { name: 'ATLAS Fixed Margin', status: '1.25% (₹1.04/USD)', ok: true },
          { name: 'Hidden Bank Surprises', status: '₹0.00 (Zero Hidden Fees)', ok: true }
        ]
      }
    },
    {
      id: 'token-vault',
      step: '03',
      title: 'Cryptographic Tokenization & 3D Secure 2.2',
      subtitle: 'Zero raw card exposure. Hardware-backed secure tokens.',
      badge: 'Step 3: Security',
      icon: Lock,
      color: 'indigo',
      accentBg: 'from-indigo-500/20 to-teal-500/5',
      accentBorder: 'border-indigo-500/40',
      description:
        'Raw card numbers and CVVs never touch our disk or merchant servers. ATLAS.PAY generates a one-time network token cryptogram and routes the transaction through biometric 3D Secure 2.2 for maximum trust.',
      metrics: [
        { label: 'PCI-DSS Level', value: 'Level 1 Certified' },
        { label: 'Token Scheme', value: 'AES-256 GCM' },
        { label: 'Fraud Scoring', value: '0.02% (Near Zero)' }
      ],
      interactiveVisual: {
        header: 'Tokenized Cryptogram Handshake',
        tag: 'EMVCo Validated',
        cardTitle: 'Security Cryptogram Payload',
        items: [
          { name: 'Token Primary Account', status: 'tok_live_8f3a99e12c', ok: true },
          { name: 'EMV 3DS Cryptogram', status: 'AQAAAjmY959k34UFAAAA...', ok: true },
          { name: 'Biometric SCA Status', status: 'Verified via OTP / Push', ok: true }
        ]
      }
    },
    {
      id: 'settlement',
      step: '04',
      title: 'Instant Multi-Rail Bilateral Settlement',
      subtitle: 'Sub-second confirmation with merchant digital receipts.',
      badge: 'Step 4: Fulfillment',
      icon: Zap,
      color: 'emerald',
      accentBg: 'from-emerald-500/20 to-teal-500/5',
      accentBorder: 'border-emerald-500/40',
      description:
        'The settlement packet lands at the overseas merchant bank within 0.84 seconds. Both buyer and seller receive verifiable cryptographic transaction receipts, tracking numbers, and instant webhook confirmations.',
      metrics: [
        { label: 'Settlement Latency', value: '0.84 Seconds' },
        { label: 'Settlement Status', value: 'Settled & Verified' },
        { label: 'Receipt Generation', value: 'Instant Digital PDF' }
      ],
      interactiveVisual: {
        header: 'Settlement Confirmation',
        tag: 'Live On-Chain / Ledger',
        cardTitle: 'Universal Transaction Receipt',
        items: [
          { name: 'Merchant Reference', status: 'tx_atlas_9918231', ok: true },
          { name: 'Settlement Channel', status: 'Direct Bilateral Clearing', ok: true },
          { name: 'Reconciliation', status: 'Automated 100% Match', ok: true }
        ]
      }
    }
  ];

  // Auto-advance loop when isPlaying is true
  useEffect(() => {
    if (!isPlaying) return;

    autoPlayRef.current = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length);
    }, 4500);

    return () => clearInterval(autoPlayRef.current);
  }, [isPlaying, stages.length]);

  // Keep progress bar in sync
  useEffect(() => {
    setScrubProgress(((activeStage + 1) / stages.length) * 100);
  }, [activeStage, stages.length]);

  const current = stages[activeStage];
  const IconComponent = current.icon;

  return (
    <section className="py-12 px-6 sm:px-8 rounded-3xl bg-slate-900/90 dark:bg-[#0a0f1d] border border-slate-800 text-white shadow-2xl relative overflow-hidden">
      
      {/* Background Atmosphere (lets-scroll diorama aesthetic) */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header with Title and Interactive Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800/80 relative z-10">
        <div className="space-y-2 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive Payment Journey</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            How An International Payment Flies
          </h2>
          <p className="text-sm text-slate-400 max-w-xl">
            Experience the automated 4-stage pipeline that turns domestic Indian instruments into global payments in sub-second time.
          </p>
        </div>

        {/* Play / Pause & Stage Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            title={isPlaying ? 'Pause Auto-Flight' : 'Play Auto-Flight'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-teal-400" />
                <span>Pause Flight</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-teal-400" />
                <span>Auto Flight</span>
              </>
            )}
          </button>

          <button
            onClick={onTryCheckout}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition-all cursor-pointer"
          >
            <span>Live Test</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrub Navigation Bar (lets-scroll scrub-engine style) */}
      <div className="py-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stages.map((stage, idx) => {
            const isCurrent = activeStage === idx;
            const isPassed = activeStage > idx;
            return (
              <button
                key={stage.id}
                onClick={() => {
                  setActiveStage(idx);
                  setIsPlaying(false);
                }}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden ${
                  isCurrent
                    ? 'bg-slate-800/90 border-teal-500/60 shadow-lg shadow-teal-500/10'
                    : isPassed
                    ? 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Active Indicator Top Bar */}
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-400" />
                )}

                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-teal-400' : 'text-slate-500'}`}>
                    STAGE {stage.step}
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {stage.title.split('&')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Progress Track with Pulsing Beam */}
        <div className="mt-4 relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${scrubProgress}%` }}
          />
        </div>
      </div>

      {/* Main Animated Stage Content Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 relative z-10">
        
        {/* Left Column: Stage Explanation & Metric Highlights */}
        <div className="lg:col-span-6 space-y-6 text-left">
          
          <div className="space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              {current.badge}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {current.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {current.description}
            </p>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {current.metrics.map((m, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  {m.label}
                </span>
                <span className="text-base font-black text-teal-400 font-mono mt-0.5 block">
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Step Switcher */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => {
                setActiveStage((prev) => (prev > 0 ? prev - 1 : stages.length - 1));
                setIsPlaying(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 cursor-pointer"
            >
              Previous Stage
            </button>
            <button
              onClick={() => {
                setActiveStage((prev) => (prev + 1) % stages.length);
                setIsPlaying(false);
              }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white shadow-md cursor-pointer flex items-center space-x-1"
            >
              <span>Next Stage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Hardware / Cryptographic Inspector Graphic */}
        <div className="lg:col-span-6">
          <div className={`p-6 rounded-3xl bg-gradient-to-br ${current.accentBg} to-slate-900/90 border ${current.accentBorder} shadow-2xl backdrop-blur-xl space-y-4`}>
            
            {/* Visual Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <IconComponent className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">{current.interactiveVisual.header}</div>
                  <div className="text-[10px] text-teal-400 font-mono">{current.interactiveVisual.tag}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-mono bg-slate-800 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Active Rail</span>
              </span>
            </div>

            {/* Visual Item List */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
                {current.interactiveVisual.cardTitle}
              </div>

              {current.interactiveVisual.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
                  <span className="text-slate-400 text-xs">{item.name}</span>
                  <div className="flex items-center space-x-1.5 text-right">
                    <span className="text-slate-200 text-xs font-semibold">{item.status}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Status Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs">
              <div className="flex items-center space-x-2 text-teal-300">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-semibold text-[11px]">Orchestration Engine Active</span>
              </div>
              <span className="text-[11px] font-mono text-teal-400 font-bold">
                Latency: 42ms
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

