/**
 * Stripe Payment Gateway Simulator
 * Simulates Stripe PaymentIntents API, 3-D Secure challenges, and decline codes.
 */
const BasePaymentProvider = require('./base.provider');

class StripeSimulatorProvider extends BasePaymentProvider {
  constructor() {
    super('stripe', 'Stripe Global');
  }

  calculateFee(amount, currency) {
    // 2.9% + $0.30
    return Math.round(((amount * 0.029) + 0.30) * 100) / 100;
  }

  async processPayment(details) {
    const latency = Math.floor(Math.random() * 60) + 290;
    const cardNumber = String(details.card_number || '4242424242424242').replace(/\s+/g, '');
    const last4 = cardNumber.slice(-4);
    const chargeId = `ch_stripe_${Math.random().toString(36).substring(2, 10)}`;

    // 1. Explicit or Card-based Failure Simulation
    if (details.simulate_decline === 'network_timeout' || last4 === '0003') {
      return {
        success: false,
        status: 'declined',
        decline_code: 'network_timeout',
        decline_reason: 'Stripe gateway connection timed out during card network handshake.',
        gateway_reference: chargeId,
        fee_charged: 0,
        latency_ms: 1200, // Timeout delay
        provider_id: this.id,
        provider_name: this.name
      };
    }

    if (details.simulate_decline === 'insufficient_funds' || last4 === '0002') {
      return {
        success: false,
        status: 'declined',
        decline_code: 'insufficient_funds',
        decline_reason: 'Card has insufficient funds to complete purchase.',
        gateway_reference: chargeId,
        fee_charged: 0,
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name
      };
    }

    if (details.simulate_decline === 'stolen_card' || last4 === '0005') {
      return {
        success: false,
        status: 'declined',
        decline_code: 'stolen_card',
        decline_reason: 'Card marked as stolen or lost by issuer.',
        gateway_reference: chargeId,
        fee_charged: 0,
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name
      };
    }

    // 2. 3DS Challenge Trigger (Cards ending in 3000 or EU PSD2 compliance triggered)
    if (last4 === '3000' || details.force_3ds) {
      return {
        success: false,
        status: 'pending_3ds',
        gateway_reference: chargeId,
        fee_charged: 0,
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name,
        requires_action: {
          type: '3ds_challenge',
          challenge_url: `/api/checkout/mock-3ds/${chargeId}`,
          instruction: 'Please complete biometric or SMS OTP confirmation with your issuing bank.'
        }
      };
    }

    // 3. Successful Settlement
    const fee = this.calculateFee(details.amount, details.currency);
    return {
      success: true,
      status: 'settled',
      gateway_reference: chargeId,
      fee_charged: fee,
      latency_ms: latency,
      provider_id: this.id,
      provider_name: this.name,
      metadata: {
        card_brand: details.card_brand || 'Visa',
        last4: last4 || '4242',
        cvc_check: 'pass',
        avs_zip_check: 'pass'
      }
    };
  }
}

module.exports = new StripeSimulatorProvider();

