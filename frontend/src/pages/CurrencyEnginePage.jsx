import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  ShieldCheck,
  RefreshCw,
  Globe
} from 'lucide-react';

export default function CurrencyEnginePage() {
  const [ratesData, setRatesData] = useState(null);
  const [markup, setMarkup] = useState(1.25);
  const [newMarkup, setNewMarkup] = useState('1.25');
  const [updatingMarkup, setUpdatingMarkup] = useState(false);
  const [loading, setLoading] = useState(true);

  // Converter state
  const [calcAmount, setCalcAmount] = useState('100');
  const [calcFrom, setCalcFrom] = useState('USD');
  const [calcTo, setCalcTo] = useState('EUR');
  const [calcResult, setCalcResult] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [rRes, mRes] = await Promise.all([
        api.currency.getRates(),
        api.currency.getMarkup()
      ]);
      setRatesData(rRes);
      setMarkup(mRes.markup_percentage);
      setNewMarkup(String(mRes.markup_percentage));

      // Initial conversion
      const initConv = await api.currency.convert({
        amount: 100,
        from_currency: 'USD',
        to_currency: 'EUR',
        custom_markup: mRes.markup_percentage
      });
      setCalcResult(initConv);
    } catch (err) {
      console.error('[Load Currency Data Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateMarkup = async (e) => {
    e.preventDefault();
    setUpdatingMarkup(true);
    try {
      const res = await api.currency.updateMarkup(parseFloat(newMarkup));
      setMarkup(res.markup_percentage);
      alert('Merchant FX markup spread updated successfully!');
      handleConvert();
    } catch (err) {
      alert(err.message || 'Failed to update markup');
    } finally {
      setUpdatingMarkup(false);
    }
  };

  const handleConvert = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.currency.convert({
        amount: parseFloat(calcAmount) || 100,
        from_currency: calcFrom,
        to_currency: calcTo,
        custom_markup: parseFloat(newMarkup) || markup
      });
      setCalcResult(res);
    } catch (err) {
      alert(err.message || 'Conversion error');
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <ArrowRightLeft className="w-4 h-4" />
            <span>FX & Compatibility Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Multi-Currency FX & Cross-Border Spread
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time exchange rate tables, customizable merchant spread markups, and instant conversion calculators.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* FX Converter Tool (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center justify-between">
              <span>Cross-Currency Pricing Preview</span>
              <span className="text-xs text-slate-400 font-mono">Live Rates Base USD</span>
            </h3>

            <form onSubmit={handleConvert} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">From</label>
                  <select
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    {ratesData?.rates && Object.keys(ratesData.rates).map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">To</label>
                  <select
                    value={calcTo}
                    onChange={(e) => setCalcTo(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    {ratesData?.rates && Object.keys(ratesData.rates).map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg fintech-gradient text-white font-semibold text-xs shadow transition flex items-center justify-center space-x-2"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Calculate Conversion Breakdown</span>
              </button>
            </form>

            {calcResult && (
              <div className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Mid-Market Base Rate:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    1 {calcResult.from_currency} = {calcResult.mid_market_rate} {calcResult.to_currency}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500">Merchant FX Spread ({calcResult.markup_percentage}%):</span>
                  <span className="font-mono text-emerald-600 font-bold">
                    +{calcResult.symbol}{calcResult.markup_amount}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 text-sm font-bold">
                  <span className="text-slate-900 dark:text-white">Customer Payment Amount:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 text-lg">
                    {calcResult.symbol}{calcResult.converted_amount} {calcResult.to_currency}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Merchant Spread Manager (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
              <Percent className="w-4 h-4" />
              <span>Merchant Spread Controls</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Configure FX Markup
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add custom margin to mid-market rates for cross-currency settlement protection.
            </p>

            <form onSubmit={handleUpdateMarkup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Spread Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="15"
                    required
                    value={newMarkup}
                    onChange={(e) => setNewMarkup(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Recommended industry standard: 1.0% - 2.5%</p>
              </div>

              <button
                type="submit"
                disabled={updatingMarkup}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition disabled:opacity-50"
              >
                {updatingMarkup ? 'Saving Spread...' : 'Save Markup Percentage'}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Live FX Rates Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">
          Live Exchange Rate Grid (1 USD = X Currency)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {ratesData?.rates && Object.entries(ratesData.rates).map(([curr, rate]) => (
            <div key={curr} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
              <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">{curr}</div>
              <div className="text-[11px] text-slate-400">{ratesData.symbols[curr] || curr}</div>
              <div className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                {Number(rate).toFixed(curr === 'JPY' ? 2 : 4)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

