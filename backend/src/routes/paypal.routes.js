/**
 * Official PayPal REST API Routes
 * Exposes endpoints for:
 * - Public configuration (/api/paypal/config)
 * - Cross-border corridor check (/api/paypal/check-corridor)
 * - Orders API v2 order creation (/api/paypal/create-order)
 * - Orders API v2 order capture (/api/paypal/capture-order)
 * - Cryptographically verified Webhooks (/api/paypal/webhook)
 * - Order details query (/api/paypal/order/:orderId)
 */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const paypalService = require('../services/paypal.service');
const { optionalAuth } = require('../middleware/auth.middleware');

/**
 * GET /api/paypal/config
 * Returns public configuration safe to expose to client-side PayPal SDK.
 * Never leaks PAYPAL_CLIENT_SECRET.
 */
router.get('/config', (req, res) => {
  try {
    const config = paypalService.getPublicConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to retrieve PayPal configuration' });
  }
});

/**
 * POST /api/paypal/check-corridor
 * Validates cross-border corridor and currency rules.
 */
router.post('/check-corridor', (req, res) => {
  try {
    const { customer_country, merchant_country, currency } = req.body;
    const result = paypalService.checkCorridorEligibility({
      customerCountry: customer_country,
      merchantCountry: merchant_country,
      currency
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ eligible: false, error: err.message });
  }
});

/**
 * POST /api/paypal/create-order
 * Initiates an Order with PayPal Orders API v2
 */
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      customer_country = 'US',
      customer_email = 'customer@example.com',
      merchant_name = 'ATLAS.PAY Merchant',
      description = 'International Cross-Border Payment',
      transaction_id = null,
      return_url,
      cancel_url
    } = req.body;

    const merchantId = req.merchant ? req.merchant.id : 'mer_demo_orchestration_01';

    // 1. Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: 'Invalid payment amount. Amount must be a positive number.',
        code: 'INVALID_AMOUNT'
      });
    }

    // 2. Validate Corridor Eligibility
    const eligibility = paypalService.checkCorridorEligibility({
      customerCountry: customer_country,
      currency
    });

    if (!eligibility.eligible) {
      return res.status(400).json({
        error: eligibility.reason,
        code: 'CORRIDOR_INELIGIBLE'
      });
    }

    const internalTxId = transaction_id || `tx_${uuidv4().substring(0, 10)}`;

    // 3. Call PayPal Orders API v2 via PayPalService
    const order = await paypalService.createOrder({
      transactionId: internalTxId,
      amount: parsedAmount,
      currency: currency.toUpperCase(),
      customerCountry: customer_country,
      customerEmail: customer_email,
      merchantName: merchant_name,
      description,
      returnUrl: return_url,
      cancelUrl: cancel_url
    });

    // 4. Record transaction in database
    const initialTx = {
      id: internalTxId,
      merchant_id: merchantId,
      amount: parsedAmount,
      currency: currency.toUpperCase(),
      customer_amount: parsedAmount,
      customer_currency: currency.toUpperCase(),
      exchange_rate: 1.0,
      customer_email: customer_email,
      customer_country: (customer_country || 'US').toUpperCase(),
      payment_method: 'paypal',
      primary_provider: 'paypal',
      executed_provider: 'paypal',
      status: 'initiated',
      risk_score: 5,
      risk_level: 'LOW',
      fee_charged: 0.0,
      latency_ms: 25,
      metadata_json: JSON.stringify({
        paypal_order_id: order.id,
        paypal_env: paypalService.getEnvironment(),
        description: description || `Payment to ${merchant_name}`,
        created_at: new Date().toISOString()
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Upsert or insert transaction record
    const existingTx = await db.table('transactions').findById(internalTxId);
    if (existingTx) {
      await db.table('transactions').update(internalTxId, {
        status: 'initiated',
        payment_method: 'paypal',
        primary_provider: 'paypal',
        executed_provider: 'paypal',
        metadata_json: JSON.stringify({
          ...(typeof existingTx.metadata_json === 'string' ? JSON.parse(existingTx.metadata_json || '{}') : (existingTx.metadata_json || {})),
          paypal_order_id: order.id
        }),
        updated_at: new Date().toISOString()
      });
    } else {
      await db.table('transactions').insert(initialTx);
    }

    res.json({
      success: true,
      order_id: order.id,
      status: order.status,
      transaction_id: internalTxId,
      amount: order.amount,
      currency: order.currency,
      links: order.links
    });
  } catch (err) {
    console.error('❌ [PayPal Create Order Error]:', err.message);
    const statusCode = err.status || (err.code === 'CORRIDOR_INELIGIBLE' ? 400 : 500);
    res.status(statusCode).json({
      error: err.message || 'Failed to create PayPal order',
      code: err.code || 'PAYPAL_ORDER_CREATION_FAILED',
      details: err.details || null
    });
  }
});

/**
 * POST /api/paypal/capture-order
 * Captures an approved PayPal Order using Orders API v2
 */
router.post('/capture-order', async (req, res) => {
  try {
    const { order_id, transaction_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        error: 'PayPal order_id is required for capture.',
        code: 'MISSING_ORDER_ID'
      });
    }

    // Capture payment via official PayPal Service
    const captureResult = await paypalService.captureOrder({
      orderId: order_id,
      transactionId: transaction_id
    });

    if (captureResult.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        status: captureResult.status,
        error: `PayPal payment status is '${captureResult.status}' instead of 'COMPLETED'.`,
        capture_result: captureResult
      });
    }

    // Locate transaction record to update
    let targetTxId = transaction_id;
    let tx = null;
    if (targetTxId) {
      tx = await db.table('transactions').findById(targetTxId);
    }
    if (!tx) {
      tx = await db.table('transactions').findOne(t =>
        t.metadata_json && t.metadata_json.includes(order_id)
      );
      if (tx) {
        targetTxId = tx.id;
      }
    }

    // Update database record to 'settled'
    if (tx) {
      const existingMeta = typeof tx.metadata_json === 'string'
        ? JSON.parse(tx.metadata_json || '{}')
        : (tx.metadata_json || {});

      await db.table('transactions').update(targetTxId, {
        status: 'settled',
        executed_provider: 'paypal',
        fee_charged: captureResult.fee_charged,
        metadata_json: JSON.stringify({
          ...existingMeta,
          paypal_order_id: order_id,
          paypal_capture_id: captureResult.capture_id,
          paypal_status: captureResult.status,
          seller_protection: captureResult.seller_protection,
          payer: captureResult.payer,
          captured_at: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      status: 'settled',
      transaction_id: targetTxId || null,
      order_id: captureResult.id,
      capture_id: captureResult.capture_id,
      amount: captureResult.amount,
      currency: captureResult.currency,
      fee_charged: captureResult.fee_charged,
      net_amount: captureResult.net_amount,
      seller_protection: captureResult.seller_protection,
      payer: captureResult.payer
    });
  } catch (err) {
    console.error('❌ [PayPal Capture Order Error]:', err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      error: err.message || 'Failed to capture PayPal order',
      code: err.code || 'PAYPAL_CAPTURE_FAILED',
      details: err.details || null
    });
  }
});

/**
 * POST /api/paypal/webhook
 * Handles incoming PayPal webhooks with signature verification & deduplication
 */
router.post('/webhook', async (req, res) => {
  try {
    const isSignatureValid = await paypalService.verifyWebhookSignature({
      headers: req.headers,
      body: req.body
    });

    if (!isSignatureValid) {
      console.warn('⚠️ [PayPal Webhook] Signature verification failed. Rejecting untrusted webhook event.');
      return res.status(400).json({ error: 'Invalid PayPal webhook signature' });
    }

    const result = await paypalService.processWebhookEvent(req.body);
    res.json({
      received: true,
      ...result
    });
  } catch (err) {
    console.error('❌ [PayPal Webhook Processing Error]:', err.message);
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

/**
 * GET /api/paypal/order/:orderId
 * Fetches order details directly from PayPal Orders API
 */
router.get('/order/:orderId', async (req, res) => {
  try {
    const orderDetails = await paypalService.getOrderDetails(req.params.orderId);
    res.json({ success: true, order: orderDetails });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;

