/**
 * Student & Minor Account Service
 * Manages under-18 student profiles, parent/guardian consent,
 * category whitelisting, spending limits, and approval workflows.
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const pythonBridge = require('./pythonBridge.service');

async function getStudentProfile(studentId) {
  let profile = await db.table('student_profiles').findById(studentId);
  if (!profile) {
    profile = await db.table('student_profiles').findOne(p => p.email === studentId || p.user_id === studentId);
  }
  return profile;
}

async function verifyStudentIntent(studentId, paymentData) {
  const profile = await getStudentProfile(studentId);
  if (!profile) {
    // If no specific profile, evaluate as standard student
    return await pythonBridge.verifyStudentPaymentIntent({
      age: 17,
      guardian_consent_status: 'ACTIVE',
      merchant_category: paymentData.merchant_category || 'online_courses',
      amount: parseFloat(paymentData.amount || 50),
      currency: paymentData.currency || 'USD',
      merchant_name: paymentData.merchant_name || 'Educational Merchant',
      single_tx_limit: 250.0,
      daily_limit: 100.0,
      auto_approval_threshold: 50.0
    });
  }

  // Calculate today's spent volume
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const studentTxs = await db.table('transactions').find(t =>
    t.customer_email === profile.email &&
    new Date(t.created_at) >= todayStart &&
    t.status === 'settled'
  );
  const currentDaySpend = studentTxs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // Calculate age from DOB
  const dob = new Date(profile.date_of_birth || '2008-05-15');
  const ageDiff = Date.now() - dob.getTime();
  const age = Math.abs(new Date(ageDiff).getUTCFullYear() - 1970);

  const payload = {
    age: age,
    guardian_consent_status: profile.guardian_consent_status,
    merchant_category: paymentData.merchant_category || 'online_courses',
    amount: parseFloat(paymentData.amount || 50),
    currency: paymentData.currency || 'USD',
    merchant_name: paymentData.merchant_name || 'Educational Merchant',
    single_tx_limit: parseFloat(profile.single_tx_limit || 250),
    daily_limit: parseFloat(profile.daily_limit || 100),
    current_day_spend: currentDaySpend,
    monthly_limit: parseFloat(profile.monthly_limit || 1200),
    auto_approval_threshold: parseFloat(profile.auto_approval_threshold || 50)
  };

  const result = await pythonBridge.verifyStudentPaymentIntent(payload);
  return {
    profile,
    verification: result
  };
}

async function requestGuardianApproval(studentId, txId, details) {
  const profile = await getStudentProfile(studentId);
  const approvalId = `appr_${uuidv4().substring(0, 10)}`;

  const approval = {
    id: approvalId,
    transaction_id: txId,
    student_id: profile ? profile.id : studentId,
    guardian_id: profile ? profile.guardian_id : 'guard_priya_sharma_01',
    amount: parseFloat(details.amount),
    currency: details.currency || 'USD',
    merchant_name: details.merchant_name || 'Educational Institution',
    merchant_category: details.merchant_category || 'education_higher_ed',
    purpose_description: details.purpose_description || 'Student course purchase',
    status: 'PENDING',
    decision_reason: null,
    requested_at: new Date().toISOString(),
    decided_at: null
  };

  await db.table('guardian_approvals').insert(approval);
  return approval;
}

async function decideGuardianApproval(approvalId, decision, reason = '') {
  const approval = await db.table('guardian_approvals').findById(approvalId);
  if (!approval) {
    throw new Error(`Approval request ${approvalId} not found`);
  }

  const updatedStatus = decision.toUpperCase() === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  const updated = await db.table('guardian_approvals').update(approvalId, {
    status: updatedStatus,
    decision_reason: reason || (updatedStatus === 'APPROVED' ? 'Approved by guardian via portal' : 'Declined by guardian'),
    decided_at: new Date().toISOString()
  });

  // If approved, update linked transaction to settled
  if (approval.transaction_id) {
    const newTxStatus = updatedStatus === 'APPROVED' ? 'settled' : 'failed';
    await db.table('transactions').update(approval.transaction_id, {
      status: newTxStatus,
      decline_reason: updatedStatus === 'APPROVED' ? 'Authorized by guardian via Parent Portal.' : `Rejected by guardian: ${reason}`
    });
  }

  return updated;
}

module.exports = {
  getStudentProfile,
  verifyStudentIntent,
  requestGuardianApproval,
  decideGuardianApproval
};

