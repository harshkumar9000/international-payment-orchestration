import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CreditCard,
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ArrowRight,
  Smartphone,
  QrCode,
  Lock,
  Sparkles,
  Info,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';

const COUNTRIES = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', flag: '🇳🇱' },
  { code: 'JP', name: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'KP', name: 'North Korea (Sanctioned Corridor Demo)', currency: 'USD', flag: '🚫' }
];

export default function CheckoutPage({ setActivePage }) {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [amount, setAmount] = useState('149.00');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [customerEmail, setCustomerEmail] = useState('alex.customer@globalpay.com');
  
  // Corridor state
  const [corridorData, setCorridorData] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [loadingCorridor, setLoadingCorridor] = useState(false);

  // Card input states
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('Alex Taylor');
  const [vpa, setVpa] = useState('alex@okaxis');

  // Simulation test triggers
  const [simulatedFailure, setSimulatedFailure] = useState('none');
  const [processingState, setProcessingState] = useState('idle'); // 'idle' | 'initiating' | 'scoring' | 'routing' | 'cascading' | 'success' | 'failed' | 'pending_3ds' | 'pending_upi'
  const [paymentResult, setPaymentResult] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentStepText, setCurrentStepText] = useState('');

  // 3DS and UPI interactive state
  const [otpCode, setOtpCode] = useState('123456');
  const [verifyingAction, setVerifyingAction] = useState(false);

  // Fetch corridor & conversion whenever country changes
  useEffect(() => {
    async function updateCorridor() {
      setLoadingCorridor(true);
      try {
        const country = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];
        const [compRes, convRes] = await Promise.all([
          api.compatibility.check(country.code, country.currency, parseFloat(amount) || 100),
          api.currency.convert({
            amount: parseFloat(amount) || 100,
            from_currency: baseCurrency,
            to_currency: country.currency
          })
        ]);
        setCorridorData(compRes);
        setConversion(convRes);
        if (compRes.compatible_methods && compRes.compatible_methods.length > 0) {
          // Preselect recommended or first
          const rec = compRes.compatible_methods.find(m => m.recommended);
          setSelectedMethod(rec ? rec.id : compRes.compatible_methods[0].id);
        }
      } catch (err) {
        console.error('[Corridor Check Error]:', err);
      } finally {
        setLoadingCorridor(false);
      }
    }
    updateCorridor();
  }, [selectedCountry, amount, baseCurrency]);

  // Execute Payment Orchestration
  const handlePay = async (e) => {
    e.preventDefault();
    setProcessingState('initiating');
    setCurrentStepText('Checking corridor legality & regulatory compliance...');
    setPaymentResult(null);

    try {
      // 1. Initiate Checkout Session
      await new Promise(r => setTimeout(r, 400));
      setCurrentStepText('Running Python AI Risk Scoring (Velocity, Geolocation, Sanctions)...');
      
      const isSimulatedVpn = simulatedFailure === 'fraud_vpn';
      const initRes = await api.checkout.initiate({
        amount: parseFloat(amount),
        currency: baseCurrency,
        customer_country: selectedCountry,
        customer_email: customerEmail,
        payment_method: selectedMethod,
        is_vpn: isSimulatedVpn,
        ip_country: isSimulatedVpn ? 'RU' : selectedCountry
      });

      setActiveSession(initRes);

      // 2. Routing Decision Animation
      await new Promise(r => setTimeout(r, 450));
      setProcessingState('routing');
      setCurrentStepText(`Routing to optimal gateway ${initRes.routing.primary_provider.toUpperCase()} (Lowest corridor fee + fastest latency)...`);

      // 3. Process with Gateway
      await new Promise(r => setTimeout(r, 600));

      let declineSimulation = null;
      if (simulatedFailure === 'network_timeout') {
        declineSimulation = 'network_timeout';
        setCurrentStepText('Simulating primary gateway timeout -> Initiating automated recovery cascade...');
      } else if (simulatedFailure === 'insufficient_funds') {
        declineSimulation = 'insufficient_funds';
      }

      const processRes = await api.checkout.process({
        transaction_id: initRes.transaction_id,
        payment_method: selectedMethod,
        simulate_decline: declineSimulation,
        payment_data: {
          card_number: cardNumber.replace(/\s+/g, ''),
          card_brand: 'Visa',
          vpa: vpa,
          force_3ds: cardNumber.endsWith('3000')
        }
      });

      // Handle 3DS Challenge
      if (processRes.status === 'pending_3ds') {
        setProcessingState('pending_3ds');
        setPaymentResult(processRes);
        return;
      }

      // Handle UPI Collect
      if (processRes.status === 'pending_upi') {
        setProcessingState('pending_upi');
        setPaymentResult(processRes);
        return;
      }

      // Settled or Recovered
      setProcessingState('success');
      setPaymentResult(processRes);

    } catch (err) {
      console.error('[Payment Process Error]:', err);
      setProcessingState('failed');
      setPaymentResult({
        error: err.message || 'Payment execution failed',
        status: 'failed'
      });
    }
  };

  // Complete 3DS Verification
  const handleVerify3ds = async () => {
    setVerifyingAction(true);
    try {
      const res = await api.checkout.verify3ds({
        transaction_id: paymentResult.transaction_id,
        otp: otpCode
      });
      setProcessingState('success');
      setPaymentResult({
        ...paymentResult,
        status: 'settled',
        message: '3DS Strong Customer Authentication successful. Payment settled!'
      });
    } catch (err) {
      alert(err.message || '3DS Verification failed');
    } finally {
      setVerifyingAction(false);
    }
  };

  // Complete UPI Approval
  const handleVerifyUpi = async () => {
    setVerifyingAction(true);
    try {
      const res = await api.checkout.verifyUpi({
        transaction_id: paymentResult.transaction_id
      });
      setProcessingState('success');
      setPaymentResult({
        ...paymentResult,
        status: 'settled',
        message: 'UPI collect transaction approved by user on mobile app!'
      });
    } catch (err) {
      alert(err.message || 'UPI Verification failed');
    } finally {
      setVerifyingAction(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Interactive Cross-Border Checkout Simulator</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Unified International Checkout
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Switch countries to view dynamic payment rails, real-time FX pricing, and trigger automated cascading recovery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Checkout Form */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
            
            <form onSubmit={handlePay} className="space-y-6">
              
              {/* Step 1: Customer Country & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Customer Jurisdiction</span>
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Order Base Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono font-bold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sanctions Block Warning */}
              {corridorData && !corridorData.compatible && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span>Cross-Border Sanctions Restriction</span>
                  </div>
                  <p>{corridorData.message}</p>
                </div>
              )}

              {/* Customer Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dynamic Compatible Payment Methods Selector */}
              {corridorData?.compatible && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Available Payment Methods in {corridorData.country_name}
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {corridorData.compatible_methods.map((m) => {
                      const isSelected = selectedMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethod(m.id)}
                          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="text-xs font-bold truncate">{m.name}</span>
                            {m.recommended && (
                              <span className="px-1.5 py-0.5 text-[9px] rounded font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Best
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {m.settlement_type || 'Instant'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Method Inputs */}
              {selectedMethod === 'credit_card' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Card Credentials</span>
                    <span className="text-[11px] text-slate-400">Encrypted via TLS 1.3</span>
                  </div>

                  {/* 1-Click Test Card Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => setCardNumber('4242 4242 4242 4242')}
                      className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-mono"
                    >
                      Card 4242 (Clean)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardNumber('4000 0000 0000 3000')}
                      className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-amber-600 dark:text-amber-400 font-mono"
                    >
                      Card 3000 (3DS SCA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardNumber('4000 0000 0000 0003')}
                      className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 dark:text-purple-400 font-mono"
                    >
                      Card 0003 (Network Timeout)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardNumber('4000 0000 0000 0005')}
                      className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-mono"
                    >
                      Card 0005 (Stolen Card)
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="px-3 py-2 text-sm font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="px-3 py-2 text-sm font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* UPI Inputs */}
              {selectedMethod === 'upi' && (
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                  <div className="flex items-center space-x-2 text-purple-700 dark:text-purple-300 text-xs font-bold">
                    <Smartphone className="w-4 h-4" />
                    <span>Instant UPI Payment (PhonePe, GPay, Paytm)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVpa('vikram@okhdfcbank')}
                      className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-mono"
                    >
                      vikram@okhdfcbank
                    </button>
                    <button
                      type="button"
                      onClick={() => setVpa('user@paytm')}
                      className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-mono"
                    >
                      user@paytm
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    placeholder="yourname@okaxis"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <div className="text-[11px] text-slate-500">
                    Direct routing to Razorpay UPI gateway with 0.5% capped processing fee.
                  </div>
                </div>
              )}

              {/* PayPal Sandbox */}
              {selectedMethod === 'paypal' && (
                <div className="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-2">
                  <div className="flex items-center space-x-2 text-sky-700 dark:text-sky-300 text-xs font-bold">
                    <Globe className="w-4 h-4" />
                    <span>PayPal Sandbox REST API Integration</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    If PayPal credentials are set in .env, creates real Sandbox OAuth order. Otherwise uses high-fidelity simulation.
                  </p>
                </div>
              )}

              {/* Pix Brazil */}
              {selectedMethod === 'pix' && (
                <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>Pix Instant Central Bank Rails (Brazil)</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Generates dynamic Pix EMV QR code and Copia-e-Cola payload via dLocal rails.
                  </p>
                </div>
              )}

              {/* Simulation Failure Dropdown for testing orchestrator features */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span className="flex items-center space-x-1">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Orchestration Test Scenario</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Test Recovery & Cascading</span>
                </div>
                <select
                  value={simulatedFailure}
                  onChange={(e) => setSimulatedFailure(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="none">Standard Clean Authorization (No Errors)</option>
                  <option value="network_timeout">Simulate Gateway Timeout (Triggers Auto-Cascade Recovery!)</option>
                  <option value="insufficient_funds">Simulate Soft Decline (Insufficient Funds)</option>
                  <option value="fraud_vpn">Simulate Fraud Risk (VPN Proxy & Geo-Mismatch)</option>
                </select>
              </div>

              {/* Submit Pay Button */}
              <button
                type="submit"
                disabled={processingState !== 'idle' && processingState !== 'success' && processingState !== 'failed'}
                className="w-full py-3.5 px-6 rounded-xl fintech-gradient text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>
                  Authorize & Pay {conversion?.symbol || '$'}{conversion?.converted_amount || amount} {conversion?.to_currency || 'USD'}
                </span>
              </button>

            </form>

          </div>

        </div>

        {/* Right Column: Dynamic Currency Breakdown & Live Timeline */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Real-time FX Breakdown Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-md">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Dynamic Currency Breakdown</span>
              <span className="text-emerald-500 font-mono text-[11px]">Live FX</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Order Subtotal</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${parseFloat(amount || 0).toFixed(2)} USD</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Customer Country</span>
                <span className="font-semibold text-slate-900 dark:text-white">{corridorData?.country_name || selectedCountry}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Mid-Market Exchange Rate</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  1 USD = {conversion?.mid_market_rate} {conversion?.to_currency}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Merchant FX Spread</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  +{conversion?.markup_percentage}% ({conversion?.symbol}{conversion?.markup_amount})
                </span>
              </div>

              <div className="flex justify-between py-2 pt-3 text-sm font-bold border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-900 dark:text-white">Total Customer Charge</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {conversion?.symbol}{conversion?.converted_amount} {conversion?.to_currency}
                </span>
              </div>
            </div>

            {/* Compliance Badge */}
            {corridorData?.regulations && corridorData.regulations.length > 0 && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{corridorData.regulations[0].title}</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-tight">
                  {corridorData.regulations[0].description}
                </p>
              </div>
            )}
          </div>

          {/* Live Orchestration Step Visualizer */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-md">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Orchestration Pipeline</span>
              <span className="text-blue-500 font-mono text-[11px]">Active</span>
            </h3>

            {processingState !== 'idle' ? (
              <div className="space-y-4">
                
                {/* Status Callout */}
                <div className={`p-4 rounded-xl border text-xs font-medium flex items-center space-x-3 ${
                  processingState === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : processingState === 'failed'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    : processingState === 'pending_3ds' || processingState === 'pending_upi'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                    : 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                }`}>
                  <RefreshCw className={`w-4 h-4 shrink-0 ${
                    processingState !== 'success' && processingState !== 'failed' && processingState !== 'pending_3ds' && processingState !== 'pending_upi' ? 'animate-spin' : ''
                  }`} />
                  <div>
                    <div className="font-bold">
                      {processingState === 'success' && (paymentResult?.status === 'recovered' ? 'Payment Cascaded & Recovered!' : 'Payment Successfully Settled!')}
                      {processingState === 'failed' && 'Payment Declined'}
                      {processingState === 'pending_3ds' && '3-D Secure Authentication Required'}
                      {processingState === 'pending_upi' && 'UPI Collect Approval Pending'}
                      {(processingState === 'initiating' || processingState === 'routing') && 'Processing Multi-Rail Payment...'}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">{currentStepText || paymentResult?.message || paymentResult?.error}</div>
                  </div>
                </div>

                {/* 3DS Verification Modal inside card */}
                {processingState === 'pending_3ds' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Lock className="w-4 h-4 text-blue-500" />
                      <span>EU PSD2 Strong Customer Auth Challenge</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Simulate biometric verification or enter 6-digit bank SMS OTP code:
                    </p>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-1.5 text-sm font-mono tracking-widest text-center rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={handleVerify3ds}
                      disabled={verifyingAction}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow transition"
                    >
                      {verifyingAction ? 'Verifying with Issuer...' : 'Confirm 3DS OTP & Settle'}
                    </button>
                  </div>
                )}

                {/* UPI Collect Approval Modal inside card */}
                {processingState === 'pending_upi' && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <span>Approve UPI Collect Request</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Collect request sent to <b>{vpa}</b>. Approve on your PhonePe/GPay app:
                    </p>
                    <button
                      type="button"
                      onClick={handleVerifyUpi}
                      disabled={verifyingAction}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow transition"
                    >
                      {verifyingAction ? 'Confirming NPCI settlement...' : 'Approve on UPI App & Settle'}
                    </button>
                  </div>
                )}

                {/* Settlement Metadata Details */}
                {paymentResult && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Transaction ID</span>
                      <span className="font-mono text-blue-500 font-bold">{paymentResult.transaction_id}</span>
                    </div>
                    {paymentResult.provider && (
                      <div className="flex justify-between text-slate-500">
                        <span>Executed Gateway</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 uppercase">{paymentResult.provider}</span>
                      </div>
                    )}
                    {paymentResult.recovered_from && (
                      <div className="flex justify-between text-purple-500 font-semibold">
                        <span>Cascaded From</span>
                        <span className="font-mono line-through uppercase">{paymentResult.recovered_from}</span>
                      </div>
                    )}
                    {paymentResult.fee_charged !== undefined && (
                      <div className="flex justify-between text-slate-500">
                        <span>Gateway Fee</span>
                        <span className="font-mono font-semibold text-emerald-600">${paymentResult.fee_charged}</span>
                      </div>
                    )}
                    {paymentResult.latency_ms && (
                      <div className="flex justify-between text-slate-500">
                        <span>Total Latency</span>
                        <span className="font-mono">{paymentResult.latency_ms} ms</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">Fill out the payment details on the left and click Authorize to watch real-time intelligent routing, AI risk checks, and cascading fallbacks in action.</p>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

