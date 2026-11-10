import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  X,
  CreditCard,
  QrCode,
  Sparkles,
  Building2,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

export default function AnimatedPaymentModal({
  isOpen,
  onClose,
  paymentData,
  onConfirmPayment,
  onViewTransaction,
  onDone
}) {
  // Modal Stages: 'review' | 'processing' | 'otp' | 'success' | 'failed'
  const [stage, setStage] = useState('review');
  const [processingStep, setProcessingStep] = useState(1);
  const [transactionResult, setTransactionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');

  // Mobile Swipe-to-confirm state
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const sliderRef = useRef(null);

  // Reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setStage('review');
      setProcessingStep(1);
      setTransactionResult(null);
      setErrorMessage('');
      setSwipeProgress(0);
      setOtpCode('123456');
    }
  }, [isOpen]);

  // Handle ESC key press (disabled during processing)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && stage !== 'processing') {
        handleModalClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const {
    merchantName = 'Coursera Inc.',
    description = 'Global Course Specialization',
    amount = 149.00,
    currency = 'USD',
    country = { name: 'United States', flag: '🇺🇸', code: 'US' },
    conversion = { exchange_rate: 83.45, converted_amount: 12589.00, markup_fee: 155.33 },
    selectedMethod = { type: 'linked_card' }
  } = paymentData || {};

  const numAmount = parseFloat(amount || 0);
  const totalInr = conversion?.converted_amount || Math.round(numAmount * (conversion?.exchange_rate || 83.45));
  const fxRate = conversion?.exchange_rate || 83.45;
  const markupFee = conversion?.markup_fee || (totalInr * 0.0125);

  // Start Payment Processing Sequence
  async function triggerPaymentExecution() {
    setStage('processing');
    setProcessingStep(1);

    // Staggered step timers for visual feedback matching Dribbble motion flow
    const stepTimer1 = setTimeout(() => setProcessingStep(2), 800);
    const stepTimer2 = setTimeout(() => setProcessingStep(3), 1600);
    const minAnimationDelay = new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const [result] = await Promise.all([
        onConfirmPayment(),
        minAnimationDelay
      ]);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (result?.status === 'pending_3ds') {
        setStage('otp');
        return;
      }

      setTransactionResult(result?.transaction || {
        id: result?.transaction_id || `tx_${Date.now().toString(36)}`,
        amount: numAmount,
        currency,
        amount_inr: totalInr,
        merchant: merchantName,
        timestamp: new Date().toISOString()
      });

      // Smooth transition to Success state
      setTimeout(() => {
        setStage('success');
      }, 500);

    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error('[Payment Modal Error]:', err);
      setErrorMessage(err.message || 'Payment processing was declined by the provider.');
      setStage('failed');
    }
  }

  // 3DS OTP Submission within Modal
  async function handleOtpSubmit(e) {
    if (e) e.preventDefault();
    setStage('processing');
    setProcessingStep(3);

    try {
      setTransactionResult({
        id: `tx_3ds_${Date.now().toString(36)}`,
        amount: numAmount,
        currency,
        amount_inr: totalInr,
        merchant: merchantName,
        timestamp: new Date().toISOString()
      });

      setTimeout(() => {
        setStage('success');
      }, 800);
    } catch (err) {
      setErrorMessage('3D Secure OTP verification failed.');
      setStage('failed');
    }
  }

  function handleModalClose() {
    if (stage === 'processing') return; // Prevent accidental dismissal while processing
    if (stage === 'success' && onDone) {
      onDone();
    } else {
      onClose();
    }
  }

  function handleCopyTxId(id) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedTxId(true);
      setTimeout(() => setCopiedTxId(false), 2000);
    }
  }

  // Mobile Swipe Handler
  function handleTouchMove(e) {
    if (!sliderRef.current || stage !== 'review') return;
    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const progress = Math.max(0, Math.min(100, (x / width) * 100));
    setSwipeProgress(progress);
    if (progress > 85 && !isSwiping) {
      setIsSwiping(true);
      triggerPaymentExecution();
    }
  }

  function handleTouchEnd() {
    if (swipeProgress < 85) {
      setSwipeProgress(0);
      setIsSwiping(false);
    }
  }

  // Currency symbols for animated coin face
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Dark Translucent Blurred Backdrop */}
      <div
        onClick={handleModalClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Main Modal Dialog Box */}
      <div
        className="relative w-full max-w-lg bg-[#0E1522] border border-white/25 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden text-slate-100 z-10 transition-all duration-300 transform scale-100"
        style={{
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px 2px rgba(20, 184, 166, 0.15)'
        }}
      >
        {/* Top Decorative Ambient Glow Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-white via-neutral-300 to-cyan-500" />

        {/* =========================================================================
            STAGE 1: REVIEW PAYMENT
        ========================================================================= */}
        {stage === 'review' && (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header: Title + Security Pill + Close */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="card-heading text-[18px] sm:text-[20px] font-semibold text-white tracking-[-0.015em]">
                    Review Payment
                  </h3>
                  <span className="text-[10px] text-white/90 font-mono flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>256-Bit SSL Encrypted Vault</span>
                  </span>
                </div>
              </div>

              <button
                onClick={handleModalClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Cancel & Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Merchant Identity & Destination Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 border border-white/30 flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {merchantName}
                  </h4>
                  <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-[260px]">
                    {description}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg">{country.flag}</span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  {country.code}
                </span>
              </div>
            </div>

            {/* Primary Total Payable Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-black/40 via-slate-900/90 to-slate-900 border border-white/30 text-center space-y-1 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                Total Payable Amount
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                ₹{totalInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 pt-0.5">
                Original amount: <span className="font-semibold text-slate-200">${numAmount.toFixed(2)} {currency}</span>
              </p>
            </div>

            {/* Price & Exchange Rate Breakdown Table */}
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 divide-y divide-slate-800/70 text-xs">
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Exchange Rate:</span>
                <span className="font-mono text-slate-200">
                  1 {currency} = ₹{fxRate.toFixed(2)} INR
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Conversion Spread (1.25%):</span>
                <span className="font-mono text-slate-300">
                  ₹{markupFee.toFixed(2)} INR
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">RBI Compliance / TCS:</span>
                <span className="font-mono text-white font-medium">
                  ₹0.00 (Exempt under ₹7L)
                </span>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="text-slate-400">Payment Instrument:</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-white" />
                  <span>
                    {selectedMethod.type === 'linked_card'
                      ? `${selectedMethod.card?.issuing_bank || 'HDFC Bank'} •••• ${selectedMethod.card?.last_four || '1234'}`
                      : selectedMethod.type === 'upi'
                      ? `UPI (${selectedMethod.upiVpa || 'student@upi'})`
                      : 'International Payment Card'}
                  </span>
                </span>
              </div>
            </div>

            {/* Desktop Confirm Button & Mobile Swipe */}
            <div className="space-y-3 pt-2">
              {/* Desktop Button with Shimmer */}
              <button
                type="button"
                onClick={triggerPaymentExecution}
                className="w-full relative group overflow-hidden py-3.5 px-6 rounded-2xl bg-gradient-to-r from-black via-white to-white hover:from-white hover:to-white text-white font-extrabold text-sm shadow-lg shadow-teal-900/40 cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {/* Shimmer light bar */}
                <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
                <Lock className="w-4 h-4 text-teal-100" />
                <span>Confirm & Pay ₹{totalInr.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-4 h-4 text-teal-100 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Mobile Swipe-to-Confirm Slider (Visible on small screens) */}
              <div className="sm:hidden pt-1">
                <div
                  ref={sliderRef}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="relative h-12 rounded-2xl bg-slate-900 border border-white/30 overflow-hidden flex items-center px-2 select-none"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all"
                    style={{ width: `${swipeProgress}%` }}
                  />
                  <div
                    className="absolute h-9 w-9 rounded-xl bg-white text-white flex items-center justify-center shadow-md transition-all cursor-grab active:cursor-grabbing"
                    style={{ left: `calc(${swipeProgress * 0.8}% + 4px)` }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <span className="w-full text-center text-xs font-semibold text-slate-400 pl-8 pointer-events-none">
                    Slide to confirm payment →
                  </span>
                </div>
              </div>

              {/* Cancel Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1"
                >
                  Cancel transaction
                </button>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            STAGE 2: TRANSACTION PROCESSING & ANIMATED CURRENCY STACKING
            (Dribbble Inspiration: 3D Stacking Coins + Floating Particles + Progress Ring)
        ========================================================================= */}
        {stage === 'processing' && (
          <div className="p-8 sm:p-12 text-center space-y-7">
            
            {/* Visual Centerpiece: 3D Animated Currency Stack */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center perspective-1000">
              
              {/* Outer Pulsing Glow Aura */}
              <div className="absolute inset-2 rounded-full bg-white/15 blur-2xl animate-ring-pulse pointer-events-none" />

              {/* Circling SVG Progress Ring */}
              <svg className="absolute w-44 h-44 animate-spin" style={{ animationDuration: '3.5s' }} viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(30, 41, 59, 0.4)"
                  strokeWidth="3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#tealGradient)"
                  strokeWidth="3.5"
                  strokeDasharray="80 180"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14B8A6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Converging Floating Light Particles (Funds Inflow) */}
              {!prefersReducedMotion && (
                <div className="absolute inset-0 pointer-events-none">
                  {[
                    { tx: '45px', ty: '-60px', delay: '0s' },
                    { tx: '-50px', ty: '-40px', delay: '0.4s' },
                    { tx: '60px', ty: '30px', delay: '0.8s' },
                    { tx: '-45px', ty: '50px', delay: '1.2s' },
                    { tx: '0px', ty: '-70px', delay: '0.6s' }
                  ].map((p, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-neutral-300 shadow-md shadow-white"
                      style={{
                        '--tx': p.tx,
                        '--ty': p.ty,
                        animation: `particleFlow 1.8s ease-in-out infinite ${p.delay}`
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 3D Stacked Metallic Currency Discs */}
              <div
                className={`relative w-28 h-28 preserve-3d flex items-center justify-center ${
                  !prefersReducedMotion ? 'animate-coin-float' : ''
                }`}
                style={{ transform: 'rotateX(60deg) rotateZ(-25deg)' }}
              >
                {/* Coin 1 (Base) */}
                <div
                  className="absolute w-24 h-24 rounded-full border border-neutral-300/60 flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #f8fafc 0%, #cbd5e1 55%, #64748b 100%)',
                    boxShadow: '0 2px 0 #475569, 0 4px 0 #334155, 0 6px 0 #1e293b, 0 14px 25px rgba(0,0,0,0.6)',
                    transform: 'translateZ(0px)',
                    animation: !prefersReducedMotion ? 'coinStackDrop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.05s' : 'none'
                  }}
                >
                  <div className="w-18 h-18 rounded-full border border-slate-400/50 flex items-center justify-center font-black font-mono text-slate-700 text-lg">
                    {currencySymbol}
                  </div>
                </div>

                {/* Coin 2 */}
                <div
                  className="absolute w-24 h-24 rounded-full border border-neutral-200/60 flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #e2e8f0 55%, #94a3b8 100%)',
                    boxShadow: '0 2px 0 #475569, 0 4px 0 #334155, 0 6px 0 #1e293b, 0 12px 20px rgba(0,0,0,0.5)',
                    transform: 'translateZ(12px)',
                    animation: !prefersReducedMotion ? 'coinStackDrop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.22s' : 'none'
                  }}
                >
                  <div className="w-18 h-18 rounded-full border border-slate-400/40 flex items-center justify-center font-black font-mono text-slate-700 text-lg">
                    ₹
                  </div>
                </div>

                {/* Coin 3 */}
                <div
                  className="absolute w-24 h-24 rounded-full border border-cyan-300/60 flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #f0fdfa 0%, #ccfbf1 50%, #5eead4 100%)',
                    boxShadow: '0 2px 0 #0f766e, 0 4px 0 #115e59, 0 6px 0 #134e4a, 0 12px 20px rgba(0,0,0,0.5)',
                    transform: 'translateZ(24px)',
                    animation: !prefersReducedMotion ? 'coinStackDrop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.38s' : 'none'
                  }}
                >
                  <div className="w-18 h-18 rounded-full border border-white/40 flex items-center justify-center font-black font-mono text-teal-800 text-lg">
                    A
                  </div>
                </div>

                {/* Coin 4 (Top Token with Teal Shimmer) */}
                <div
                  className="absolute w-24 h-24 rounded-full border border-neutral-200 flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f1f5f9 55%, #cbd5e1 100%)',
                    boxShadow: '0 2px 0 #64748b, 0 4px 0 #475569, 0 6px 0 #334155, 0 16px 28px rgba(20, 184, 166, 0.3)',
                    transform: 'translateZ(36px)',
                    animation: !prefersReducedMotion ? 'coinStackDrop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.54s' : 'none'
                  }}
                >
                  <div className="w-18 h-18 rounded-full border border-white/50 flex items-center justify-center">
                    <span className="font-black font-mono text-teal-700 text-xl tracking-tighter">
                      ATLAS
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Text & Status */}
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-[22px] font-semibold text-white tracking-[-0.02em] animate-pulse">
                Processing your payment...
              </h3>
              <p className="text-[14px] text-slate-400 font-normal">
                Securely communicating with the payment provider.
              </p>
            </div>

            {/* Stepped Progress Tracker */}
            <div className="max-w-xs mx-auto p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-left">
              {[
                { step: 1, label: 'Initiating cross-border corridor...' },
                { step: 2, label: 'Routing through optimal clearing rail...' },
                { step: 3, label: 'Settling funds with merchant...' }
              ].map((s) => {
                const isCurrent = processingStep === s.step;
                const isCompleted = processingStep > s.step;

                return (
                  <div key={s.step} className="flex items-center space-x-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-white text-white'
                        : isCurrent
                        ? 'bg-white text-white animate-spin'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                    </div>
                    <span className={`text-[11px] font-medium ${
                      isCompleted ? 'text-slate-300' : isCurrent ? 'text-white font-bold' : 'text-slate-500'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] font-mono text-slate-500">
              Do not close this window or refresh the page.
            </p>
          </div>
        )}

        {/* =========================================================================
            STAGE: 3D SECURE OTP SIMULATION (if required)
        ========================================================================= */}
        {stage === 'otp' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 border border-white/30 text-white flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                3D Secure 2.2 Bank Authorization
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Please enter the 6-digit one-time passcode sent to your bank-registered mobile number to finalize authorization.
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4 max-w-xs mx-auto">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center text-xl font-mono tracking-widest py-3 px-4 rounded-xl bg-slate-900 border border-white/40 text-white focus:outline-none focus:border-white shadow-inner"
                />
                <span className="block text-[10px] font-mono text-white mt-1 text-center">
                  Sandbox Demo Code: 123456
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-black hover:bg-white text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Confirm & Authorize Charge
              </button>
            </form>
          </div>
        )}

        {/* =========================================================================
            STAGE 3: SUCCESSFUL PAYMENT & SATISFYING CONFETTI / CHECKMARK
        ========================================================================= */}
        {stage === 'success' && (
          <div className="p-6 sm:p-8 text-center space-y-6 relative overflow-hidden">
            
            {/* Subtle Confetti Particles Burst */}
            {!prefersReducedMotion && (
              <div className="absolute inset-0 pointer-events-none">
                {[
                  { cx: '-70px', cy: '-90px', color: '#14B8A6', delay: '0s', rot: '140deg' },
                  { cx: '70px', cy: '-80px', color: '#38BDF8', delay: '0.1s', rot: '220deg' },
                  { cx: '-40px', cy: '-110px', color: '#FCD34D', delay: '0.15s', rot: '90deg' },
                  { cx: '50px', cy: '-100px', color: '#34D399', delay: '0.05s', rot: '180deg' },
                  { cx: '-90px', cy: '-40px', color: '#2DD4BF', delay: '0.2s', rot: '270deg' },
                  { cx: '90px', cy: '-50px', color: '#6EE7B7', delay: '0.25s', rot: '110deg' }
                ].map((c, idx) => (
                  <div
                    key={idx}
                    className="absolute left-1/2 top-1/3 w-2.5 h-2.5 rounded-sm"
                    style={{
                      backgroundColor: c.color,
                      '--cx': c.cx,
                      '--cy': c.cy,
                      '--crot': c.rot,
                      animation: `confettiBurst 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards ${c.delay}`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Satisfying Spring Checkmark */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-white text-white flex items-center justify-center shadow-lg shadow-emerald-900/40 animate-spring-pop">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            {/* Headline & Amount */}
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/30">
                Payment Settled
              </span>
              <h2 className="text-2xl sm:text-[28px] font-semibold text-white tracking-[-0.025em] pt-1">
                Payment Successful!
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white pt-1">
                ₹{totalInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-400">
                Paid to <strong className="text-slate-200">{merchantName}</strong> (${numAmount.toFixed(2)} {currency})
              </p>
            </div>

            {/* Transaction Reference Pill */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs divide-y divide-slate-800 text-left">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Reference ID:</span>
                <button
                  type="button"
                  onClick={() => handleCopyTxId(transactionResult?.id || 'tx_demo')}
                  className="font-mono text-white hover:text-neutral-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Copy Reference ID"
                >
                  <span>{transactionResult?.id || 'tx_atlas_demo_01'}</span>
                  {copiedTxId ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400">Clearing Rail:</span>
                <span className="font-semibold text-slate-200">
                  Atlas Cross-Border Settlement (Sandbox)
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400">Method:</span>
                <span className="text-slate-300">
                  {selectedMethod.type === 'linked_card'
                    ? `${selectedMethod.card?.issuing_bank || 'HDFC Bank'} •••• ${selectedMethod.card?.last_four || '1234'}`
                    : selectedMethod.type === 'upi'
                    ? 'UPI International'
                    : 'International Card'}
                </span>
              </div>
            </div>

            {/* Action Buttons: View Transaction + Done */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onViewTransaction) onViewTransaction(transactionResult?.id);
                  handleModalClose();
                }}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                View Transaction
              </button>

              <button
                type="button"
                onClick={handleModalClose}
                className="py-3 px-4 rounded-2xl bg-black hover:bg-white text-white font-bold text-xs shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        )}

        {/* =========================================================================
            STAGE: FAILED / DECLINED STATE
        ========================================================================= */}
        {stage === 'failed' && (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                Payment Not Completed
              </h3>
              <p className="text-xs text-rose-400 max-w-sm mx-auto leading-relaxed">
                {errorMessage || 'Your card could not be charged by the provider. Please check your card balance and international enablement.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStage('review')}
                className="py-3 px-4 rounded-2xl bg-black hover:bg-white text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
