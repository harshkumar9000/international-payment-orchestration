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
      (a.guardian_id === guardianId || a.guardian_id.startsWith(guardianId) || guardianId.startsWith(a.guardian_id)) &&
      a.status?.toUpperCase() === 'PENDING'
    );
    const history = await db.table('guardian_approvals').find(a =>
      (a.guardian_id === guardianId || a.guardian_id.startsWith(guardianId) || guardianId.startsWith(a.guardian_id)) &&
      a.status?.toUpperCase() !== 'PENDING'
    );

    res.json({
      pending: pending.reverse(),
      history: history.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guardian/limits
router.put('/limits', async (req, res) => {
  try {
    const { student_id = 'stu_aarav_sharma_01', daily_limit, weekly_limit, monthly_limit, single_tx_limit, auto_approval_threshold } = req.body;
    const profile = await studentPaymentService.getStudentProfile(student_id);
    if (!profile) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const updates = {};
    if (daily_limit !== undefined) updates.daily_limit = parseFloat(daily_limit);
    if (weekly_limit !== undefined) updates.weekly_limit = parseFloat(weekly_limit);
    if (monthly_limit !== undefined) updates.monthly_limit = parseFloat(monthly_limit);
    if (single_tx_limit !== undefined) updates.single_tx_limit = parseFloat(single_tx_limit);
    if (auto_approval_threshold !== undefined) updates.auto_approval_threshold = parseFloat(auto_approval_threshold);

    const updated = await db.table('student_profiles').update(profile.id, updates);
    res.json({ message: 'Spending limits updated', profile: updated });
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
    const students = await db.table('student_profiles').find(s =>
      s.guardian_id === guardianId || s.guardian_id?.startsWith(guardianId) || guardianId?.startsWith(s.guardian_id)
    );
    const pending = await db.table('guardian_approvals').find(a =>
      (a.guardian_id === guardianId || a.guardian_id?.startsWith(guardianId) || guardianId?.startsWith(a.guardian_id)) &&
      a.status?.toUpperCase() === 'PENDING'
    );
    const allApprovals = await db.table('guardian_approvals').find(a =>
      a.guardian_id === guardianId || a.guardian_id?.startsWith(guardianId) || guardianId?.startsWith(a.guardian_id)
    );

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
      total_approved_count: allApprovals.filter(a => a.status?.toUpperCase() === 'APPROVED').length,
      recent_requests: allApprovals.slice(-10).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

