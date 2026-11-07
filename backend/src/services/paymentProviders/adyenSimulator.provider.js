/**
 * Adyen Payment Gateway Simulator
 * Simulates European card processing, SEPA Direct Debit, and iDEAL rails.
 */
const BasePaymentProvider = require('./base.provider');

class AdyenSimulatorProvider extends BasePaymentProvider {
  constructor() {
    super('adyen', 'Adyen European & Global');
  }

  calculateFee(amount, currency) {
    // 1.9% + 0.12 EUR/USD
    return Math.round(((amount * 0.019) + 0.12) * 100) / 100;
  }

  async processPayment(details) {
    const latency = Math.floor(Math.random() * 50) + 260;
    const pspReference = `adyen_psp_${Math.random().toString(36).substring(2, 10)}`;

    if (details.simulate_decline === 'do_not_honor') {
      return {
        success: false,
        status: 'declined',
        decline_code: 'do_not_honor',
        decline_reason: 'Adyen refused payment: Card issuer generic decline.',
        gateway_reference: pspReference,
        fee_charged: 0,
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name
      };
    }

    const fee = this.calculateFee(details.amount, details.currency);
    return {
      success: true,
      status: 'settled',
      gateway_reference: pspReference,
      fee_charged: fee,
      latency_ms: latency,
      provider_id: this.id,
      provider_name: this.name,
      metadata: {
        payment_method_variant: details.payment_method || 'credit_card',
        auth_code: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        acquirer: 'Adyen N.V. Amsterdam'
      }
    };
  }
}

module.exports = new AdyenSimulatorProvider();

