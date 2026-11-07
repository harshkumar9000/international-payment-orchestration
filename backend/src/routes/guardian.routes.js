const express = require('express');
const router = express.Router();
const studentPaymentService = require('../services/studentPayment.service');
const db = require('../db/db');
const { optionalAuth } = require('../middleware/auth.middleware');

// GET /api/guardian/pending-approvals
router.get('/pending-approvals', optionalAuth, async (req, res) => {
  try {
    const guardianId = req.query.guardian_id || 'guard_priya_sharma_01';
    const pending = await db.table('guardian_approvals').find(a =>
      a.guardian_id === guardianId && a.status === 'PENDING'
    );
    const history = await db.table('guardian_approvals').find(a =>
      a.guardian_id === guardianId && a.status !== 'PENDING'
    );

    res.json({
      pending: pending.reverse(),
      history: history.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guardian/approve/:id
router.post('/approve/:id', async (req, res) => {
  try {
    const { reason = 'Authorized by parent' } = req.body;
    const result = await studentPaymentService.decideGuardianApproval(req.params.id, 'APPROVED', reason);
    res.json({
      message: 'Payment request approved successfully',
      approval: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guardian/reject/:id
router.post('/reject/:id', async (req, res) => {
  try {
    const { reason = 'Disapproved by parent' } = req.body;
    const result = await studentPaymentService.decideGuardianApproval(req.params.id, 'REJECTED', reason);
    res.json({
      message: 'Payment request rejected',
      approval: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/guardian/overview
router.get('/overview', optionalAuth, async (req, res) => {
  try {
    const guardianId = req.query.guardian_id || 'guard_priya_sharma_01';
    const students = await db.table('student_profiles').find(s => s.guardian_id === guardianId);
    const pending = await db.table('guardian_approvals').find(a => a.guardian_id === guardianId && a.status === 'PENDING');
    const allApprovals = await db.table('guardian_approvals').find(a => a.guardian_id === guardianId);

    res.json({
      guardian: {
        id: guardianId,
        name: 'Priya Sharma (Parent/Guardian)',
        email: 'priya.sharma@parent.in',
        active_consent_given: true,
        managed_students_count: students.length
      },
      students,
      pending_count: pending.length,
      total_approved_count: allApprovals.filter(a => a.status === 'APPROVED').length,
      recent_requests: allApprovals.slice(-10).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

