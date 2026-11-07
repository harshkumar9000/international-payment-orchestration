/**
 * Backend API Integration and Unit Tests
 * Tests routing, currency conversion, fraud, checkout, recovery, and providers.
 */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { app, startServer } = require('../src/server');
const db = require('../src/db/db');
const seed = require('../src/db/seed');

let serverInstance;
const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe('International Payment Orchestration API Suite', () => {
  before(async () => {
    // Seed test data and run on dedicated port
    await seed();
    serverInstance = app.listen(TEST_PORT);
  });

  after(() => {
    if (serverInstance) {
      serverInstance.close();
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

    // Guardian Pending Approvals
    const guardRes = await fetch(`${BASE_URL}/api/guardian/pending-approvals`);
    assert.strictEqual(guardRes.status, 200);
    const guardData = await guardRes.json();
    assert.ok(guardData.pending.length > 0);

    // Approve the pending request
    const pendingId = guardData.pending[0].id;
    const apprRes = await fetch(`${BASE_URL}/api/guardian/approve/${pendingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Approved for Stanford course' })
    });
    assert.strictEqual(apprRes.status, 200);
    const apprData = await apprRes.json();
    assert.strictEqual(apprData.approval.status, 'APPROVED');
  });
});

