const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');
const routingEngine = require('../services/routingEngine.service');

// GET /rules
router.get('/rules', optionalAuth, async (req, res) => {
  try {
    const merchantId = req.merchant.id;
    const rules = await db.table('routing_rules').find(r => r.merchant_id === merchantId);
    const formatted = rules
      .sort((a, b) => a.priority_order - b.priority_order)
      .map(r => ({
        ...r,
        condition: typeof r.condition_json === 'string' ? JSON.parse(r.condition_json) : r.condition_json
      }));
    res.json({ rules: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rules
router.post('/rules', requireAuth, async (req, res) => {
  try {
    const { name, condition, target_provider, priority_order } = req.body;
    if (!name || !target_provider) {
      return res.status(400).json({ error: 'Rule name and target provider are required.' });
    }

    const currentRules = await db.table('routing_rules').find(r => r.merchant_id === req.merchant.id);
    const order = priority_order || (currentRules.length + 1);

    const newRule = {
      id: `rule_${uuidv4().substring(0, 8)}`,
      merchant_id: req.merchant.id,
      name: name.trim(),
      priority_order: order,
      is_active: true,
      condition_json: JSON.stringify(condition || {}),
      target_provider: target_provider,
      created_at: new Date().toISOString()
    };

    await db.table('routing_rules').insert(newRule);
    res.status(201).json({
      message: 'Routing rule created successfully',
      rule: {
        ...newRule,
        condition: condition || {}
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /rules/:id
router.put('/rules/:id', requireAuth, async (req, res) => {
  try {
    const rule = await db.table('routing_rules').findById(req.params.id);
    if (!rule || rule.merchant_id !== req.merchant.id) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.is_active !== undefined) updates.is_active = Boolean(req.body.is_active);
    if (req.body.target_provider !== undefined) updates.target_provider = req.body.target_provider;
    if (req.body.priority_order !== undefined) updates.priority_order = req.body.priority_order;
    if (req.body.condition !== undefined) updates.condition_json = JSON.stringify(req.body.condition);

    const updated = await db.table('routing_rules').update(req.params.id, updates);
    res.json({
      message: 'Rule updated',
      rule: {
        ...updated,
        condition: typeof updated.condition_json === 'string' ? JSON.parse(updated.condition_json) : updated.condition_json
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /rules/:id
router.delete('/rules/:id', requireAuth, async (req, res) => {
  try {
    const rule = await db.table('routing_rules').findById(req.params.id);
    if (!rule || rule.merchant_id !== req.merchant.id) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    await db.table('routing_rules').delete(req.params.id);
    res.json({ message: 'Rule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /simulate
router.post('/simulate', optionalAuth, async (req, res) => {
  try {
    const { amount, currency, payment_method, customer_country } = req.body;
    const simulationResult = await routingEngine.selectOptimalRoute({
      merchant_id: req.merchant.id,
      amount: amount || 100,
      currency: currency || 'USD',
      payment_method: payment_method || 'credit_card',
      customer_country: customer_country || 'US'
    });

    res.json(simulationResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

