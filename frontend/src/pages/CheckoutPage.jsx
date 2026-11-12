import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AnimatedPaymentModal from '../components/AnimatedPaymentModal';
import { AddCardModal } from '../components/LinkInstrumentModals';
import {
  parseFxRate,
  parseMarkupAmount,
  parseConvertedAmount,
  formatFxRateDisplay,
  formatMarkupDisplay,
  formatTotalPayableDisplay
} from '../utils/fxUtils';
import {
  CreditCard,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  QrCode,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  Check,
  Building2,
  Copy,
  Receipt,
  RotateCcw
} from 'lucide-react';

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', flag: '🇸🇬', upiSupported: true, upiRail: 'PayNow' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪', upiSupported: true, upiRail: 'NeoPay' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', upiSupported: true, upiRail: 'Lyra Network' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' }
];

export default function CheckoutPage({ setActivePage }) {
  const { merchant } = useAuth();

  // Step 1: Merchant & Payment Details (empty by default for new users)
  const [merchantName, setMerchantName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Step 2: Destination & Currency
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');

  // Step 3: Payment Method
  const [savedCards, setSavedCards] = useState([]);
  const [selectedMethodType, setSelectedMethodType] = useState('linked_card'); // 'linked_card' | 'new_card' | 'upi' | 'paypal'
  const [selectedCardId, setSelectedCardId] = useState('');

  // New Card Inputs (if selectedMethodType === 'new_card')
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [newCardholderName, setNewCardholderName] = useState('');

  // UPI VPA (if selectedMethodType === 'upi')
  const [upiVpa, setUpiVpa] = useState('');

  // FX & Calculation States
  const [conversion, setConversion] = useState(null);
  const [loadingRates, setLoadingRates] = useState(false);

  // Processing & Receipt States
  const [processing, setProcessing] = useState(false);
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [transactionReceipt, setTransactionReceipt] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // PayPal Integration State
  const [paypalConfig, setPaypalConfig] = useState(null);
  const [loadingPaypalConfig, setLoadingPaypalConfig] = useState(false);
  const [paypalButtonProcessing, setPaypalButtonProcessing] = useState(false);
  const lastPaypalErrorRef = useRef('');

  useEffect(() => {
    let isMounted = true;
    setLoadingPaypalConfig(true);
    api.paypal.getConfig()
      .then(cfg => {
        if (isMounted) setPaypalConfig(cfg);
      })
      .catch(err => {
        console.warn('[PayPal] Failed to fetch PayPal gateway config:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoadingPaypalConfig(false);
      });
    return () => { isMounted = false; };
  }, []);

  function handleLoadDemoData() {
    setCheckoutError('');
    setMerchantName('Coursera Inc.');
    setDescription('Global AI & Data Science Specialization');
    setSelectedCountry('US');
    setSelectedCurrency('USD');
    setAmount('149.00');
    setUpiVpa('student@okaxis');
  }

  function handleClearForm() {
    setCheckoutError('');
    setMerchantName('');
    setDescription('');
    setSelectedCountry('');
    setSelectedCurrency('');
    setAmount('');
    setUpiVpa('');
    setConversion(null);
  }

  const loadCards = useCallback(async () => {
    try {
      const res = await api.cards.list();
      const cards = res.cards || [];
      setSavedCards(cards);
      if (cards.length > 0) {
        const defaultCard = cards.find(c => c.is_default) || cards[0];
        setSelectedCardId(defaultCard.id);
      } else {
        setSelectedCardId('');
      }
    } catch (err) {
      console.error('[Load Cards Error]:', err);
    }
  }, []);

  // Load Saved Cards on Mount
  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // Update Currency when Country changes
  function handleCountryChange(countryCode) {
    setSelectedCountry(countryCode);
    if (!countryCode) {
      setSelectedCurrency('');
      return;
    }
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCurrency(country.currency);
    }
  }

  // Calculate live FX rate and conversion
  useEffect(() => {
    const parsedAmount = parseFloat(amount);
    if (!selectedCurrency || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setConversion(null);
      setLoadingRates(false);
      return;
    }

    let isCancelled = false;
    async function fetchFx() {
      setLoadingRates(true);
      try {
        const res = await api.currency.convert({
          amount: parsedAmount,
          from_currency: selectedCurrency,
          to_currency: 'INR'
        });
        if (!isCancelled) {
          setConversion(res);
        }
      } catch (err) {
        console.warn('[FX Convert API Error]:', err.message);
        if (!isCancelled) {
          setConversion(null);
        }
      } finally {
        if (!isCancelled) setLoadingRates(false);
      }
    }

    const timer = setTimeout(fetchFx, 200);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [amount, selectedCurrency]);

  const activeCountry = COUNTRIES.find(c => c.code === selectedCountry) || null;
  const activeCard = savedCards.find(c => c.id === selectedCardId);
  const parsedCheckoutAmount = parseFloat(amount);
  const isCheckoutReady =
    Boolean(merchantName.trim()) &&
    Boolean(selectedCountry) &&
    Boolean(selectedCurrency) &&
    !Number.isNaN(parsedCheckoutAmount) &&
    parsedCheckoutAmount > 0;

  // Check if chosen payment method is valid/supported
  let methodIneligibleReason = null;
  if (selectedMethodType === 'linked_card' && activeCard) {
    if (activeCard.international_support === 'DOMESTIC_ONLY') {
      methodIneligibleReason = `${activeCard.issuing_bank} ${activeCard.card_type} is a domestic-only card. Overseas foreign payments are not supported on this instrument. Please select an international card or PayPal.`;
    }
  } else if (selectedMethodType === 'upi') {
    if (activeCountry && !activeCountry.upiSupported) {
      methodIneligibleReason = `UPI International is not supported for payments to ${activeCountry.name}. Active bilateral corridors include Singapore (PayNow), UAE (NeoPay), and France (Lyra).`;
    }
  } else if (selectedMethodType === 'paypal') {
    if (selectedCountry === 'IN') {
      methodIneligibleReason = 'PayPal India does not support domestic payments within India (RBI regulations). For domestic transactions, please select UPI or RuPay.';
    } else if (selectedCurrency === 'INR') {
      methodIneligibleReason = 'PayPal cross-border transactions require an international foreign currency (e.g. USD, EUR, GBP). Please select an international currency.';
    }
  }

  // Handle Payment Submission
  async function handleConfirmPayment(e) {
    if (e) e.preventDefault();
    setCheckoutError('');

    if (!isCheckoutReady) {
      setCheckoutError('Please enter merchant name, destination country, and a valid payment amount (or click Demo Data).');
      return;
    }

    setProcessing(true);

    if (methodIneligibleReason) {
      setCheckoutError(methodIneligibleReason);
      setProcessing(false);
      return;
    }

    try {
      const parsedAmount = parsedCheckoutAmount;

      const initiateRes = await api.checkout.initiate({
        amount: parsedAmount,
        currency: selectedCurrency,
        customer_country: selectedCountry,
        customer_email: merchant?.email || 'customer@atlaspay.demo',
        merchant_id: merchant?.id || 'mer_demo_orchestration_01',
        merchant_name: merchantName.trim(),
        payment_method: selectedMethodType === 'upi' ? 'upi' : 'credit_card',
        card_cvc: '888',
        is_vpn: false
      });

      // Process payment charge
      const processRes = await api.checkout.process({
        transaction_id: initiateRes.transaction_id,
        session_id: initiateRes.session_id,
        simulated_failure: 'none'
      });

      if (processRes.status === 'pending_3ds') {
        setOtpRequired(true);
        setProcessing(false);
        return;
      }

      setTransactionReceipt({
        id: processRes.transaction_id || initiateRes.transaction_id,
        status: processRes.status || 'settled',
        amount: parsedAmount,
        currency: selectedCurrency,
        amount_inr: conversion?.converted_amount || Math.round(parsedAmount * 83.45),
        merchant: merchantName,
        payment_method: selectedMethodType === 'linked_card' ? `${activeCard?.issuing_bank} ${activeCard?.network}` : selectedMethodType.toUpperCase(),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setCheckoutError(err.message || 'Payment processing failed. Please check payment details.');
    } finally {
      setProcessing(false);
    }
  }

  // Handle 3DS OTP Submission
  async function handleVerifyOtp() {
    setProcessing(true);
    setCheckoutError('');
    try {
      const parsedAmount = parsedCheckoutAmount || 0;
      setTransactionReceipt({
        id: `tx_${Date.now().toString(36)}`,
        status: 'settled',
        amount: parsedAmount,
        currency: selectedCurrency,
        amount_inr: conversion?.converted_amount ?? Math.round(parsedAmount * 83.45),
        merchant: merchantName,
        payment_method: selectedMethodType === 'linked_card' ? `${activeCard?.issuing_bank} ${activeCard?.network}` : 'Card (3DS Verified)',
        timestamp: new Date().toISOString()
      });
      setOtpRequired(false);
    } catch (err) {
      setCheckoutError('3D Secure OTP verification failed.');
    } finally {
      setProcessing(false);
    }
  }

  // Live Payment Data Pack for Animated Modal
  const currentPaymentData = {
    merchantName,
    description,
    amount: parsedCheckoutAmount || 0,
    currency: selectedCurrency || 'USD',
    country: activeCountry || COUNTRIES[0],
    conversion,
    selectedMethod: {
      type: selectedMethodType,
      card: activeCard,
      upiVpa
    }
  };

  // Execution Handler triggered inside the Animated Payment Modal
  async function handleExecuteModalPayment() {
    setCheckoutError('');
    if (!isCheckoutReady) {
      throw new Error('Please fill in Merchant Name, Destination Country, and Payment Amount (or click Demo Data).');
    }
    if (methodIneligibleReason) {
      throw new Error(methodIneligibleReason);
    }

    const parsedAmount = parsedCheckoutAmount;

    // Handle PayPal Payment Flow
    if (selectedMethodType === 'paypal') {
      if (!paypalConfig?.is_configured) {
        throw new Error('PayPal Gateway credentials are missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.');
      }

      const createRes = await api.paypal.createOrder({
        amount: parsedAmount,
        currency: selectedCurrency,
        customer_country: selectedCountry,
        customer_email: merchant?.email || 'customer@atlaspay.demo',
        merchant_name: merchantName.trim(),
        description: description || `Payment to ${merchantName.trim()}`
      });

      const captureRes = await api.paypal.captureOrder({
        order_id: createRes.order_id,
        transaction_id: createRes.transaction_id
      });

      if (captureRes.status !== 'settled' && captureRes.status !== 'COMPLETED') {
        throw new Error(`PayPal payment status is '${captureRes.status}'. Settlement not confirmed.`);
      }

      const inrTotal = parseConvertedAmount(conversion);
      const txInfo = {
        id: captureRes.transaction_id || `tx_pp_${captureRes.capture_id || createRes.order_id}`,
        status: 'settled',
        amount: parsedAmount,
        currency: selectedCurrency,
        amount_inr: inrTotal,
        merchant: merchantName,
        payment_method: 'PayPal Sandbox (Verified)',
        capture_id: captureRes.capture_id,
        fee_charged: captureRes.fee_charged,
        timestamp: new Date().toISOString()
      };

      setTransactionReceipt(txInfo);
      return { success: true, transaction: txInfo };
    }

    // Initiate transaction with payment provider
    const initiateRes = await api.checkout.initiate({
      amount: parsedAmount,
      currency: selectedCurrency,
      customer_country: selectedCountry,
      customer_email: merchant?.email || 'customer@atlaspay.demo',
      merchant_id: merchant?.id || 'mer_demo_orchestration_01',
      merchant_name: merchantName.trim(),
      payment_method: selectedMethodType === 'upi' ? 'upi' : 'credit_card',
      card_cvc: '888',
      is_vpn: false
    });

    // Process payment charge
    const processRes = await api.checkout.process({
      transaction_id: initiateRes.transaction_id,
      session_id: initiateRes.session_id,
      simulated_failure: 'none'
    });

    if (processRes.status === 'pending_3ds') {
      return { status: 'pending_3ds', transaction_id: initiateRes.transaction_id };
    }

    const txInfo = {
      id: processRes.transaction_id || initiateRes.transaction_id,
      status: processRes.status || 'settled',
      amount: parsedAmount,
      currency: selectedCurrency,
      amount_inr: conversion?.converted_amount || Math.round(parsedAmount * 83.45),
      merchant: merchantName,
      payment_method: selectedMethodType === 'linked_card'
        ? `${activeCard?.issuing_bank || 'HDFC Bank'} ${activeCard?.network || 'Card'} (•••• ${activeCard?.last_four || '1234'})`
        : selectedMethodType === 'upi'
        ? `UPI (${upiVpa})`
        : 'International Card',
      timestamp: new Date().toISOString()
    };

    setTransactionReceipt(txInfo);
    return { success: true, transaction: txInfo };
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#DEDEDE] dark:border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white rounded border border-[#DEDEDE] dark:border-[#333333]">
              Multi-Rail Checkout
            </span>
            <span className="text-xs text-slate-400">• Demo Mode</span>
          </div>
          <h1 className="page-heading text-[28px] sm:text-[32px] font-semibold text-slate-900 dark:text-white tracking-[-0.025em] leading-tight">
            International Payment Checkout
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
            Pay international merchants seamlessly using your linked Indian payment cards or global rails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleLoadDemoData}
            className="px-4 py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 font-semibold text-[13px] flex items-center gap-2 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Demo Data</span>
          </button>
          {(merchantName || description || amount || selectedCountry) && (
            <button
              type="button"
              onClick={handleClearForm}
              className="px-3.5 py-2.5 rounded-xl bg-[#F7F7F7] dark:bg-[#141414] hover:bg-[#EEEEEE] dark:hover:bg-[#1E1E1E] text-[#111111] dark:text-white font-semibold text-[13px] border border-[#DEDEDE] dark:border-[#333333] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setActivePage('cards')}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-[13px] border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
          >
            <CreditCard className="w-4 h-4 text-[#111111] dark:text-white" />
            <span>Manage Saved Cards</span>
          </button>
        </div>
      </div>

      {/* Main Checkout View: Left Form + Right Summary OR Receipt View */}
      {transactionReceipt ? (
        // Transaction Success Receipt Card
        <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white dark:bg-[#080808] border border-emerald-500/30 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Payment Settled Successfully
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              ${transactionReceipt.amount.toFixed(2)} {transactionReceipt.currency}
            </h2>
            <p className="text-xs text-slate-400">
              Settled equivalent: <span className="font-mono font-bold text-slate-200">₹{transactionReceipt.amount_inr?.toLocaleString()} INR</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-[#DEDEDE] dark:border-[#222222] divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Transaction ID:</span>
              <span className="font-mono text-[#111111] dark:text-white font-semibold">{transactionReceipt.id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Merchant:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{transactionReceipt.merchant}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Payment Instrument:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{transactionReceipt.payment_method}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Timestamp:</span>
              <span className="text-slate-300">{new Date(transactionReceipt.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setTransactionReceipt(null);
                setOtpRequired(false);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md cursor-pointer transition-all"
            >
              Make Another Payment
            </button>
            <button
              onClick={() => setActivePage('dashboard')}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs cursor-pointer transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : otpRequired ? (
        // 3D Secure / OTP Simulation Screen
        <div className="max-w-md mx-auto p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#333333] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              3D Secure 2.2 Verification
            </h3>
            <p className="text-xs text-slate-400">
              Enter the bank authorization code sent to your registered mobile device.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                One-Time Passcode (OTP)
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="w-full text-center tracking-widest text-lg font-mono px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-black dark:border-white"
              />
              <span className="block text-[11px] text-[#111111] dark:text-white mt-1 text-center font-mono">
                Demo Code: 123456
              </span>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={processing}
              className="w-full py-3 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              {processing ? 'Authorizing Payment...' : 'Confirm & Authorize Charge'}
            </button>
          </div>
        </div>
      ) : (
        // Standard Checkout Grid: Left (Inputs) + Right (Summary)
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Flow Inputs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Step 1: Merchant & Payment Details */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-black dark:bg-white dark:text-black text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Merchant & Payment Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Coursera Inc."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Global AI & Data Science Specialization"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Destination Country & Currency */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-black dark:bg-white dark:text-black text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Destination Country & Currency
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Destination Country
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  >
                    <option value="">Select destination country...</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount {selectedCurrency ? `(${selectedCurrency})` : ''}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">
                      {selectedCurrency || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-black dark:bg-white dark:text-black text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Select Payment Method
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(true)}
                  className="text-xs text-[#111111] dark:text-white hover:underline font-semibold cursor-pointer"
                >
                  + Add Card
                </button>
              </div>

              {/* Payment Method Tabs */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethodType('linked_card')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMethodType === 'linked_card'
                      ? 'bg-black dark:bg-white dark:text-black text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Linked Cards ({savedCards.length})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethodType('upi')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMethodType === 'upi'
                      ? 'bg-black dark:bg-white dark:text-black text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  UPI International
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethodType('paypal')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMethodType === 'paypal'
                      ? 'bg-black dark:bg-white dark:text-black text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  PayPal Sandbox
                </button>
              </div>

              {/* Linked Cards Selector */}
              {selectedMethodType === 'linked_card' && (
                <div className="space-y-3 pt-2">
                  {savedCards.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-xs text-slate-400">
                      No cards linked yet.{' '}
                      <button type="button" onClick={() => setShowAddCardModal(true)} className="text-[#111111] dark:text-white font-bold hover:underline cursor-pointer">
                        Link a Card here
                      </button>
                    </div>
                  ) : (
                    savedCards.map((card) => {
                      const isSelected = selectedCardId === card.id;
                      const isDomesticOnly = card.international_support === 'DOMESTIC_ONLY';
                      const isSupported = card.international_support === 'SUPPORTED';

                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-black dark:border-white bg-teal-500/5 dark:bg-[#EEEEEE] dark:bg-[#1A1A1A]'
                              : 'border-[#DEDEDE] dark:border-[#222222] hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="selected_card"
                              checked={isSelected}
                              onChange={() => setSelectedCardId(card.id)}
                              className="text-teal-600 focus:ring-black dark:focus:ring-white"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                {card.issuing_bank} • {card.network}
                              </div>
                              <div className="font-mono text-[11px] text-slate-400">
                                {card.card_number_masked} (Exp {card.expiry})
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                                isSupported
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {card.international_support_label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* UPI Option */}
              {selectedMethodType === 'upi' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Virtual Payment Address (VPA / UPI ID)
                    </label>
                    <input
                      type="text"
                      value={upiVpa}
                      onChange={(e) => setUpiVpa(e.target.value)}
                      placeholder="username@okaxis"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-[11px] text-slate-400">
                    {activeCountry
                      ? `Bilateral linkage active with ${activeCountry.upiSupported ? `${activeCountry.name} (${activeCountry.upiRail})` : 'selected country'}.`
                      : 'Select a destination country above to verify bilateral UPI linkage.'}
                  </div>
                </div>
              )}

              {/* PayPal Option */}
              {selectedMethodType === 'paypal' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        PayPal REST API v2
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                        {paypalConfig?.env === 'live' ? 'LIVE GATEWAY' : 'SANDBOX ACTIVE'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Orders API v2
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>RBI Compliant Cross-Border Export: Billed directly in {selectedCurrency || 'USD'}.</span>
                    </p>
                    <p>
                      PayPal Buyer Protection, Seller Protection and cryptographic webhook reconciliation active.
                    </p>
                  </div>

                  {/* PayPal Credentials Status or Smart Buttons */}
                  <div className="pt-2">
                    {!paypalConfig?.is_configured ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>PayPal Sandbox Credentials Required</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          To activate live PayPal Sandbox checkout, configure your sandbox API credentials in your server <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-200">.env</code> file:
                        </p>
                        <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20 font-mono text-[10px] text-slate-300 space-y-1">
                          <div>PAYPAL_ENV=sandbox</div>
                          <div className={paypalConfig?.client_id ? 'text-emerald-400' : 'text-rose-400'}>
                            PAYPAL_CLIENT_ID={paypalConfig?.client_id ? '[CONFIGURED]' : '[MISSING]'}
                          </div>
                          <div className="text-rose-400">
                            PAYPAL_CLIENT_SECRET=[MISSING]
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Get your credentials from the <a href="https://developer.paypal.com/dashboard/applications/sandbox" target="_blank" rel="noreferrer" className="underline hover:text-white">PayPal Developer Dashboard</a> under Apps &amp; Credentials.
                        </p>
                      </div>
                    ) : isCheckoutReady && !methodIneligibleReason ? (
                      <PayPalScriptProvider
                        key={`${paypalConfig.client_id}-${selectedCurrency || 'USD'}`}
                        options={{
                          clientId: paypalConfig.client_id,
                          currency: (selectedCurrency || 'USD').toUpperCase(),
                          intent: 'capture'
                        }}
                      >
                        <PayPalButtons
                          style={{
                            layout: 'vertical',
                            color: 'gold',
                            shape: 'rect',
                            label: 'paypal',
                            height: 42
                          }}
                          disabled={paypalButtonProcessing}
                          createOrder={async () => {
                            setCheckoutError('');
                            lastPaypalErrorRef.current = '';
                            try {
                              const res = await api.paypal.createOrder({
                                amount: parsedCheckoutAmount,
                                currency: selectedCurrency,
                                customer_country: selectedCountry,
                                customer_email: merchant?.email || 'customer@atlaspay.demo',
                                merchant_name: merchantName.trim(),
                                description: description || `Payment to ${merchantName.trim()}`
                              });
                              return res.order_id;
                            } catch (err) {
                              const errorMsg = err.message || 'PayPal order creation failed.';
                              lastPaypalErrorRef.current = errorMsg;
                              setCheckoutError(errorMsg);
                              throw err;
                            }
                          }}
                          onApprove={async (data) => {
                            setCheckoutError('');
                            setPaypalButtonProcessing(true);
                            try {
                              const captureRes = await api.paypal.captureOrder({
                                order_id: data.orderID,
                                transaction_id: data.orderID
                              });

                              if (captureRes.status === 'settled' || captureRes.status === 'COMPLETED') {
                                const inrTotal = parseConvertedAmount(conversion);
                                const txInfo = {
                                  id: captureRes.transaction_id || `tx_pp_${captureRes.capture_id || data.orderID}`,
                                  status: 'settled',
                                  amount: parseFloat(captureRes.amount || parsedCheckoutAmount),
                                  currency: captureRes.currency || selectedCurrency,
                                  amount_inr: inrTotal,
                                  merchant: merchantName,
                                  payment_method: 'PayPal Sandbox (Verified)',
                                  capture_id: captureRes.capture_id,
                                  fee_charged: captureRes.fee_charged,
                                  timestamp: new Date().toISOString()
                                };
                                setTransactionReceipt(txInfo);
                                setShowPaymentModal(true);
                              } else {
                                throw new Error(`PayPal payment status: ${captureRes.status}`);
                              }
                            } catch (err) {
                              const captureMsg = err.message || 'PayPal capture verification failed.';
                              setCheckoutError(captureMsg);
                            } finally {
                              setPaypalButtonProcessing(false);
                            }
                          }}
                          onCancel={() => {
                            setCheckoutError('PayPal payment was cancelled. No charges were made.');
                          }}
                          onError={(err) => {
                            console.error('[PayPal SDK Error]:', err);
                            const failureReason = lastPaypalErrorRef.current || err?.message || 'PayPal Checkout encountered an error.';
                            setCheckoutError(failureReason);
                          }}
                        />
                      </PayPalScriptProvider>
                    ) : (
                      <div className="p-3 text-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        Fill in merchant name, destination country, and amount (or click Demo Data) to activate PayPal checkout buttons.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ineligibility Warning Banner */}
              {methodIneligibleReason && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Payment Method Unsupported for this Transaction</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pl-5">
                    {methodIneligibleReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Payment Summary & Confirmation */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-xl space-y-5">
              <h3 className="font-bold text-slate-900 dark:text-white text-base pb-3 border-b border-slate-100 dark:border-slate-800">
                Payment Summary
              </h3>

              {/* Price Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Payment Amount:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {!Number.isNaN(parsedCheckoutAmount) && parsedCheckoutAmount > 0 && selectedCurrency
                      ? `${parsedCheckoutAmount.toFixed(2)} ${selectedCurrency}`
                      : '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Mid-Market FX Rate:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatFxRateDisplay(conversion, selectedCurrency, loadingRates)}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Conversion Spread (1.25%):</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatMarkupDisplay(conversion, loadingRates)}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Estimated TCS / Compliance:</span>
                  <span className="font-mono text-[#111111] dark:text-white font-semibold">
                    ₹0.00 (Exempt)
                  </span>
                </div>

                <div className="pt-3 border-t border-[#DEDEDE] dark:border-[#222222] flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Total Payable</span>
                    <span className="block text-[10px] text-slate-400">Billed in Indian Rupees (INR)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-[#111111] dark:text-white">
                      {formatTotalPayableDisplay(conversion, loadingRates)}
                    </span>
                  </div>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {checkoutError}
                </div>
              )}

              {/* Pay Now Button -> Opens Animated Payment Modal Popup */}
              <button
                type="button"
                onClick={() => {
                  if (!isCheckoutReady) {
                    setCheckoutError('Please enter merchant name, destination country, and amount (or click Demo Data).');
                    return;
                  }
                  if (methodIneligibleReason) {
                    setCheckoutError(methodIneligibleReason);
                    return;
                  }
                  if (selectedMethodType === 'paypal' && !paypalConfig?.is_configured) {
                    setCheckoutError('PayPal Gateway credentials are missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.');
                    return;
                  }
                  if (!parseFxRate(conversion)) {
                    setCheckoutError('Live foreign exchange rate is currently unavailable. Please verify connectivity.');
                    return;
                  }
                  setShowPaymentModal(true);
                }}
                disabled={!isCheckoutReady || Boolean(methodIneligibleReason) || (selectedMethodType === 'paypal' && !paypalConfig?.is_configured) || !parseFxRate(conversion)}
                className="w-full py-3.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isCheckoutReady
                    ? parseConvertedAmount(conversion)
                      ? `Pay Now — ${formatTotalPayableDisplay(conversion, loadingRates)}`
                      : 'Pay Now — FX rate unavailable'
                    : 'Enter payment details or click Demo Data'}
                </span>
              </button>

              <div className="pt-2 text-center text-[10px] text-slate-400 space-y-1">
                <p>🔒 Demo Mode: No actual financial charge will occur.</p>
                <p>Protected by EMV 3D Secure & Idempotency Vault.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animated Payment Popup with Dribbble-inspired Currency Stacking */}
      <AnimatedPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        paymentData={currentPaymentData}
        onConfirmPayment={handleExecuteModalPayment}
        onViewTransaction={(txId) => {
          setActivePage('transactions');
        }}
        onDone={() => {
          setShowPaymentModal(false);
          setTransactionReceipt(null);
        }}
      />

      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSuccess={() => {
          loadCards();
        }}
      />
    </div>
  );
}
