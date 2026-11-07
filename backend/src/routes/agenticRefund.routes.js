const express = require('express');
const router = express.Router();
const agenticRefundService = require('../services/agenticRefund.service');
const db = require('../db/db');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');

// POST /api/agentic-refund/analyze/:id
router.post('/analyze/:id', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await agenticRefundService.analyzeTransactionForRefund(req.params.id, reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agentic-refund/execute/:id
router.post('/execute/:id', async (req, res) => {
  try {
    const { reason, overrideByHuman } = req.body;
    const result = await agenticRefundService.executeRefund(req.params.id, {
      reason,
      overrideByHuman: Boolean(overrideByHuman)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agentic-refund/history
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const refunds = await db.table('refund_records').find();
    const auditLogs = await db.table('agentic_audit_logs').find();
    res.json({
      refunds: refunds.reverse(),
      audit_logs: auditLogs.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agentic-refund/approvals-queue
router.get('/approvals-queue', optionalAuth, async (req, res) => {
  try {
    const pending = await db.table('refund_records').find(r => r.status === 'HELD_FOR_APPROVAL');
    res.json({ pending_approvals: pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agentic-refund/approve-manual/:id
router.post('/approve-manual/:id', async (req, res) => {
  try {
    const refundRecord = await db.table('refund_records').findById(req.params.id);
    if (!refundRecord) {
      return res.status(404).json({ error: 'Refund record not found' });
    }

    const result = await agenticRefundService.executeRefund(refundRecord.transaction_id, {
      reason: refundRecord.reason_description,
      overrideByHuman: true
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

