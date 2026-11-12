/**
 * Official PayPal REST API v2 Integration Service
 *
 * Implements:
 * - OAuth 2.0 Client Credentials token management with caching
 * - PayPal Orders API v2 (Order Creation and Capture)
 * - PayPal Webhook Signature Verification and Event Processing
 * - RBI/India cross-border corridor compliance checks
 * - Strict server-side amount and currency validation
 * - Idempotency via PayPal-Request-Id headers
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');

class PayPalService {
  constructor() {
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
    this.mockOrders = new Map();
    this.activeWebhookLocks = new Set();

    // Standard currencies supported for PayPal cross-border international checkout
    this.SUPPORTED_CURRENCIES = new Set([
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'JPY',
      'CHF', 'NZD', 'HKD', 'SEK', 'NOK', 'DKK', 'PLN',
      'ILS', 'THB', 'MXN', 'BRL', 'TWD'
    ]);
  }

  /**
   * Determine the target PayPal environment. Defaults strictly to 'sandbox'.
   */
  getEnvironment() {
    const env = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase().trim();
    return (env === 'live' || env === 'production') ? 'live' : 'sandbox';
  }

  /**
   * Get the PayPal REST API base URL. Never defaults to live.
   */
  getApiBaseUrl() {
    return this.getEnvironment() === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  getClientId() {
    return (process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || '').trim();
  }

  getClientSecret() {
    return (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  }

  getWebhookId() {
    return (process.env.PAYPAL_WEBHOOK_ID || '').trim();
  }

  isConfigured() {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  /**
   * Public configuration safe to expose to client-side SDK.
   * NEVER exposes client secret.
   */
  getPublicConfig() {
    const isSandbox = this.getEnvironment() === 'sandbox';
    return {
      is_configured: this.isConfigured(),
      env: this.getEnvironment(),
      client_id: this.getClientId() || null,
      api_base: this.getApiBaseUrl(),
      is_sandbox: isSandbox,
      supported_currencies: Array.from(this.SUPPORTED_CURRENCIES),
      cross_border_rules: {
        merchant_country: 'IN',
        india_domestic_allowed: false,
        notice: 'Indian PayPal accounts support cross-border export transactions only (RBI regulations). Domestic India-to-India payments must use UPI or RuPay.'
      }
    };
  }

  /**
   * Check PayPal corridor eligibility.
   * Enforces PayPal India cross-border rules:
   * - India-to-India domestic payments are NOT supported on Indian merchant accounts.
   * - Charges must be denominated in supported international trade currencies (e.g. USD, EUR, GBP).
   */
  checkCorridorEligibility({ customerCountry = 'US', merchantCountry = 'IN', currency = 'USD' }) {
    const custCountry = (customerCountry || 'US').toUpperCase().trim();
    const merchCountry = (merchantCountry || 'IN').toUpperCase().trim();
    const curr = (currency || 'USD').toUpperCase().trim();

    // 1. India-to-India Domestic Restriction
    if (custCountry === 'IN' && merchCountry === 'IN') {
      return {
        eligible: false,
        reason: 'PayPal India does not support domestic India-to-India payments per RBI regulations. For domestic transactions, please select UPI or RuPay.'
      };
    }

    // 2. Currency check
    if (curr === 'INR') {
      return {
        eligible: false,
        reason: 'PayPal cross-border checkout requires an international settlement currency (e.g. USD, EUR, GBP). Please select USD or another international currency.'
      };
    }

    if (!this.SUPPORTED_CURRENCIES.has(curr)) {
      return {
        eligible: false,
        reason: `Currency '${curr}' is not supported for PayPal cross-border international payments.`
      };
    }

    return { eligible: true };
  }

  /**
   * Retrieve or refresh OAuth 2.0 access token via Client Credentials grant.
   */
  async getAccessToken() {
    // In automated testing with mock enabled, return simulated token
    if (process.env.PAYPAL_MOCK === 'true') {
      return 'mock_access_token_paypal_sandbox_12345';
    }

    if (!this.isConfigured()) {
      const err = new Error('PayPal Gateway credentials are missing. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.');
      err.status = 503;
      err.code = 'PAYPAL_CREDENTIALS_MISSING';
      throw err;
    }

    const now = Date.now();
    // Return cached token if valid with at least 60s buffer
    if (this.cachedToken && this.tokenExpiresAt > now + 60000) {
      return this.cachedToken;
    }

    const auth = Buffer.from(`${this.getClientId()}:${this.getClientSecret()}`).toString('base64');
    const tokenUrl = `${this.getApiBaseUrl()}/v1/oauth2/token`;

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch (_) {}
      throw new Error(`PayPal OAuth token request failed (${res.status}): ${errBody || res.statusText}`);
    }

    const data = await res.json();
    this.cachedToken = data.access_token;
    this.tokenExpiresAt = now + ((data.expires_in || 3600) * 1000);
    return this.cachedToken;
  }

  /**
   * Create an Order with PayPal Orders API v2
   */
  async createOrder({
    transactionId,
    amount,
    currency = 'USD',
    customerCountry = 'US',
    customerEmail = 'customer@example.com',
    merchantName = 'ATLAS.PAY Merchant',
    description = 'International Cross-Border Payment',
    returnUrl,
    cancelUrl
  }) {
    // 1. Corridor Eligibility Check
    const eligibility = this.checkCorridorEligibility({ customerCountry, currency });
    if (!eligibility.eligible) {
      const err = new Error(eligibility.reason);
      err.status = 400;
      err.code = 'CORRIDOR_INELIGIBLE';
      throw err;
    }

    // 2. Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      const err = new Error('Invalid payment amount. Amount must be a positive number.');
      err.status = 400;
      err.code = 'INVALID_AMOUNT';
      throw err;
    }

    const formattedAmount = parsedAmount.toFixed(2);
    const internalTxId = transactionId || `tx_${uuidv4().substring(0, 10)}`;
    const idempotencyKey = `req_order_${internalTxId}`;

    // Handle Mock Mode for unit tests
    if (process.env.PAYPAL_MOCK === 'true') {
      const mockOrderId = `PAYID-ORDER-${uuidv4().substring(0, 8).toUpperCase()}`;
      if (!this.mockOrders) this.mockOrders = new Map();
      this.mockOrders.set(mockOrderId, {
        amount: formattedAmount,
        currency: currency.toUpperCase(),
        transaction_id: internalTxId
      });
      return {
        id: mockOrderId,
        status: 'CREATED',
        transaction_id: internalTxId,
        amount: formattedAmount,
        currency: currency.toUpperCase(),
        links: [
          {
            href: `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`,
            rel: 'approve',
            method: 'GET'
          }
        ]
      };
    }

    const token = await this.getAccessToken();
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: internalTxId,
          custom_id: internalTxId,
          invoice_id: `INV-${internalTxId}`,
          description: (description || `Payment to ${merchantName}`).substring(0, 127),
          amount: {
            currency_code: currency.toUpperCase(),
            value: formattedAmount
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'ATLAS.PAY International',
            locale: 'en-US',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: returnUrl || 'https://atlaspay.demo/checkout/success',
            cancel_url: cancelUrl || 'https://atlaspay.demo/checkout/cancel'
          }
        }
      }
    };

    const res = await fetch(`${this.getApiBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': idempotencyKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderPayload)
    });

    const resData = await res.json();
    if (!res.ok) {
      const errorMsg = resData.message || resData.details?.[0]?.description || `PayPal order creation failed (${res.status})`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.details = resData;
      throw err;
    }

    return {
      id: resData.id,
      status: resData.status,
      transaction_id: internalTxId,
      amount: formattedAmount,
      currency: currency.toUpperCase(),
      links: resData.links || []
    };
  }

  /**
   * Capture an approved PayPal Order using PayPal Orders API v2
   */
  async captureOrder({ orderId, transactionId, mockAmount, mockCurrency }) {
    if (!orderId) {
      const err = new Error('PayPal Order ID is required for capture.');
      err.status = 400;
      throw err;
    }

    // Handle Mock Mode for unit tests
    if (process.env.PAYPAL_MOCK === 'true') {
      const mockCaptureId = `CAP-${uuidv4().substring(0, 10).toUpperCase()}`;
      const mockOrder = this.mockOrders?.get(orderId);
      const capAmount = mockAmount !== undefined ? String(mockAmount) : (mockOrder?.amount || '149.00');
      const capCurrency = mockCurrency !== undefined ? String(mockCurrency).toUpperCase() : (mockOrder?.currency || 'USD');
      const parsedCapAmount = parseFloat(capAmount) || 0;
      const fee = 5.69;
      const net = parsedCapAmount > fee ? parseFloat((parsedCapAmount - fee).toFixed(2)) : 0;
      return {
        id: orderId,
        status: 'COMPLETED',
        capture_id: mockCaptureId,
        amount: capAmount,
        currency: capCurrency,
        seller_protection: 'ELIGIBLE',
        fee_charged: fee,
        net_amount: net,
        payer: {
          email_address: 'sandbox-buyer@personal.example.com',
          payer_id: 'PAYER123456789'
        },
        raw_response: { status: 'COMPLETED', id: orderId }
      };
    }

    const token = await this.getAccessToken();
    const idempotencyKey = `req_cap_${orderId}`;

    const res = await fetch(`${this.getApiBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': idempotencyKey,
        'Prefer': 'return=representation'
      }
    });

    const resData = await res.json();

    // If order was already captured, query order details to verify status
    if (res.status === 422 && resData?.details?.some(d => d.issue === 'ORDER_ALREADY_CAPTURED')) {
      const orderDetails = await this.getOrderDetails(orderId);
      if (orderDetails.status === 'COMPLETED') {
        const capture = orderDetails.purchase_units?.[0]?.payments?.captures?.[0];
        return {
          id: orderId,
          status: 'COMPLETED',
          capture_id: capture?.id || `CAP-${orderId}`,
          amount: capture?.amount?.value || '0.00',
          currency: capture?.amount?.currency_code || 'USD',
          fee_charged: parseFloat(capture?.seller_receivable_breakdown?.paypal_fee?.value || '0.00'),
          net_amount: parseFloat(capture?.seller_receivable_breakdown?.net_amount?.value || '0.00'),
          payer: orderDetails.payer || {},
          raw_response: orderDetails
        };
      }
    }

    if (!res.ok) {
      const errorMsg = resData.message || resData.details?.[0]?.description || `PayPal capture failed (${res.status})`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.details = resData;
      throw err;
    }

    const capture = resData.purchase_units?.[0]?.payments?.captures?.[0];
    const captureStatus = capture?.status || resData.status;

    return {
      id: resData.id,
      status: captureStatus,
      capture_id: capture?.id || null,
      amount: capture?.amount?.value || '0.00',
      currency: capture?.amount?.currency_code || 'USD',
      seller_protection: capture?.seller_protection?.status || 'NOT_ELIGIBLE',
      fee_charged: parseFloat(capture?.seller_receivable_breakdown?.paypal_fee?.value || '0.00'),
      net_amount: parseFloat(capture?.seller_receivable_breakdown?.net_amount?.value || '0.00'),
      payer: resData.payer || {},
      raw_response: resData
    };
  }

  /**
   * Get full Order details from PayPal
   */
  async getOrderDetails(orderId) {
    if (process.env.PAYPAL_MOCK === 'true') {
      return {
        id: orderId,
        status: 'COMPLETED',
        purchase_units: [{
          amount: { currency_code: 'USD', value: '149.00' },
          payments: {
            captures: [{ id: `CAP-${orderId}`, status: 'COMPLETED', amount: { value: '149.00', currency_code: 'USD' } }]
          }
        }]
      };
    }

    const token = await this.getAccessToken();
    const res = await fetch(`${this.getApiBaseUrl()}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch PayPal order ${orderId} (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Verify Webhook Signature with PayPal REST API
   * Priority 1 requirements:
   * 1. Never accept a PayPal webhook when PAYPAL_WEBHOOK_ID is missing.
   * 2. Never bypass cryptographic signature verification in Sandbox or Live mode.
   */
  async verifyWebhookSignature({ headers = {}, body }) {
    const webhookId = this.getWebhookId();
    if (!webhookId) {
      console.warn('[PayPal Webhook Security] PAYPAL_WEBHOOK_ID is not configured. Webhook signature verification rejected.');
      return false;
    }

    const authAlgo = headers['paypal-auth-algo'];
    const certUrl = headers['paypal-cert-url'];
    const transmissionId = headers['paypal-transmission-id'];
    const transmissionSig = headers['paypal-transmission-sig'];
    const transmissionTime = headers['paypal-transmission-time'];

    // All 5 signature headers are cryptographically required
    if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
      console.warn('[PayPal Webhook Security] Missing required PayPal signature verification headers.');
      return false;
    }

    // Mock Mode for automated tests
    if (process.env.PAYPAL_MOCK === 'true') {
      if (transmissionSig === 'bad_signature_abc' || headers['x-mock-signature-valid'] === 'false' || transmissionSig === 'invalid') {
        return false;
      }
      return true;
    }

    try {
      const token = await this.getAccessToken();
      const verificationPayload = {
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: body
      };

      const res = await fetch(`${this.getApiBaseUrl()}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(verificationPayload)
      });

      if (!res.ok) {
        return false;
      }

      const resData = await res.json();
      return resData.verification_status === 'SUCCESS';
    } catch (err) {
      console.warn('[PayPal Webhook Signature Verification Failed]:', err.message);
      return false;
    }
  }

  /**
   * Process incoming Webhook Event with database-atomic transaction guarantees
   * - Uses a database transaction for event reservation and transaction mutation.
   * - Uses INSERT ... ON CONFLICT DO NOTHING RETURNING to identify whether the event was newly claimed.
   * - Does not rely on an in-memory Set as the primary protection.
   * - If transaction processing fails, rolls back the event reservation so PayPal can retry.
   * - Ensures a server crash cannot leave an event permanently marked processed without applying its transaction update.
   */
  async processWebhookEvent(event) {
    if (!event || !event.id) {
      throw new Error('Invalid webhook event payload');
    }

    const eventId = event.id;
    const eventType = event.event_type;
    const resource = event.resource || {};

    return await db.transaction(async (txDb) => {
      // 1. Database-atomic claim via INSERT ... ON CONFLICT DO NOTHING RETURNING
      const claimResult = await txDb.claimWebhook({
        id: eventId,
        provider: 'paypal',
        event_type: eventType,
        resource_id: resource.id || null
      });

      if (!claimResult.claimed) {
        return { status: 'ALREADY_PROCESSED', event_id: eventId };
      }

      // 2. Identify linked internal transaction
      const customId = resource.custom_id || resource.invoice_id?.replace(/^INV-/, '') || null;
      const paypalOrderId = resource.supplementary_data?.related_ids?.order_id || resource.id;

      let tx = null;
      if (customId) {
        tx = await txDb.table('transactions').findById(customId);
      }
      if (!tx && paypalOrderId) {
        tx = await txDb.table('transactions').findOne(t =>
          t.metadata_json && t.metadata_json.includes(paypalOrderId)
        );
      }

      // 3. Handle event types within the atomic transaction
      if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
        if (tx) {
          const existingMeta = typeof tx.metadata_json === 'string' ? JSON.parse(tx.metadata_json || '{}') : (tx.metadata_json || {});
          await txDb.table('transactions').update(tx.id, {
            status: 'settled',
            executed_provider: 'paypal',
            fee_charged: parseFloat(resource.seller_receivable_breakdown?.paypal_fee?.value || tx.fee_charged || '0.00'),
            metadata_json: JSON.stringify({
              ...existingMeta,
              paypal_capture_id: resource.id,
              paypal_status: 'COMPLETED',
              webhook_reconciled: true,
              reconciled_at: new Date().toISOString()
            })
          });
        }
      } else if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.DECLINED') {
        if (tx) {
          await txDb.table('transactions').update(tx.id, {
            status: 'failed',
            decline_code: 'paypal_capture_denied',
            decline_reason: 'Payment capture denied by PayPal buyer funding source.'
          });
        }
      } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
        if (tx) {
          await txDb.table('transactions').update(tx.id, {
            status: 'refunded'
          });
        }
      }

      return { status: 'PROCESSED', event_id: eventId, event_type: eventType, transaction_id: tx?.id || null };
    });
  }
}

const paypalServiceInstance = new PayPalService();
paypalServiceInstance.PayPalService = PayPalService;
module.exports = paypalServiceInstance;
