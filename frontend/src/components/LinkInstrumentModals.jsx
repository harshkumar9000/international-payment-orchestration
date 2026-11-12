import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  CreditCard,
  Building2,
  X,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const ISSUING_BANKS = [
  'HDFC Bank',
  'State Bank of India (SBI)',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
  'Bank of Baroda',
  'Chase Bank',
  'Citibank',
  'HSBC Global'
];

export function AddCardModal({ isOpen, onClose, onSuccess }) {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedNetwork, setSelectedNetwork] = useState('RuPay');
  const [isDefault, setIsDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const cleanNumber = cardNumber.replace(/\D/g, '');
  const detectedBin = cleanNumber.slice(0, 6);

  useEffect(() => {
    if (cleanNumber.startsWith('4')) {
      setSelectedNetwork('Visa');
    } else if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
      setSelectedNetwork('Mastercard');
    } else if (
      cleanNumber.startsWith('60') ||
      cleanNumber.startsWith('65') ||
      cleanNumber.startsWith('81') ||
      cleanNumber.startsWith('82')
    ) {
      setSelectedNetwork('RuPay');
    }
  }, [cleanNumber]);

  if (!isOpen) return null;

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

  function getLiveSupportPreview() {
    if (cleanNumber.length < 4) return null;
    if (selectedNetwork === 'RuPay') {
      if (detectedBin.startsWith('6521') || detectedBin.startsWith('6522') || detectedBin.startsWith('6080')) {
        return {
          label: 'RuPay Global (International Enabled)',
          desc: 'Co-badged with Discover & Diners Club for cross-border payments.'
        };
      }
      if (detectedBin.startsWith('6070') || detectedBin.startsWith('6071') || detectedBin.startsWith('6072')) {
        return {
          label: 'RuPay Classic (Domestic Only)',
          desc: 'Domestic debit card. International online billing disabled by issuer.'
        };
      }
      return {
        label: 'RuPay Card (Verification Required)',
        desc: 'Eligibility depends on issuing bank international e-commerce activation.'
      };
    }
    return {
      label: `${selectedNetwork} International`,
      desc: 'Accepted across 200+ countries with 3D Secure verification.'
    };
  }

  const livePreview = getLiveSupportPreview();

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!cardholderName || cardholderName.trim().length < 2) {
      setFormError('Please enter the full cardholder name.');
      return;
    }
    if (cleanNumber.length < 15 || cleanNumber.length > 19) {
      setFormError('Please enter a valid 15 or 16-digit card number.');
      return;
    }
    const expiryMatch = expiry.match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch || parseInt(expiryMatch[1], 10) < 1 || parseInt(expiryMatch[1], 10) > 12) {
      setFormError('Expiry date must be valid in MM/YY format.');
      return;
    }
    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      setFormError('CVV security code must be 3 or 4 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.cards.create({
        cardholder_name: cardholderName.trim(),
        card_number: cleanNumber,
        expiry: expiry.trim(),
        cvv: cvv.trim(),
        network: selectedNetwork,
        issuing_bank: selectedBank,
        is_default: isDefault
      });

      if (res.success) {
        setCardholderName('');
        setCardNumber('');
        setExpiry('');
        setCvv('');
        if (onSuccess) onSuccess(res.card);
        onClose();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to link payment card.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-card-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#DEDEDE] dark:border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-card-modal-title" className="text-base font-semibold text-[#111111] dark:text-white">
                Add Payment Card
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999]">
                Tokenize RuPay, Visa, or Mastercard — zero full PAN/CVV storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Add Card modal"
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#141414] border border-[#111111] dark:border-[#444444] text-[#111111] dark:text-white text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Arjun Mehta"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#111111] dark:text-[#DDDDDD]">
                Card Number
              </label>
              <span className="text-[10px] font-mono font-semibold uppercase text-[#666666] dark:text-[#999999]">
                Detected: {selectedNetwork}
              </span>
            </div>
            <input
              type="text"
              required
              placeholder="6521 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono tracking-wider bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>

          {livePreview && (
            <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#2B2B2B] text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#111111] dark:text-white">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{livePreview.label}</span>
              </div>
              <p className="text-[11px] text-[#666666] dark:text-[#999999] leading-relaxed">
                {livePreview.desc}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Card Network
              </label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="RuPay">RuPay</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Issuing Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                {ISSUING_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                required
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiryInput(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#111111] dark:text-[#DDDDDD]">
                  CVV / CVC
                </label>
                <span className="text-[10px] text-[#666666] dark:text-[#999999]">Never stored</span>
              </div>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="•••"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-[#999999] text-black focus:ring-black w-4 h-4 accent-black dark:accent-white"
            />
            <span className="text-xs text-[#666666] dark:text-[#999999]">
              Set as default payment card
            </span>
          </label>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DEDEDE] dark:border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-xs disabled:opacity-50 cursor-pointer transition-all"
            >
              {submitting ? 'Tokenizing Card...' : 'Link Card Securely'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LinkBankAccountModal({ isOpen, onClose, onSuccess }) {
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingCode, setRoutingCode] = useState('');
  const [accountType, setAccountType] = useState('checking');
  const [currency, setCurrency] = useState('USD');
  const [country, setCountry] = useState('US');
  const [isDefault, setIsDefault] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const cleanAcct = accountNumber.replace(/\D/g, '');
    if (!accountHolderName || accountHolderName.trim().length < 2) {
      setFormError('Please enter the account holder name.');
      return;
    }
    if (!bankName || bankName.trim().length < 2) {
      setFormError('Please enter or select your bank name.');
      return;
    }
    if (cleanAcct.length < 6 || cleanAcct.length > 20) {
      setFormError('Bank account number must be between 6 and 20 digits.');
      return;
    }
    if (!routingCode || routingCode.trim().length < 4) {
      setFormError('Please enter a valid IFSC, SWIFT, or ACH Routing code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.bankAccounts.create({
        account_holder_name: accountHolderName.trim(),
        bank_name: bankName.trim(),
        account_number: cleanAcct,
        routing_code: routingCode.trim().toUpperCase(),
        account_type: accountType,
        currency,
        country,
        is_default: isDefault
      });

      if (res.success) {
        setAccountHolderName('');
        setAccountNumber('');
        setRoutingCode('');
        if (onSuccess) onSuccess(res.bank_account);
        onClose();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to link bank account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-bank-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#DEDEDE] dark:border-[#222222]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="link-bank-modal-title" className="text-base font-semibold text-[#111111] dark:text-white">
                Link Bank Account
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999]">
                Connect an ACH, SEPA, SWIFT, or IMPS settlement account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Link Bank Account modal"
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#141414] border border-[#111111] dark:border-[#444444] text-[#111111] dark:text-white text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Acme Global Corp"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Bank Institution
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                {ISSUING_BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Account Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 501002394812"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 20))}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                IFSC / SWIFT / Routing Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC0000240"
                value={routingCode}
                onChange={(e) => setRoutingCode(e.target.value.toUpperCase().slice(0, 20))}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono uppercase bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="checking">Checking</option>
                <option value="current">Current</option>
                <option value="savings">Savings</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111111] dark:text-[#DDDDDD] mb-1">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              >
                <option value="US">United States</option>
                <option value="IN">India</option>
                <option value="EU">European Union</option>
                <option value="GB">United Kingdom</option>
              </select>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#2B2B2B] flex items-center gap-2.5 text-[11px] text-[#666666] dark:text-[#999999]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#111111] dark:text-white" />
            <span>
              Account numbers are masked immediately on ingestion and stored as tokenized settlement rails.
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-[#999999] text-black focus:ring-black w-4 h-4 accent-black dark:accent-white"
            />
            <span className="text-xs text-[#666666] dark:text-[#999999]">
              Set as primary settlement bank account
            </span>
          </label>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#DEDEDE] dark:border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-full bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-xs disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Linking Account...' : 'Link Bank Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

