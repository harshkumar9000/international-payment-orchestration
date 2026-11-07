import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Globe2,
  CreditCard,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Building,
  Info,
  Check,
  Layers,
  Sparkles
} from 'lucide-react';

export default function PaymentCompatibilityPage({ setActivePage }) {
  const [method, setMethod] = useState('card'); // 'card' | 'upi'
  const [cardBin, setCardBin] = useState('652150');
  const [upiVpa, setUpiVpa] = useState('alex@upi');
  const [destCountry, setDestCountry] = useState('US');
  const [destCurrency, setDestCurrency] = useState('USD');
  const [amountInr, setAmountInr] = useState('25000');
  const [purpose, setPurpose] = useState('educational_tuition');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [corridors, setCorridors] = useState([]);
  const [corridorLoading, setCorridorLoading] = useState(false);

  // Load corridor metadata on mount
  useEffect(() => {
    async function fetchCorridors() {
      setCorridorLoading(true);
      try {
        const res = await api.domesticCard.getCorridors();
        setCorridors(res.upi_international_corridors || []);
      } catch (e) {
        console.error('Error fetching corridors:', e);
      } finally {
        setCorridorLoading(false);
      }
    }
    fetchCorridors();
    // Run initial evaluation
    handleEvaluate();
  }, []);

  async function handleEvaluate(overrideData = {}) {
    setLoading(true);
    const payload = {
      card_bin: overrideData.cardBin !== undefined ? overrideData.cardBin : cardBin,
      payment_method: overrideData.method !== undefined ? overrideData.method : method,
      upi_vpa: overrideData.upiVpa !== undefined ? overrideData.upiVpa : upiVpa,
      destination_country: overrideData.destCountry !== undefined ? overrideData.destCountry : destCountry,
      destination_currency: overrideData.destCurrency !== undefined ? overrideData.destCurrency : destCurrency,
      amount_inr: parseFloat(overrideData.amountInr !== undefined ? overrideData.amountInr : amountInr) || 25000,
      purpose_of_remittance: overrideData.purpose !== undefined ? overrideData.purpose : purpose
    };

    try {
      const res = await api.domesticCard.checkEligibility(payload);
      setResult(res);
    } catch (err) {
      console.error('Compatibility check error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handlePreset(type) {
    if (type === 'rupay_global') {
      setMethod('card');
      setCardBin('652150');
      setDestCountry('US');
      setDestCurrency('USD');
      setAmountInr('15000');
      handleEvaluate({ method: 'card', cardBin: '652150', destCountry: 'US', destCurrency: 'USD', amountInr: '15000' });
    } else if (type === 'rupay_domestic') {
      setMethod('card');
      setCardBin('607012');
      setDestCountry('US');
      setDestCurrency('USD');
      setAmountInr('12000');
      handleEvaluate({ method: 'card', cardBin: '607012', destCountry: 'US', destCurrency: 'USD', amountInr: '12000' });
    } else if (type === 'upi_singapore') {
      setMethod('upi');
      setUpiVpa('tourist@okaxis');
      setDestCountry('SG');
      setDestCurrency('SGD');
      setAmountInr('8500');
      handleEvaluate({ method: 'upi', upiVpa: 'tourist@okaxis', destCountry: 'SG', destCurrency: 'SGD', amountInr: '8500' });
    } else if (type === 'upi_uae') {
      setMethod('upi');
      setUpiVpa('merchant@icici');
      setDestCountry('AE');
      setDestCurrency('AED');
      setAmountInr('18000');
      handleEvaluate({ method: 'upi', upiVpa: 'merchant@icici', destCountry: 'AE', destCurrency: 'AED', amountInr: '18000' });
    } else if (type === 'upi_france') {
      setMethod('upi');
      setUpiVpa('student@sbi');
      setDestCountry('FR');
      setDestCurrency('EUR');
      setAmountInr('22000');
      handleEvaluate({ method: 'upi', upiVpa: 'student@sbi', destCountry: 'FR', destCurrency: 'EUR', amountInr: '22000' });
    } else if (type === 'upi_usa_unsupported') {
      setMethod('upi');
      setUpiVpa('alex@okaxis');
      setDestCountry('US');
      setDestCurrency('USD');
      setAmountInr('35000');
      handleEvaluate({ method: 'upi', upiVpa: 'alex@okaxis', destCountry: 'US', destCurrency: 'USD', amountInr: '35000' });
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Feature 1 Active
            </span>
            <span className="text-xs text-slate-400">NPCI / NIPL & RBI LRS Framework</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Domestic Card & UPI Cross-Border Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time validation for RuPay Global vs PMJDY domestic cards, NIPL bilateral UPI corridors, and RBI LRS TCS calculations.
          </p>
        </div>

        <button
          onClick={() => setActivePage('checkout')}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          Test in Live Checkout
        </button>
      </div>

      {/* Preset Quick Selectors */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-2.5">
          Select Benchmark Scenarios to Test Compatibility:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePreset('rupay_global')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-all cursor-pointer"
          >
            ✓ RuPay Global (BIN 6521)
          </button>
          <button
            onClick={() => handlePreset('rupay_domestic')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-all cursor-pointer"
          >
            ✕ RuPay Domestic PMJDY (BIN 6070)
          </button>
          <button
            onClick={() => handlePreset('upi_singapore')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/80 transition-all cursor-pointer"
          >
            ✓ UPI → Singapore (PayNow)
          </button>
          <button
            onClick={() => handlePreset('upi_uae')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/80 transition-all cursor-pointer"
          >
            ✓ UPI → UAE (NeoPay)
          </button>
          <button
            onClick={() => handlePreset('upi_france')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/80 transition-all cursor-pointer"
          >
            ✓ UPI → France (Lyra Network)
          </button>
          <button
            onClick={() => handlePreset('upi_usa_unsupported')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-all cursor-pointer"
          >
            ⚠ UPI → USA (Unsupported Corridor)
          </button>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Parameter Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-teal-500" />
            Corridor & Instrument Parameters
          </h2>

          {/* Payment Method Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Payment Instrument
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  method === 'card'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                RuPay / Domestic Card
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  method === 'upi'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                UPI International
              </button>
            </div>
          </div>

          {/* Dynamic input depending on method */}
          {method === 'card' ? (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Card BIN (First 6 Digits)
              </label>
              <input
                type="text"
                value={cardBin}
                maxLength={6}
                onChange={(e) => setCardBin(e.target.value)}
                placeholder="e.g. 652150"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                6521/6522 = RuPay Global (Discover/JCB); 6070/6071 = PMJDY Domestic only.
              </span>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                UPI Virtual Payment Address (VPA)
              </label>
              <input
                type="text"
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="username@okhdfcbank"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                NPCI International Payments Ltd (NIPL) corridor routing verification.
              </span>
            </div>
          )}

          {/* Destination Country & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Destination Country
              </label>
              <select
                value={destCountry}
                onChange={(e) => {
                  setDestCountry(e.target.value);
                  if (e.target.value === 'SG') setDestCurrency('SGD');
                  else if (e.target.value === 'AE') setDestCurrency('AED');
                  else if (e.target.value === 'FR' || e.target.value === 'DE') setDestCurrency('EUR');
                  else if (e.target.value === 'GB') setDestCurrency('GBP');
                  else if (e.target.value === 'US') setDestCurrency('USD');
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="US">🇺🇸 United States (US)</option>
                <option value="SG">🇸🇬 Singapore (SG - PayNow)</option>
                <option value="AE">🇦🇪 United Arab Emirates (AE - NeoPay)</option>
                <option value="FR">🇫🇷 France (FR - Lyra)</option>
                <option value="GB">🇬🇧 United Kingdom (GB)</option>
                <option value="DE">🇩🇪 Germany (DE)</option>
                <option value="MU">🇲🇺 Mauritius (MU)</option>
                <option value="NP">🇳🇵 Nepal (NP)</option>
                <option value="BT">🇧🇹 Bhutan (BT)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Destination Currency
              </label>
              <input
                type="text"
                value={destCurrency}
                onChange={(e) => setDestCurrency(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Amount INR */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Transaction Amount (INR ₹)
            </label>
            <input
              type="number"
              value={amountInr}
              onChange={(e) => setAmountInr(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Annual RBI LRS Limit: \$250,000 USD (approx ₹2.08 Crore).
            </span>
          </div>

          {/* Purpose of Remittance for TCS */}
          <div>
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
              Purpose of Remittance (RBI LRS TCS Rate)
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="educational_tuition">Education: Tuition & Courses (0.5% or 5% TCS &gt; 7L)</option>
              <option value="medical_treatment">Medical Treatment Overseas (5% TCS &gt; 7L)</option>
              <option value="tourist_package">Overseas Tour Package (5% up to 7L, 20% &gt; 7L)</option>
              <option value="general_foreign_ecom">General Foreign Ecommerce (20% TCS on full remittance)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleEvaluate()}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Evaluate Compatibility & Tax
          </button>
        </div>

        {/* Right Output: Decision & Fee Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              
              {/* Decision Header Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  result.eligible
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                {result.eligible ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm uppercase tracking-wide">
                      {result.eligible ? 'Compatible & Eligible' : 'Ineligible Payment Method'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-full bg-white/60 dark:bg-black/30">
                      Rail: {result.recommended_rail || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{result.reason}</p>
                </div>
              </div>

              {/* Instrument Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Scheme / Network</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block capitalize">
                    {result.scheme || (method === 'upi' ? 'UPI / NPCI' : 'RuPay')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Global Enabled</span>
                  <span className={`font-bold mt-0.5 block ${result.eligible ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {result.is_global_enabled ? 'Yes (International)' : 'No (Domestic Only)'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Target Corridor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {destCountry} ({destCurrency})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold block">Selected Gateway</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 mt-0.5 block capitalize">
                    {result.suggested_provider || 'PayPal / Adyen'}
                  </span>
                </div>
              </div>

              {/* Ineligible: Recommended Alternatives */}
              {!result.eligible && result.alternatives && result.alternatives.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Recommended Alternative Payment Methods
                  </span>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    To prevent transaction drop-off, ATLAS.PAY dynamically falls back to these verified rails:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.alternatives.map((alt, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparent Fee & TCS Breakdown */}
              {result.fee_breakdown && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Transparent Currency Conversion & Regulatory Tax (TCS)
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Base Remittance:</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        ₹{parseFloat(result.fee_breakdown.amount_inr || amountInr).toLocaleString()} (~{result.fee_breakdown.amount_foreign_display})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Gateway Processing Fee (1.5%):</span>
                      <span className="font-mono text-slate-900 dark:text-white">₹{result.fee_breakdown.gateway_fee_inr}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>GST (18% on service fee):</span>
                      <span className="font-mono text-slate-900 dark:text-white">₹{result.fee_breakdown.gst_inr}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>RBI LRS Tax Collected at Source (TCS {result.fee_breakdown.tcs_percent}%):</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        ₹{result.fee_breakdown.tcs_inr}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                      <span>Total Debit Amount (INR):</span>
                      <span className="font-mono text-teal-600 dark:text-teal-400">
                        ₹{result.fee_breakdown.total_debit_inr}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 pt-1">
                      *TCS is fully adjustable against the taxpayer's annual income tax return (Form 26AS / AIS).
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111827] rounded-xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-teal-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Evaluating corridor parameters...</p>
            </div>
          )}

          {/* Active Bilateral UPI Corridors List */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-teal-500" />
              NPCI / NIPL Bilateral UPI International Corridors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">🇸🇬 Singapore (PayNow)</span>
                  <span className="text-[10px] text-slate-400">MAS-RBI Bilateral Fast Link</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">🇦🇪 UAE (NeoPay / Mashreq)</span>
                  <span className="text-[10px] text-slate-400">Merchant QR & Terminal</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">🇫🇷 France (Lyra Network)</span>
                  <span className="text-[10px] text-slate-400">Eiffel Tower & Department Stores</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">🇲🇺 Mauritius (Bank of Mauritius)</span>
                  <span className="text-[10px] text-slate-400">MauCAS Instant Interoperability</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

