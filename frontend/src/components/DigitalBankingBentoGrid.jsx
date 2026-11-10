import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRightLeft,
  Globe2,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Building2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function DigitalBankingBentoGrid({ onNavigate }) {
  const [activeCurrency, setActiveCurrency] = useState('USD');

  const balances = {
    USD: { symbol: '$', amount: '148,920.50', change: '+24.6%', inr: '₹1,24,22,948.00' },
    EUR: { symbol: '€', amount: '136,410.20', change: '+18.2%', inr: '₹1,22,97,379.00' },
    INR: { symbol: '₹', amount: '1,24,22,948.00', change: '+22.4%', inr: '$148,920.50 eq.' },
    GBP: { symbol: '£', amount: '117,350.00', change: '+15.9%', inr: '₹1,24,15,630.00' }
  };

  const curr = balances[activeCurrency];

  const recentTransactions = [
    {
      id: 'tx_1',
      merchant: 'Stanford Univ Tuition',
      location: 'California, US',
      amount: '$1,250.00',
      inr: '₹1,04,275.00',
      rail: 'RuPay Global LRS',
      time: '2m ago',
      status: 'Settled',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'tx_2',
      merchant: 'Apple Services Ireland',
      location: 'Cork, Ireland',
      amount: '€49.00',
      inr: '₹4,417.35',
      rail: 'Tokenized EMV 3DS',
      time: '14m ago',
      status: 'Settled',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'tx_3',
      merchant: 'Figma Enterprise',
      location: 'San Francisco, US',
      amount: '$150.00',
      inr: '₹12,513.00',
      rail: 'Visa Domestic Ingestion',
      time: '1h ago',
      status: 'Settled',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'tx_4',
      merchant: 'Singapore Cloud Mesh',
      location: 'Singapore SG',
      amount: 'S$320.00',
      inr: '₹19,968.00',
      rail: 'UPI Bilateral Rail',
      time: '3h ago',
      status: 'Settled',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  ];

  const fxCorridors = [
    { pair: 'USD / INR', rate: '₹83.42', atlas: '1.25%', bank: '3.85%', saving: '₹2.17/USD' },
    { pair: 'EUR / INR', rate: '₹90.15', atlas: '1.25%', bank: '4.10%', saving: '₹2.57/EUR' },
    { pair: 'GBP / INR', rate: '₹105.80', atlas: '1.25%', bank: '3.90%', saving: '₹2.80/GBP' },
    { pair: 'SGD / INR', rate: '₹62.40', atlas: '1.25%', bank: '3.75%', saving: '₹1.56/SGD' }
  ];

  return (
    <section className="space-y-6 text-left">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Banking Intelligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Cross-Border Capabilities
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            A cohesive bento dashboard delivering multi-currency liquidity, transparent corridor rates, and automated compliance.
          </p>
        </div>

        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          <span>Open Full Dashboard</span>
          <ArrowRightLeft className="w-3.5 h-3.5 text-teal-500" />
        </button>
      </div>

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bento 1: Multi-Currency Liquidity & Volume (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 hover:border-teal-500/40 transition-all">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Multi-Currency Global Vault
                </h3>
                <span className="text-xs text-slate-400">Total cross-border processed volume</span>
              </div>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              {['USD', 'EUR', 'INR', 'GBP'].map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCurrency(c)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    activeCurrency === c
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Balance Display */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Balance ({activeCurrency})</span>
              <span className="flex items-center text-emerald-400 font-bold space-x-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{curr.change} growth</span>
              </span>
            </div>

            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
              {curr.symbol}{curr.amount}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span>Domestic INR Valuation: <strong className="text-teal-400 font-mono">{curr.inr}</strong></span>
              <span className="text-[10px] text-slate-500 font-mono">100% Reserve Backed</span>
            </div>
          </div>

          {/* Quick Action Pills */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('checkout')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-500/10 hover:border-teal-500/30 border border-slate-200 dark:border-slate-800 transition-all text-center cursor-pointer group"
            >
              <ArrowUpRight className="w-4 h-4 text-teal-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Send Payment</span>
              <span className="text-[10px] text-slate-400">Zero margin FX</span>
            </button>

            <button
              onClick={() => onNavigate('cards')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-500/10 hover:border-teal-500/30 border border-slate-200 dark:border-slate-800 transition-all text-center cursor-pointer group"
            >
              <CreditCard className="w-4 h-4 text-teal-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Link Domestic</span>
              <span className="text-[10px] text-slate-400">RuPay & UPI</span>
            </button>

            <button
              onClick={() => onNavigate('rupay-upi')}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-500/10 hover:border-teal-500/30 border border-slate-200 dark:border-slate-800 transition-all text-center cursor-pointer group"
            >
              <ShieldCheck className="w-4 h-4 text-teal-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Corridor Check</span>
              <span className="text-[10px] text-slate-400">Bilateral Status</span>
            </button>
          </div>
        </div>

        {/* Bento 2: Live Real-Time Transactions Feed (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Global Activity
                </h3>
              </div>
              <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Real-Time Stream
              </span>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 pt-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {tx.merchant}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1.5">
                      <span>{tx.location}</span>
                      <span>•</span>
                      <span className="text-teal-500">{tx.rail}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {tx.amount}
                    </div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold border ${tx.statusColor}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Average settlement: <strong className="text-teal-500">0.84 seconds</strong></span>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-teal-500 hover:underline font-semibold cursor-pointer"
            >
              View All Txs →
            </button>
          </div>
        </div>

        {/* Bento 3: Live FX Corridors & Bank Fee Comparison (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live FX Corridors vs Traditional Banks
              </h3>
            </div>
            <span className="text-[10px] text-emerald-500 font-bold">1.25% Transparent Spread</span>
          </div>

          <div className="space-y-2.5">
            {fxCorridors.map((c) => (
              <div key={c.pair} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">{c.pair}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Mid-Market: {c.rate}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-500 block font-mono">Save {c.saving}</span>
                  <span className="text-[10px] text-slate-400">ATLAS {c.atlas} vs Bank {c.bank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 4: Compliance & RBI LRS Shield (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Regulatory Compliance & Token Shield
                </h3>
                <span className="text-xs text-slate-400">Full RBI LRS, NPCI & PCI-DSS Level 1 compliance</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ATLAS.PAY natively handles Liberalised Remittance Scheme (LRS) reporting and Tax Collected at Source (TCS) threshold calculations. Card credentials are cryptographically tokenized at the hardware level.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">LRS Annual Cap</span>
                <span className="font-bold text-slate-900 dark:text-white">$250,000 USD/yr</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] block">Token Security</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">EMVCo Certified</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center space-x-1 text-emerald-500 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automated LRS Form A2 Declaration</span>
            </span>
            <button
              onClick={() => onNavigate('student-payments')}
              className="text-teal-500 hover:underline font-semibold cursor-pointer"
            >
              Student Portal →
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}

