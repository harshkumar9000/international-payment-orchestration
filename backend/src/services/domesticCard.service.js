/**
 * Domestic Card & UPI Cross-Border Service
 * Orchestrates Indian domestic cards (RuPay BINs, dual-network verification)
 * and UPI International corridors with regulatory LRS and TCS compliance.
 */
const pythonBridge = require('./pythonBridge.service');

async function checkEligibility(details) {
  const method = details.payment_method === 'upi' ? 'upi' : 'card';
  const cardBin = String(details.card_bin || details.bin || (details.card_number ? details.card_number.replace(/\s+/g, '') : '6521')).trim();
  const country = String(details.merchant_country || details.destination_country || 'US').toUpperCase();
  const currency = String(details.currency || details.destination_currency || 'USD').toUpperCase();
  const amountInr = parseFloat(details.amount_inr || 0);
  const amountUsd = parseFloat(details.amount_usd || (amountInr > 0 ? amountInr / 86.45 : 100));

  const payload = {
    payment_method: method === 'upi' ? 'upi' : 'rupay_card',
    card_number: details.card_number || cardBin,
    bin: cardBin.substring(0, 6),
    card_bin: cardBin,
    currency,
    merchant_country: country,
    destination_country: country,
    destination_currency: currency,
    amount_usd: amountUsd,
    amount_inr: amountInr,
    is_educational: Boolean(details.is_educational),
    annual_remittance_usd: parseFloat(details.annual_remittance_usd || 12000)
  };

  const res = await pythonBridge.checkDomesticCardEligibility(payload);
  return {
    ...res,
    status: res.eligible ? 'SUPPORTED' : 'NOT_SUPPORTED',
    reason: res.rejection_reason || res.reason || null
  };
}

function calculateTcs(amountInr, isEducational = false) {
  const threshold = 700000.0;
  if (amountInr <= threshold) {
    return {
      tcs_applicable: false,
      threshold_inr: threshold,
      taxable_amount_inr: 0,
      tcs_rate_percent: 0,
      tcs_amount_inr: 0
    };
  }

  const rate = isEducational ? 5.0 : 20.0;
  const taxable = amountInr - threshold;
  const tcs = Math.round(taxable * (rate / 100.0) * 100) / 100;

  return {
    tcs_applicable: true,
    threshold_inr: threshold,
    taxable_amount_inr: taxable,
    tcs_rate_percent: rate,
    tcs_amount_inr: tcs
  };
}

module.exports = {
  checkEligibility,
  calculateTcs
};

