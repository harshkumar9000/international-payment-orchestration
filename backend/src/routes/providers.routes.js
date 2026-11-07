const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');

// GET /
router.get('/', optionalAuth, async (req, res) => {
  try {
    const list = await db.table('providers').find();
    res.json({ providers: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /benchmark (Side-by-side comparison matrix)
router.get('/benchmark', (req, res) => {
  const comparison = [
    {
      id: 'stripe',
      name: 'Stripe Global',
      processing_fee: '2.90% + $0.30',
      cross_border_fee: '+1.00% for international',
      avg_latency: '320 ms',
      global_uptime: '99.98%',
      best_for: 'Global credit & debit cards, Apple/Google Pay, US/CA/UK',
      supported_corridors: '135+ currencies, 45+ countries',
      payout_frequency: 'Daily rolling / T+2',
      instant_fallback_supported: true,
      smart_retries: true,
      chargeback_protection: 'Radar AI Fraud Defense'
    },
    {
      id: 'adyen',
      name: 'Adyen European & Global',
      processing_fee: '1.90% + €0.12',
      cross_border_fee: 'Interchange++ pricing',
      avg_latency: '285 ms',
      global_uptime: '99.99%',
      best_for: 'Pan-European SEPA Direct Debit, iDEAL, Carte Bancaire, Enterprise volume',
      supported_corridors: '150+ currencies, 100+ countries',
      payout_frequency: 'Daily net settlement',
      instant_fallback_supported: true,
      smart_retries: true,
      chargeback_protection: 'RevenueProtect Machine Learning'
    },
    {
      id: 'paypal',
      name: 'PayPal Sandbox / Enterprise',
      processing_fee: '3.49% + $0.49',
      cross_border_fee: '+1.50% international spread',
      avg_latency: '520 ms',
      global_uptime: '99.95%',
      best_for: 'Consumer trust, 400M+ PayPal Wallets, Pay in 4 installments',
      supported_corridors: '200+ markets, 25 currencies',
      payout_frequency: 'Instant wallet transfer',
      instant_fallback_supported: true,
      smart_retries: false,
      chargeback_protection: 'PayPal Seller Protection'
    },
    {
      id: 'razorpay_upi',
      name: 'Razorpay / UPI India Gateway',
      processing_fee: '0.50% (capped)',
      cross_border_fee: 'Domestic zero cross-border',
      avg_latency: '190 ms',
      global_uptime: '99.97%',
      best_for: 'India corridor (INR), Instant UPI (PhonePe/GPay), RuPay, NetBanking',
      supported_corridors: 'India domestic & INR cross-border export',
      payout_frequency: 'Instant T+0 / T+1',
      instant_fallback_supported: true,
      smart_retries: true,
      chargeback_protection: 'RBI 2-Factor Authentication'
    },
    {
      id: 'dlocal',
      name: 'dLocal Emerging Corridors',
      processing_fee: '2.40% + $0.20',
      cross_border_fee: 'Local APM standard',
      avg_latency: '410 ms',
      global_uptime: '99.92%',
      best_for: 'Latin America (Pix Brazil, Oxxo Mexico), Africa, Southeast Asia',
      supported_corridors: '40+ emerging markets, 900+ local payment methods',
      payout_frequency: 'Weekly or bi-weekly local currency',
      instant_fallback_supported: true,
      smart_retries: true,
      chargeback_protection: 'Local Clearing Guarantees'
    }
  ];

  res.json({ comparison });
});

// POST /toggle/:id
router.post('/toggle/:id', requireAuth, async (req, res) => {
  try {
    const prov = await db.table('providers').findById(req.params.id);
    if (!prov) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const newStatus = !prov.is_active;
    await db.table('providers').update(req.params.id, { is_active: newStatus });

    res.json({
      message: `Provider ${prov.name} is now ${newStatus ? 'active' : 'disabled'}`,
      is_active: newStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

