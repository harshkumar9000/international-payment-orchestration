const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth.middleware');

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { email, password, company_name, default_currency } = req.body;

    if (!email || !password || !company_name) {
      return res.status(400).json({ error: 'Email, password, and company name are required.' });
    }

    const existing = await db.table('merchants').findOne(m => m.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'A merchant with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newMerchant = {
      id: `mer_${uuidv4().substring(0, 12)}`,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      company_name: company_name.trim(),
      default_currency: (default_currency || 'USD').toUpperCase(),
      markup_percentage: 1.25,
      api_key: `sk_live_${uuidv4().replace(/-/g, '')}`,
      role: 'merchant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.table('merchants').insert(newMerchant);

    // Auto-create default routing rules for new merchant
    const defaultRules = [
      { id: `rule_${uuidv4().substring(0, 8)}`, merchant_id: newMerchant.id, name: 'India UPI Rail Priority', priority_order: 1, is_active: true, condition_json: JSON.stringify({ currency: 'INR', payment_method: 'upi' }), target_provider: 'razorpay_upi', created_at: new Date().toISOString() },
      { id: `rule_${uuidv4().substring(0, 8)}`, merchant_id: newMerchant.id, name: 'EU Low-Fee SEPA / Cards', priority_order: 2, is_active: true, condition_json: JSON.stringify({ currency: 'EUR' }), target_provider: 'adyen', created_at: new Date().toISOString() },
      { id: `rule_${uuidv4().substring(0, 8)}`, merchant_id: newMerchant.id, name: 'Global Card Processing', priority_order: 3, is_active: true, condition_json: JSON.stringify({ payment_method: 'credit_card' }), target_provider: 'stripe', created_at: new Date().toISOString() }
    ];
    for (const rule of defaultRules) {
      await db.table('routing_rules').insert(rule);
    }

    const token = jwt.sign(
      { id: newMerchant.id, email: newMerchant.email, role: newMerchant.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      merchant: {
        id: newMerchant.id,
        email: newMerchant.email,
        company_name: newMerchant.company_name,
        default_currency: newMerchant.default_currency,
        markup_percentage: newMerchant.markup_percentage,
        api_key: newMerchant.api_key
      }
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const merchant = await db.table('merchants').findOne(m => m.email.toLowerCase() === email.toLowerCase());
    if (!merchant) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, merchant.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: merchant.id, email: merchant.email, role: merchant.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        company_name: merchant.company_name,
        default_currency: merchant.default_currency,
        markup_percentage: merchant.markup_percentage,
        api_key: merchant.api_key
      }
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /demo-login (Quick 1-click login for test reviewers)
router.post('/demo-login', async (req, res) => {
  try {
    let merchant = await db.table('merchants').findOne(m => m.email === 'merchant@example.com');
    if (!merchant) {
      // Create if missing
      const passwordHash = await bcrypt.hash('Password123!', 10);
      merchant = {
        id: 'mer_demo_orchestration_01',
        email: 'merchant@example.com',
        password_hash: passwordHash,
        company_name: 'Atlas Cross-Border Commerce Ltd',
        default_currency: 'USD',
        markup_percentage: 1.25,
        api_key: 'sk_live_orchestration_atlas_983742',
        role: 'merchant',
        created_at: new Date().toISOString()
      };
      await db.table('merchants').insert(merchant);
    }

    const token = jwt.sign(
      { id: merchant.id, email: merchant.email, role: merchant.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Demo login successful',
      token,
      merchant: {
        id: merchant.id,
        email: merchant.email,
        company_name: merchant.company_name,
        default_currency: merchant.default_currency,
        markup_percentage: merchant.markup_percentage,
        api_key: merchant.api_key
      }
    });
  } catch (err) {
    console.error('[Demo Login Error]:', err);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// GET /me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const merchant = await db.table('merchants').findById(req.merchant.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found.' });
    }

    res.json({
      merchant: {
        id: merchant.id,
        email: merchant.email,
        company_name: merchant.company_name,
        default_currency: merchant.default_currency,
        markup_percentage: merchant.markup_percentage,
        api_key: merchant.api_key
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;

