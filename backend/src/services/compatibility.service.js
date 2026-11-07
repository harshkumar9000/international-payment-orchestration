/**
 * Payment Compatibility Engine
 * Evaluates corridor legality, regulatory compliance (3DS/PSD2, RBI, Pix),
 * and maps Country <-> Currency <-> Payment Method compatibility.
 */

const SANCTIONED_COUNTRIES = new Set(['KP', 'IR', 'SY', 'CU']);
const HIGH_RISK_COUNTRIES = new Set(['AF', 'YE', 'VE', 'MM']);

// Country metadata with default currency and supported payment rails
const COUNTRY_PROFILES = {
  US: { name: 'United States', defaultCurrency: 'USD', methods: ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay'] },
  GB: { name: 'United Kingdom', defaultCurrency: 'GBP', methods: ['credit_card', 'debit_card', 'paypal', 'apple_pay'] },
  DE: { name: 'Germany', defaultCurrency: 'EUR', methods: ['credit_card', 'debit_card', 'sepa_debit', 'sofort', 'giropay', 'paypal'] },
  FR: { name: 'France', defaultCurrency: 'EUR', methods: ['credit_card', 'debit_card', 'sepa_debit', 'paypal', 'apple_pay'] },
  NL: { name: 'Netherlands', defaultCurrency: 'EUR', methods: ['ideal', 'credit_card', 'debit_card', 'sepa_debit', 'paypal'] },
  IN: { name: 'India', defaultCurrency: 'INR', methods: ['upi', 'rupay_card', 'credit_card', 'debit_card', 'netbanking'] },
  BR: { name: 'Brazil', defaultCurrency: 'BRL', methods: ['pix', 'credit_card', 'boleto'] },
  JP: { name: 'Japan', defaultCurrency: 'JPY', methods: ['credit_card', 'paypal', 'apple_pay'] },
  CA: { name: 'Canada', defaultCurrency: 'CAD', methods: ['credit_card', 'debit_card', 'paypal', 'apple_pay'] },
  AU: { name: 'Australia', defaultCurrency: 'AUD', methods: ['credit_card', 'debit_card', 'paypal', 'apple_pay'] },
  SG: { name: 'Singapore', defaultCurrency: 'SGD', methods: ['credit_card', 'paynow', 'grabpay', 'paypal'] },
  AE: { name: 'United Arab Emirates', defaultCurrency: 'AED', methods: ['credit_card', 'apple_pay', 'paypal'] },
  MX: { name: 'Mexico', defaultCurrency: 'MXN', methods: ['credit_card', 'oxxo', 'paypal'] }
};

const PAYMENT_METHODS = {
  credit_card: {
    id: 'credit_card',
    name: 'Credit / Debit Card',
    icon: 'credit-card',
    required_fields: ['card_number', 'expiry', 'cvc', 'cardholder_name'],
    settlement_type: 'Instant authorization',
    global: true
  },
  paypal: {
    id: 'paypal',
    name: 'PayPal Sandbox / Wallet',
    icon: 'paypal',
    required_fields: ['paypal_account'],
    settlement_type: 'Instant wallet transfer',
    global: true
  },
  upi: {
    id: 'upi',
    name: 'UPI (PhonePe, GPay, Paytm, BHIM)',
    icon: 'smartphone',
    required_fields: ['vpa'],
    settlement_type: 'Instant 24x7 IMPS Rail',
    global: false
  },
  sepa_debit: {
    id: 'sepa_debit',
    name: 'SEPA Direct Debit',
    icon: 'building-2',
    required_fields: ['iban', 'account_holder'],
    settlement_type: 'T+1 European Clearing',
    global: false
  },
  ideal: {
    id: 'ideal',
    name: 'iDEAL Dutch Online Banking',
    icon: 'landmark',
    required_fields: ['issuer_bank'],
    settlement_type: 'Instant Bank Clearing',
    global: false
  },
  pix: {
    id: 'pix',
    name: 'Pix Instant Central Bank Rails',
    icon: 'zap',
    required_fields: ['tax_id'], // CPF in Brazil
    settlement_type: 'Instant 24/7 BCB Clearing',
    global: false
  }
};

/**
 * Validates corridor and returns compatible methods, regulations, and warnings.
 */
function checkCompatibility(countryCode, requestedCurrency = null, amount = 100) {
  const code = (countryCode || 'US').toUpperCase();

  // 1. Sanctions Check
  if (SANCTIONED_COUNTRIES.has(code)) {
    return {
      compatible: false,
      blocked: true,
      reason: 'SANCTIONED_JURISDICTION',
      message: `Transactions to or from ${code} are prohibited under international trade sanctions (OFAC / FATF).`,
      compatible_methods: [],
      regulations: []
    };
  }

  const isHighRisk = HIGH_RISK_COUNTRIES.has(code);
  const countryProfile = COUNTRY_PROFILES[code] || {
    name: `Country (${code})`,
    defaultCurrency: 'USD',
    methods: ['credit_card', 'paypal']
  };

  const currency = requestedCurrency ? requestedCurrency.toUpperCase() : countryProfile.defaultCurrency;

  // Regulatory Requirements
  const regulations = [];
  if (['DE', 'FR', 'NL', 'ES', 'IT', 'IE', 'BE'].includes(code)) {
    regulations.push({
      rule: 'EU_PSD2_SCA',
      title: 'Strong Customer Authentication (PSD2)',
      description: 'Mandatory 3-D Secure 2.2 authentication challenge enforced for electronic payments.'
    });
  }

  if (code === 'IN') {
    regulations.push({
      rule: 'RBI_2FA_TOKENIZATION',
      title: 'Reserve Bank of India (RBI) Regulations',
      description: 'Card tokenization and explicit Two-Factor Authentication (OTP/UPI PIN) required.'
    });
  }

  if (code === 'BR') {
    regulations.push({
      rule: 'BCB_PIX_TAX_ID',
      title: 'Banco Central do Brasil Pix Standards',
      description: 'Customer CPF/CNPJ tax identifier mandatory for instant Pix QR settlement.'
    });
  }

  // Determine available methods
  const compatibleMethods = countryProfile.methods.map(methodId => {
    const info = PAYMENT_METHODS[methodId] || {
      id: methodId,
      name: methodId.replace('_', ' ').toUpperCase(),
      required_fields: []
    };
    return {
      ...info,
      recommended: (code === 'IN' && methodId === 'upi') || (code === 'BR' && methodId === 'pix') || (code === 'DE' && methodId === 'sepa_debit')
    };
  });

  return {
    compatible: true,
    blocked: false,
    country_code: code,
    country_name: countryProfile.name,
    default_currency: countryProfile.defaultCurrency,
    evaluated_currency: currency,
    is_high_risk: isHighRisk,
    regulations: regulations,
    compatible_methods: compatibleMethods
  };
}

function getCorridorMatrix() {
  return {
    countries: COUNTRY_PROFILES,
    methods: PAYMENT_METHODS
  };
}

module.exports = {
  checkCompatibility,
  getCorridorMatrix,
  SANCTIONED_COUNTRIES
};

