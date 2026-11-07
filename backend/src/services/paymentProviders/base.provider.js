/**
 * Base Payment Provider Interface
 */
class BasePaymentProvider {
  constructor(id, name, config = {}) {
    this.id = id;
    this.name = name;
    this.config = config;
  }

  async processPayment(paymentDetails) {
    throw new Error(`processPayment not implemented in ${this.name}`);
  }

  async verifyPayment(verificationDetails) {
    throw new Error(`verifyPayment not implemented in ${this.name}`);
  }

  async refund(transactionId, amount) {
    const refundId = `re_${this.id}_${Math.random().toString(36).substring(2, 10)}`;
    return {
      success: true,
      status: 'refunded',
      refund_id: refundId,
      amount: amount,
      provider_id: this.id,
      timestamp: new Date().toISOString()
    };
  }

  calculateFee(amount, currency) {
    // Default fallback fee: 2.9% + 0.30
    return Math.round(((amount * 0.029) + 0.30) * 100) / 100;
  }
}

module.exports = BasePaymentProvider;

