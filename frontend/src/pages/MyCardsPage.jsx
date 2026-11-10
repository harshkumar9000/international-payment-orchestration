import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Sparkles,
  Info,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  Eye,
  Building2
} from 'lucide-react';

const INDIAN_BANKS = [
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Canara Bank',
  'IndusInd Bank'
];

export default function MyCardsPage({ setActivePage }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCardDetails, setSelectedCardDetails] = useState(null);

  // Form states
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedNetwork, setSelectedNetwork] = useState('RuPay');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Auto-detection based on input
  const cleanNumber = cardNumber.replace(/\D/g, '');
  const detectedBin = cleanNumber.slice(0, 6);

  // Load cards from API
  async function loadCards() {
    setLoading(true);
    try {
      const res = await api.cards.list();
      setCards(res.cards || []);
    } catch (err) {
      console.error('[Load Cards Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCards();
  }, []);

  // Detect card network and international support live as user types
  useEffect(() => {
    if (cleanNumber.startsWith('4')) {
      setSelectedNetwork('Visa');
    } else if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
      setSelectedNetwork('Mastercard');
    } else if (cleanNumber.startsWith('60') || cleanNumber.startsWith('65') || cleanNumber.startsWith('81') || cleanNumber.startsWith('82')) {
      setSelectedNetwork('RuPay');
    }
  }, [cleanNumber]);

  function formatCardNumberInput(val) {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  }

  function formatExpiryInput(val) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  }

  // Determine readiness hint in modal
  function getLiveSupportPreview() {
    if (cleanNumber.length < 4) return null;
    if (selectedNetwork === 'RuPay') {
      if (detectedBin.startsWith('6521') || detectedBin.startsWith('6522') || detectedBin.startsWith('6080')) {
        return {
          status: 'SUPPORTED',
          label: 'RuPay Global (International Enabled)',
          desc: 'Co-badged with Discover & Diners Club. Fully supported for overseas cross-border transactions.',
          badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        };
      }
      if (detectedBin.startsWith('6070') || detectedBin.startsWith('6071') || detectedBin.startsWith('6072')) {
        return {
          status: 'DOMESTIC_ONLY',
          label: 'RuPay Classic (Domestic Only)',
          desc: 'Domestic PMJDY / basic debit card. Not supported for foreign currency online purchases.',
          badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
        };
      }
      return {
        status: 'VERIFICATION_REQUIRED',
        label: 'RuPay Card (Verification Required)',
        desc: 'Card eligibility depends on your issuing bank netbanking international e-commerce settings.',
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
      };
    }
    return {
      status: 'SUPPORTED',
      label: `${selectedNetwork} International`,
      desc: 'Standard international network accepted across 200+ countries with 3D Secure verification.',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    };
  }

  async function handleAddCard(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    if (!cardholderName || !cardholderName.trim() || cardholderName.trim().length < 2) {
      setFormError('Please enter the full cardholder name as printed on the card.');
      setSubmitting(false);
      return;
    }

    if (cleanNumber.length < 15 || cleanNumber.length > 19) {
      setFormError('Please enter a valid 15 or 16-digit card number.');
      setSubmitting(false);
      return;
    }

    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      setFormError('Expiry date must be in MM/YY format (e.g. 12/28).');
      setSubmitting(false);
      return;
    }

    const month = parseInt(expiryMatch[1], 10);
    if (month < 1 || month > 12) {
      setFormError('Expiry month must be between 01 and 12.');
      setSubmitting(false);
      return;
    }

    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      setFormError('CVV security code must be 3 or 4 digits.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.cards.create({
        cardholder_name: cardholderName.trim(),
        card_number: cleanNumber,
        expiry: expiry.trim(),
        cvv: cvv.trim(), // Transmitted for mock tokenization, NEVER stored
        network: selectedNetwork,
        issuing_bank: selectedBank,
        is_default: isDefault
      });

      if (res.success) {
        setSuccessNotice(`Card ending in ${res.card.last_four} securely tokenized and linked!`);
        setShowAddModal(false);
        // Reset form
        setCardholderName('');
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setIsDefault(false);
        loadCards();
        setTimeout(() => setSuccessNotice(''), 4000);
      }
    } catch (err) {
      console.error('[Card Linking Failure]:', {
        network: selectedNetwork,
        bin: cleanNumber.slice(0, 6),
        lastFour: cleanNumber.slice(-4),
        status: err.status,
        message: err.message
      });

      let friendlyMsg = err.message || 'Failed to link card. Please try again.';
      if (err.isNetworkError || err.message === 'Failed to fetch') {
        friendlyMsg = 'Unable to connect to payment service. Please ensure the backend server is reachable.';
      } else if (err.status === 401) {
        friendlyMsg = 'Authentication required. Please sign in again to link cards.';
      } else if (err.status === 400) {
        friendlyMsg = err.message || 'Card details could not be validated. Please check the details entered.';
      } else if (err.status >= 500) {
        friendlyMsg = 'Card linking service is temporarily unavailable. Database operation failed.';
      }

      setFormError(friendlyMsg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetDefault(id) {
    try {
      await api.cards.setDefault(id);
      loadCards();
    } catch (err) {
      console.error('[Set Default Error]:', err);
      alert(err.message || 'Unable to update default card. Please try again.');
    }
  }

  async function handleRemoveCard(id) {
    if (!window.confirm('Are you sure you want to remove this linked payment card?')) {
      return;
    }
    try {
      await api.cards.delete(id);
      loadCards();
    } catch (err) {
      console.error('[Remove Card Error]:', err);
      alert(err.message || 'Unable to remove card. Please try again.');
    }
  }

  const livePreview = getLiveSupportPreview();

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#DEDEDE] dark:border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white rounded border border-[#DEDEDE] dark:border-[#333333]">
              Domestic Rails
            </span>
            <span className="text-xs text-slate-400">• Tokenized Storage</span>
          </div>
          <h1 className="page-heading text-[28px] sm:text-[32px] font-semibold text-slate-900 dark:text-white tracking-[-0.025em] leading-tight">
            My Payment Cards
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
            Manage your domestic Indian payment cards and verify cross-border e-commerce eligibility.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-[14px] shadow-md shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Card</span>
          </button>
          <button
            onClick={() => setActivePage('checkout')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-slate-100 font-semibold text-[14px] border border-slate-700/60 flex items-center gap-2 cursor-pointer transition-all"
          >
            <CreditCard className="w-4 h-4 text-[#111111] dark:text-white" />
            <span>Go to Checkout</span>
          </button>
        </div>
      </div>

      {/* Security & Tokenization Notice */}
      <div className="p-4 rounded-xl bg-teal-500/5 border border-[#DEDEDE] dark:border-[#333333] flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <ShieldCheck className="w-5 h-5 text-[#111111] dark:text-white shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-900 dark:text-white">
            Bank-Grade Simulated Tokenization
          </p>
          <p className="leading-relaxed text-slate-500 dark:text-slate-400">
            For security compliance, full card numbers and CVVs are <strong>never stored</strong> in our application database. In this demo sandbox, cards are replaced with secure mock vault tokens (<code className="font-mono text-[#111111] dark:text-white">tok_sim_...</code>).
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Linked Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">
          Loading linked payment cards...
        </div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#EEEEEE] dark:bg-[#1A1A1A] flex items-center justify-center text-[#111111] dark:text-white">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Payment Cards Linked Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your RuPay, Visa, or Mastercard to pay international merchants effortlessly.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold hover:bg-[#222222] dark:hover:bg-[#EEEEEE] transition-all cursor-pointer"
          >
            Add Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const isSupported = card.international_support === 'SUPPORTED';
            const isDomesticOnly = card.international_support === 'DOMESTIC_ONLY';

            return (
              <div
                key={card.id}
                className={`relative flex flex-col justify-between rounded-2xl p-6 border transition-all duration-200 overflow-hidden ${
                  card.is_default
                    ? 'border-black dark:border-white/50 shadow-lg shadow-teal-500/10 bg-gradient-to-br from-slate-900 via-[#0d1624] to-[#0a2327]'
                    : 'border-[#DEDEDE] dark:border-[#222222] bg-white dark:bg-[#080808] hover:border-slate-700'
                }`}
              >
                {/* Visual Card Elements */}
                <div>
                  {/* Top Bar: Bank Name + Network Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                      {card.issuing_bank}
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg bg-white/10 text-white backdrop-blur-md">
                      {card.network}
                    </span>
                  </div>

                  {/* Card Chip & Contactless */}
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-sm flex items-center justify-center p-1 border border-amber-200/40">
                      <div className="w-full h-full border border-amber-600/30 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                        <div className="border border-amber-600/30 rounded-[1px]" />
                        <div className="border border-amber-600/30 rounded-[1px]" />
                        <div className="border border-amber-600/30 rounded-[1px]" />
                        <div className="border border-amber-600/30 rounded-[1px]" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">EMV Contactless</span>
                  </div>

                  {/* Masked Card Number */}
                  <div className="font-mono text-lg font-bold tracking-widest text-slate-800 dark:text-white mb-4">
                    {card.card_number_masked}
                  </div>

                  {/* Cardholder + Expiry */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Cardholder</div>
                      <div className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                        {card.cardholder_name}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Expires</div>
                      <div className="font-mono font-bold text-slate-700 dark:text-slate-200">
                        {card.expiry}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Status & Actions Footer */}
                <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Cross-Border Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        isSupported
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isDomesticOnly
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                      }`}
                    >
                      {isSupported ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{card.international_support_label}</span>
                    </span>
                  </div>

                  {/* Badges / Notes */}
                  {card.is_default && (
                    <div className="text-[11px] font-semibold text-[#111111] dark:text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <span>Default Payment Method</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => setSelectedCardDetails(card)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {!card.is_default && (
                        <button
                          onClick={() => handleSetDefault(card.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-[#111111] dark:text-white hover:text-[#111111] dark:text-white hover:bg-[#222222] dark:hover:bg-[#EEEEEE]/10 rounded cursor-pointer transition-all"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveCard(card.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                        title="Remove Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DEDEDE] dark:border-[#222222]">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Link Payment Card
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supports Indian RuPay, Visa, and Mastercard
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCard} className="space-y-4">
              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swapnil Sharma"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                />
              </div>

              {/* Card Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Card Number
                  </label>
                  <span className="text-[10px] font-mono text-[#111111] dark:text-white font-bold uppercase">
                    Detected: {selectedNetwork}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="6521 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono tracking-wider bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                />
              </div>

              {/* Live Support Indicator */}
              {livePreview && (
                <div className={`p-3 rounded-xl border text-xs space-y-1 ${livePreview.badgeColor}`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{livePreview.label}</span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {livePreview.desc}
                  </p>
                </div>
              )}

              {/* Network and Bank Dropdowns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Card Network
                  </label>
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  >
                    <option value="RuPay">RuPay</option>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issuing Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  >
                    {INDIAN_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      CVV / CVC
                    </label>
                    <span className="text-[9px] text-slate-400">Never stored</span>
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                  />
                </div>
              </div>

              {/* Set Default Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-700 text-teal-600 focus:ring-black dark:focus:ring-white w-4 h-4"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Set as default payment card for checkout
                </span>
              </label>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DEDEDE] dark:border-[#222222]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md shadow-sm disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submitting ? 'Tokenizing Card...' : 'Link Card Securely'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Details Modal */}
      {selectedCardDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Card Information & Compliance
              </h3>
              <button
                onClick={() => setSelectedCardDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Cardholder:</span>
                <span className="font-semibold text-white">{selectedCardDetails.cardholder_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Masked Number:</span>
                <span className="font-mono font-semibold text-white">{selectedCardDetails.card_number_masked}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">BIN Identifier:</span>
                <span className="font-mono text-[#111111] dark:text-white">{selectedCardDetails.bin || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Card Classification:</span>
                <span className="text-slate-200">{selectedCardDetails.card_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Issuing Bank:</span>
                <span className="text-slate-200">{selectedCardDetails.issuing_bank}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Vault Token:</span>
                <span className="font-mono text-[10px] text-[#111111] dark:text-white">{selectedCardDetails.token}</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Cross-Border Eligibility Note:</span>
                <p className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                  {selectedCardDetails.international_support_notes}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCardDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

