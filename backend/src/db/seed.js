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
