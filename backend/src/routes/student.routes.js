const express = require('express');
const router = express.Router();
const studentPaymentService = require('../services/studentPayment.service');
const db = require('../db/db');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');

// GET /api/student/profile
router.get('/profile', optionalAuth, async (req, res) => {
  try {
    const studentId = req.query.student_id || 'stu_aarav_sharma_01';
    let profile = await studentPaymentService.getStudentProfile(studentId);
    
    // Default demo student profile if missing
    if (!profile) {
      profile = {
        id: 'stu_aarav_sharma_01',
        user_id: 'usr_aarav_01',
        email: 'aarav.student@delhiuniversity.ac.in',
        student_name: 'Aarav Sharma',
        date_of_birth: '2009-05-15',
        is_minor: true,
        institution_name: 'Delhi Public School / Global Scholar',
        student_id_number: 'DPS-2024-9842',
        guardian_id: 'guard_priya_sharma_01',
        guardian_email: 'priya.sharma@parent.in',
        guardian_name: 'Priya Sharma (Parent/Guardian)',
        guardian_consent_status: 'ACTIVE',
        daily_limit: 100.00,
        weekly_limit: 400.00,
        monthly_limit: 1200.00,
        single_tx_limit: 250.00,
        auto_approval_threshold: 50.00,
        whitelisted_mccs: JSON.stringify(['education_higher_ed', 'online_courses', 'books_study_materials', 'software_tools', 'standardized_testing'])
      };
      await db.table('student_profiles').insert(profile);
    }

    // Get student recent transactions
    const txs = await db.table('transactions').find(t =>
      t.customer_email === profile.email || t.metadata_json?.includes(profile.id)
    );

    const verifiedAge = studentPaymentService.calculateAge(profile.date_of_birth);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const fullProfile = {
      ...profile,
      age: verifiedAge,
      is_minor: verifiedAge !== null ? verifiedAge < 18 : null,
      spending_limits: {
        daily_limit: parseFloat(profile.daily_limit || 100),
        weekly_limit: parseFloat(profile.weekly_limit || 400),
        monthly_limit: parseFloat(profile.monthly_limit || 1200),
        single_tx_limit: parseFloat(profile.single_tx_limit || 250),
        auto_approval_threshold: parseFloat(profile.auto_approval_threshold || 50),
        current_daily_spend: parseFloat(txs.filter(t => new Date(t.created_at) >= todayMidnight && t.status === 'settled').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2)),
        current_weekly_spend: parseFloat(txs.filter(t => t.status === 'settled').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2)),
        current_monthly_spend: parseFloat(txs.filter(t => t.status === 'settled').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(2))
      },
      whitelisted_mccs: typeof profile.whitelisted_mccs === 'string' ? JSON.parse(profile.whitelisted_mccs) : profile.whitelisted_mccs
    };

    res.json({
      profile: fullProfile,
      student: fullProfile,
      transactions: txs.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/student/create-intent
router.post('/create-intent', async (req, res) => {
  try {
    const studentId = req.body.student_id || 'stu_aarav_sharma_01';
    const profile = await studentPaymentService.getStudentProfile(studentId);
    const paymentData = {
      amount: parseFloat(req.body.amount || req.body.payment_data?.amount || 50),
      currency: req.body.currency || req.body.payment_data?.currency || 'USD',
      merchant_name: req.body.merchant_name || req.body.course_name || req.body.payment_data?.merchant_name || 'Educational Institution',
      merchant_category: req.body.merchant_category || req.body.payment_data?.merchant_category || 'online_courses',
      date_of_birth: req.body.date_of_birth !== undefined ? req.body.date_of_birth : req.body.payment_data?.date_of_birth
    };

    const evalResult = await studentPaymentService.verifyStudentIntent(studentId, paymentData);
    const verification = evalResult.verification;

    if (verification.status === 'BLOCKED') {
      return res.json({
        success: false,
        status: 'blocked',
        decision: verification.decision,
        reason: verification.reason,
        message: verification.reason,
        verification,
        profile: evalResult.profile || profile
      });
    }

    if (verification.status === 'PENDING_APPROVAL' || verification.requires_parent_approval) {
      const targetStudentId = profile ? profile.id : studentId;
      const idempotencyKey = req.body.idempotency_key || `idem_stu_${targetStudentId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

      // 1. Backend Idempotency & Duplicate Pending Request Guard
      // Check if an existing PENDING approval request already exists for this exact course and amount
      const existingPending = await db.table('guardian_approvals').findOne(a =>
        (a.student_id === targetStudentId || (profile && a.student_id === profile.id)) &&
        a.status?.toUpperCase() === 'PENDING' &&
        (
          (req.body.idempotency_key && a.idempotency_key === req.body.idempotency_key) ||
          (a.merchant_name === paymentData.merchant_name && parseFloat(a.amount) === paymentData.amount)
        )
      );

      if (existingPending) {
        return res.json({
          success: true,
          status: 'requires_guardian_approval',
          decision: verification.decision,
          reason: 'A pending approval request for this course and amount is already awaiting parent review.',
          message: 'A pending approval request for this course and amount is already awaiting parent review.',
          approval_id: existingPending.id,
          approval: existingPending,
          verification,
          profile: evalResult.profile || profile,
          is_duplicate_prevented: true
        });
      }

      const txId = `tx_pend_${Date.now().toString(36)}`;
      const approval = await studentPaymentService.requestGuardianApproval(
        targetStudentId,
        txId,
        {
          amount: paymentData.amount,
          currency: paymentData.currency,
          merchant_name: paymentData.merchant_name,
          merchant_category: paymentData.merchant_category,
          purpose_description: req.body.course_name || paymentData.merchant_name || 'Educational Course Enrollment',
          idempotency_key: idempotencyKey
        }
      );

      // Create linked pending transaction in ledger
      await db.table('transactions').insert({
        id: txId,
        merchant_id: 'mer_demo_orchestration_01',
        amount: paymentData.amount,
        currency: paymentData.currency,
        customer_amount: paymentData.amount,
        customer_currency: paymentData.currency,
        exchange_rate: 1.0,
        customer_email: profile ? profile.email : 'aarav.student@delhiuniversity.ac.in',
        customer_country: 'IN',
        payment_method: 'guardian_consent_pending',
        primary_provider: 'stripe',
        executed_provider: 'stripe',
        status: 'pending',
        decline_reason: 'Awaiting parent / guardian authorization.',
        metadata_json: JSON.stringify({
          student_id: targetStudentId,
          guardian_approval_id: approval.id,
          course_name: paymentData.merchant_name,
          category: paymentData.merchant_category,
          purpose: req.body.course_name || paymentData.merchant_name,
          is_sandbox: true
        }),
        created_at: new Date().toISOString()
      });

      return res.json({
        success: true,
        status: 'requires_guardian_approval',
        decision: verification.decision,
        reason: verification.reason,
        message: verification.reason,
        approval_id: approval.id,
        approval,
        verification,
        profile: evalResult.profile || profile
      });
    }

    // APPROVED -> Instant allowance clearance
    const txId = `tx_stu_${Date.now().toString(36)}`;
    await db.table('transactions').insert({
      id: txId,
      merchant_id: 'mer_demo_orchestration_01',
      amount: paymentData.amount,
      currency: paymentData.currency,
      customer_email: profile ? profile.email : 'student@university.edu',
      customer_country: 'IN',
      payment_method: 'student_allowance',
      executed_provider: 'stripe',
      status: 'settled',
      decline_reason: null,
      metadata_json: JSON.stringify({ student_id: profile ? profile.id : studentId, course_name: paymentData.merchant_name }),
      created_at: new Date().toISOString()
    });

    return res.json({
      success: true,
      status: 'approved',
      decision: verification.decision,
      reason: verification.reason,
      message: verification.reason,
      transaction_id: txId,
      verification,
      profile: evalResult.profile || profile
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

// GET /api/student/approvals
router.get('/approvals', optionalAuth, async (req, res) => {
  try {
    const studentId = req.query.student_id || 'stu_aarav_sharma_01';
    const profile = await studentPaymentService.getStudentProfile(studentId);
    const targetId = profile ? profile.id : studentId;
    const approvals = await db.table('guardian_approvals').find(a =>
      a.student_id === targetId ||
      (profile && a.student_id === profile.id) ||
      a.student_id.startsWith(studentId) ||
      studentId.startsWith(a.student_id)
    );
    res.json({
      approvals: approvals.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message, approvals: [] });
  }
});

// GET /api/student/transactions
router.get('/transactions', optionalAuth, async (req, res) => {
  try {
    const studentId = req.query.student_id || 'stu_aarav_sharma_01';
    const profile = await studentPaymentService.getStudentProfile(studentId);
    const email = profile ? profile.email : 'aarav.student@delhiuniversity.ac.in';
    const txs = await db.table('transactions').find(t =>
      t.customer_email === email || (profile && t.metadata_json?.includes(profile.id))
    );
    res.json({
      transactions: txs.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message, transactions: [] });
  }
});

// POST /api/student/verify-intent
router.post('/verify-intent', async (req, res) => {
  try {
    const { student_id = 'stu_aarav_sharma_01', payment_data } = req.body;
    const result = await studentPaymentService.verifyStudentIntent(student_id, payment_data || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/student/limits
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

// GET /api/student/categories
router.get('/categories', (req, res) => {
  res.json({
    whitelisted: [
      { id: 'online_courses', name: 'Online Courseware (Coursera, edX, Udemy)', threshold: 60 },
      { id: 'education_higher_ed', name: 'University Tuition & Admissions', threshold: 100 },
      { id: 'standardized_testing', name: 'Standardized Exams (TOEFL, GRE, IELTS, SAT)', threshold: 150 },
      { id: 'books_study_materials', name: 'Academic Books & Subscriptions', threshold: 50 },
      { id: 'software_tools', name: 'Student Developer Tools (GitHub, JetBrains)', threshold: 35 }
    ],
    prohibited: [
      { id: 'gambling_betting', reason: 'Gambling & lotteries prohibited for minors' },
      { id: 'cryptocurrency', reason: 'Speculative crypto trading blocked' },
      { id: 'bars_alcohol', reason: 'Alcohol and nightlife venues blocked' },
      { id: 'adult_content', reason: 'Age-restricted content prohibited' }
    ]
  });
});

module.exports = router;

