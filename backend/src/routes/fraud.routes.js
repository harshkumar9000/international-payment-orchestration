const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const pythonBridge = require('../services/pythonBridge.service');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');

// POST /assess (Standalone or live test simulation)
router.post('/assess', async (req, res) => {
  try {
    const payload = req.body;
    const assessment = await pythonBridge.assessFraud(payload);

    // Save assessment record
    const record = {
      id: `fraud_${uuidv4().substring(0, 8)}`,
      transaction_id: payload.transaction_id || null,
      risk_score: assessment.risk_score,
      risk_level: assessment.risk_level,
      decision: assessment.decision,
      triggered_rules_json: JSON.stringify(assessment.triggered_rules || []),
      score_breakdown_json: JSON.stringify(assessment.score_breakdown || {}),
      assessed_at: new Date().toISOString()
    };
    await db.table('fraud_assessments').insert(record);

    res.json({
      ...assessment,
      assessment_id: record.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /history
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const assessments = await db.table('fraud_assessments').find();
    const formatted = assessments.map(a => ({
      ...a,
      triggered_rules: typeof a.triggered_rules_json === 'string' ? JSON.parse(a.triggered_rules_json) : a.triggered_rules_json,
      score_breakdown: typeof a.score_breakdown_json === 'string' ? JSON.parse(a.score_breakdown_json) : a.score_breakdown_json
    })).reverse();

    res.json({ assessments: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /review/:id (Compliance manual review action)
router.post('/review/:id', requireAuth, async (req, res) => {
  try {
    const { decision, notes } = req.body;
    const tx = await db.table('transactions').findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const newStatus = decision === 'APPROVE' ? 'settled' : 'blocked';
    await db.table('transactions').update(req.params.id, {
      status: newStatus,
      decline_reason: decision === 'APPROVE' ? 'Approved after compliance manual review.' : `Rejected by compliance officer: ${notes || 'Suspected Fraud'}`
    });

    res.json({
      message: `Transaction ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully`,
      status: newStatus
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

