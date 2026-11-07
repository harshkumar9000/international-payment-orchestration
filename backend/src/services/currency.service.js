/**
 * Currency Conversion Engine
 * Manages live/cached FX rates, multi-currency conversions, and merchant markup spread.
 */

// Exchange rates relative to USD (1 USD = X target currency)
const LIVE_FX_RATES = {
  USD: 1.000000,
  EUR: 0.923400,
  GBP: 0.781200,
  INR: 86.450000,
  JPY: 152.300000,
  CAD: 1.392000,
  AUD: 1.521000,
  BRL: 5.750000,
  SGD: 1.328000,
  AED: 3.672500,
  CHF: 0.884000,
  MXN: 20.150000,
  CNY: 7.215000,
  SEK: 10.720000,
  NZD: 1.685000,
  ZAR: 18.250000,
  HKD: 7.780000,
  DKK: 6.890000,
  NOK: 10.980000,
  PLN: 4.080000
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'AU$',
  BRL: 'R$',
  SGD: 'S$',
  AED: 'AED',
  CHF: 'CHF',
  MXN: 'Mex$',
  CNY: '¥',
  SEK: 'kr',
  NZD: 'NZ$',
  ZAR: 'R',
  HKD: 'HK$',
  DKK: 'kr',
  NOK: 'kr',
  PLN: 'zł'
};

const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'CLP', 'PYG']);

function getDecimals(currency) {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 0 : 2;
}

function getRates() {
  return {
    base: 'USD',
    rates: LIVE_FX_RATES,
    symbols: CURRENCY_SYMBOLS,
    last_updated: new Date().toISOString()
  };
}

/**
 * Converts an amount from source currency to target currency with merchant markup.
 */
function convertAmount(amount, fromCurrency, toCurrency, markupPercentage = 1.25) {
  fromCurrency = fromCurrency.toUpperCase();
  toCurrency = toCurrency.toUpperCase();
  amount = parseFloat(amount) || 0;

  const rateFrom = LIVE_FX_RATES[fromCurrency] || 1.0;
  const rateTo = LIVE_FX_RATES[toCurrency] || 1.0;

  // Mid-market conversion rate: 1 fromCurrency = X toCurrency
  const midMarketRate = rateTo / rateFrom;

  // Amount in target currency before markup
  const baseTargetAmount = amount * midMarketRate;

  // Apply markup / FX spread (e.g. 1.25%)
  const markupFactor = 1 + (markupPercentage / 100);
  const finalTargetAmount = baseTargetAmount * markupFactor;
  const effectiveExchangeRate = midMarketRate * markupFactor;

  const decimals = getDecimals(toCurrency);
  const roundedAmount = Number(finalTargetAmount.toFixed(decimals));
  const markupAmount = Number((finalTargetAmount - baseTargetAmount).toFixed(decimals));

  return {
    from_currency: fromCurrency,
    to_currency: toCurrency,
    original_amount: amount,
    converted_amount: roundedAmount,
    mid_market_rate: Number(midMarketRate.toFixed(6)),
    effective_rate: Number(effectiveExchangeRate.toFixed(6)),
    markup_percentage: markupPercentage,
    markup_amount: markupAmount,
    symbol: CURRENCY_SYMBOLS[toCurrency] || toCurrency,
    decimals: decimals,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getRates,
  convertAmount,
  getDecimals,
  LIVE_FX_RATES,
  CURRENCY_SYMBOLS
};

