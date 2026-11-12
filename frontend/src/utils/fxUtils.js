/**
 * Foreign Exchange (FX) Calculation and Formatting Utilities
 *
 * Enforces strict validation:
 * - FX rate must be a finite, positive number (> 0).
 * - Never displays ₹0.00 or fabricated live rates when rates are missing or failed.
 * - Displays "FX rate unavailable" upon loading/API failure.
 * - Reconciles conversion spread and total INR payable accurately.
 */

/**
 * Extracts and strictly validates the exchange rate from a conversion object.
 * Returns the positive finite rate as a number, or null if invalid/missing.
 */
export function parseFxRate(conversion) {
  if (!conversion || typeof conversion !== 'object') {
    return null;
  }

  const rawRate = conversion.mid_market_rate ?? conversion.exchange_rate ?? conversion.rate;
  if (rawRate === null || rawRate === undefined || rawRate === '') {
    return null;
  }

  const num = typeof rawRate === 'number' ? rawRate : parseFloat(rawRate);
  if (!Number.isFinite(num) || num <= 0 || Number.isNaN(num)) {
    return null;
  }

  return num;
}

/**
 * Extracts and validates the markup/spread fee from a conversion object.
 * Returns the non-negative finite markup amount as a number, or null if invalid/missing.
 */
export function parseMarkupAmount(conversion) {
  if (!conversion || typeof conversion !== 'object') {
    return null;
  }

  const rawMarkup = conversion.markup_amount ?? conversion.markup_fee ?? conversion.markup;
  if (rawMarkup === null || rawMarkup === undefined || rawMarkup === '') {
    return null;
  }

  const num = typeof rawMarkup === 'number' ? rawMarkup : parseFloat(rawMarkup);
  if (!Number.isFinite(num) || num < 0 || Number.isNaN(num)) {
    return null;
  }

  return num;
}

/**
 * Extracts and validates the total converted amount in target currency (e.g. INR).
 * Returns the positive finite amount as a number, or null if invalid/missing.
 */
export function parseConvertedAmount(conversion) {
  if (!conversion || typeof conversion !== 'object') {
    return null;
  }

  const rawAmount = conversion.converted_amount ?? conversion.total_inr ?? conversion.total_amount;
  if (rawAmount === null || rawAmount === undefined || rawAmount === '') {
    return null;
  }

  const num = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount);
  if (!Number.isFinite(num) || num <= 0 || Number.isNaN(num)) {
    return null;
  }

  return num;
}

/**
 * Formats the mid-market rate display string for payment summary.
 * Never outputs ₹0.00.
 */
export function formatFxRateDisplay(conversion, currency, loading = false) {
  if (loading) {
    return 'Updating FX rate...';
  }

  if (!currency) {
    return 'Select destination country';
  }

  const rate = parseFxRate(conversion);
  if (rate === null) {
    return 'FX rate unavailable';
  }

  return `1 ${currency} = ₹${rate.toFixed(2)} INR`;
}

/**
 * Formats the conversion spread display string.
 */
export function formatMarkupDisplay(conversion, loading = false) {
  if (loading) {
    return 'Calculating...';
  }

  const markup = parseMarkupAmount(conversion);
  if (markup === null) {
    return 'Unavailable';
  }

  return `₹${markup.toFixed(2)} INR`;
}

/**
 * Formats the total payable amount in INR.
 */
export function formatTotalPayableDisplay(conversion, loading = false) {
  if (loading) {
    return 'Calculating...';
  }

  const total = parseConvertedAmount(conversion);
  if (total === null) {
    return 'Unavailable';
  }

  return `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

