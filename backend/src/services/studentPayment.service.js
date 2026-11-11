/**
 * Student & Minor Account Service
 * Manages under-18 student profiles, parent/guardian consent,
 * category whitelisting, spending limits, and approval workflows.
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const pythonBridge = require('./pythonBridge.service');

async function getStudentProfile(studentId) {
  if (!studentId) {
    return await db.table('student_profiles').findOne(() => true);
  }
  let profile = await db.table('student_profiles').findById(studentId);
  if (!profile) {
    profile = await db.table('student_profiles').findOne(p =>
      p.email === studentId ||
      p.user_id === studentId ||
      p.id === studentId ||
      p.id.startsWith(studentId) ||
      studentId.startsWith(p.id)
    );
  }
  return profile;
}

/**
 * Accurately parse date of birth and calculate age without timezone shifting errors.
 * Supports:
 * 1. JavaScript Date objects (extracts UTC year, month, day).
 * 2. Date-only strings: YYYY-MM-DD.
 * 3. Valid ISO datetime strings: YYYY-MM-DDTHH:mm:ss.sssZ.
 *
 * Normalizes all valid dates to YYYY-MM-DD.
 * Returns:
 *   { status: 'VERIFIED', age: number, is_minor: boolean, date_of_birth: string }
 * or
 *   { status: 'UNVERIFIED', age: null, is_minor: null, reason: string }
 */
function parseAndCalculateAge(dateOfBirth, referenceDate = new Date()) {
  if (dateOfBirth === null || dateOfBirth === undefined) {
    return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth is missing.' };
  }

  let birthYear = null;
  let birthMonth = null;
  let birthDay = null;
  let normalizedDob = null;

  // Case 1: JavaScript Date object (e.g. from PostgreSQL DATE column via node-postgres)
  if (dateOfBirth instanceof Date) {
    if (isNaN(dateOfBirth.getTime())) {
      return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth is an invalid Date object.' };
    }
    birthYear = dateOfBirth.getUTCFullYear();
    birthMonth = dateOfBirth.getUTCMonth() + 1;
    birthDay = dateOfBirth.getUTCDate();
    normalizedDob = `${String(birthYear).padStart(4, '0')}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
  }
  // Case 2: String input (Date-only YYYY-MM-DD or ISO datetime string)
  else if (typeof dateOfBirth === 'string') {
    const trimmed = dateOfBirth.trim();
    if (!trimmed) {
      return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth is missing.' };
    }

    // Date-only format: YYYY-MM-DD
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      birthYear = parseInt(dateOnlyMatch[1], 10);
      birthMonth = parseInt(dateOnlyMatch[2], 10);
      birthDay = parseInt(dateOnlyMatch[3], 10);
      normalizedDob = `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`;
    } else {
      // ISO datetime format (e.g. 2009-05-15T00:00:00.000Z or with offset)
      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/);
      if (isoMatch) {
        const parsedTime = Date.parse(trimmed);
        if (isNaN(parsedTime)) {
          return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'ISO date of birth timestamp is malformed.' };
        }
        birthYear = parseInt(isoMatch[1], 10);
        birthMonth = parseInt(isoMatch[2], 10);
        birthDay = parseInt(isoMatch[3], 10);
        normalizedDob = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      } else {
        return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth format is invalid (expected YYYY-MM-DD or ISO timestamp).' };
      }
    }
  } else {
    return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth type is unsupported.' };
  }

  // Strict Calendar Validation
  if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31) {
    return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth contains invalid calendar values.' };
  }

  // Check valid days in month using UTC (strictly checks leap years and month boundaries)
  const daysInMonth = new Date(Date.UTC(birthYear, birthMonth, 0)).getUTCDate();
  if (birthDay > daysInMonth) {
    return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth specifies an invalid day for that month.' };
  }

  // Current year/month/day using UTC getters to prevent local timezone shifting errors
  const ref = (referenceDate instanceof Date && !isNaN(referenceDate.getTime())) ? referenceDate : new Date();
  const currentYear = ref.getUTCFullYear();
  const currentMonth = ref.getUTCMonth() + 1;
  const currentDay = ref.getUTCDate();

  // Future DOB check
  if (
    birthYear > currentYear ||
    (birthYear === currentYear && birthMonth > currentMonth) ||
    (birthYear === currentYear && birthMonth === currentMonth && birthDay > currentDay)
  ) {
    return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Date of birth cannot be in the future.' };
  }

  // Exact age calculation
  let age = currentYear - birthYear;
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  if (age < 0 || age > 130) {
    return { status: 'UNVERIFIED', age: null, is_minor: null, reason: 'Calculated age is outside valid range.' };
  }

  return {
    status: 'VERIFIED',
    age,
    is_minor: age < 18,
    date_of_birth: normalizedDob
  };
}

function calculateAge(dateOfBirth, referenceDate) {
  const res = parseAndCalculateAge(dateOfBirth, referenceDate);
  return res.status === 'VERIFIED' ? res.age : null;
}

async function verifyStudentIntent(studentId, paymentData = {}) {
  const profile = await getStudentProfile(studentId);
  const rawDob = paymentData.date_of_birth !== undefined ? paymentData.date_of_birth : profile?.date_of_birth;

  // Validate age from date of birth
  const ageInfo = parseAndCalculateAge(rawDob);
  if (ageInfo.status === 'UNVERIFIED') {
    return {
      profile: profile || null,
      verification: {
        status: 'BLOCKED',
        decision: 'AGE_VERIFICATION_REQUIRED',
        reason: `Student age is unverified (${ageInfo.reason}). Valid age verification is required before student payments can be processed.`,
        age_status: 'UNVERIFIED',
        requires_parent_approval: false,
        requires_age_verification: true,
        source: 'age_verification_guard'
      }
    };
  }

  if (!profile) {
    return {
      profile: null,
      verification: {
        status: 'BLOCKED',
        decision: 'AGE_VERIFICATION_REQUIRED',
        reason: 'Student profile not found. Valid age verification is required before payments can be processed.',
        age_status: 'UNVERIFIED',
        requires_parent_approval: false,
        requires_age_verification: true,
        source: 'age_verification_guard'
      }
    };
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

  const payload = {
    age: ageInfo.age,
    age_status: 'VERIFIED',
    date_of_birth: ageInfo.date_of_birth,
    is_minor: ageInfo.is_minor,
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
  const targetStudentId = profile ? profile.id : studentId;

  // Defensive idempotency check in service layer (only for pending requests)
  if (details.idempotency_key) {
    const existing = await db.table('guardian_approvals').findOne(a =>
      a.idempotency_key === details.idempotency_key && a.status?.toUpperCase() === 'PENDING'
    );
    if (existing) {
      return existing;
    }
  }

  const approvalId = `appr_${uuidv4().substring(0, 10)}`;

  const approval = {
    id: approvalId,
    transaction_id: txId,
    student_id: targetStudentId,
    guardian_id: profile ? profile.guardian_id : 'guard_priya_sharma_01',
    amount: parseFloat(details.amount),
    currency: details.currency || 'USD',
    merchant_name: details.merchant_name || 'Educational Institution',
    merchant_category: details.merchant_category || 'education_higher_ed',
    purpose_description: details.purpose_description || 'Student course purchase',
    status: 'PENDING',
    idempotency_key: details.idempotency_key || null,
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

  // If approved, update linked transaction to settled or create settled transaction record
  if (approval.transaction_id) {
    const newTxStatus = updatedStatus === 'APPROVED' ? 'settled' : 'failed';
    const existingTx = await db.table('transactions').findById(approval.transaction_id);

    if (existingTx) {
      await db.table('transactions').update(approval.transaction_id, {
        status: newTxStatus,
        decline_reason: updatedStatus === 'APPROVED' ? null : `Rejected by guardian: ${reason}`,
        updated_at: new Date().toISOString()
      });
    } else if (updatedStatus === 'APPROVED') {
      // Find student profile for customer email
      const studentProfile = await getStudentProfile(approval.student_id);
      const studentEmail = studentProfile?.email || 'aarav.student@delhiuniversity.ac.in';

      // Check if duplicate transaction already exists for this approval ID
      const dupTx = await db.table('transactions').findOne(t =>
        t.id === approval.transaction_id ||
        (t.metadata_json && t.metadata_json.includes(approval.id))
      );

      if (!dupTx) {
        await db.table('transactions').insert({
          id: approval.transaction_id,
          merchant_id: 'mer_demo_orchestration_01',
          amount: parseFloat(approval.amount),
          currency: approval.currency || 'USD',
          customer_amount: parseFloat(approval.amount),
          customer_currency: approval.currency || 'USD',
          exchange_rate: 1.0,
          customer_email: studentEmail,
          customer_country: 'IN',
          payment_method: 'guardian_approved_rail',
          primary_provider: 'stripe',
          executed_provider: 'stripe',
          status: 'settled',
          risk_score: 5,
          risk_level: 'LOW',
          decline_code: null,
          decline_reason: null,
          fee_charged: parseFloat(((approval.amount * 0.02) + 0.30).toFixed(2)),
          latency_ms: 310,
          metadata_json: JSON.stringify({
            student_id: approval.student_id,
            guardian_approval_id: approval.id,
            course_name: approval.merchant_name,
            category: approval.merchant_category,
            purpose: approval.purpose_description,
            approved_by: approval.guardian_id,
            is_sandbox: true
          }),
          created_at: new Date().toISOString()
        });
      }
    }
  }

  return updated;
}

module.exports = {
  calculateAge,
  parseAndCalculateAge,
  getStudentProfile,
  verifyStudentIntent,
  requestGuardianApproval,
  decideGuardianApproval
};

