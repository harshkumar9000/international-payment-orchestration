/**
 * Database Seed Script
 * Pre-populates realistic FinTech records for merchants, payment providers,
 * intelligent routing rules, and past transactions with audit logs.
 */
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  await db.init();
  console.log('🌱 Starting database seed...');

  // Reset local store to ensure clean demo state
  db.resetStore();

  // 1. Create Default Demo Merchant
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const demoMerchant = {
    id: 'mer_demo_orchestration_01',
    email: 'merchant@example.com',
    password_hash: passwordHash,
    company_name: 'Atlas Cross-Border Commerce Ltd',
    default_currency: 'USD',
    markup_percentage: 1.25,
    api_key: 'sk_live_orchestration_atlas_983742',
    role: 'merchant',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };
  await db.table('merchants').insert(demoMerchant);
  console.log('  -> Merchant created: merchant@example.com / Password123!');

  // 2. Providers
  const providers = [
    {
      id: 'stripe',
      name: 'Stripe Global',
      is_active: true,
      base_fee_percent: 2.90,
      base_fee_fixed: 0.30,
      avg_latency_ms: 320,
      success_rate: 0.9620,
      uptime: 0.9998,
      supported_currencies: '["USD","EUR","GBP","CAD","AUD","JPY","SGD","NZD","CHF"]',
      supported_methods: '["credit_card","debit_card","apple_pay","google_pay"]',
      supported_countries: '["US","CA","GB","AU","DE","FR","JP","SG","NL","IE","ES","IT"]',
      created_at: new Date().toISOString()
    },
    {
      id: 'adyen',
      name: 'Adyen European & Global',
      is_active: true,
      base_fee_percent: 1.90,
      base_fee_fixed: 0.12,
      avg_latency_ms: 285,
      success_rate: 0.9780,
      uptime: 0.9999,
      supported_currencies: '["EUR","GBP","USD","CHF","SEK","NOK","DKK","PLN"]',
      supported_methods: '["credit_card","debit_card","sepa_debit","ideal","sofort","giropay"]',
      supported_countries: '["DE","FR","NL","GB","ES","IT","SE","CH","BE","AT","PL"]',
      created_at: new Date().toISOString()
    },
    {
      id: 'paypal',
      name: 'PayPal Sandbox / Enterprise',
      is_active: true,
      base_fee_percent: 3.49,
      base_fee_fixed: 0.49,
      avg_latency_ms: 520,
      success_rate: 0.9450,
      uptime: 0.9995,
      supported_currencies: '["USD","EUR","GBP","CAD","AUD","JPY"]',
      supported_methods: '["paypal_wallet","paypal_credit","credit_card","debit_card"]',
      supported_countries: '["US","GB","DE","FR","CA","AU","JP"]',
      created_at: new Date().toISOString()
    },
    {
      id: 'razorpay_upi',
      name: 'Razorpay / UPI India Gateway',
      is_active: true,
      base_fee_percent: 0.50,
      base_fee_fixed: 0.00,
      avg_latency_ms: 190,
      success_rate: 0.9850,
      uptime: 0.9997,
      supported_currencies: '["INR"]',
      supported_methods: '["upi","upi_qr","upi_intent","netbanking","rupay_card"]',
      supported_countries: '["IN"]',
      created_at: new Date().toISOString()
    },
    {
      id: 'dlocal',
      name: 'dLocal Emerging Corridors',
      is_active: true,
      base_fee_percent: 2.40,
      base_fee_fixed: 0.20,
      avg_latency_ms: 410,
      success_rate: 0.9510,
      uptime: 0.9992,
      supported_currencies: '["BRL","MXN","COP","CLP","PEN","ZAR","NGN","KES","INR","USD"]',
      supported_methods: '["pix","oxxo","pse","boleto","credit_card","debit_card"]',
      supported_countries: '["BR","MX","CO","CL","PE","ZA","NG","KE","IN"]',
      created_at: new Date().toISOString()
    }
  ];

  for (const prov of providers) {
    await db.table('providers').insert(prov);
  }
  console.log(`  -> Inserted ${providers.length} payment provider profiles.`);

  // 3. Routing Rules
  const routingRules = [
    {
      id: 'rule_upi_priority_01',
      merchant_id: demoMerchant.id,
      name: 'Direct India UPI / RuPay Corridor',
      priority_order: 1,
      is_active: true,
      condition_json: JSON.stringify({ currency: 'INR', payment_method: 'upi' }),
      target_provider: 'razorpay_upi',
      created_at: new Date().toISOString()
    },
    {
      id: 'rule_eur_sepa_adyen_02',
      merchant_id: demoMerchant.id,
      name: 'European Union Low-Fee Adyen Rail',
      priority_order: 2,
      is_active: true,
      condition_json: JSON.stringify({ currency: 'EUR' }),
      target_provider: 'adyen',
      created_at: new Date().toISOString()
    },
    {
      id: 'rule_latam_pix_03',
      merchant_id: demoMerchant.id,
      name: 'Brazil Pix & LATAM Local Payment',
      priority_order: 3,
      is_active: true,
      condition_json: JSON.stringify({ country: 'BR' }),
      target_provider: 'dlocal',
      created_at: new Date().toISOString()
    },
    {
      id: 'rule_us_card_stripe_04',
      merchant_id: demoMerchant.id,
      name: 'North America Fast Card Authorization',
      priority_order: 4,
      is_active: true,
      condition_json: JSON.stringify({ currency: 'USD', country: 'US' }),
      target_provider: 'stripe',
      created_at: new Date().toISOString()
    }
  ];

  for (const rule of routingRules) {
    await db.table('routing_rules').insert(rule);
  }
  console.log(`  -> Inserted ${routingRules.length} intelligent routing rules.`);

  // 4. Past Transactions & Audit Trails
  const now = Date.now();
  const sampleTransactions = [
    {
      id: 'tx_demo_001',
      merchant_id: demoMerchant.id,
      amount: 149.00,
      currency: 'USD',
      customer_amount: 149.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'alex.taylor@techhub.io',
      customer_country: 'US',
      payment_method: 'credit_card',
      primary_provider: 'stripe',
      executed_provider: 'stripe',
      status: 'settled',
      risk_score: 12,
      risk_level: 'LOW',
      decline_code: null,
      decline_reason: null,
      fee_charged: 4.62,
      latency_ms: 310,
      metadata_json: JSON.stringify({ order_id: 'ORD-9821', ip: '64.233.160.1', '3ds': 'frictionless' }),
      created_at: new Date(now - 12 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_002',
      merchant_id: demoMerchant.id,
      amount: 85.00,
      currency: 'EUR',
      customer_amount: 85.00,
      customer_currency: 'EUR',
      exchange_rate: 1.08,
      customer_email: 'sophie.muller@berlin-design.de',
      customer_country: 'DE',
      payment_method: 'sepa_debit',
      primary_provider: 'adyen',
      executed_provider: 'adyen',
      status: 'settled',
      risk_score: 8,
      risk_level: 'LOW',
      decline_code: null,
      decline_reason: null,
      fee_charged: 1.73,
      latency_ms: 275,
      metadata_json: JSON.stringify({ order_id: 'ORD-9822', ip: '85.214.132.1' }),
      created_at: new Date(now - 45 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_003',
      merchant_id: demoMerchant.id,
      amount: 4500.00,
      currency: 'INR',
      customer_amount: 4500.00,
      customer_currency: 'INR',
      exchange_rate: 0.0116,
      customer_email: 'vikram.sharma@startupindia.in',
      customer_country: 'IN',
      payment_method: 'upi',
      primary_provider: 'razorpay_upi',
      executed_provider: 'razorpay_upi',
      status: 'settled',
      risk_score: 14,
      risk_level: 'LOW',
      decline_code: null,
      decline_reason: null,
      fee_charged: 22.50,
      latency_ms: 185,
      metadata_json: JSON.stringify({ order_id: 'ORD-9823', vpa: 'vikram@okaxis' }),
      created_at: new Date(now - 80 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_004',
      merchant_id: demoMerchant.id,
      amount: 220.00,
      currency: 'USD',
      customer_amount: 220.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'marcus.vance@chicago.net',
      customer_country: 'US',
      payment_method: 'credit_card',
      primary_provider: 'stripe',
      executed_provider: 'adyen',
      status: 'recovered',
      risk_score: 28,
      risk_level: 'LOW',
      decline_code: 'network_timeout',
      decline_reason: 'Primary processor Stripe timed out. Instantly cascaded to secondary gateway Adyen with successful settlement.',
      fee_charged: 4.30,
      latency_ms: 590,
      metadata_json: JSON.stringify({ order_id: 'ORD-9824', retry_strategy: 'CASCADE_FALLBACK' }),
      created_at: new Date(now - 140 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_005',
      merchant_id: demoMerchant.id,
      amount: 1450.00,
      currency: 'USD',
      customer_amount: 1450.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'bot_suspicious_99@mailinator.com',
      customer_country: 'US',
      payment_method: 'credit_card',
      primary_provider: 'stripe',
      executed_provider: 'none',
      status: 'blocked',
      risk_score: 92,
      risk_level: 'CRITICAL',
      decline_code: 'suspected_fraud',
      decline_reason: 'AI Risk Engine blocked transaction: High velocity anomaly and disposable email domain detected.',
      fee_charged: 0.00,
      latency_ms: 45,
      metadata_json: JSON.stringify({ order_id: 'ORD-9825', fraud_flags: ['DISPOSABLE_EMAIL_DOMAIN', 'AMOUNT_OUTLIER_CRITICAL'] }),
      created_at: new Date(now - 210 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_006',
      merchant_id: demoMerchant.id,
      amount: 320.00,
      currency: 'BRL',
      customer_amount: 320.00,
      customer_currency: 'BRL',
      exchange_rate: 0.174,
      customer_email: 'lucas.silva@sao-paulo.com.br',
      customer_country: 'BR',
      payment_method: 'pix',
      primary_provider: 'dlocal',
      executed_provider: 'dlocal',
      status: 'settled',
      risk_score: 11,
      risk_level: 'LOW',
      decline_code: null,
      decline_reason: null,
      fee_charged: 7.88,
      latency_ms: 395,
      metadata_json: JSON.stringify({ order_id: 'ORD-9826', pix_qr: 'generated' }),
      created_at: new Date(now - 320 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_007',
      merchant_id: demoMerchant.id,
      amount: 110.00,
      currency: 'GBP',
      customer_amount: 110.00,
      customer_currency: 'GBP',
      exchange_rate: 1.28,
      customer_email: 'oliver.brown@london.co.uk',
      customer_country: 'GB',
      payment_method: 'credit_card',
      primary_provider: 'adyen',
      executed_provider: 'adyen',
      status: 'settled',
      risk_score: 19,
      risk_level: 'LOW',
      decline_code: null,
      decline_reason: null,
      fee_charged: 2.21,
      latency_ms: 290,
      metadata_json: JSON.stringify({ order_id: 'ORD-9827' }),
      created_at: new Date(now - 450 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_008',
      merchant_id: demoMerchant.id,
      amount: 95.00,
      currency: 'USD',
      customer_amount: 95.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'claire.dubois@paris-corp.fr',
      customer_country: 'FR',
      payment_method: 'paypal_wallet',
      primary_provider: 'paypal',
      executed_provider: 'paypal',
      status: 'settled',
      risk_score: 22,
      risk_level: 'LOW',
      decline_code: null,
      decline_reason: null,
      fee_charged: 3.80,
      latency_ms: 510,
      metadata_json: JSON.stringify({ order_id: 'ORD-9828', paypal_capture_id: 'PAYID-SANDBOX-89123' }),
      created_at: new Date(now - 600 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_009',
      merchant_id: demoMerchant.id,
      amount: 275.00,
      currency: 'USD',
      customer_amount: 275.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'jordan.bell@toronto.ca',
      customer_country: 'CA',
      payment_method: 'credit_card',
      primary_provider: 'stripe',
      executed_provider: 'stripe',
      status: 'failed',
      risk_score: 45,
      risk_level: 'MEDIUM',
      decline_code: 'insufficient_funds',
      decline_reason: 'Issuer declined due to insufficient account balance. Scheduled for smart retry.',
      fee_charged: 0.00,
      latency_ms: 340,
      metadata_json: JSON.stringify({ order_id: 'ORD-9829', recovery_status: 'QUEUED' }),
      created_at: new Date(now - 780 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_demo_010',
      merchant_id: demoMerchant.id,
      amount: 180.00,
      currency: 'USD',
      customer_amount: 180.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'ananya.iyer@mumbai.in',
      customer_country: 'IN',
      payment_method: 'credit_card',
      primary_provider: 'stripe',
      executed_provider: 'razorpay_upi',
      status: 'recovered',
      risk_score: 24,
      risk_level: 'LOW',
      decline_code: 'do_not_honor',
      decline_reason: 'International card payment rejected by issuing bank; automated fallback prompted India UPI payment, successfully settled.',
      fee_charged: 0.90,
      latency_ms: 480,
      metadata_json: JSON.stringify({ order_id: 'ORD-9830', fallback_type: 'APM_SWITCH' }),
      created_at: new Date(now - 920 * 60 * 1000).toISOString()
    }
  ];

  for (const tx of sampleTransactions) {
    await db.table('transactions').insert(tx);

    // Audit logs for recovered transactions
    if (tx.status === 'recovered') {
      await db.table('recovery_logs').insert({
        id: `rec_${tx.id}`,
        transaction_id: tx.id,
        original_provider: tx.primary_provider,
        retry_provider: tx.executed_provider,
        decline_code: tx.decline_code,
        is_successful: true,
        strategy_used: 'CASCADE_FALLBACK_IMMEDIATE',
        recovered_at: tx.created_at
      });
    }

    // Fraud log for blocked
    if (tx.status === 'blocked') {
      await db.table('fraud_assessments').insert({
        id: `fraud_${tx.id}`,
        transaction_id: tx.id,
        risk_score: tx.risk_score,
        risk_level: tx.risk_level,
        decision: 'DECLINE',
        triggered_rules_json: JSON.stringify(['DISPOSABLE_EMAIL_DOMAIN', 'AMOUNT_OUTLIER_CRITICAL']),
        score_breakdown_json: JSON.stringify({ email_risk: 30, amount_risk: 35, velocity: 27 }),
        assessed_at: tx.created_at
      });
    }
  }

  // 5. Student & Under-18 Profiles
  const studentProfiles = [
    {
      id: 'stu_aarav_sharma_01',
      user_id: 'usr_aarav_01',
      email: 'aarav.student@delhiuniversity.ac.in',
      student_name: 'Aarav Sharma',
      date_of_birth: '2008-05-15',
      is_minor: true,
      institution_name: 'Delhi Public School / Global Scholars Program',
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
      whitelisted_mccs: JSON.stringify(['education_higher_ed', 'online_courses', 'books_study_materials', 'software_tools', 'standardized_testing']),
      created_at: new Date(now - 60 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'stu_elena_02',
      user_id: 'usr_elena_02',
      email: 'elena.rostova@oxford.ac.uk',
      student_name: 'Elena Rostova',
      date_of_birth: '2005-09-12',
      is_minor: false,
      institution_name: 'University of Oxford',
      student_id_number: 'OX-2023-4122',
      guardian_id: 'guard_dmitri_02',
      guardian_email: 'dmitri.rostov@family.co.uk',
      guardian_name: 'Dmitri Rostov',
      guardian_consent_status: 'ACTIVE',
      daily_limit: 500.00,
      weekly_limit: 2000.00,
      monthly_limit: 5000.00,
      single_tx_limit: 1000.00,
      auto_approval_threshold: 200.00,
      whitelisted_mccs: JSON.stringify(['education_higher_ed', 'online_courses', 'software_tools']),
      created_at: new Date(now - 90 * 24 * 3600 * 1000).toISOString()
    }
  ];

  for (const stu of studentProfiles) {
    await db.table('student_profiles').insert(stu);
  }
  console.log(`  -> Inserted ${studentProfiles.length} student profiles.`);

  // 6. Guardian Approval Requests
  const guardianApprovals = [
    {
      id: 'appr_pending_coursera_01',
      transaction_id: 'tx_student_pending_01',
      student_id: 'stu_aarav_sharma_01',
      guardian_id: 'guard_priya_sharma_01',
      amount: 79.00,
      currency: 'USD',
      merchant_name: 'Coursera Deep Learning Specialization',
      merchant_category: 'online_courses',
      purpose_description: 'Stanford AI & Machine Learning Specialization Certificate (Exceeds $50 auto-allowance)',
      status: 'PENDING',
      decision_reason: null,
      requested_at: new Date(now - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'appr_approved_gre_02',
      transaction_id: 'tx_student_gre_02',
      student_id: 'stu_aarav_sharma_01',
      guardian_id: 'guard_priya_sharma_01',
      amount: 220.00,
      currency: 'USD',
      merchant_name: 'Educational Testing Service (ETS) - GRE Exam',
      merchant_category: 'standardized_testing',
      purpose_description: 'GRE General Test Registration Fee',
      status: 'APPROVED',
      decision_reason: 'Approved by Priya Sharma via Parent Mobile Portal.',
      requested_at: new Date(now - 3 * 24 * 3600 * 1000).toISOString(),
      decided_at: new Date(now - 3 * 24 * 3600 * 1000 + 400000).toISOString()
    }
  ];

  for (const appr of guardianApprovals) {
    await db.table('guardian_approvals').insert(appr);
  }
  console.log(`  -> Inserted ${guardianApprovals.length} guardian approvals.`);

  // 7. Stuck Transactions & Seeded Refunds for Agentic Engine
  const stuckTxs = [
    {
      id: 'tx_stuck_orphaned_01',
      merchant_id: demoMerchant.id,
      amount: 89.00,
      currency: 'USD',
      customer_amount: 89.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'anita.desai@mumbai.in',
      customer_country: 'IN',
      payment_method: 'credit_card',
      primary_provider: 'stripe',
      executed_provider: 'stripe',
      status: 'failed',
      risk_score: 18,
      risk_level: 'LOW',
      decline_code: 'network_timeout_after_capture',
      decline_reason: 'Stuck Transaction: Card was debited at gateway but merchant webhook timed out. Eligible for automated agentic refund.',
      fee_charged: 0.00,
      latency_ms: 3200,
      metadata_json: JSON.stringify({ order_id: 'ORD-STUCK-891', stuck_type: 'ORPHANED_CAPTURE' }),
      created_at: new Date(now - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'tx_high_val_tuition_02',
      merchant_id: demoMerchant.id,
      amount: 850.00,
      currency: 'USD',
      customer_amount: 850.00,
      customer_currency: 'USD',
      exchange_rate: 1.0,
      customer_email: 'rohan.mehta@delhi.ac.in',
      customer_country: 'IN',
      payment_method: 'credit_card',
      primary_provider: 'adyen',
      executed_provider: 'adyen',
      status: 'failed',
      risk_score: 42,
      risk_level: 'MEDIUM',
      decline_code: 'service_cancellation_dispute',
      decline_reason: 'High-Value Course Tuition: Exceeds $500 threshold. Queued for human compliance officer review.',
      fee_charged: 0.00,
      latency_ms: 420,
      metadata_json: JSON.stringify({ order_id: 'ORD-TUITION-99', high_value: true }),
      created_at: new Date(now - 40 * 60 * 1000).toISOString()
    }
  ];

  for (const st of stuckTxs) {
    await db.table('transactions').insert(st);
  }

  // Pre-seed an existing settled refund to test idempotency
  await db.table('refund_records').insert({
    id: 'ref_demo_settled_01',
    transaction_id: 'tx_demo_009',
    amount: 275.00,
    currency: 'USD',
    provider: 'stripe',
    provider_refund_id: 're_stripe_89123891',
    reason_code: 'AUTONOMOUS_REFUND_AUTHORIZED',
    reason_description: 'Automated agent refund for duplicate charge attempt.',
    status: 'SETTLED',
    idempotency_key: 'idem_tx_demo_009_275_USD',
    agent_evaluated: true,
    agent_confidence_score: 0.99,
    customer_notified: true,
    initiated_by: 'AI_AGENT_AUTONOMOUS',
    created_at: new Date(now - 120 * 60 * 1000).toISOString()
  });

  console.log(`  -> Inserted stuck transactions and agentic refund seed records.`);
  console.log(`  -> Inserted ${sampleTransactions.length} sample transactions and audit records.`);
  console.log('✅ Database seed completed successfully!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;
