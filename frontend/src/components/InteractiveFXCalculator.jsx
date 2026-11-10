import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Sparkles,
  TrendingDown,
  ShieldCheck,
  Check,
  CreditCard,
  ChevronRight,
  Zap
} from 'lucide-react';

export default function InteractiveFXCalculator({ onTryCheckout }) {
  const [amount, setAmount] = useState(1500);
  const [currency, setCurrency] = useState('USD');

  const currencies = {
    USD: { symbol: '$', rate: 83.42, bankMarkup: 0.0385, atlasMarkup: 0.0125, name: 'US Dollar' },
    EUR: { symbol: '€', rate: 90.15, bankMarkup: 0.0410, atlasMarkup: 0.0125, name: 'Euro' },
    GBP: { symbol: '£', rate: 105.80, bankMarkup: 0.0390, atlasMarkup: 0.0125, name: 'British Pound' },
    SGD: { symbol: 'S$', rate: 62.40, bankMarkup: 0.0375, atlasMarkup: 0.0125, name: 'Singapore Dollar' }
  };

  const curr = currencies[currency];
  const midMarketInr = amount * curr.rate;
  const atlasTotalInr = midMarketInr * (1 + curr.atlasMarkup);
  const bankTotalInr = midMarketInr * (1 + curr.bankMarkup);
  const totalSavingsInr = bankTotalInr - atlasTotalInr;

  return (
    <section className="p-8 sm:p-10 rounded-3xl bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Fee Calculator</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Transparent Pricing vs Traditional Banks
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            See exactly how much you save on tuition, international software subscriptions, and e-commerce checkouts.
          </p>
        </div>

        {/* Currency Switcher Tabs */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold self-start md:self-auto">
          {Object.keys(currencies).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currency === c
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Controls & Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Interactive Sliders & Inputs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Payment Amount ({curr.name})
              </label>
              <div className="flex items-center space-x-1 font-mono text-xl font-black text-slate-900 dark:text-white">
                <span>{curr.symbol}</span>
                <span>{amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="100"
              max="10000"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />

            {/* Quick Presets */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Presets:</span>
              {[250, 750, 1500, 3500, 5000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    amount === preset
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {curr.symbol}{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Institutional Mid-Market Benchmark Pill */}
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span>Real-Time Interbank Benchmark: <strong>1 {currency} = ₹{curr.rate.toFixed(2)}</strong></span>
            </div>
            <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 bg-teal-500/20 px-2 py-0.5 rounded font-bold">
              Institutional Live
            </span>
          </div>
        </div>

        {/* Right: Side-by-Side Savings Visual (6 cols) */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* ATLAS.PAY Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-900/40 via-slate-900 to-slate-950 border-2 border-teal-500/60 text-white space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500 text-slate-950 font-mono">
                ATLAS.PAY
              </span>
              <span className="text-xs font-mono text-teal-400 font-bold">1.25% Fixed Fee</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Payable (INR)
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                ₹{atlasTotalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
              <div className="flex items-center justify-between">
                <span>Mid-Market Cost:</span>
                <span className="font-mono">₹{midMarketInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between text-teal-300">
                <span>Orchestration Fee:</span>
                <span className="font-mono">+₹{(midMarketInr * curr.atlasMarkup).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span>Hidden Surcharges:</span>
                <span className="font-mono">₹0.00</span>
              </div>
            </div>

            <button
              onClick={onTryCheckout}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Test This Amount</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Traditional Bank Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                Typical Bank
              </span>
              <span className="text-xs font-mono text-rose-500 font-bold">~3.85% Markup</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Total Charged (INR)
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-0.5">
                ₹{bankTotalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Mid-Market Cost:</span>
                <span className="font-mono">₹{midMarketInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between text-rose-500">
                <span>Forex Markup:</span>
                <span className="font-mono">+₹{(midMarketInr * curr.bankMarkup).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between text-rose-500 font-semibold">
                <span>Cross-Border Fee:</span>
                <span className="font-mono">Hidden in billing</span>
              </div>
            </div>

            {/* Savings Pill */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                You Save With ATLAS
              </span>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                ₹{totalSavingsInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

