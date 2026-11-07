/**
 * Razorpay / UPI India Gateway Simulator
 * Simulates UPI Intent, UPI Dynamic QR, and Virtual Payment Address (VPA) rails.
 */
const BasePaymentProvider = require('./base.provider');

class UPISimulatorProvider extends BasePaymentProvider {
  constructor() {
    super('razorpay_upi', 'Razorpay / UPI India Gateway');
  }

  calculateFee(amount, currency) {
    // 0.50% (capped at 15 INR) or minimal processing fee
    const fee = amount * 0.005;
    return Math.round(Math.min(fee, 25.0) * 100) / 100;
  }

  isValidVpa(vpa) {
    if (!vpa || typeof vpa !== 'string') return false;
    const vpaRegex = /^[\w.-]+@[\w.-]+$/;
    return vpaRegex.test(vpa.trim());
  }

  async processPayment(details) {
    const latency = Math.floor(Math.random() * 40) + 175;
    const rzpPaymentId = `pay_upi_${Math.random().toString(36).substring(2, 10)}`;
    const vpa = details.vpa || details.customer_vpa || 'customer@okaxis';

    // Check VPA validity if passed
    if (details.payment_method === 'upi' && details.vpa && !this.isValidVpa(vpa)) {
      return {
        success: false,
        status: 'declined',
        decline_code: 'invalid_vpa',
        decline_reason: 'The Virtual Payment Address (VPA) format is invalid.',
        gateway_reference: rzpPaymentId,
        fee_charged: 0,
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name
      };
    }

    // Dynamic QR generation
    const upiUri = `upi://pay?pa=atlaspayments@icici&pn=Atlas+FinTech&am=${details.amount.toFixed(2)}&cu=INR&tr=${rzpPaymentId}&tn=Order+Payment`;

    // UPI Collect simulation: If user triggers collect flow, return pending action
    if (details.upi_mode === 'collect_request') {
      return {
        success: false,
        status: 'pending_upi',
        gateway_reference: rzpPaymentId,
        fee_charged: 0,
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name,
        requires_action: {
          type: 'upi_collect',
          vpa: vpa,
          upi_uri: upiUri,
          instruction: `UPI collect request sent to ${vpa}. Please approve on PhonePe, Google Pay, or Paytm.`
        }
      };
    }

    const fee = this.calculateFee(details.amount, details.currency);
    return {
      success: true,
      status: 'settled',
      gateway_reference: rzpPaymentId,
      fee_charged: fee,
      latency_ms: latency,
      provider_id: this.id,
      provider_name: this.name,
      metadata: {
        vpa: vpa,
        npci_ref_id: `NPCI-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        upi_app: 'UPI Standard / Auto-switch',
        settlement_mode: 'IMPS_INSTANT'
      }
    };
  }
}

module.exports = new UPISimulatorProvider();

