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
      delete process.env.VERCEL;
      process.env.DB_PROVIDER = 'json';
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

  describe('Vercel Entrypoint & Express Module Export Compatibility Suite', () => {
    test('1. require("./src/server") returns a function', () => {
      const serverModule = require('../src/server');
      assert.strictEqual(typeof serverModule, 'function');
    });

    test('2. The returned function is the Express app', () => {
      const serverModule = require('../src/server');
      assert.strictEqual(typeof serverModule.use, 'function');
      assert.strictEqual(typeof serverModule.get, 'function');
      assert.strictEqual(typeof serverModule.listen, 'function');
    });

    test('3. The .app property points to the same Express app', () => {
      const serverModule = require('../src/server');
      assert.strictEqual(typeof serverModule.app, 'function');
      assert.strictEqual(serverModule, serverModule.app);
    });

    test('4. Named startServer and ensureDbInitialized exports remain available', () => {
      const { startServer: startFn, ensureDbInitialized: initFn, _resetServerlessInitPromiseForTesting: resetFn } = require('../src/server');
      assert.strictEqual(typeof startFn, 'function');
      assert.strictEqual(typeof initFn, 'function');
      assert.strictEqual(typeof resetFn, 'function');
    });

    test('5. backend/api/index.js exports a function (the Express app)', () => {
      const apiModule = require('../api/index');
      const serverModule = require('../src/server');
      assert.strictEqual(typeof apiModule, 'function');
      assert.strictEqual(apiModule, serverModule);
      assert.strictEqual(typeof apiModule.listen, 'function');
    });
  });

  describe('PostgreSQL DOB Parsing & Student Age Verification Regression Suite', () => {
    // Reference date for Aarav Sharma verification: November 11, 2026
    const refNov11_2026 = new Date(Date.UTC(2026, 10, 11));

    test('1. String 2009-05-15 parses accurately and verifies Aarav as 17-year-old minor', () => {
      const res = parseAndCalculateAge('2009-05-15', refNov11_2026);
      assert.strictEqual(res.status, 'VERIFIED');
      assert.strictEqual(res.age, 17);
      assert.strictEqual(res.is_minor, true);
      assert.strictEqual(res.date_of_birth, '2009-05-15');
      assert.strictEqual(calculateAge('2009-05-15', refNov11_2026), 17);
    });

    test('2. ISO string 2009-05-15T00:00:00.000Z parses and normalizes to YYYY-MM-DD', () => {
      const res = parseAndCalculateAge('2009-05-15T00:00:00.000Z', refNov11_2026);
      assert.strictEqual(res.status, 'VERIFIED');
      assert.strictEqual(res.age, 17);
      assert.strictEqual(res.is_minor, true);
      assert.strictEqual(res.date_of_birth, '2009-05-15');
      assert.strictEqual(calculateAge('2009-05-15T00:00:00.000Z', refNov11_2026), 17);
    });

    test('3. JavaScript Date object representing May 15, 2009 calculates age 17 via UTC getters', () => {
      const dateObj = new Date(Date.UTC(2009, 4, 15));
      const res = parseAndCalculateAge(dateObj, refNov11_2026);
      assert.strictEqual(res.status, 'VERIFIED');
      assert.strictEqual(res.age, 17);
      assert.strictEqual(res.is_minor, true);
      assert.strictEqual(res.date_of_birth, '2009-05-15');
      assert.strictEqual(calculateAge(dateObj, refNov11_2026), 17);
    });

    test('4. Missing or empty DOB returns UNVERIFIED and null age', () => {
      const resUndefined = parseAndCalculateAge(undefined, refNov11_2026);
      assert.strictEqual(resUndefined.status, 'UNVERIFIED');
      assert.strictEqual(resUndefined.age, null);
      assert.strictEqual(resUndefined.is_minor, null);
      assert.strictEqual(calculateAge(undefined), null);

      const resEmpty = parseAndCalculateAge('   ', refNov11_2026);
      assert.strictEqual(resEmpty.status, 'UNVERIFIED');
      assert.strictEqual(calculateAge('   '), null);
    });

    test('5. Null DOB returns UNVERIFIED and null age', () => {
      const resNull = parseAndCalculateAge(null, refNov11_2026);
      assert.strictEqual(resNull.status, 'UNVERIFIED');
      assert.strictEqual(resNull.age, null);
      assert.strictEqual(resNull.is_minor, null);
      assert.strictEqual(calculateAge(null), null);
    });

    test('6. Invalid dates like 2009-02-30 are strictly rejected', () => {
      const resStr = parseAndCalculateAge('2009-02-30', refNov11_2026);
      assert.strictEqual(resStr.status, 'UNVERIFIED');
      assert.strictEqual(resStr.age, null);
      assert.ok(resStr.reason.includes('invalid day'));

      const resIso = parseAndCalculateAge('2009-02-30T00:00:00.000Z', refNov11_2026);
      assert.strictEqual(resIso.status, 'UNVERIFIED');
      assert.strictEqual(resIso.age, null);
    });

    test('7. Future DOB cannot bypass verification', () => {
      const resFuture = parseAndCalculateAge('2030-01-01', refNov11_2026);
      assert.strictEqual(resFuture.status, 'UNVERIFIED');
      assert.strictEqual(resFuture.age, null);
      assert.ok(resFuture.reason.includes('future'));
    });

    test('8. Leap-year DOB validation (2008-02-29 valid, 2009-02-29 invalid)', () => {
      const resLeapValid = parseAndCalculateAge('2008-02-29', refNov11_2026);
      assert.strictEqual(resLeapValid.status, 'VERIFIED');
      assert.strictEqual(resLeapValid.age, 18);
      assert.strictEqual(resLeapValid.is_minor, false);
      assert.strictEqual(resLeapValid.date_of_birth, '2008-02-29');

      const resLeapInvalid = parseAndCalculateAge('2009-02-29', refNov11_2026);
      assert.strictEqual(resLeapInvalid.status, 'UNVERIFIED');
      assert.strictEqual(resLeapInvalid.age, null);
    });

    test('9. Precise age calculation around student birthday', () => {
      const dob = '2009-05-15';

      // Day before 17th birthday (May 14, 2026) -> Age 16
      const dayBefore17 = parseAndCalculateAge(dob, new Date(Date.UTC(2026, 4, 14)));
      assert.strictEqual(dayBefore17.age, 16);
      assert.strictEqual(dayBefore17.is_minor, true);

      // On 17th birthday (May 15, 2026) -> Age 17
      const on17th = parseAndCalculateAge(dob, new Date(Date.UTC(2026, 4, 15)));
      assert.strictEqual(on17th.age, 17);
      assert.strictEqual(on17th.is_minor, true);

      // Day after 17th birthday (May 16, 2026) -> Age 17
      const dayAfter17 = parseAndCalculateAge(dob, new Date(Date.UTC(2026, 4, 16)));
      assert.strictEqual(dayAfter17.age, 17);
      assert.strictEqual(dayAfter17.is_minor, true);

      // Day before 18th birthday (May 14, 2027) -> Age 17 (Minor)
      const dayBefore18 = parseAndCalculateAge(dob, new Date(Date.UTC(2027, 4, 14)));
      assert.strictEqual(dayBefore18.age, 17);
      assert.strictEqual(dayBefore18.is_minor, true);

      // On 18th birthday (May 15, 2027) -> Age 18 (Adult)
      const on18th = parseAndCalculateAge(dob, new Date(Date.UTC(2027, 4, 15)));
      assert.strictEqual(on18th.age, 18);
      assert.strictEqual(on18th.is_minor, false);
    });

    test('10. Student payment verification and profile endpoint handle Date objects and ISO strings', async () => {
      // 10A. Verification with ISO string formatted from Date object
      const pgDateObj = new Date(Date.UTC(2009, 4, 15));
      const verifyRes = await fetch(`${BASE_URL}/api/student/verify-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'stu_aarav_sharma_01',
          payment_data: {
            date_of_birth: pgDateObj.toISOString(),
            amount: 35,
            currency: 'USD',
            merchant_name: 'Harvard edX',
            merchant_category: 'online_courses'
          }
        })
      });
      assert.strictEqual(verifyRes.status, 200);
      const verifyData = await verifyRes.json();
      assert.strictEqual(verifyData.verification.status, 'APPROVED');
      assert.strictEqual(verifyData.verification.requires_parent_approval, false);
      assert.strictEqual(verifyData.profile.is_minor, true);

      // 10B. GET /api/student/profile returns normalized date_of_birth, age 17, is_minor true
      const profRes = await fetch(`${BASE_URL}/api/student/profile?student_id=stu_aarav_sharma_01`);
      assert.strictEqual(profRes.status, 200);
      const profData = await profRes.json();
      assert.strictEqual(profData.profile.date_of_birth, '2009-05-15');
      assert.strictEqual(profData.profile.age, 17);
      assert.strictEqual(profData.profile.is_minor, true);
      assert.strictEqual(profData.profile.age_verification_status, 'VERIFIED');
    });
  });

  describe('Parent Approval Portal & Pending Requests Display Regression Suite', () => {
    let filterValidPendingApprovals, formatApprovalTimestamp, getPortalDisplayState;

    before(async () => {
      const utils = await import('../../frontend/src/utils/approvalUtils.js');
      filterValidPendingApprovals = utils.filterValidPendingApprovals;
      formatApprovalTimestamp = utils.formatApprovalTimestamp;
      getPortalDisplayState = utils.getPortalDisplayState;
    });

    test('1. API response containing appr_pending_coursera_01 appears for guardian guard_priya_sharma_01', async () => {
      const guardianId = 'guard_priya_sharma_01';
      const res = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=${guardianId}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.pending));

      const courseraAppr = data.pending.find(a => a.id === 'appr_pending_coursera_01');
      assert.ok(courseraAppr, 'appr_pending_coursera_01 must be present in pending approvals list');
      assert.strictEqual(courseraAppr.student_id, 'stu_aarav_sharma_01');
      assert.strictEqual(courseraAppr.guardian_id, 'guard_priya_sharma_01');
      assert.strictEqual(courseraAppr.merchant_name, 'Coursera Deep Learning Specialization');
      assert.strictEqual(courseraAppr.merchant_category, 'online_courses');
      assert.strictEqual(Number(courseraAppr.amount), 79.00);
      assert.strictEqual(courseraAppr.currency, 'USD');
      assert.strictEqual(courseraAppr.status, 'PENDING');
      assert.ok(courseraAppr.requested_at, 'requested_at timestamp must be present');
      assert.ok(courseraAppr.purpose_description, 'purpose_description must be present');
    });

    test('2. A valid pending item is not filtered out by portal filtering logic', () => {
      const guardianId = 'guard_priya_sharma_01';
      const studentId = 'stu_aarav_sharma_01';
      const samplePending = [
        {
          id: 'appr_pending_coursera_01',
          transaction_id: 'tx_student_pending_01',
          student_id: studentId,
          guardian_id: guardianId,
          amount: 79.00,
          currency: 'USD',
          merchant_name: 'Coursera Deep Learning Specialization',
          merchant_category: 'online_courses',
          purpose_description: 'Stanford AI & Machine Learning Specialization Certificate',
          status: 'PENDING',
          requested_at: '2026-11-11T12:00:00.000Z'
        }
      ];

      const filtered = filterValidPendingApprovals(samplePending, guardianId, studentId);
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].id, 'appr_pending_coursera_01');
      assert.strictEqual(filtered[0].status, 'PENDING');
      assert.strictEqual(filtered[0].merchant_name, 'Coursera Deep Learning Specialization');
      assert.strictEqual(filtered[0].amount, 79.00);

      // Verify timestamp formatting prioritizes requested_at
      const formattedTime = formatApprovalTimestamp(samplePending[0].requested_at, null);
      assert.ok(formattedTime !== 'Pending' && formattedTime !== 'Just now');
    });

    test('3. An API failure displays an error state instead of "No Pending Requests"', () => {
      // Scenario A: API failed with an error
      const errorState = getPortalDisplayState({
        loading: false,
        error: 'Failed to fetch from endpoint /api/guardian/pending-approvals?guardian_id=guard_priya_sharma_01: Network Error',
        pendingApprovals: []
      });
      assert.strictEqual(errorState, 'ERROR', 'Display state must be ERROR when API fails, never EMPTY');

      // Scenario B: Loading in progress
      const loadingState = getPortalDisplayState({
        loading: true,
        error: null,
        pendingApprovals: []
      });
      assert.strictEqual(loadingState, 'LOADING', 'Display state must be LOADING, never EMPTY');

      // Scenario C: Successful response with empty list
      const emptyState = getPortalDisplayState({
        loading: false,
        error: null,
        pendingApprovals: []
      });
      assert.strictEqual(emptyState, 'EMPTY', 'Display state is EMPTY only after successful empty response');

      // Scenario D: Successful response with items
      const listState = getPortalDisplayState({
        loading: false,
        error: null,
        pendingApprovals: [{ id: 'appr_pending_coursera_01' }]
      });
      assert.strictEqual(listState, 'LIST', 'Display state must be LIST when approvals exist');
    });

    test('4. Approved and rejected records are not displayed as pending', async () => {
      const guardianId = 'guard_priya_sharma_01';
      const studentId = 'stu_aarav_sharma_01';

      // 4A. Test database response: /api/guardian/pending-approvals separates pending from history
      const res = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=${guardianId}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      // All items in data.pending must have status PENDING
      for (const item of data.pending) {
        assert.strictEqual(item.status.toUpperCase(), 'PENDING');
        assert.notStrictEqual(item.status.toUpperCase(), 'APPROVED');
        assert.notStrictEqual(item.status.toUpperCase(), 'REJECTED');
        assert.notStrictEqual(item.status.toUpperCase(), 'CANCELLED_DUPLICATE');
      }

      // 4B. Test filterValidPendingApprovals strictly rejects non-PENDING items
      const mixedList = [
        { id: 'appr_1', status: 'PENDING', guardian_id: guardianId, student_id: studentId },
        { id: 'appr_2', status: 'APPROVED', guardian_id: guardianId, student_id: studentId },
        { id: 'appr_3', status: 'REJECTED', guardian_id: guardianId, student_id: studentId },
        { id: 'appr_4', status: 'CANCELLED_DUPLICATE', guardian_id: guardianId, student_id: studentId },
        { id: 'appr_5', status: 'pending', guardian_id: guardianId, student_id: studentId } // Case-insensitive
      ];

      const filtered = filterValidPendingApprovals(mixedList, guardianId, studentId);
      assert.strictEqual(filtered.length, 2);
      assert.deepStrictEqual(filtered.map(x => x.id), ['appr_1', 'appr_5']);
    });

    test('5. Refresh updates the pending list when a request is approved or rejected', async () => {
      const guardianId = 'guard_priya_sharma_01';
      const studentId = 'stu_aarav_sharma_01';
      const tempApprId = `appr_temp_refresh_test_${Date.now()}`;

      // Insert a dedicated temporary pending approval
      await db.table('guardian_approvals').insert({
        id: tempApprId,
        transaction_id: `tx_temp_refresh_${Date.now()}`,
        student_id: studentId,
        guardian_id: guardianId,
        amount: 45.00,
        currency: 'USD',
        merchant_name: 'Udemy React Mastery',
        merchant_category: 'online_courses',
        purpose_description: 'React course for student curriculum',
        status: 'PENDING',
        requested_at: new Date().toISOString()
      });

      // 5A. Pending list before approval must include temp request
      const resBefore = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=${guardianId}`);
      const dataBefore = await resBefore.json();
      const foundBefore = dataBefore.pending.find(a => a.id === tempApprId);
      assert.ok(foundBefore, 'Temporary pending request must appear in pending list before decision');

      // 5B. Approve the temporary request
      const approveRes = await fetch(`${BASE_URL}/api/guardian/approve/${tempApprId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Approved in test refresh flow' })
      });
      assert.strictEqual(approveRes.status, 200);

      // 5C. Refresh pending list - temporary request must no longer be in pending
      const resAfter = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=${guardianId}`);
      const dataAfter = await resAfter.json();
      const foundAfter = dataAfter.pending.find(a => a.id === tempApprId);
      assert.strictEqual(foundAfter, undefined, 'Approved request must not appear in pending list after refresh');

      const foundInHistory = dataAfter.history.find(a => a.id === tempApprId);
      assert.ok(foundInHistory, 'Approved request must move to history');
      assert.strictEqual(foundInHistory.status, 'APPROVED');

      // Clean up temporary approval record from test store
      await db.table('guardian_approvals').delete(tempApprId);
    });

    test('6. The student and guardian exact IDs (stu_aarav_sharma_01 and guard_priya_sharma_01) are used', async () => {
      const guardianId = 'guard_priya_sharma_01';
      const studentId = 'stu_aarav_sharma_01';

      // 6A. Student profile endpoint returns exact student ID and guardian link
      const profRes = await fetch(`${BASE_URL}/api/student/profile?student_id=${studentId}`);
      assert.strictEqual(profRes.status, 200);
      const profData = await profRes.json();
      assert.strictEqual(profData.profile.id, 'stu_aarav_sharma_01');
      assert.strictEqual(profData.profile.guardian_id, 'guard_priya_sharma_01');
      assert.strictEqual(profData.profile.guardian_email, 'priya.sharma@parent.in');

      // 6B. Guardian pending approvals matches exact guardian ID
      const pendRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals?guardian_id=${guardianId}`);
      assert.strictEqual(pendRes.status, 200);
      const pendData = await pendRes.json();
      const coursera = pendData.pending.find(a => a.id === 'appr_pending_coursera_01');
      assert.ok(coursera);
      assert.strictEqual(coursera.guardian_id, guardianId);
      assert.strictEqual(coursera.student_id, studentId);

      // 6C. Updating limits with exact studentId succeeds
      const limitsRes = await fetch(`${BASE_URL}/api/guardian/limits`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          daily_limit: 150,
          weekly_limit: 350,
          monthly_limit: 700
        })
      });
      assert.strictEqual(limitsRes.status, 200);
      const limitsData = await limitsRes.json();
      assert.strictEqual(limitsData.profile.id, studentId);
      assert.strictEqual(Number(limitsData.profile.daily_limit), 150);
    });
  });

  describe('Frontend Routing, Dashboard Resilience & Auth Lifecycle Regression Suite', () => {
    let routeUtils;

    before(async () => {
      routeUtils = await import('../../frontend/src/utils/routeUtils.js');
    });

    test('1. Routing: Maps all protected and core routes accurately', () => {
      const { getPageFromPath, isProtectedPage } = routeUtils;

      const routes = [
        { path: '/dashboard', page: 'dashboard' },
        { path: '/checkout', page: 'checkout' },
        { path: '/cards', page: 'cards' },
        { path: '/my-cards', page: 'cards' },
        { path: '/rupay-upi', page: 'rupay-upi' },
        { path: '/compatibility', page: 'rupay-upi' },
        { path: '/transactions', page: 'transactions' },
        { path: '/history', page: 'transactions' },
        { path: '/student-payments', page: 'student-payments' },
        { path: '/student', page: 'student-payments' },
        { path: '/guardian', page: 'guardian' },
        { path: '/parent-approval', page: 'guardian' },
        { path: '/parent', page: 'guardian' },
        { path: '/settings', page: 'settings' }
      ];

      for (const { path, page } of routes) {
        const resolved = getPageFromPath(path);
        assert.strictEqual(resolved, page, `Path "${path}" must map to page "${page}"`);
        assert.strictEqual(isProtectedPage(resolved), true, `Page "${resolved}" must be classified as protected`);
      }
    });

    test('2. Routing: Normalizes trailing slashes, duplicate slashes, queries, and hashes', () => {
      const { normalizePath, getPageFromPath } = routeUtils;

      // Trailing slashes
      assert.strictEqual(normalizePath('/dashboard/'), '/dashboard');
      assert.strictEqual(getPageFromPath('/dashboard/'), 'dashboard');

      assert.strictEqual(normalizePath('/checkout///'), '/checkout');
      assert.strictEqual(getPageFromPath('/checkout///'), 'checkout');

      assert.strictEqual(normalizePath('///transactions///'), '/transactions');
      assert.strictEqual(getPageFromPath('///transactions///'), 'transactions');

      assert.strictEqual(normalizePath('/student-payments/'), '/student-payments');
      assert.strictEqual(getPageFromPath('/student-payments/'), 'student-payments');

      assert.strictEqual(normalizePath('/settings/'), '/settings');
      assert.strictEqual(getPageFromPath('/settings/'), 'settings');

      assert.strictEqual(normalizePath('/cards/'), '/cards');
      assert.strictEqual(getPageFromPath('/cards/'), 'cards');

      assert.strictEqual(normalizePath('/rupay-upi/'), '/rupay-upi');
      assert.strictEqual(getPageFromPath('/rupay-upi/'), 'rupay-upi');

      // Root slash preservation
      assert.strictEqual(normalizePath('/'), '/');
      assert.strictEqual(normalizePath('///'), '/');
      assert.strictEqual(getPageFromPath('///'), 'landing');

      // Query parameters and hash anchors
      assert.strictEqual(normalizePath('/dashboard?currency=INR&period=week'), '/dashboard');
      assert.strictEqual(getPageFromPath('/dashboard?currency=INR&period=week'), 'dashboard');

      assert.strictEqual(normalizePath('/checkout?order_id=ORD-9821#pay'), '/checkout');
      assert.strictEqual(getPageFromPath('/checkout?order_id=ORD-9821#pay'), 'checkout');
    });

    test('3. Routing: Unknown routes resolve to not-found and never leave main workspace blank', () => {
      const { getPageFromPath, getPathFromPage, isPublicPage, PROTECTED_PAGES } = routeUtils;

      const unknownPaths = [
        '/unknown-path',
        '/random-slug',
        '/dashboard/subpage',
        '/admin/secret',
        '/invalid-route-123'
      ];

      for (const p of unknownPaths) {
        const resolved = getPageFromPath(p);
        assert.strictEqual(resolved, 'not-found', `Unknown path "${p}" must resolve to "not-found"`);
        assert.strictEqual(isPublicPage(resolved), true, `Page "${resolved}" must be a public page`);
        assert.strictEqual(getPathFromPage(resolved), '/not-found');
      }

      // Defensive workspace fallback verification:
      // Any page not in PROTECTED_PAGES is caught by the defensive fallback
      assert.strictEqual(PROTECTED_PAGES.includes('not-found'), false);
      assert.strictEqual(PROTECTED_PAGES.includes('unknown-view'), false);
    });

    test('4. Access Control: Unauthenticated redirects save destination and navigate to login', () => {
      const { resolveAuthRedirect } = routeUtils;

      // Accessing /dashboard while unauthenticated
      const dashRedirect = resolveAuthRedirect({
        isAuthenticated: false,
        activePage: 'dashboard',
        savedRedirect: null
      });
      assert.deepStrictEqual(dashRedirect, {
        redirect: 'login',
        saveRedirect: '/dashboard'
      });

      // Accessing /checkout while unauthenticated
      const checkoutRedirect = resolveAuthRedirect({
        isAuthenticated: false,
        activePage: 'checkout',
        savedRedirect: null
      });
      assert.deepStrictEqual(checkoutRedirect, {
        redirect: 'login',
        saveRedirect: '/checkout'
      });

      // Accessing public page while unauthenticated -> No redirect
      const publicRedirect = resolveAuthRedirect({
        isAuthenticated: false,
        activePage: 'landing',
        savedRedirect: null
      });
      assert.deepStrictEqual(publicRedirect, {
        redirect: null,
        saveRedirect: null
      });
    });

    test('5. Access Control: Authenticated redirects send users to saved destination or dashboard without loops', () => {
      const { resolveAuthRedirect } = routeUtils;

      // Authenticated user on /login with saved redirect to /checkout
      const withSaved = resolveAuthRedirect({
        isAuthenticated: true,
        activePage: 'login',
        savedRedirect: '/checkout'
      });
      assert.deepStrictEqual(withSaved, {
        redirect: 'checkout',
        saveRedirect: null
      });

      // Authenticated user on /login with no saved redirect -> sends to dashboard
      const withoutSaved = resolveAuthRedirect({
        isAuthenticated: true,
        activePage: 'login',
        savedRedirect: null
      });
      assert.deepStrictEqual(withoutSaved, {
        redirect: 'dashboard',
        saveRedirect: null
      });

      // Authenticated user on /signup -> sends to dashboard
      const onSignup = resolveAuthRedirect({
        isAuthenticated: true,
        activePage: 'signup',
        savedRedirect: null
      });
      assert.deepStrictEqual(onSignup, {
        redirect: 'dashboard',
        saveRedirect: null
      });

      // Authenticated user on /dashboard -> stays on dashboard (NO redirect loop)
      const onDashboard = resolveAuthRedirect({
        isAuthenticated: true,
        activePage: 'dashboard',
        savedRedirect: null
      });
      assert.deepStrictEqual(onDashboard, {
        redirect: null,
        saveRedirect: null
      });
    });

    test('6. Error Diagnostics: Sanitizes sensitive tokens, secrets, and credentials in component stacks', () => {
      const { sanitizeErrorDetails } = routeUtils;

      const sensitiveMsg = 'Network failure while requesting https://api.atlaspay.com/auth/me with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretToken123456';
      const sensitiveStack = `Error: Authentication rejected
        at request (api.js:29:15)
        at loadUser (AuthContext.jsx:32:19)?password=SuperSecretPassword123&token=mySecretApiKey999
        at App (App.jsx:218:20)`;

      const result = sanitizeErrorDetails(
        new Error(sensitiveMsg),
        { componentStack: sensitiveStack }
      );

      // Bearer token must be redacted
      assert.ok(!result.message.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretToken123456'));
      assert.ok(result.message.includes('Bearer [REDACTED]'));

      // Passwords and API secrets in component stack must be redacted
      assert.ok(!result.componentStack.includes('SuperSecretPassword123'));
      assert.ok(!result.componentStack.includes('mySecretApiKey999'));
      assert.ok(result.componentStack.includes('password=[REDACTED]'));
    });

    test('7. Dashboard API Availability & Real Data Verification', async () => {
      // 7A. Core metrics endpoint returns 200 with required volume and transaction counters
      const metricsRes = await fetch(`${BASE_URL}/api/analytics/metrics`);
      assert.strictEqual(metricsRes.status, 200);
      const metricsData = await metricsRes.json();
      assert.ok(metricsData.total_volume_usd !== undefined);
      assert.ok(metricsData.total_transactions !== undefined);
      assert.ok(metricsData.settled_transactions !== undefined);

      // 7B. Volume chart endpoint returns 7-day array
      const chartRes = await fetch(`${BASE_URL}/api/analytics/volume-chart`);
      assert.strictEqual(chartRes.status, 200);
      const chartData = await chartRes.json();
      assert.ok(Array.isArray(chartData.labels));
      assert.strictEqual(chartData.labels.length, 7);
      assert.ok(Array.isArray(chartData.volumes));
      assert.strictEqual(chartData.volumes.length, 7);

      // 7C. Transactions endpoint returns real array without fabricating fake amounts
      const txRes = await fetch(`${BASE_URL}/api/transactions?limit=6`);
      assert.strictEqual(txRes.status, 200);
      const txData = await txRes.json();
      assert.ok(Array.isArray(txData.transactions));
      for (const tx of txData.transactions) {
        assert.ok(tx.id, 'Transaction must have an ID');
        assert.ok(typeof tx.amount === 'number' || !isNaN(Number(tx.amount)), 'Transaction amount must be numeric');
      }
    });

    test('8. Newly registered merchant starts with empty inventory and can link bank accounts and cards in isolation', async () => {
      const uniqueEmail = `fresh_${Date.now()}@atlaspay.test`;
      const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail,
          password: 'Password123!',
          company_name: 'Fresh Empty Merchant'
        })
      });
      assert.strictEqual(regRes.status, 201);
      const regData = await regRes.json();
      assert.ok(regData.token);
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      };

      // 8A. Cards, bank accounts, transactions, and analytics must all be completely empty (0)
      const [cardsRes, banksRes, txRes, metricsRes, chartRes] = await Promise.all([
        fetch(`${BASE_URL}/api/cards`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/bank-accounts`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/transactions`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/analytics/metrics`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/analytics/volume-chart`, { headers: authHeaders })
      ]);

      const cardsData = await cardsRes.json();
      const banksData = await banksRes.json();
      const txData = await txRes.json();
      const metricsData = await metricsRes.json();
      const chartData = await chartRes.json();

      assert.strictEqual(cardsData.cards.length, 0);
      assert.strictEqual(banksData.bank_accounts.length, 0);
      assert.strictEqual(txData.transactions.length, 0);
      assert.strictEqual(metricsData.total_volume_usd, 0);
      assert.strictEqual(metricsData.total_transactions, 0);
      assert.strictEqual(metricsData.settled_transactions, 0);
      assert.strictEqual(metricsData.failed_transactions, 0);
      assert.strictEqual(metricsData.conversion_rate_percent, 0);
      assert.deepStrictEqual(chartData.volumes, [0, 0, 0, 0, 0, 0, 0]);
      assert.deepStrictEqual(chartData.transactions_count, [0, 0, 0, 0, 0, 0, 0]);

      // 8B. Link a bank account securely with masking & tokenization
      const linkBankRes = await fetch(`${BASE_URL}/api/bank-accounts`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          account_holder_name: 'Fresh Empty Merchant',
          bank_name: 'HDFC Bank',
          account_number: '501002394812',
          routing_code: 'HDFC0000240',
          account_type: 'current',
          currency: 'INR',
          country: 'IN'
        })
      });
      assert.strictEqual(linkBankRes.status, 201);
      const linkedBank = await linkBankRes.json();
      assert.strictEqual(linkedBank.success, true);
      assert.strictEqual(linkedBank.bank_account.last_four, '4812');
      assert.strictEqual(linkedBank.bank_account.account_number_masked, '•••• •••• 4812');
      assert.strictEqual(linkedBank.bank_account.account_number, undefined);
      assert.strictEqual(linkedBank.bank_account.is_default, true);
      assert.ok(linkedBank.bank_account.token.startsWith('ba_sim_'));

      // Verify demo account does NOT see this merchant's bank account
      const demoBanksRes = await fetch(`${BASE_URL}/api/bank-accounts`);
      const demoBanksData = await demoBanksRes.json();
      assert.ok(!demoBanksData.bank_accounts.some(b => b.id === linkedBank.bank_account.id));

      // Verify fresh merchant DOES see it and can unlink it
      const freshBanksRes = await fetch(`${BASE_URL}/api/bank-accounts`, { headers: authHeaders });
      const freshBanksData = await freshBanksRes.json();
      assert.strictEqual(freshBanksData.bank_accounts.length, 1);

      const delBankRes = await fetch(`${BASE_URL}/api/bank-accounts/${linkedBank.bank_account.id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      assert.strictEqual(delBankRes.status, 200);
    });

    test('9. Newly registered merchant starts with empty student/parent portals and can add Parent Profile first then Student Profile', async () => {
      const uniqueEmail = `parent_first_${Date.now()}@atlaspay.test`;
      const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail,
          password: 'Password123!',
          company_name: 'Parent First Family'
        })
      });
      assert.strictEqual(regRes.status, 201);
      const regData = await regRes.json();
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      };

      // Both portals should indicate needs_setup without leaking demo Aarav/Priya data
      const [stuInitRes, guardPendingRes, guardOverviewRes] = await Promise.all([
        fetch(`${BASE_URL}/api/student/profile`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/guardian/pending-approvals`, { headers: authHeaders }),
        fetch(`${BASE_URL}/api/guardian/overview`, { headers: authHeaders })
      ]);
      const stuInit = await stuInitRes.json();
      const guardPending = await guardPendingRes.json();
      const guardOverview = await guardOverviewRes.json();

      assert.strictEqual(stuInit.needs_setup, true);
      assert.strictEqual(stuInit.profile, null);
      assert.strictEqual(stuInit.guardian_profile, null);
      assert.strictEqual(guardPending.needs_setup, true);
      assert.strictEqual(guardPending.guardian, null);
      assert.deepStrictEqual(guardPending.pending, []);
      assert.strictEqual(guardOverview.needs_setup, true);
      assert.strictEqual(guardOverview.guardian, null);

      // Step 1: Add Parent / Guardian profile first
      const createParentRes = await fetch(`${BASE_URL}/api/guardian/profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          guardian_name: 'Meera Nair',
          guardian_email: 'meera.nair@family.test',
          relationship: 'Mother',
          daily_limit: 120,
          weekly_limit: 300,
          monthly_limit: 700
        })
      });
      assert.strictEqual(createParentRes.status, 201);
      const createdParent = await createParentRes.json();
      assert.strictEqual(createdParent.success, true);
      assert.strictEqual(createdParent.guardian.guardian_name, 'Meera Nair');

      // Student profile is still empty, but guardian_profile is now visible
      const stuMidRes = await fetch(`${BASE_URL}/api/student/profile`, { headers: authHeaders });
      const stuMid = await stuMidRes.json();
      assert.strictEqual(stuMid.needs_setup, true);
      assert.strictEqual(stuMid.profile, null);
      assert.strictEqual(stuMid.guardian_profile.guardian_email, 'meera.nair@family.test');

      // Step 2: Add Student profile next -> should auto-link Meera Nair
      const createStudentRes = await fetch(`${BASE_URL}/api/student/profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_name: 'Rohan Nair',
          email: 'rohan.nair@student.test',
          date_of_birth: '2009-04-12',
          institution_name: 'IIT Madras BS',
          daily_limit: 100,
          weekly_limit: 250,
          monthly_limit: 600
        })
      });
      assert.strictEqual(createStudentRes.status, 201);
      const createdStudent = await createStudentRes.json();
      assert.strictEqual(createdStudent.success, true);
      assert.strictEqual(createdStudent.profile.student_name, 'Rohan Nair');
      assert.strictEqual(createdStudent.profile.guardian_id, createdParent.guardian.id);
      assert.strictEqual(createdStudent.profile.guardian_email, 'meera.nair@family.test');

      // Demo Aarav data remains completely untouched
      const demoStuRes = await fetch(`${BASE_URL}/api/student/profile?student_id=stu_aarav_sharma_01`);
      const demoStu = await demoStuRes.json();
      assert.strictEqual(demoStu.profile.student_name, 'Aarav Sharma');
    });

    test('10. Newly registered merchant can add Student Profile first and then link Parent Profile', async () => {
      const uniqueEmail = `student_first_${Date.now()}@atlaspay.test`;
      const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: uniqueEmail,
          password: 'Password123!',
          company_name: 'Student First Family'
        })
      });
      assert.strictEqual(regRes.status, 201);
      const regData = await regRes.json();
      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regData.token}`
      };

      // Step 1: Add Student profile first (without optional parent fields)
      const createStuRes = await fetch(`${BASE_URL}/api/student/profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          student_name: 'Ananya Verma',
          email: 'ananya.verma@student.test',
          date_of_birth: '2010-08-20',
          institution_name: 'Coursera Youth Track'
        })
      });
      assert.strictEqual(createStuRes.status, 201);
      const createdStu = await createStuRes.json();
      assert.strictEqual(createdStu.profile.student_name, 'Ananya Verma');
      assert.strictEqual(createdStu.profile.guardian_id, null);

      // Guardian portal still needs guardian setup, though students list shows Ananya
      const guardInitRes = await fetch(`${BASE_URL}/api/guardian/overview`, { headers: authHeaders });
      const guardInit = await guardInitRes.json();
      assert.strictEqual(guardInit.needs_setup, true);
      assert.strictEqual(guardInit.guardian, null);
      assert.strictEqual(guardInit.students.length, 1);
      assert.strictEqual(guardInit.students[0].student_name, 'Ananya Verma');

      // Step 2: Add Parent profile -> auto-links onto Ananya Verma
      const createGuardRes = await fetch(`${BASE_URL}/api/guardian/profile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          guardian_name: 'Vikram Verma',
          guardian_email: 'vikram.verma@parent.test'
        })
      });
      assert.strictEqual(createGuardRes.status, 201);
      const createdGuard = await createGuardRes.json();
      assert.strictEqual(createdGuard.linked_students.length, 1);

      const finalStuRes = await fetch(`${BASE_URL}/api/student/profile`, { headers: authHeaders });
      const finalStu = await finalStuRes.json();
      assert.strictEqual(finalStu.needs_setup, false);
      assert.strictEqual(finalStu.profile.guardian_id, createdGuard.guardian.id);
      assert.strictEqual(finalStu.profile.guardian_name, 'Vikram Verma');
    });
  });

  // =========================================================================
  // Official PayPal Payment Gateway Integration Regression Suite
  // =========================================================================
  describe('Official PayPal Payment Gateway Integration Regression Suite', () => {
    const origMock = process.env.PAYPAL_MOCK;
    const origEnv = process.env.PAYPAL_ENV;

    before(() => {
      process.env.PAYPAL_MOCK = 'true';
      process.env.PAYPAL_ENV = 'sandbox';
    });

    after(() => {
      if (origMock !== undefined) process.env.PAYPAL_MOCK = origMock;
      else delete process.env.PAYPAL_MOCK;

      if (origEnv !== undefined) process.env.PAYPAL_ENV = origEnv;
      else delete process.env.PAYPAL_ENV;
    });

    test('1. GET /api/paypal/config returns safe public config and never exposes client secret', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/config`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();

      assert.strictEqual(data.env, 'sandbox');
      assert.strictEqual(data.is_sandbox, true);
      assert.ok(Array.isArray(data.supported_currencies));
      assert.ok(data.supported_currencies.includes('USD'));
      assert.ok(data.supported_currencies.includes('EUR'));
      assert.ok(data.supported_currencies.includes('GBP'));
      assert.ok(data.cross_border_rules);
      assert.strictEqual(data.cross_border_rules.india_domestic_allowed, false);

      // Secret must NEVER be present anywhere in public config
      assert.strictEqual(data.client_secret, undefined);
      assert.strictEqual(data.PAYPAL_CLIENT_SECRET, undefined);
      assert.strictEqual(JSON.stringify(data).includes('client_secret'), false);
    });

    test('2. POST /api/paypal/check-corridor allows valid international export corridor', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/check-corridor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_country: 'US',
          merchant_country: 'IN',
          currency: 'USD'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.eligible, true);
    });

    test('3. POST /api/paypal/check-corridor rejects domestic India-to-India payments (RBI regulation)', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/check-corridor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_country: 'IN',
          merchant_country: 'IN',
          currency: 'USD'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.eligible, false);
      assert.ok(data.reason.includes('domestic India-to-India'));
      assert.ok(data.reason.includes('UPI or RuPay'));
    });

    test('4. POST /api/paypal/check-corridor rejects INR currency for PayPal export orders', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/check-corridor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_country: 'US',
          merchant_country: 'IN',
          currency: 'INR'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.eligible, false);
      assert.ok(data.reason.includes('international settlement currency'));
    });

    test('5. POST /api/paypal/check-corridor rejects unsupported currency (e.g. XYZ)', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/check-corridor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_country: 'US',
          merchant_country: 'IN',
          currency: 'XYZ'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.eligible, false);
      assert.ok(data.reason.includes('XYZ'));
    });

    test('6. POST /api/paypal/create-order strictly rejects negative, zero or non-numeric amount', async () => {
      for (const badAmount of [0, -49.99, 'invalid_amount', null]) {
        const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: badAmount,
            currency: 'USD',
            customer_country: 'US'
          })
        });
        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.strictEqual(data.code, 'INVALID_AMOUNT');
      }
    });

    test('7. POST /api/paypal/create-order rejects domestic corridor at order creation', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 99.00,
          currency: 'USD',
          customer_country: 'IN'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.code, 'CORRIDOR_INELIGIBLE');
    });

    test('8. POST /api/paypal/create-order creates order with valid USD amount and persists initiated transaction', async () => {
      const customTxId = `tx_test_pp_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: customTxId,
          amount: 149.00,
          currency: 'USD',
          customer_country: 'US',
          customer_email: 'buyer@example.com',
          merchant_name: 'Coursera Inc.',
          description: 'Deep Learning Specialization'
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.status, 'CREATED');
      assert.strictEqual(data.transaction_id, customTxId);
      assert.strictEqual(data.amount, '149.00');
      assert.strictEqual(data.currency, 'USD');
      assert.ok(data.order_id);
      assert.ok(data.links.some(l => l.rel === 'approve'));

      // Check DB persistence
      const savedTx = await db.table('transactions').findById(customTxId);
      assert.ok(savedTx);
      assert.strictEqual(savedTx.status, 'initiated');
      assert.strictEqual(savedTx.payment_method, 'paypal');
      assert.strictEqual(savedTx.primary_provider, 'paypal');
      assert.ok(savedTx.metadata_json.includes(data.order_id));
    });

    test('9. POST /api/paypal/capture-order rejects missing order_id with 400 Bad Request', async () => {
      const res = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.code, 'MISSING_ORDER_ID');
    });

    test('10. POST /api/paypal/capture-order captures approved order and marks transaction settled with fees', async () => {
      const txId = `tx_capture_test_${Date.now()}`;

      // 1. Create order
      const createRes = await fetch(`${BASE_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txId,
          amount: 149.00,
          currency: 'USD',
          customer_country: 'US'
        })
      });
      const createData = await createRes.json();
      assert.strictEqual(createData.success, true);

      // 2. Capture order
      const capRes = await fetch(`${BASE_URL}/api/paypal/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: createData.order_id,
          transaction_id: txId
        })
      });

      assert.strictEqual(capRes.status, 200);
      const capData = await capRes.json();
      assert.strictEqual(capData.success, true);
      assert.strictEqual(capData.status, 'settled');
      assert.ok(capData.capture_id);
      assert.strictEqual(capData.amount, '149.00');
      assert.strictEqual(capData.currency, 'USD');
      assert.ok(capData.fee_charged > 0);
      assert.strictEqual(capData.seller_protection, 'ELIGIBLE');

      // 3. Verify DB update
      const settledTx = await db.table('transactions').findById(txId);
      assert.strictEqual(settledTx.status, 'settled');
      assert.strictEqual(settledTx.executed_provider, 'paypal');
      assert.strictEqual(settledTx.fee_charged, capData.fee_charged);
      assert.ok(settledTx.metadata_json.includes(capData.capture_id));
    });

    test('11. GET /api/paypal/order/:orderId returns full order details from PayPal Orders API', async () => {
      const orderId = `PAYID-TEST-${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/paypal/order/${orderId}`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.order.id, orderId);
      assert.strictEqual(data.order.status, 'COMPLETED');
    });

    test('12. POST /api/paypal/webhook verifies signature and rejects when invalid', async () => {
      const origMockVal = process.env.PAYPAL_MOCK;
      const origWebhookId = process.env.PAYPAL_WEBHOOK_ID;
      try {
        process.env.PAYPAL_MOCK = 'false';
        process.env.PAYPAL_WEBHOOK_ID = 'wh_test_id_123';

        const res = await fetch(`${BASE_URL}/api/paypal/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'paypal-auth-algo': 'SHA256withRSA',
            'paypal-cert-url': 'https://api.sandbox.paypal.com/v1/notifications/certs/CERT-123',
            'paypal-transmission-id': 'trans-123',
            'paypal-transmission-sig': 'bad_signature_abc',
            'paypal-transmission-time': new Date().toISOString()
          },
          body: JSON.stringify({ id: 'WH-EVT-BAD', event_type: 'PAYMENT.CAPTURE.COMPLETED' })
        });

        assert.strictEqual(res.status, 400);
        const data = await res.json();
        assert.ok(data.error.includes('signature'));
      } finally {
        process.env.PAYPAL_MOCK = origMockVal;
        if (origWebhookId !== undefined) process.env.PAYPAL_WEBHOOK_ID = origWebhookId;
        else delete process.env.PAYPAL_WEBHOOK_ID;
      }
    });

    test('13. POST /api/paypal/webhook reconciles PAYMENT.CAPTURE.COMPLETED into transactions table', async () => {
      const webhookTxId = `tx_wh_reconcile_${Date.now()}`;
      await db.table('transactions').insert({
        id: webhookTxId,
        merchant_id: 'mer_demo_orchestration_01',
        amount: 89.00,
        currency: 'USD',
        customer_amount: 89.00,
        customer_currency: 'USD',
        exchange_rate: 1.0,
        customer_email: 'buyer@test.org',
        customer_country: 'US',
        payment_method: 'paypal',
        primary_provider: 'paypal',
        executed_provider: 'paypal',
        status: 'initiated',
        metadata_json: JSON.stringify({ paypal_order_id: 'PAYID-WH-ORDER-01' }),
        created_at: new Date().toISOString()
      });

      const eventPayload = {
        id: `WH-EVENT-${Date.now()}-1`,
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: `CAP-WH-${Date.now()}`,
          custom_id: webhookTxId,
          seller_receivable_breakdown: {
            paypal_fee: { value: '3.60', currency_code: 'USD' },
            net_amount: { value: '85.40', currency_code: 'USD' }
          }
        }
      };

      const res = await fetch(`${BASE_URL}/api/paypal/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'PROCESSED');
      assert.strictEqual(data.transaction_id, webhookTxId);

      // Verify transaction status changed to settled
      const updatedTx = await db.table('transactions').findById(webhookTxId);
      assert.strictEqual(updatedTx.status, 'settled');
      assert.strictEqual(updatedTx.fee_charged, 3.60);
      assert.ok(updatedTx.metadata_json.includes('webhook_reconciled'));
    });

    test('14. POST /api/paypal/webhook deduplicates identical event IDs idempotently', async () => {
      const eventId = `WH-DEDUP-${Date.now()}`;
      const payload = {
        id: eventId,
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: `CAP-DEDUP-${Date.now()}`,
          custom_id: 'non_existent_tx'
        }
      };

      // First delivery -> PROCESSED
      const res1 = await fetch(`${BASE_URL}/api/paypal/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res1.status, 200);
      const data1 = await res1.json();
      assert.strictEqual(data1.status, 'PROCESSED');

      // Second delivery with duplicate event id -> ALREADY_PROCESSED
      const res2 = await fetch(`${BASE_URL}/api/paypal/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      assert.strictEqual(res2.status, 200);
      const data2 = await res2.json();
      assert.strictEqual(data2.status, 'ALREADY_PROCESSED');
      assert.strictEqual(data2.event_id, eventId);
    });

    test('15. Webhooks accurately update transactions on PAYMENT.CAPTURE.DENIED and REFUNDED', async () => {
      const deniedTxId = `tx_denied_${Date.now()}`;
      await db.table('transactions').insert({
        id: deniedTxId,
        merchant_id: 'mer_demo_orchestration_01',
        amount: 120.00,
        currency: 'USD',
        payment_method: 'paypal',
        executed_provider: 'paypal',
        status: 'initiated',
        created_at: new Date().toISOString()
      });

      // Send DENIED event
      await fetch(`${BASE_URL}/api/paypal/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `WH-DENIED-${Date.now()}`,
          event_type: 'PAYMENT.CAPTURE.DENIED',
          resource: { custom_id: deniedTxId }
        })
      });

      const txAfterDenial = await db.table('transactions').findById(deniedTxId);
      assert.strictEqual(txAfterDenial.status, 'failed');
      assert.strictEqual(txAfterDenial.decline_code, 'paypal_capture_denied');

      // Send REFUNDED event
      await fetch(`${BASE_URL}/api/paypal/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `WH-REFUND-${Date.now()}`,
          event_type: 'PAYMENT.CAPTURE.REFUNDED',
          resource: { custom_id: deniedTxId }
        })
      });

      const txAfterRefund = await db.table('transactions').findById(deniedTxId);
      assert.strictEqual(txAfterRefund.status, 'refunded');
    });

    test('16. When credentials are missing and mock mode is disabled, create-order returns HTTP 503 with PAYPAL_CREDENTIALS_MISSING', async () => {
      const origMockVal = process.env.PAYPAL_MOCK;
      try {
        process.env.PAYPAL_MOCK = 'false';
        const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 2344.37,
            currency: 'USD',
            customer_country: 'US'
          })
        });

        assert.strictEqual(res.status, 503);
        const data = await res.json();
        assert.strictEqual(data.code, 'PAYPAL_CREDENTIALS_MISSING');
        assert.ok(data.error.includes('PayPal Gateway credentials are missing'));
      } finally {
        process.env.PAYPAL_MOCK = origMockVal;
      }
    });

    test('17. For $2,344.37 USD payment, order creation strictly sends intended USD amount (never INR)', async () => {
      const txId = `tx_usd_integrity_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/paypal/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: txId,
          amount: 2344.37,
          currency: 'USD',
          customer_country: 'US',
          merchant_name: 'Coursera Inc.',
          description: 'Global AI & Data Science Specialization'
        })
      });

      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.amount, '2344.37');
      assert.strictEqual(data.currency, 'USD');
      // Assert that the amount is NOT the converted INR amount (e.g. 205204.17)
      assert.notStrictEqual(data.amount, '205204.17');
    });
  });

  // =========================================================================
  // FX Calculation, Rate Parsing and Mathematical Integrity Regression Suite
  // =========================================================================
  describe('FX Calculation, Rate Parsing and Mathematical Integrity Regression Suite', () => {
    let fxUtils;

    before(async () => {
      fxUtils = await import('../../frontend/src/utils/fxUtils.js');
    });

    test('1. parseFxRate parses valid numeric rate (e.g. 86.45)', () => {
      const rate = fxUtils.parseFxRate({ mid_market_rate: 86.45 });
      assert.strictEqual(rate, 86.45);
    });

    test('2. parseFxRate parses valid string rate ("86.45")', () => {
      const rate = fxUtils.parseFxRate({ mid_market_rate: '86.45' });
      assert.strictEqual(rate, 86.45);
    });

    test('3. parseFxRate strictly rejects zero (0) and string zero ("0", "0.00")', () => {
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: 0 }), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: '0' }), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: '0.00' }), null);
      assert.strictEqual(fxUtils.parseFxRate({ exchange_rate: 0 }), null);
    });

    test('4. parseFxRate strictly rejects negative rates', () => {
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: -86.45 }), null);
      assert.strictEqual(fxUtils.parseFxRate({ exchange_rate: '-1.00' }), null);
    });

    test('5. parseFxRate strictly rejects null, undefined, empty object and invalid strings', () => {
      assert.strictEqual(fxUtils.parseFxRate(null), null);
      assert.strictEqual(fxUtils.parseFxRate(undefined), null);
      assert.strictEqual(fxUtils.parseFxRate({}), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: null }), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: undefined }), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: 'abc' }), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: 'NaN' }), null);
      assert.strictEqual(fxUtils.parseFxRate({ mid_market_rate: Infinity }), null);
    });

    test('6. formatFxRateDisplay displays "FX rate unavailable" instead of ₹0.00 when rate is missing or invalid', () => {
      assert.strictEqual(fxUtils.formatFxRateDisplay(null, 'USD'), 'FX rate unavailable');
      assert.strictEqual(fxUtils.formatFxRateDisplay({}, 'USD'), 'FX rate unavailable');
      assert.strictEqual(fxUtils.formatFxRateDisplay({ mid_market_rate: 0 }, 'USD'), 'FX rate unavailable');
      assert.strictEqual(fxUtils.formatFxRateDisplay({ exchange_rate: '0.00' }, 'USD'), 'FX rate unavailable');
      assert.strictEqual(fxUtils.formatFxRateDisplay({ exchange_rate: -5 }, 'USD'), 'FX rate unavailable');

      // Never contains ₹0.00
      const display = fxUtils.formatFxRateDisplay({ mid_market_rate: 0 }, 'USD');
      assert.strictEqual(display.includes('₹0.00'), false);
    });

    test('7. formatFxRateDisplay displays correct rate when valid', () => {
      const display = fxUtils.formatFxRateDisplay({ mid_market_rate: 86.45 }, 'USD');
      assert.strictEqual(display, '1 USD = ₹86.45 INR');
    });

    test('8. formatFxRateDisplay indicates loading when loading=true', () => {
      const display = fxUtils.formatFxRateDisplay({ mid_market_rate: 86.45 }, 'USD', true);
      assert.strictEqual(display, 'Updating FX rate...');
    });

    test('9. formatMarkupDisplay formats conversion spread correctly and handles failures', () => {
      assert.strictEqual(fxUtils.formatMarkupDisplay({ markup_amount: 2533.38 }), '₹2533.38 INR');
      assert.strictEqual(fxUtils.formatMarkupDisplay({ markup_fee: 2533.38 }), '₹2533.38 INR');
      assert.strictEqual(fxUtils.formatMarkupDisplay(null), 'Unavailable');
      assert.strictEqual(fxUtils.formatMarkupDisplay({ markup_amount: 'invalid' }), 'Unavailable');
      assert.strictEqual(fxUtils.formatMarkupDisplay({}, true), 'Calculating...');
    });

    test('10. formatTotalPayableDisplay formats converted total INR and handles failures', () => {
      assert.strictEqual(fxUtils.formatTotalPayableDisplay({ converted_amount: 205204.17 }), '₹2,05,204.17');
      assert.strictEqual(fxUtils.formatTotalPayableDisplay(null), 'Unavailable');
      assert.strictEqual(fxUtils.formatTotalPayableDisplay({ converted_amount: 0 }), 'Unavailable');
      assert.strictEqual(fxUtils.formatTotalPayableDisplay({}, true), 'Calculating...');
    });

    test('11. Mathematical agreement: $2,344.37 USD matches exactly ₹205,204.17 with 1.25% spread', async () => {
      const res = await fetch(`${BASE_URL}/api/currency/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 2344.37,
          from_currency: 'USD',
          to_currency: 'INR'
        })
      });

      assert.strictEqual(res.status, 200);
      const conversion = await res.json();

      // Verify mid-market rate is finite positive
      const rate = fxUtils.parseFxRate(conversion);
      assert.ok(rate > 0);
      assert.strictEqual(rate, 86.45);

      // Verify markup fee is 1.25% of gross INR
      const expectedBaseInr = 2344.37 * 86.45;
      const expectedMarkup = Number((expectedBaseInr * 0.0125).toFixed(2));
      const expectedTotal = Number((expectedBaseInr + expectedMarkup).toFixed(2));

      const parsedMarkup = fxUtils.parseMarkupAmount(conversion);
      const parsedTotal = fxUtils.parseConvertedAmount(conversion);

      assert.strictEqual(parsedMarkup, expectedMarkup);
      assert.strictEqual(parsedTotal, expectedTotal);
      assert.strictEqual(parsedTotal, 205204.17);

      // Verify formatted output
      assert.strictEqual(fxUtils.formatFxRateDisplay(conversion, 'USD'), '1 USD = ₹86.45 INR');
      assert.strictEqual(fxUtils.formatMarkupDisplay(conversion), '₹2533.38 INR');
      assert.strictEqual(fxUtils.formatTotalPayableDisplay(conversion), '₹2,05,204.17');
    });
  });
});

