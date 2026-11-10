import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Globe2,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Info,
  Check,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const DESTINATIONS = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬', upiSupported: true, upiNetwork: 'PayNow' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪', upiSupported: true, upiNetwork: 'NeoPay / Mashreq' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', upiSupported: true, upiNetwork: 'Lyra Network' },
  { code: 'MU', name: 'Mauritius', currency: 'MUR', flag: '🇲🇺', upiSupported: true, upiNetwork: 'MauCAS' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', flag: '🇳🇵', upiSupported: true, upiNetwork: 'NIPL Nepal' },
  { code: 'BT', name: 'Bhutan', currency: 'BTN', flag: '🇧🇹', upiSupported: true, upiNetwork: 'Royal Monetary Authority' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', upiSupported: false },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', upiSupported: false },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵', upiSupported: false }
];

export default function PaymentCompatibilityPage({ setActivePage }) {
  const [method, setMethod] = useState('card'); // 'card' | 'upi'
  const [cardBin, setCardBin] = useState('652150');
  const [network, setNetwork] = useState('RuPay');
  const [destCountry, setDestCountry] = useState('US');
  const [destCurrency, setDestCurrency] = useState('USD');
  const [amountInr, setAmountInr] = useState('25000');
  
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  // Sync destination currency when country changes
  function handleCountryChange(code) {
    setDestCountry(code);
    const dest = DESTINATIONS.find(d => d.code === code);
    if (dest) {
      setDestCurrency(dest.currency);
    }
  }

  // Reactive automatic evaluation whenever inputs change (NO BUTTON REQUIRED)
  useEffect(() => {
    let isCancelled = false;

    async function evaluateLive() {
      setEvaluating(true);
      try {
        const payload = {
          card_bin: cardBin.trim(),
          payment_method: method === 'upi' ? 'upi' : 'card',
          destination_country: destCountry,
          destination_currency: destCurrency,
          amount_inr: parseFloat(amountInr) || 25000,
          purpose_of_remittance: 'general_e_commerce'
        };

        const res = await api.domesticCard.checkEligibility(payload);
        if (!isCancelled) {
          setResult(res);
        }
      } catch (err) {
        console.error('[Instant Check Error]:', err);
      } finally {
        if (!isCancelled) setEvaluating(false);
      }
    }

    const timer = setTimeout(evaluateLive, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [method, cardBin, network, destCountry, destCurrency, amountInr]);

  // Quick Preset Handlers
  function applyPreset(presetType) {
    if (presetType === 'rupay_global') {
      setMethod('card');
      setNetwork('RuPay');
      setCardBin('652150');
      handleCountryChange('US');
    } else if (presetType === 'rupay_domestic') {
      setMethod('card');
      setNetwork('RuPay');
      setCardBin('607012');
      handleCountryChange('US');
    } else if (presetType === 'upi_singapore') {
      setMethod('upi');
      handleCountryChange('SG');
    } else if (presetType === 'upi_usa') {
      setMethod('upi');
      handleCountryChange('US');
    } else if (presetType === 'visa_intl') {
      setMethod('card');
      setNetwork('Visa');
      setCardBin('453201');
      handleCountryChange('DE');
    }
  }

  const selectedDest = DESTINATIONS.find(d => d.code === destCountry) || DESTINATIONS[0];

  // Derive dynamic client-side classification if API is loading or fallback
  const isUpi = method === 'upi';
  const isRuPay = method === 'card' && (network === 'RuPay' || cardBin.startsWith('60') || cardBin.startsWith('65'));
  const isRuPayGlobal = isRuPay && (cardBin.startsWith('6521') || cardBin.startsWith('6522') || cardBin.startsWith('6080') || cardBin.startsWith('6528'));
  const isRuPayDomestic = isRuPay && (cardBin.startsWith('6070') || cardBin.startsWith('6071') || cardBin.startsWith('6072'));

  let statusKey = 'SUPPORTED';
  let statusText = 'Supported';
  let shortReason = 'Payment instrument is eligible for international e-commerce processing.';
  let suggestedAlternative = null;

  if (isUpi) {
    if (selectedDest.upiSupported) {
      statusKey = 'SUPPORTED';
      statusText = 'Supported';
      shortReason = `UPI bilateral cross-border corridor is active via NIPL and ${selectedDest.upiNetwork}.`;
    } else {
      statusKey = 'NOT_SUPPORTED';
      statusText = 'Not Supported';
      shortReason = `UPI International is currently not supported for payments to ${selectedDest.name}.`;
      suggestedAlternative = 'Pay using an International RuPay, Visa, Mastercard, or PayPal.';
    }
  } else if (isRuPay) {
    if (isRuPayGlobal) {
      statusKey = 'SUPPORTED';
      statusText = 'Supported';
      shortReason = 'RuPay Global co-badged with Discover/Diners Club is accepted by international merchants.';
    } else if (isRuPayDomestic) {
      statusKey = 'NOT_SUPPORTED';
      statusText = 'Not Supported';
      shortReason = 'Domestic-only RuPay cards cannot be processed by foreign merchant gateways.';
      suggestedAlternative = 'Use a RuPay Global card, an international Visa/Mastercard, or PayPal.';
    } else {
      statusKey = 'VERIFICATION_REQUIRED';
      statusText = 'Verification Required';
      shortReason = 'International eligibility depends on your issuing bank netbanking transaction limits.';
      suggestedAlternative = 'Check your bank mobile app to enable international online payments.';
    }
  } else {
    statusKey = 'SUPPORTED';
    statusText = 'Supported';
    shortReason = `${network} international cards are accepted worldwide with 3D Secure verification.`;
  }

  // Override with backend engine details if present
  if (result) {
    if (result.eligible === true || result.status === 'SUPPORTED' || result.status === 'APPROVED') {
      statusKey = 'SUPPORTED';
      statusText = 'Supported';
      if (isRuPay) {
        shortReason = 'RuPay Global co-badged with Discover/Diners Club is accepted by international merchants.';
      } else if (isUpi) {
        shortReason = `UPI bilateral cross-border corridor is active via NIPL and ${selectedDest.upiNetwork || 'clearing partner'}.`;
      } else {
        shortReason = `${network} international cards are accepted worldwide with 3D Secure verification.`;
      }
      suggestedAlternative = null;
    } else if (result.eligible === false || result.status === 'BLOCKED' || result.status === 'NOT_SUPPORTED') {
      statusKey = 'NOT_SUPPORTED';
      statusText = 'Not Supported';
      if (result.rejection_reason || result.reason) {
        shortReason = result.rejection_reason || result.reason;
      } else if (isRuPayDomestic) {
        shortReason = 'Domestic-only RuPay cards cannot be processed by foreign merchant gateways.';
      } else if (isUpi) {
        shortReason = `UPI International is currently not supported for payments to ${selectedDest.name}.`;
      } else {
        shortReason = 'This payment instrument is not eligible for international cross-border processing.';
      }
      suggestedAlternative = result.suggested_alternative || (
        isUpi
          ? 'Pay using an International RuPay, Visa, Mastercard, or PayPal.'
          : 'Use a RuPay Global card, an international Visa/Mastercard, or PayPal.'
      );
    } else if (result.status === 'WARNING' || result.status === 'VERIFICATION_REQUIRED') {
      statusKey = 'VERIFICATION_REQUIRED';
      statusText = 'Verification Required';
      if (result.reason || result.rejection_reason) shortReason = result.reason || result.rejection_reason;
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#DEDEDE] dark:border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white rounded border border-[#DEDEDE] dark:border-[#333333]">
              Corridor Checker
            </span>
            <span className="text-xs text-slate-400">• Instant Dynamic Feedback</span>
          </div>
          <h1 className="page-heading text-[28px] sm:text-[32px] font-semibold text-slate-900 dark:text-white tracking-[-0.025em] leading-tight">
            RuPay & UPI International Compatibility
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
            Real-time verification of domestic Indian cards and bilateral UPI payment corridors.
          </p>
        </div>

        <button
          onClick={() => setActivePage('checkout')}
          className="px-4 py-2.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-[14px] shadow-md shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" />
          <span>Test in Checkout</span>
        </button>
      </div>

      {/* Preset Test Scenarios */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold text-[11px] shrink-0">Quick Presets:</span>
        <button
          onClick={() => applyPreset('rupay_global')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-[#222222] dark:hover:bg-[#EEEEEE]/10 hover:text-[#111111] dark:text-white text-slate-700 dark:text-slate-300 font-medium shrink-0 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          RuPay Global (US)
        </button>
        <button
          onClick={() => applyPreset('rupay_domestic')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-amber-500/10 hover:text-amber-400 text-slate-700 dark:text-slate-300 font-medium shrink-0 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          RuPay Domestic Only (US)
        </button>
        <button
          onClick={() => applyPreset('upi_singapore')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-[#222222] dark:hover:bg-[#EEEEEE]/10 hover:text-[#111111] dark:text-white text-slate-700 dark:text-slate-300 font-medium shrink-0 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          UPI Singapore (PayNow)
        </button>
        <button
          onClick={() => applyPreset('upi_usa')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-700 dark:text-slate-300 font-medium shrink-0 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          UPI USA (Unsupported)
        </button>
        <button
          onClick={() => applyPreset('visa_intl')}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-[#222222] dark:hover:bg-[#EEEEEE]/10 hover:text-[#111111] dark:text-white text-slate-700 dark:text-slate-300 font-medium shrink-0 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          Visa International (DE)
        </button>
      </div>

      {/* Main Interactive Workspace (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Reactive Parameters Form */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Payment Instrument & Destination
            </h3>
            {evaluating && (
              <span className="text-[10px] text-[#111111] dark:text-white flex items-center gap-1 font-mono">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Checking...
              </span>
            )}
          </div>

          {/* Payment Method Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Payment Instrument Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  method === 'card'
                    ? 'bg-black dark:bg-white dark:text-black text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Debit / Credit Card</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  method === 'upi'
                    ? 'bg-black dark:bg-white dark:text-black text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>UPI International</span>
              </button>
            </div>
          </div>

          {/* Card Specific Inputs */}
          {method === 'card' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => {
                      setNetwork(e.target.value);
                      if (e.target.value === 'RuPay' && !cardBin.startsWith('6')) {
                        setCardBin('652150');
                      } else if (e.target.value === 'Visa') {
                        setCardBin('453201');
                      } else if (e.target.value === 'Mastercard') {
                        setCardBin('524100');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  >
                    <option value="RuPay">RuPay (India)</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card BIN (First 6 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={cardBin}
                    onChange={(e) => setCardBin(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 652150"
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#111111] dark:text-white shrink-0" />
                <span>
                  RuPay Global BINs: <code className="text-[#111111] dark:text-white font-mono">6521xx</code>, <code className="text-[#111111] dark:text-white font-mono">6522xx</code> • Domestic PMJDY: <code className="text-amber-400 font-mono">6070xx</code>
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[#DEDEDE] dark:border-[#222222] text-xs space-y-1.5">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                NIPL Bilateral Fast-Payment Linkage
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                UPI International works via bilateral government pacts (NPCI International). Active bilateral corridors include Singapore (PayNow), UAE (NeoPay), France (Lyra), Mauritius, Bhutan, and Nepal.
              </p>
            </div>
          )}

          {/* Destination Country */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Merchant Country
            </label>
            <select
              value={destCountry}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
            >
              {DESTINATIONS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.flag} {d.name} ({d.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Amount in INR */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Transaction Amount (INR ₹)
            </label>
            <input
              type="number"
              value={amountInr}
              onChange={(e) => setAmountInr(e.target.value)}
              placeholder="25000"
              className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
            />
          </div>
        </div>

        {/* Right: Instant Results Card */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Instant Verification Result
            </span>
            <span className="text-xs font-mono text-slate-500">
              Live Evaluation
            </span>
          </div>

          {/* Status Badge & Headline */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  statusKey === 'SUPPORTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : statusKey === 'NOT_SUPPORTED'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                }`}
              >
                {statusKey === 'SUPPORTED' && <CheckCircle2 className="w-4 h-4" />}
                {statusKey === 'NOT_SUPPORTED' && <XCircle className="w-4 h-4" />}
                {statusKey === 'VERIFICATION_REQUIRED' && <AlertTriangle className="w-4 h-4" />}
                <span>{statusText}</span>
              </span>

              <span className="text-xs text-slate-400 font-mono">
                {selectedDest.flag} {selectedDest.code} ({selectedDest.currency})
              </span>
            </div>

            {/* Short 1-sentence explanation */}
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {shortReason}
            </p>
          </div>

          {/* Suggested Alternative (if unsupported) */}
          {suggestedAlternative && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Recommended Alternative:</span>
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {suggestedAlternative}
              </p>
            </div>
          )}

          {/* Corridor Details Matrix */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Selected Instrument:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {method === 'upi' ? 'UPI International (QR / VPA)' : `${network} Card (BIN ${cardBin})`}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">Merchant Corridor:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                India (INR) → {selectedDest.name} ({selectedDest.currency})
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">FX Settlement:</span>
              <span className="font-mono text-[#111111] dark:text-white font-semibold">
                Mid-market + 1.25% markup
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-400">RBI LRS TCS Tax:</span>
              <span className="font-mono text-slate-300">
                {parseFloat(amountInr) > 700000 ? '20% TCS applies above ₹7 Lakh' : '₹0.00 (Exempt under ₹7 Lakh)'}
              </span>
            </div>
          </div>

          {/* Action Link */}
          <div className="pt-2">
            <button
              onClick={() => setActivePage('checkout')}
              className="w-full py-2.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Proceed to Checkout with this Corridor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
