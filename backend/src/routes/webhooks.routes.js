const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');

// In-memory webhooks log
let webhooksLog = [];

// POST /api/webhooks/stripe
router.post('/stripe', async (req, res) => {
  const event = req.body || {};
  const eventId = `wh_stripe_${Date.now()}`;
  console.log(`📥 [Webhook] Received Stripe event: ${event.type || 'payment_intent.succeeded'}`);

  const logEntry = {
    id: eventId,
    provider: 'stripe',
    event_type: event.type || 'payment_intent.succeeded',
    payload: event,
    received_at: new Date().toISOString()
  };
  webhooksLog.unshift(logEntry);
  if (webhooksLog.length > 50) webhooksLog.pop();

  res.json({ received: true, event_id: eventId });
});

// POST /api/webhooks/paypal
router.post('/paypal', async (req, res) => {
  const event = req.body || {};
  const eventId = `wh_paypal_${Date.now()}`;
  console.log(`📥 [Webhook] Received PayPal event: ${event.event_type || 'PAYMENT.CAPTURE.COMPLETED'}`);

  const logEntry = {
    id: eventId,
    provider: 'paypal',
    event_type: event.event_type || 'PAYMENT.CAPTURE.COMPLETED',
    payload: event,
    received_at: new Date().toISOString()
  };
  webhooksLog.unshift(logEntry);
  if (webhooksLog.length > 50) webhooksLog.pop();

  res.json({ received: true, event_id: eventId });
});

// POST /api/webhooks/adyen
router.post('/adyen', async (req, res) => {
  const event = req.body || {};
  const eventId = `wh_adyen_${Date.now()}`;
  console.log(`📥 [Webhook] Received Adyen notification: ${event.eventCode || 'AUTHORISATION'}`);

  const logEntry = {
    id: eventId,
    provider: 'adyen',
    event_type: event.eventCode || 'AUTHORISATION',
    payload: event,
    received_at: new Date().toISOString()
  };
  webhooksLog.unshift(logEntry);
  if (webhooksLog.length > 50) webhooksLog.pop();

  // Adyen expects [accepted] response
  res.send('[accepted]');
});

// POST /api/webhooks/razorpay
router.post('/razorpay', async (req, res) => {
  const event = req.body || {};
  const eventId = `wh_rzp_${Date.now()}`;
  console.log(`📥 [Webhook] Received Razorpay UPI event: ${event.event || 'payment.authorized'}`);

  const logEntry = {
    id: eventId,
    provider: 'razorpay_upi',
    event_type: event.event || 'payment.authorized',
    payload: event,
    received_at: new Date().toISOString()
  };
  webhooksLog.unshift(logEntry);
  if (webhooksLog.length > 50) webhooksLog.pop();

  res.json({ status: 'ok', event_id: eventId });
});

// GET /api/webhooks/logs
router.get('/logs', (req, res) => {
  res.json({ webhooks: webhooksLog });
});

module.exports = router;

