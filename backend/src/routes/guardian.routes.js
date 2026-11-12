const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const studentPaymentService = require('../services/studentPayment.service');
const db = require('../db/db');
const { optionalAuth } = require('../middleware/auth.middleware');

function isDemoOrUnauth(req) {
  return !req.merchant || req.merchant.id === 'mer_demo_orchestration_01';
}

// GET /api/guardian/pending-approvals
router.get('/pending-approvals', optionalAuth, async (req, res) => {
  try {
    if (!isDemoOrUnauth(req)) {
      const merchantId = req.merchant.id;
      const guardian = await db.table('guardian_profiles').findOne(g => g.merchant_id === merchantId);
      const students = await db.table('student_profiles').find(s => s.merchant_id === merchantId);
      if (!guardian) {
        return res.json({
          pending: [],
          history: [],
          guardian: null,
          students,
          needs_setup: true
        });
      }
      const studentIds = new Set(students.map(s => s.id));
      const approvals = await db.table('guardian_approvals').find(a =>
        a.guardian_id === guardian.id || studentIds.has(a.student_id)
      );
      const pending = approvals.filter(a => a.status?.toUpperCase() === 'PENDING');
      const history = approvals.filter(a => a.status?.toUpperCase() !== 'PENDING');
      return res.json({
        pending: pending.reverse(),
        history: history.reverse(),
        guardian,
        students,
        needs_setup: false
      });
    }

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
      history: history.reverse(),
      needs_setup: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/guardian/profile - Create or configure a Parent / Guardian profile for the merchant
router.post('/profile', optionalAuth, async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const {
      guardian_name,
      guardian_email,
      relationship = 'Parent',
      daily_limit = 100,
      weekly_limit = 400,
      monthly_limit = 1200,
      auto_approval_threshold = 50
    } = req.body;

    if (!guardian_name || !guardian_name.trim()) {
      return res.status(400).json({ error: 'Parent / Guardian full name is required' });
    }
    if (!guardian_email || !guardian_email.trim() || !guardian_email.includes('@')) {
      return res.status(400).json({ error: 'Valid Parent / Guardian email address is required' });
    }

    const newGuardian = {
      id: `guard_${uuidv4().substring(0, 10)}`,
      merchant_id: merchantId,
      guardian_name: guardian_name.trim(),
      guardian_email: guardian_email.trim().toLowerCase(),
      relationship: String(relationship || 'Parent').trim(),
      default_daily_limit: parseFloat(daily_limit ?? 100),
      default_weekly_limit: parseFloat(weekly_limit ?? 400),
      default_monthly_limit: parseFloat(monthly_limit ?? 1200),
      auto_approval_threshold: parseFloat(auto_approval_threshold ?? 50),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.table('guardian_profiles').insert(newGuardian);

    // Automatically link any existing student profiles owned by this merchant that have no guardian yet
    const merchantStudents = await db.table('student_profiles').find(s => s.merchant_id === merchantId);
    const linkedStudents = [];
    for (const st of merchantStudents) {
      if (!st.guardian_id) {
        const updated = await db.table('student_profiles').update(st.id, {
          guardian_id: newGuardian.id,
          guardian_name: newGuardian.guardian_name,
          guardian_email: newGuardian.guardian_email,
          guardian_consent_status: 'ACTIVE',
          daily_limit: st.daily_limit ?? newGuardian.default_daily_limit,
          weekly_limit: st.weekly_limit ?? newGuardian.default_weekly_limit,
          monthly_limit: st.monthly_limit ?? newGuardian.default_monthly_limit
        });
        linkedStudents.push(updated || st);
      } else {
        linkedStudents.push(st);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Parent / Guardian profile created successfully',
      guardian: newGuardian,
      linked_students: linkedStudents
    });
  } catch (err) {
    console.error('[Guardian Create Profile Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/guardian/limits
router.put('/limits', optionalAuth, async (req, res) => {
  try {
    const { student_id, daily_limit, weekly_limit, monthly_limit, single_tx_limit, auto_approval_threshold } = req.body;
    let profile = null;

    if (!isDemoOrUnauth(req)) {
      const merchantId = req.merchant.id;
      profile = student_id
        ? await db.table('student_profiles').findOne(p => p.merchant_id === merchantId && p.id === student_id)
        : await db.table('student_profiles').findOne(p => p.merchant_id === merchantId);
    } else {
      profile = await studentPaymentService.getStudentProfile(student_id || 'stu_aarav_sharma_01');
    }

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
    if (!isDemoOrUnauth(req)) {
      const merchantId = req.merchant.id;
      const guardian = await db.table('guardian_profiles').findOne(g => g.merchant_id === merchantId);
      const students = await db.table('student_profiles').find(s => s.merchant_id === merchantId);
      if (!guardian) {
        return res.json({
          guardian: null,
          students,
          pending_count: 0,
          total_approved_count: 0,
          recent_requests: [],
          needs_setup: true
        });
      }
      const studentIds = new Set(students.map(s => s.id));
      const allApprovals = await db.table('guardian_approvals').find(a =>
        a.guardian_id === guardian.id || studentIds.has(a.student_id)
      );
      const pending = allApprovals.filter(a => a.status?.toUpperCase() === 'PENDING');
      return res.json({
        guardian: {
          ...guardian,
          name: guardian.guardian_name,
          email: guardian.guardian_email,
          active_consent_given: true,
          managed_students_count: students.length
        },
        students,
        pending_count: pending.length,
        total_approved_count: allApprovals.filter(a => a.status?.toUpperCase() === 'APPROVED').length,
        recent_requests: allApprovals.slice(-10).reverse(),
        needs_setup: false
      });
    }

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
      recent_requests: allApprovals.slice(-10).reverse(),
      needs_setup: false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

