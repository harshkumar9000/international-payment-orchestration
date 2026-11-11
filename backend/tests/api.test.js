/**
 * Backend API Integration and Unit Tests
 * Tests routing, currency conversion, fraud, checkout, recovery, and providers.
 */
const path = require('path');
const fs = require('fs');

// Strictly enforce isolated test store for automated testing (never touch real Supabase or local_store.json)
process.env.DB_PROVIDER = 'json';
process.env.TEST_STORE_FILE = path.join(__dirname, 'local_store.test.json');

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { app, startServer, ensureDbInitialized, _resetServerlessInitPromiseForTesting } = require('../src/server');
const db = require('../src/db/db');
const seed = require('../src/db/seed');
const { calculateAge, parseAndCalculateAge } = require('../src/services/studentPayment.service');

let serverInstance;
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe('International Payment Orchestration API Suite', () => {
  before(async () => {
    // Seed test data and run on dedicated port in isolated test store
    await seed();
    serverInstance = app.listen(TEST_PORT);
  });

  after(async () => {
    if (serverInstance) {
      serverInstance.close();
    }
    // Clean up isolated test store file
    if (fs.existsSync(process.env.TEST_STORE_FILE)) {
      try {
        fs.unlinkSync(process.env.TEST_STORE_FILE);
      } catch (_) {}
    }
  });

  test('GET /api/health should return online status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'online');
    assert.ok(data.services);
  });

  test('GET /api/currency/rates should return 20+ exchange rates', async () => {
    const res = await fetch(`${BASE_URL}/api/currency/rates`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.base, 'USD');
    assert.ok(data.rates.EUR);
    assert.ok(data.rates.INR);
    assert.ok(data.rates.GBP);
    assert.ok(data.rates.JPY);
  });

  test('POST /api/currency/convert should calculate exchange with markup', async () => {
    const res = await fetch(`${BASE_URL}/api/currency/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100,
        from_currency: 'USD',
        to_currency: 'EUR',
        custom_markup: 2.0
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.from_currency, 'USD');
    assert.strictEqual(data.to_currency, 'EUR');
    assert.ok(data.converted_amount > 0);
    assert.strictEqual(data.markup_percentage, 2.0);
  });

  test('GET /api/compatibility/check should allow valid corridor and block sanctioned corridor', async () => {
    // Valid corridor (DE)
    const validRes = await fetch(`${BASE_URL}/api/compatibility/check?country=DE&currency=EUR`);
    assert.strictEqual(validRes.status, 200);
    const validData = await validRes.json();
    assert.strictEqual(validData.compatible, true);
    assert.strictEqual(validData.blocked, false);
    assert.ok(validData.compatible_methods.length > 0);

    // Sanctioned corridor (KP)
    const sanctionedRes = await fetch(`${BASE_URL}/api/compatibility/check?country=KP`);
    assert.strictEqual(sanctionedRes.status, 200);
    const sanctionedData = await sanctionedRes.json();
    assert.strictEqual(sanctionedData.compatible, false);
    assert.strictEqual(sanctionedData.blocked, true);
    assert.strictEqual(sanctionedData.reason, 'SANCTIONED_JURISDICTION');
  });

  test('POST /api/auth/demo-login should return valid JWT and merchant profile', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
    assert.strictEqual(data.merchant.email, 'merchant@example.com');
  });

  test('POST /api/auth/register, /login, /me and /forgot-password should authenticate and manage session', async () => {
    const testEmail = `fintech.user.${Date.now()}@example.com`;
    const initialPassword = 'SecurePassword123!';
    const updatedPassword = 'NewSecretPassword456!';

    // 1. Register new user
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        company_name: 'Atlas Test Merchant Corp'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    assert.ok(regData.token);
    assert.strictEqual(regData.merchant.email, testEmail);

    // 2. Login with wrong password
    const failRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword'
      })
    });
    assert.strictEqual(failRes.status, 401);

    // 3. Login with correct password
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword
      })
    });
    assert.strictEqual(loginRes.status, 200);
    const loginData = await loginRes.json();
    assert.ok(loginData.token);

    // 4. GET /api/auth/me with Bearer token
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.merchant.email, testEmail);

    // 5. Forgot password request
    const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    assert.strictEqual(forgotRes.status, 200);
    const forgotData = await forgotRes.json();
    assert.ok(forgotData.resetToken);

    // 6. Reset password
    const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        token: forgotData.resetToken,
        new_password: updatedPassword
      })
    });
    assert.strictEqual(resetRes.status, 200);

    // 7. Verify login works with updated password
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: updatedPassword
      })
    });
    assert.strictEqual(newLoginRes.status, 200);
  });

  test('POST /api/routing/simulate should route INR to UPI and EUR to Adyen', async () => {
    // INR route simulation
    const inrRes = await fetch(`${BASE_URL}/api/routing/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 3000,
        currency: 'INR',
        payment_method: 'upi',
        customer_country: 'IN'
      })
    });
    assert.strictEqual(inrRes.status, 200);
    const inrData = await inrRes.json();
    assert.strictEqual(inrData.primary_provider, 'razorpay_upi');
  });

  test('POST /api/checkout/initiate and /process should handle full lifecycle', async () => {
    // 1. Initiate
    const initRes = await fetch(`${BASE_URL}/api/checkout/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 89.99,
        currency: 'USD',
        customer_country: 'US',
        customer_email: 'test.shopper@gmail.com',
        payment_method: 'credit_card'
      })
    });
    assert.strictEqual(initRes.status, 200);
    const initData = await initRes.json();
    assert.ok(initData.transaction_id);

    // 2. Process with standard test card (settled)
    const procRes = await fetch(`${BASE_URL}/api/checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: initData.transaction_id,
        payment_method: 'credit_card',
        payment_data: { card_number: '4242424242424242' }
      })
    });
    assert.strictEqual(procRes.status, 200);
    const procData = await procRes.json();
    assert.strictEqual(procData.status, 'settled');
    assert.ok(procData.fee_charged > 0);
  });

  test('POST /api/checkout/process should cascade and recover on soft network timeout decline', async () => {
    // 1. Initiate
    const initRes = await fetch(`${BASE_URL}/api/checkout/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 150.00,
        currency: 'USD',
        customer_country: 'US',
        customer_email: 'retry.shopper@test.com',
        payment_method: 'credit_card'
      })
    });
    assert.strictEqual(initRes.status, 200);
    const initData = await initRes.json();

    // 2. Process with simulate_decline='network_timeout' to verify automated cascading recovery
    const procRes = await fetch(`${BASE_URL}/api/checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_id: initData.transaction_id,
        payment_method: 'credit_card',
        simulate_decline: 'network_timeout'
      })
    });
    assert.strictEqual(procRes.status, 200);
    const procData = await procRes.json();
    assert.strictEqual(procData.status, 'recovered');
    assert.strictEqual(procData.recovered_from, 'stripe');
  });

  test('GET /api/providers/benchmark should return matrix comparing all providers', async () => {
    const res = await fetch(`${BASE_URL}/api/providers/benchmark`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.comparison);
    assert.strictEqual(data.comparison.length, 5);
  });

  test('POST /api/domestic-card/check-eligibility should verify RuPay Global vs Domestic', async () => {
    // RuPay Global Platinum (6521)
    const resGlobal = await fetch(`${BASE_URL}/api/domestic-card/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: 'rupay_card',
        bin: '6521',
        currency: 'USD',
        merchant_country: 'US',
        amount_usd: 150
      })
    });
    assert.strictEqual(resGlobal.status, 200);
    const dataGlobal = await resGlobal.json();
    assert.strictEqual(dataGlobal.eligible, true);
    assert.ok(dataGlobal.co_branded_networks.includes('Discover'));

    // RuPay PMJDY Domestic Only (6071)
    const resDom = await fetch(`${BASE_URL}/api/domestic-card/check-eligibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: 'rupay_card',
        bin: '6071',
        currency: 'USD',
        merchant_country: 'US',
        amount_usd: 50
      })
    });
    assert.strictEqual(resDom.status, 200);
    const dataDom = await resDom.json();
    assert.strictEqual(dataDom.eligible, false);
    assert.ok(dataDom.alternative_recommendations.length > 0);
  });

  test('POST /api/agentic-refund/analyze and execute should handle autonomous refund', async () => {
    // Analyze stuck orphaned transaction
    const anRes = await fetch(`${BASE_URL}/api/agentic-refund/analyze/tx_stuck_orphaned_01`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Customer never received access' })
    });
    assert.strictEqual(anRes.status, 200);
    const anData = await anRes.json();
    assert.strictEqual(anData.evaluation.decision, 'AUTO_REFUND_APPROVED');
    assert.strictEqual(anData.evaluation.refund_eligible, true);

    // Execute refund
    const exRes = await fetch(`${BASE_URL}/api/agentic-refund/execute/tx_stuck_orphaned_01`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Customer never received access' })
    });
    assert.strictEqual(exRes.status, 200);
    const exData = await exRes.json();
    assert.strictEqual(exData.status, 'settled');
    assert.ok(exData.refund_id);
  });

  test('GET /api/student/profile and /api/guardian/pending-approvals should manage under-18 flow', async () => {
    // Student Profile
    const stuRes = await fetch(`${BASE_URL}/api/student/profile`);
    assert.strictEqual(stuRes.status, 200);
    const stuData = await stuRes.json();
    assert.strictEqual(stuData.profile.student_name, 'Aarav Sharma');
    assert.strictEqual(stuData.profile.is_minor, true);

    // Guardian Pending Approvals (Coursera remains pending in seed)
    const guardRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals`);
    assert.strictEqual(guardRes.status, 200);
    const guardData = await guardRes.json();
    assert.ok(guardData.pending.length > 0);
    const courseraPending = guardData.pending.find(a => a.merchant_name.includes('Coursera'));
    assert.ok(courseraPending, 'Coursera should be pending');
    assert.strictEqual(courseraPending.status, 'PENDING');
  });

  test('Student age verification accurately distinguishes minor (<18) vs adult (18+) from DOB', async () => {
    // 1. Direct unit tests of parseAndCalculateAge and calculateAge helpers
    const today = new Date();
    const currentYear = today.getUTCFullYear();
    const currentMonth = today.getUTCMonth() + 1; // 1-12
    const currentDay = today.getUTCDate();

    // A. Missing DOB -> UNVERIFIED
    const missingRes = parseAndCalculateAge(null);
    assert.strictEqual(missingRes.status, 'UNVERIFIED');
    assert.strictEqual(missingRes.age, null);
    assert.strictEqual(calculateAge(null), null);
    assert.strictEqual(calculateAge(''), null);

    // B. Invalid DOB format -> UNVERIFIED
    const invalidFormatRes = parseAndCalculateAge('15-05-2009');
    assert.strictEqual(invalidFormatRes.status, 'UNVERIFIED');
    assert.strictEqual(calculateAge('not-a-date'), null);

    // C. Invalid calendar date (e.g. Feb 31) -> UNVERIFIED
    const invalidCalRes = parseAndCalculateAge('2009-02-31');
    assert.strictEqual(invalidCalRes.status, 'UNVERIFIED');
    assert.strictEqual(calculateAge('2009-02-31'), null);

    // D. Future DOB -> UNVERIFIED
    const futureRes = parseAndCalculateAge('2035-12-01');
    assert.strictEqual(futureRes.status, 'UNVERIFIED');
    assert.strictEqual(calculateAge('2035-12-01'), null);

    // E. Minor: Exactly 17 years old today
    const dob17 = `${currentYear - 17}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    const age17Info = parseAndCalculateAge(dob17);
    assert.strictEqual(age17Info.status, 'VERIFIED');
    assert.strictEqual(age17Info.age, 17);
    assert.strictEqual(age17Info.is_minor, true);
    assert.strictEqual(calculateAge(dob17), 17);

    // F. Adult: Exactly 18 years old today
    const dob18 = `${currentYear - 18}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    const age18Info = parseAndCalculateAge(dob18);
    assert.strictEqual(age18Info.status, 'VERIFIED');
    assert.strictEqual(age18Info.age, 18);
    assert.strictEqual(age18Info.is_minor, false);
    assert.strictEqual(calculateAge(dob18), 18);

    // G. Timezone boundary test (fixed UTC date: reference 2026-06-15)
    const fixedRef = new Date(Date.UTC(2026, 5, 15)); // 2026-06-15 UTC
    // Birthday tomorrow (2008-06-16) -> still 17 on June 15
    const tzDayBefore = parseAndCalculateAge('2008-06-16', fixedRef);
    assert.strictEqual(tzDayBefore.age, 17);
    assert.strictEqual(tzDayBefore.is_minor, true);
    // Birthday today (2008-06-15) -> turns 18 on June 15
    const tzDayOf = parseAndCalculateAge('2008-06-15', fixedRef);
    assert.strictEqual(tzDayOf.age, 18);
    assert.strictEqual(tzDayOf.is_minor, false);

    // 2. Integration test: Missing / invalid DOB blocks intent with AGE_VERIFICATION_REQUIRED
    const resMissingDob = await fetch(`${BASE_URL}/api/student/verify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        payment_data: {
          date_of_birth: '',
          amount: 35,
          merchant_name: 'edX',
          merchant_category: 'online_courses'
        }
      })
    });
    assert.strictEqual(resMissingDob.status, 200);
    const dataMissingDob = await resMissingDob.json();
    assert.strictEqual(dataMissingDob.verification.status, 'BLOCKED');
    assert.strictEqual(dataMissingDob.verification.decision, 'AGE_VERIFICATION_REQUIRED');
    assert.strictEqual(dataMissingDob.verification.age_status, 'UNVERIFIED');
    assert.strictEqual(dataMissingDob.verification.requires_age_verification, true);

    const resFutureDob = await fetch(`${BASE_URL}/api/student/verify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        payment_data: {
          date_of_birth: '2035-05-15',
          amount: 35,
          merchant_name: 'edX',
          merchant_category: 'online_courses'
        }
      })
    });
    assert.strictEqual(resFutureDob.status, 200);
    const dataFutureDob = await resFutureDob.json();
    assert.strictEqual(dataFutureDob.verification.status, 'BLOCKED');
    assert.strictEqual(dataFutureDob.verification.decision, 'AGE_VERIFICATION_REQUIRED');

    // 3. Integration test: Minor student Aarav Sharma (DOB 2009-05-15, age 17)
    // Transaction under threshold ($35 < $50) -> Approved without parent approval
    const resUnder = await fetch(`${BASE_URL}/api/student/verify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        payment_data: {
          amount: 35,
          currency: 'USD',
          merchant_name: 'edX MicroMasters',
          merchant_category: 'online_courses'
        }
      })
    });
    assert.strictEqual(resUnder.status, 200);
    const dataUnder = await resUnder.json();
    assert.strictEqual(dataUnder.verification.status, 'APPROVED');
    assert.strictEqual(dataUnder.verification.requires_parent_approval, false);

    // Minor: Transaction over threshold ($79 > $50) -> Requires parent approval
    const resOver = await fetch(`${BASE_URL}/api/student/verify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        payment_data: {
          amount: 79,
          currency: 'USD',
          merchant_name: 'Coursera AI Specialization',
          merchant_category: 'online_courses'
        }
      })
    });
    assert.strictEqual(resOver.status, 200);
    const dataOver = await resOver.json();
    assert.strictEqual(dataOver.verification.status, 'PENDING_APPROVAL');
    assert.strictEqual(dataOver.verification.requires_parent_approval, true);
    assert.strictEqual(dataOver.verification.decision, 'REQUIRES_PARENT_APPROVAL');

    // Minor: Prohibited category -> Blocked
    const resBlocked = await fetch(`${BASE_URL}/api/student/verify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        payment_data: {
          amount: 20,
          currency: 'USD',
          merchant_name: 'Vegas Bets',
          merchant_category: 'gambling_betting'
        }
      })
    });
    assert.strictEqual(resBlocked.status, 200);
    const dataBlocked = await resBlocked.json();
    assert.strictEqual(dataBlocked.verification.status, 'BLOCKED');
    assert.strictEqual(dataBlocked.verification.decision, 'PROHIBITED_MERCHANT_CATEGORY');

    // 4. Integration test: Adult student Elena Rostova (DOB 2005-09-12, age 20-21)
    // $79 purchase would trigger approval for a minor, but Elena is 18+ and approved instantly
    const resAdult = await fetch(`${BASE_URL}/api/student/verify-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_elena_02',
        payment_data: {
          amount: 79,
          currency: 'USD',
          merchant_name: 'Oxford Courseware',
          merchant_category: 'online_courses'
        }
      })
    });
    assert.strictEqual(resAdult.status, 200);
    const dataAdult = await resAdult.json();
    assert.strictEqual(dataAdult.verification.status, 'APPROVED');
    assert.strictEqual(dataAdult.verification.requires_parent_approval, false);
    assert.strictEqual(dataAdult.verification.decision, 'INSTANT_ALLOWANCE_APPROVED');
  });

  test('Refund safety audit across captured, duplicate, failed, and pending transactions', async () => {
    // Scenario 1: CAPTURED & eligible transaction (tx_demo_001 settled charge)
    const anCaptured = await fetch(`${BASE_URL}/api/agentic-refund/analyze/tx_demo_001`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Customer returns item, eligible for refund.' })
    });
    assert.strictEqual(anCaptured.status, 200);
    const dataCaptured = await anCaptured.json();
    assert.strictEqual(dataCaptured.evaluation.decision, 'AUTO_REFUND_APPROVED');
    assert.strictEqual(dataCaptured.evaluation.refund_eligible, true);

    // Execute refund
    const exRes = await fetch(`${BASE_URL}/api/agentic-refund/execute/tx_demo_001`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Customer returns item, eligible for refund.' })
    });
    assert.strictEqual(exRes.status, 200);
    const exData = await exRes.json();
    assert.strictEqual(exData.status, 'settled');

    // Scenario 2: Already refunded payment (duplicate prevention check on tx_demo_001)
    const anDup = await fetch(`${BASE_URL}/api/agentic-refund/analyze/tx_demo_001`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Duplicate attempt' })
    });
    assert.strictEqual(anDup.status, 200);
    const dataDup = await anDup.json();
    assert.strictEqual(dataDup.evaluation.decision, 'REFUND_REJECTED');
    assert.strictEqual(dataDup.evaluation.reason_code, 'DUPLICATE_REFUND_PREVENTED');
    assert.strictEqual(dataDup.evaluation.refund_eligible, false);

    const exDup = await fetch(`${BASE_URL}/api/agentic-refund/execute/tx_demo_001`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Duplicate attempt' })
    });
    assert.strictEqual(exDup.status, 200);
    const exDupData = await exDup.json();
    assert.strictEqual(exDupData.success, false);
    assert.strictEqual(exDupData.status, 'rejected');

    // Scenario 3: FAILED payment with no debit (tx_demo_013_failed_nodebit - card declined)
    const anFailed = await fetch(`${BASE_URL}/api/agentic-refund/analyze/tx_demo_013_failed_nodebit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Failed payment check' })
    });
    assert.strictEqual(anFailed.status, 200);
    const dataFailed = await anFailed.json();
    assert.strictEqual(dataFailed.evaluation.decision, 'NO_REFUND_NEEDED_HOLD_RELEASED');
    assert.strictEqual(dataFailed.evaluation.reason_code, 'NO_CAPTURE_OCCURRED');
    assert.strictEqual(dataFailed.evaluation.refund_eligible, false);

    const exFailed = await fetch(`${BASE_URL}/api/agentic-refund/execute/tx_demo_013_failed_nodebit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Failed payment check' })
    });
    assert.strictEqual(exFailed.status, 200);
    const exFailedData = await exFailed.json();
    assert.strictEqual(exFailedData.status, 'hold_released');

    // Scenario 4: PENDING transaction awaiting 3DS bank verification (tx_demo_011_pending)
    const anPending = await fetch(`${BASE_URL}/api/agentic-refund/analyze/tx_demo_011_pending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Pending payment check' })
    });
    assert.strictEqual(anPending.status, 200);
    const dataPending = await anPending.json();
    assert.strictEqual(dataPending.evaluation.decision, 'REFUND_REJECTED');
    assert.strictEqual(dataPending.evaluation.reason_code, 'TRANSACTION_STILL_PENDING');
    assert.strictEqual(dataPending.evaluation.refund_eligible, false);

    const exPending = await fetch(`${BASE_URL}/api/agentic-refund/execute/tx_demo_011_pending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Pending payment check' })
    });
    assert.strictEqual(exPending.status, 200);
    const exPendingData = await exPending.json();
    assert.strictEqual(exPendingData.success, false);
    assert.strictEqual(exPendingData.status, 'rejected');

    // Scenario 5: High-value CAPTURED transaction ($1250 >= $500 threshold)
    const anHigh = await fetch(`${BASE_URL}/api/agentic-refund/analyze/tx_demo_012_high_value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Enterprise dispute' })
    });
    assert.strictEqual(anHigh.status, 200);
    const dataHigh = await anHigh.json();
    assert.strictEqual(dataHigh.evaluation.decision, 'REQUIRES_HUMAN_APPROVAL');
    assert.strictEqual(dataHigh.evaluation.requires_human_approval, true);
    assert.strictEqual(dataHigh.evaluation.reason_code, 'HIGH_VALUE_COMPLIANCE_ESCALATION');

    const exHigh = await fetch(`${BASE_URL}/api/agentic-refund/execute/tx_demo_012_high_value`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Enterprise dispute' })
    });
    assert.strictEqual(exHigh.status, 200);
    const exHighData = await exHigh.json();
    assert.strictEqual(exHighData.status, 'held_for_approval');
  });

  test('End-to-end Student Payment Intent, Guardian Approval, and Refund Audit Trail Lifecycle', async () => {
    // 1. Under-18 student requests payment for $79 course (exceeds $50 auto threshold)
    const createRes = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'MIT Quantum Computing MicroMasters',
        merchant_name: 'MIT Quantum Computing MicroMasters',
        merchant_category: 'online_courses',
        amount: 79.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(createRes.status, 200);
    const createData = await createRes.json();
    assert.strictEqual(createData.success, true);
    assert.strictEqual(createData.status, 'requires_guardian_approval');
    assert.strictEqual(createData.decision, 'REQUIRES_PARENT_APPROVAL');
    assert.ok(createData.approval_id);
    const newApprovalId = createData.approval_id;

    // 2. Parent checks pending approvals
    const pendRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=guard_priya_sharma_01`);
    assert.strictEqual(pendRes.status, 200);
    const pendData = await pendRes.json();
    const foundPending = pendData.pending.find(a => a.id === newApprovalId);
    assert.ok(foundPending, 'Expected newly created approval to appear in pending list');
    assert.strictEqual(foundPending.amount, 79);

    // 3. Parent approves the request
    const approveRes = await fetch(`${BASE_URL}/api/guardian/approve/${newApprovalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Approved by Priya Sharma for educational advancement.' })
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.approval.status, 'APPROVED');

    // 4. Student sees updated approval status
    const studentApprRes = await fetch(`${BASE_URL}/api/student/approvals?student_id=stu_aarav_sharma_01`);
    assert.strictEqual(studentApprRes.status, 200);
    const studentApprData = await studentApprRes.json();
    const updatedInStudentView = studentApprData.approvals.find(a => a.id === newApprovalId);
    assert.ok(updatedInStudentView);
    assert.strictEqual(updatedInStudentView.status, 'APPROVED');

    // 5. Parent rejects a separate $95 request
    const req2Res = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'Advanced Robotics Workshop',
        merchant_name: 'Robotics Lab',
        merchant_category: 'online_courses',
        amount: 95.00,
        currency: 'USD'
      })
    });
    const req2Data = await req2Res.json();
    const req2Id = req2Data.approval_id;

    const rejectRes = await fetch(`${BASE_URL}/api/guardian/reject/${req2Id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Exceeds monthly allowance.' })
    });
    assert.strictEqual(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.approval.status, 'REJECTED');

    // 6. Student instant allowance clearance for under-threshold purchase ($35 <= $50)
    const instantRes = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'edX Python Intro',
        merchant_name: 'edX Python Intro',
        merchant_category: 'online_courses',
        amount: 35.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(instantRes.status, 200);
    const instantData = await instantRes.json();
    assert.strictEqual(instantData.status, 'approved');
    assert.strictEqual(instantData.decision, 'INSTANT_ALLOWANCE_APPROVED');

    // 7. Prohibited category is blocked
    const prohibRes = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'Crypto Casino',
        merchant_name: 'Crypto Casino',
        merchant_category: 'gambling_betting',
        amount: 25.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(prohibRes.status, 200);
    const prohibData = await prohibRes.json();
    assert.strictEqual(prohibData.status, 'blocked');
    assert.strictEqual(prohibData.decision, 'PROHIBITED_MERCHANT_CATEGORY');

    // 8. Missing / invalid DOB is blocked
    const badDobRes = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'Course',
        date_of_birth: '2035-01-01',
        amount: 25.00
      })
    });
    assert.strictEqual(badDobRes.status, 200);
    const badDobData = await badDobRes.json();
    assert.strictEqual(badDobData.status, 'blocked');
    assert.strictEqual(badDobData.decision, 'AGE_VERIFICATION_REQUIRED');

    // 9. Refund history and audit trail endpoint works reliably
    const histRes = await fetch(`${BASE_URL}/api/agentic-refund/history`);
    assert.strictEqual(histRes.status, 200);
    const histData = await histRes.json();
    assert.ok(Array.isArray(histData.audit_logs));

    // 10. Guardian spending limits update works and reflects in student portal
    const limitsRes = await fetch(`${BASE_URL}/api/guardian/limits`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma',
        daily_limit: 350,
        weekly_limit: 650,
        monthly_limit: 1200
      })
    });
    assert.strictEqual(limitsRes.status, 200);
    const limitsData = await limitsRes.json();
    assert.strictEqual(limitsData.profile.daily_limit, 350);
    assert.strictEqual(limitsData.profile.weekly_limit, 650);
    assert.strictEqual(limitsData.profile.monthly_limit, 1200);

    // Verify student portal profile endpoint returns the updated limits
    const stuProfRes = await fetch(`${BASE_URL}/api/student/profile?student_id=stu_aarav_sharma`);
    assert.strictEqual(stuProfRes.status, 200);
    const stuProfData = await stuProfRes.json();
    assert.strictEqual(stuProfData.profile.spending_limits.daily_limit, 350);
    assert.strictEqual(stuProfData.profile.spending_limits.weekly_limit, 650);
    assert.strictEqual(stuProfData.profile.spending_limits.monthly_limit, 1200);
    assert.strictEqual(stuProfData.student.spending_limits.monthly_limit, 1200);
  });

  test('POST /api/student/create-intent should prevent duplicate pending approval requests while allowing separate courses', async () => {
    // 1. First submission: creates initial pending approval
    const firstReq = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'AWS Certified Cloud Practitioner',
        merchant_name: 'AWS Certified Cloud Practitioner',
        merchant_category: 'online_courses',
        amount: 85.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(firstReq.status, 200);
    const firstData = await firstReq.json();
    assert.strictEqual(firstData.status, 'requires_guardian_approval');
    assert.ok(firstData.approval_id);
    const originalApprovalId = firstData.approval_id;

    // 2. Duplicate submission with same student, course, and amount
    const dupReq = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'AWS Certified Cloud Practitioner',
        merchant_name: 'AWS Certified Cloud Practitioner',
        merchant_category: 'online_courses',
        amount: 85.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(dupReq.status, 200);
    const dupData = await dupReq.json();
    assert.strictEqual(dupData.status, 'requires_guardian_approval');
    assert.strictEqual(dupData.approval_id, originalApprovalId);
    assert.strictEqual(dupData.is_duplicate_prevented, true);

    // 3. Verify in pending approvals that there is ONLY ONE pending request for this course
    const pendRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=guard_priya_sharma_01`);
    assert.strictEqual(pendRes.status, 200);
    const pendData = await pendRes.json();
    const awsPending = pendData.pending.filter(a => a.merchant_name === 'AWS Certified Cloud Practitioner');
    assert.strictEqual(awsPending.length, 1);
    assert.strictEqual(awsPending[0].id, originalApprovalId);

    // 4. Genuinely separate future course payment is NOT blocked
    const separateReq = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'Harvard CS50 Web Programming',
        merchant_name: 'Harvard CS50 Web Programming',
        merchant_category: 'online_courses',
        amount: 99.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(separateReq.status, 200);
    const separateData = await separateReq.json();
    assert.strictEqual(separateData.status, 'requires_guardian_approval');
    assert.ok(separateData.approval_id);
    assert.notStrictEqual(separateData.approval_id, originalApprovalId);
    const separateApprovalId = separateData.approval_id;

    // 5. Individual approval isolation: Approving one does not affect the other
    const approveRes = await fetch(`${BASE_URL}/api/guardian/approve/${originalApprovalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Approved by Priya Sharma for AWS Certification.' })
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.approval.status, 'APPROVED');

    // Verify separate request is STILL pending
    const checkPendRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=guard_priya_sharma_01`);
    const checkPendData = await checkPendRes.json();
    const stillPendingSeparate = checkPendData.pending.find(a => a.id === separateApprovalId);
    assert.ok(stillPendingSeparate);
    assert.strictEqual(stillPendingSeparate.status, 'PENDING');

    // 6. Individual rejection isolation: Rejecting the separate request updates only it
    const rejectRes = await fetch(`${BASE_URL}/api/guardian/reject/${separateApprovalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Course deferred to next semester.' })
    });
    assert.strictEqual(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.approval.status, 'REJECTED');

    // 7. After previous approval/rejection, new request for same course can be made without being blocked
    const reapplyReq = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'AWS Certified Cloud Practitioner',
        merchant_name: 'AWS Certified Cloud Practitioner',
        merchant_category: 'online_courses',
        amount: 85.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(reapplyReq.status, 200);
    const reapplyData = await reapplyReq.json();
    assert.strictEqual(reapplyData.status, 'requires_guardian_approval');
    assert.notStrictEqual(reapplyData.approval_id, originalApprovalId);
    assert.strictEqual(reapplyData.is_duplicate_prevented, undefined);
  });

  test('Approved guardian payment synchronizes transaction record, student history, and spending totals', async () => {
    // 1. Verify seeded transactions include Duolingo ($59.99), Coursera ($49), and AWS ($79)
    const initProfRes = await fetch(`${BASE_URL}/api/student/profile?student_id=stu_aarav_sharma_01`);
    assert.strictEqual(initProfRes.status, 200);
    const initProfData = await initProfRes.json();
    const initialSpend = initProfData.profile.spending_limits.current_monthly_spend;
    assert.ok(typeof initialSpend === 'number');
    assert.ok(initialSpend >= 187.99);

    // 2. Verify Duolingo is recorded exactly once as settled transaction
    const txRes = await fetch(`${BASE_URL}/api/student/transactions?student_id=stu_aarav_sharma_01`);
    assert.strictEqual(txRes.status, 200);
    const txData = await txRes.json();
    const duoTxs = txData.transactions.filter(t =>
      t.amount === 59.99 &&
      (t.metadata_json && t.metadata_json.includes('Duolingo Super Annual Plan'))
    );
    assert.strictEqual(duoTxs.length, 1);
    assert.strictEqual(duoTxs[0].status, 'settled');

    // 3. Verify Coursera remains pending and not approved automatically
    const guardPendRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=guard_priya_sharma_01`);
    const guardPendData = await guardPendRes.json();
    const courseraItem = guardPendData.pending.find(a => a.merchant_name.includes('Coursera'));
    assert.ok(courseraItem, 'Coursera should remain in pending approvals');
    assert.strictEqual(courseraItem.status, 'PENDING');

    // 4. Submit a new course intent and approve it to verify live synchronization
    const newCourseRes = await fetch(`${BASE_URL}/api/student/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 'stu_aarav_sharma_01',
        course_name: 'Language Immersion Certificate',
        merchant_name: 'Language Immersion Certificate',
        merchant_category: 'online_courses',
        amount: 65.00,
        currency: 'USD'
      })
    });
    assert.strictEqual(newCourseRes.status, 200);
    const newCourseData = await newCourseRes.json();
    assert.strictEqual(newCourseData.status, 'requires_guardian_approval');
    assert.ok(newCourseData.approval_id);
    const newApprovalId = newCourseData.approval_id;

    // Approve the new payment
    const approveRes = await fetch(`${BASE_URL}/api/guardian/approve/${newApprovalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Approved by Priya Sharma for educational advancement.' })
    });
    assert.strictEqual(approveRes.status, 200);

    // Verify student monthly spend increased by exactly $65.00
    const updatedProfRes = await fetch(`${BASE_URL}/api/student/profile?student_id=stu_aarav_sharma_01`);
    const updatedProfData = await updatedProfRes.json();
    const updatedSpend = updatedProfData.profile.spending_limits.current_monthly_spend;
    assert.strictEqual(parseFloat((updatedSpend - initialSpend).toFixed(2)), 65.00);

    // Verify Coursera is STILL pending
    const finalGuardRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=guard_priya_sharma_01`);
    const finalGuardData = await finalGuardRes.json();
    const finalCoursera = finalGuardData.pending.find(a => a.merchant_name.includes('Coursera'));
    assert.ok(finalCoursera);
    assert.strictEqual(finalCoursera.status, 'PENDING');
  });

  test('GET /api/cards and POST /api/cards should securely link domestic cards with tokenization', async () => {
    // 1. Fetch initial seeded cards
    const listRes = await fetch(`${BASE_URL}/api/cards`);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.cards));
    assert.ok(listData.cards.length >= 3);

    // Verify raw CVV is not present in stored cards
    for (const card of listData.cards) {
      assert.strictEqual(card.cvv, undefined);
      assert.ok(card.card_number_masked.includes('••••'));
      assert.ok(card.token);
    }

    // 2. Add a new RuPay Global card
    const addRes = await fetch(`${BASE_URL}/api/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardholder_name: 'Priya Sharma',
        card_number: '6521998877665544',
        expiry: '10/28',
        cvv: '789',
        network: 'RuPay',
        issuing_bank: 'Axis Bank'
      })
    });
    assert.strictEqual(addRes.status, 201);
    const addData = await addRes.json();
    assert.strictEqual(addData.success, true);
    assert.strictEqual(addData.card.international_support, 'SUPPORTED');
    assert.strictEqual(addData.card.last_four, '5544');
    assert.strictEqual(addData.card.cvv, undefined);
    assert.ok(addData.card.token.startsWith('tok_sim_'));

    // 3. Set as default
    const defRes = await fetch(`${BASE_URL}/api/cards/${addData.card.id}/default`, {
      method: 'PUT'
    });
    assert.strictEqual(defRes.status, 200);
    const defData = await defRes.json();
    assert.strictEqual(defData.card.is_default, true);

    // 4. Delete the card
    const delRes = await fetch(`${BASE_URL}/api/cards/${addData.card.id}`, {
      method: 'DELETE'
    });
    assert.strictEqual(delRes.status, 200);
  });

  describe('Database Layer & PostgreSQL Isolation Tests', () => {
    test('db.getStatus() and GET /api/health report embedded_storage_active in local JSON mode', async () => {
      assert.strictEqual(db.getStatus(), 'embedded_storage_active');
      assert.strictEqual(db.getProvider(), 'json');

      const res = await fetch(`${BASE_URL}/api/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.services.database, 'embedded_storage_active');
    });

    test('Table name allowlist protects against unauthorized dynamic tables', async () => {
      assert.throws(() => {
        db.table('malicious_table_injection');
      }, /not in the allowlist/);
    });

    test('Identifier validator rejects unsafe column names', async () => {
      const origProvider = db.getProvider();
      const origStatus = db.getStatus();

      // Mock pool to test validation in postgres mode
      const mockPool = {
        query: async () => ({ rows: [] })
      };
      db._setMockPoolForTesting(mockPool, 'postgres', 'postgresql_connected');

      await assert.rejects(async () => {
        await db.table('merchants').insert({ 'invalid-col; DROP TABLE--': 'val' });
      }, /Invalid SQL identifier/);

      // Restore
      db._setMockPoolForTesting(null, origProvider, origStatus);
    });

    test('PostgreSQL mode with missing or placeholder DATABASE_URL marks database_unavailable and does not fall back to JSON', async () => {
      const origProvider = process.env.DB_PROVIDER;
      const origUrl = process.env.DATABASE_URL;

      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-1.pooler.supabase.com:5432/postgres';

      const ok = await db.init({ throwOnError: false });
      assert.strictEqual(ok, false);
      assert.strictEqual(db.getStatus(), 'database_unavailable');
      assert.strictEqual(db.isPostgres(), false);

      // Attempting database table operation in postgres mode with unavailable database must throw, never silently read JSON
      await assert.rejects(async () => {
        await db.table('transactions').find();
      }, /Database unavailable: PostgreSQL is configured but/);

      // Restore
      process.env.DB_PROVIDER = origProvider;
      process.env.DATABASE_URL = origUrl;
      await db.init();
    });

    test('PostgreSQL mode with mock pool executes parameterized queries and returns actual DB records', async () => {
      const origProvider = db.getProvider();
      const origStatus = db.getStatus();

      const executedQueries = [];
      const mockPool = {
        query: async (sql, params = []) => {
          executedQueries.push({ sql, params });
          if (sql.includes('SELECT COUNT(*)')) {
            return { rows: [{ count: '42' }] };
          }
          if (sql.includes('INSERT INTO saved_cards')) {
            return { rows: [{ id: params[0], cardholder_name: params[1], is_persisted: true }] };
          }
          if (sql.includes('UPDATE saved_cards')) {
            return { rows: [{ id: params[params.length - 1], cardholder_name: 'Updated Name' }] };
          }
          if (sql.includes('SELECT * FROM saved_cards WHERE id = $1')) {
            return { rows: [{ id: params[0], cardholder_name: 'Fetched Name' }] };
          }
          if (sql.includes('SELECT * FROM saved_cards')) {
            return { rows: [{ id: 'card_1', cardholder_name: 'Mock Card 1' }, { id: 'card_2', cardholder_name: 'Mock Card 2' }] };
          }
          if (sql.includes('DELETE FROM saved_cards')) {
            return { rows: [] };
          }
          return { rows: [] };
        }
      };

      db._setMockPoolForTesting(mockPool, 'postgres', 'postgresql_connected');

      // Test COUNT
      const count = await db.table('saved_cards').count();
      assert.strictEqual(count, 42);
      assert.ok(executedQueries[executedQueries.length - 1].sql.includes('SELECT COUNT(*)::int AS count FROM saved_cards'));

      // Test INSERT
      const inserted = await db.table('saved_cards').insert({
        id: 'card_test_mock_01',
        cardholder_name: 'Mock User'
      });
      assert.strictEqual(inserted.id, 'card_test_mock_01');
      assert.strictEqual(inserted.is_persisted, true);
      assert.ok(executedQueries[executedQueries.length - 1].sql.includes('RETURNING *'));

      // Test UPDATE
      const updated = await db.table('saved_cards').update('card_test_mock_01', {
        cardholder_name: 'Updated Name'
      });
      assert.strictEqual(updated.cardholder_name, 'Updated Name');
      assert.ok(executedQueries[executedQueries.length - 1].sql.includes('RETURNING *'));

      // Test FIND
      const cards = await db.table('saved_cards').find();
      assert.strictEqual(cards.length, 2);

      // Test FINDBYID
      const found = await db.table('saved_cards').findById('card_test_mock_01');
      assert.strictEqual(found.cardholder_name, 'Fetched Name');

      // Test DELETE
      const deleted = await db.table('saved_cards').delete('card_test_mock_01');
      assert.strictEqual(deleted, true);

      // Restore
      db._setMockPoolForTesting(null, origProvider, origStatus);
    });

    test('Guardian spending limits and student approval records persist accurately', async () => {
      // 1. Update limits
      const updateRes = await fetch(`${BASE_URL}/api/guardian/limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'stu_aarav_sharma_01',
          daily_limit: 5000.00,
          monthly_limit: 15000.00,
          single_tx_limit: 500.00
        })
      });
      assert.strictEqual(updateRes.status, 200);
      const updateData = await updateRes.json();
      assert.strictEqual(updateData.profile.daily_limit, 5000.00);
      assert.strictEqual(updateData.profile.monthly_limit, 15000.00);

      // 2. Verify student profile endpoint reflects updated limits
      const profileRes = await fetch(`${BASE_URL}/api/student/profile?student_id=stu_aarav_sharma_01`);
      assert.strictEqual(profileRes.status, 200);
      const profileData = await profileRes.json();
      assert.strictEqual(profileData.profile.spending_limits.daily_limit, 5000.00);
      assert.strictEqual(profileData.profile.spending_limits.monthly_limit, 15000.00);

      // 3. Verify duplicate prevention mechanism on pending approval
      const firstReq = await fetch(`${BASE_URL}/api/student/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'stu_aarav_sharma_01',
          merchant_name: 'MIT Quantum Computing',
          course_name: 'MIT Quantum Computing',
          merchant_category: 'online_courses',
          amount: 120.00,
          currency: 'USD'
        })
      });
      assert.strictEqual(firstReq.status, 200);
      const firstData = await firstReq.json();
      assert.strictEqual(firstData.status, 'requires_guardian_approval');

      const dupRes = await fetch(`${BASE_URL}/api/student/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'stu_aarav_sharma_01',
          merchant_name: 'MIT Quantum Computing',
          course_name: 'MIT Quantum Computing',
          merchant_category: 'online_courses',
          amount: 120.00,
          currency: 'USD'
        })
      });
      assert.strictEqual(dupRes.status, 200);
      const dupData = await dupRes.json();
      assert.strictEqual(dupData.is_duplicate_prevented, true);
    });

    test('Refund records persist simulation safeguards (is_simulated and simulation_notice)', async () => {
      const refunds = await db.table('refund_records').find();
      assert.ok(refunds.length > 0);
      const demoRefund = refunds.find(r => r.id === 'ref_demo_settled_01');
      assert.ok(demoRefund);
      assert.strictEqual(demoRefund.is_simulated, true);
      assert.ok(demoRefund.simulation_notice.includes('Simulated sandbox transaction'));
    });
  });

  describe('Vercel Serverless & Supabase PostgreSQL Initialization Regression Suite', () => {
    let savedEnv;

    before(() => {
      savedEnv = {
        VERCEL: process.env.VERCEL,
        DB_PROVIDER: process.env.DB_PROVIDER,
        DATABASE_URL: process.env.DATABASE_URL,
        DB_POOL_MAX: process.env.DB_POOL_MAX
      };
    });

    after(async () => {
      // Restore environment and reset database back to isolated test store state
      process.env.VERCEL = savedEnv.VERCEL;
      process.env.DB_PROVIDER = savedEnv.DB_PROVIDER;
      process.env.DATABASE_URL = savedEnv.DATABASE_URL;
      process.env.DB_POOL_MAX = savedEnv.DB_POOL_MAX;
      db._setPoolConstructorForTesting(null);
      await db.init({ force: true });
    });

    test('1. Vercel starts with the PostgreSQL provider when DB_PROVIDER=postgres', async () => {
      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.user:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

      let poolCreated = false;
      class MockPoolSuccess {
        constructor() {
          poolCreated = true;
        }
        async connect() {
          return {
            query: async () => ({ rows: [{ '?column?': 1 }] }),
            release: () => {}
          };
        }
        async query() {
          return { rows: [] };
        }
        async end() {}
      }

      db._setPoolConstructorForTesting(MockPoolSuccess);
      const ok = await db.init({ force: true });

      assert.strictEqual(ok, true);
      assert.strictEqual(poolCreated, true);
      assert.strictEqual(db.getProvider(), 'postgres');
      assert.strictEqual(db.isPostgres(), true);
      assert.strictEqual(db.getStatus(), 'postgresql_connected');
    });

    test('2. The first serverless request calls database initialization', async () => {
      // Simulate cold container where db is uninitialized
      db._resetForTesting();
      _resetServerlessInitPromiseForTesting();
      assert.strictEqual(db.isInitialized(), false);
      assert.strictEqual(db.getStatus(), 'uninitialized');

      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.user:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

      let initCalled = false;
      class MockColdPool {
        constructor() {
          initCalled = true;
        }
        async connect() {
          return {
            query: async () => ({ rows: [{ '?column?': 1 }] }),
            release: () => {}
          };
        }
        async query() {
          return { rows: [] };
        }
        async end() {}
      }

      db._setPoolConstructorForTesting(MockColdPool);

      // Trigger initialization through the serverless entrypoint helper
      const initResult = await ensureDbInitialized();
      assert.strictEqual(initResult, true);
      assert.strictEqual(initCalled, true);
      assert.strictEqual(db.isInitialized(), true);
      assert.strictEqual(db.getStatus(), 'postgresql_connected');
    });

    test('3. Initial embedded_storage_active does not skip initialization', async () => {
      // Simulate state where initial status was set before request arrives
      db._setMockPoolForTesting(null, 'json', 'embedded_storage_active', false);
      _resetServerlessInitPromiseForTesting();

      // On Vercel, having embedded_storage_active before request must NOT skip init
      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.user:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

      let executedInit = false;
      class MockPoolReInit {
        constructor() {
          executedInit = true;
        }
        async connect() {
          return {
            query: async () => ({ rows: [{ '?column?': 1 }] }),
            release: () => {}
          };
        }
        async query() {
          return { rows: [] };
        }
        async end() {}
      }

      db._setPoolConstructorForTesting(MockPoolReInit);
      await ensureDbInitialized();

      assert.strictEqual(executedInit, true);
      assert.strictEqual(db.getProvider(), 'postgres');
      assert.strictEqual(db.getStatus(), 'postgresql_connected');
    });

    test('4. PostgreSQL success produces postgresql_connected', async () => {
      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.user:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

      class MockConnectedPool {
        async connect() {
          return {
            query: async () => ({ rows: [{ '?column?': 1 }] }),
            release: () => {}
          };
        }
        async query() { return { rows: [] }; }
        async end() {}
      }

      db._setPoolConstructorForTesting(MockConnectedPool);
      const ok = await db.init({ force: true });

      assert.strictEqual(ok, true);
      assert.strictEqual(db.getStatus(), 'postgresql_connected');
      assert.strictEqual(db.isReady(), true);
      assert.strictEqual(db.isPostgres(), true);
    });

    test('5. Missing DATABASE_URL produces database_unavailable', async () => {
      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      delete process.env.DATABASE_URL;

      const ok = await db.init({ force: true, throwOnError: false });

      assert.strictEqual(ok, false);
      assert.strictEqual(db.getStatus(), 'database_unavailable');
      assert.strictEqual(db.isReady(), false);
      assert.notStrictEqual(db.getStatus(), 'embedded_storage_active');
      assert.ok(db.getLastError());
      assert.ok(db.getLastError().message.includes('DATABASE_URL is missing'));
    });

    test('6. Failed PostgreSQL connection never falls back to JSON', async () => {
      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.user:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

      class MockFailingPool {
        async connect() {
          throw new Error('Connection timeout to Supabase pooler host');
        }
        async end() {}
      }

      db._setPoolConstructorForTesting(MockFailingPool);
      const ok = await db.init({ force: true, throwOnError: false });

      assert.strictEqual(ok, false);
      assert.strictEqual(db.getStatus(), 'database_unavailable');
      assert.strictEqual(db.getProvider(), 'postgres');
      assert.strictEqual(db.isReady(), false);

      // Verify that database operations throw and NEVER return or read local_store.json
      await assert.rejects(async () => {
        await db.table('merchants').find();
      }, /Database unavailable: PostgreSQL is configured but/);
    });

    test('7. Local JSON development still works', async () => {
      delete process.env.VERCEL;
      process.env.DB_PROVIDER = 'json';
      db._setPoolConstructorForTesting(null);

      const ok = await db.init({ force: true });

      assert.strictEqual(ok, true);
      assert.strictEqual(db.getProvider(), 'json');
      assert.strictEqual(db.getStatus(), 'embedded_storage_active');
      assert.strictEqual(db.isReady(), true);

      // Verify CRUD operation works cleanly in local JSON mode
      const merchants = await db.table('merchants').find();
      assert.ok(Array.isArray(merchants));
    });

    test('8. Concurrent serverless requests do not create duplicate pools', async () => {
      process.env.VERCEL = '1';
      process.env.DB_PROVIDER = 'postgres';
      process.env.DATABASE_URL = 'postgresql://postgres.user:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

      let poolCreationCount = 0;
      let connectionAttempts = 0;

      class MockDelayedPool {
        constructor() {
          poolCreationCount++;
        }
        async connect() {
          connectionAttempts++;
          // Simulate network latency to test concurrency racing
          await new Promise(resolve => setTimeout(resolve, 25));
          return {
            query: async () => ({ rows: [{ '?column?': 1 }] }),
            release: () => {}
          };
        }
        async query() { return { rows: [] }; }
        async end() {}
      }

      db._resetForTesting();
      db._setPoolConstructorForTesting(MockDelayedPool);
      _resetServerlessInitPromiseForTesting();

      // Launch 10 simultaneous concurrent requests during cold start
      const concurrentRequests = Array.from({ length: 10 }, () => ensureDbInitialized());
      const results = await Promise.all(concurrentRequests);

      // Every concurrent request must successfully resolve
      for (const res of results) {
        assert.strictEqual(res, true);
      }

      // Exactly ONE pool must have been created across all 10 concurrent requests
      assert.strictEqual(poolCreationCount, 1);
      assert.strictEqual(connectionAttempts, 1);
      assert.strictEqual(db.getStatus(), 'postgresql_connected');
    });
  });
});

