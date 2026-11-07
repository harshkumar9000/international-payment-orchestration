/**
 * dLocal Emerging Corridors Simulator
 * Simulates Brazilian Pix, Mexican OXXO vouchers, and local LATAM payment rails.
 */
const BasePaymentProvider = require('./base.provider');

class DLocalSimulatorProvider extends BasePaymentProvider {
  constructor() {
    super('dlocal', 'dLocal Emerging Corridors');
  }

  calculateFee(amount, currency) {
    // 2.4% + 0.20 USD equivalent
    return Math.round(((amount * 0.024) + 0.20) * 100) / 100;
  }

  async processPayment(details) {
    const latency = Math.floor(Math.random() * 60) + 380;
    const paymentId = `dl_${Math.random().toString(36).substring(2, 10)}`;

    // Pix generation
    if (details.payment_method === 'pix' || details.currency === 'BRL') {
      const pixKey = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 16)}5204000053039865406${details.amount.toFixed(2)}5802BR5912ATLASPAY6009SAOPAULO62070503***6304`;
      return {
        success: true,
        status: 'settled',
        gateway_reference: paymentId,
        fee_charged: this.calculateFee(details.amount, details.currency),
        latency_ms: latency,
        provider_id: this.id,
        provider_name: this.name,
        metadata: {
          pix_copia_e_cola: pixKey,
          end_to_end_id: `E${Date.now()}${Math.random().toString(36).substring(2, 8)}`,
          clearing_system: 'BCB SPI Instant Rails'
        }
      };
    }

    const fee = this.calculateFee(details.amount, details.currency);
    return {
      success: true,
      status: 'settled',
      gateway_reference: paymentId,
      fee_charged: fee,
      latency_ms: latency,
      provider_id: this.id,
      provider_name: this.name,
      metadata: {
        payment_method: details.payment_method || 'local_apm',
        clearing_country: details.customer_country || 'BR'
      }
    };
  }
}

module.exports = new DLocalSimulatorProvider();

