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
        date_of_birth: '2008-05-15',
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

    res.json({
      profile: {
        ...profile,
        whitelisted_mccs: typeof profile.whitelisted_mccs === 'string' ? JSON.parse(profile.whitelisted_mccs) : profile.whitelisted_mccs
      },
      transactions: txs.reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

