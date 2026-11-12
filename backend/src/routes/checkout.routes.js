const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const { optionalAuth } = require('../middleware/auth.middleware');
const compatibilityService = require('../services/compatibility.service');
const currencyService = require('../services/currency.service');
const routingEngine = require('../services/routingEngine.service');
const pythonBridge = require('../services/pythonBridge.service');
const recoveryEngine = require('../services/recoveryEngine.service');
const domesticCardService = require('../services/domesticCard.service');
const studentPaymentService = require('../services/studentPayment.service');
const { getProvider } = require('../services/paymentProviders');

// POST /initiate (Prepares international checkout session)
router.post('/initiate', optionalAuth, async (req, res) => {
  try {
    const {
      amount = 100,
      currency = 'USD',
      customer_country = 'US',
      customer_email = 'customer@example.com',
      payment_method = 'credit_card',
      ip_country = 'US',
      ip_address = '127.0.0.1',
      is_vpn = false,
      card_bin = null,
      is_student_payment = false,
      student_id = null,
      merchant_category = 'general_ecommerce',
      merchant_name = 'Atlas Global Commerce'
    } = req.body;

    const merchantId = req.merchant ? req.merchant.id : 'mer_demo_orchestration_01';

    // 0. Domestic Instrument (RuPay / Domestic Card) Check
    if (payment_method === 'rupay_card' || card_bin?.startsWith('60') || card_bin?.startsWith('65')) {
      const domesticCheck = await domesticCardService.checkEligibility({
        payment_method: payment_method,
        bin: card_bin || '6521',
        currency: currency,
        merchant_country: customer_country,
        amount_usd: parseFloat(amount),
        is_educational: Boolean(is_student_payment)
      });

      if (!domesticCheck.eligible) {
        return res.status(400).json({
          error: domesticCheck.rejection_reason || 'Domestic instrument not eligible for cross-border transactions.',
          domestic_check: domesticCheck
        });
      }
    }

    // 0b. Student & Minor Payment Intent Evaluation
    let studentVerification = null;
    let requiresParentApproval = false;
    if (is_student_payment) {
      const studentRes = await studentPaymentService.verifyStudentIntent(student_id || customer_email, {
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        merchant_category: merchant_category,
        merchant_name: merchant_name
      });
      studentVerification = studentRes.verification || studentRes;

      if (studentVerification.status === 'BLOCKED') {
        return res.status(403).json({
          error: studentVerification.reason || 'Transaction blocked by student protection guardrails.',
          student_verification: studentVerification
        });
      }

      if (studentVerification.status === 'PENDING_APPROVAL') {
        requiresParentApproval = true;
      }
    }

    // 1. Check Corridor Compatibility & Sanctions
    const compCheck = compatibilityService.checkCompatibility(customer_country, currency, amount);
    if (!compCheck.compatible || compCheck.blocked) {
      return res.status(403).json({
        error: compCheck.message || 'Payment corridor is blocked by international regulations.',
        details: compCheck
      });
    }

    // 2. Real-time Currency Conversion & Markup
    const targetCurrency = compCheck.default_currency || currency;
    let conversion;
    try {
      conversion = currencyService.convertAmount(amount, currency, targetCurrency, 1.25);
    } catch (fxErr) {
      return res.status(fxErr.status || 503).json({
        error: fxErr.message || 'Payment processing blocked: FX rates are stale or unavailable.',
        code: fxErr.code || 'FX_RATES_UNAVAILABLE'
      });
    }

    // 3. AI Fraud Assessment
    const fraudAssessment = await pythonBridge.assessFraud({
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      customer_country: customer_country.toUpperCase(),
      billing_country: customer_country.toUpperCase(),
      ip_country: (ip_country || customer_country).toUpperCase(),
      customer_email: customer_email,
      ip_address: ip_address,
      payment_method: payment_method,
      is_vpn: Boolean(is_vpn)
    });

    // 4. Intelligent Routing Selection
    const routeDecision = await routingEngine.selectOptimalRoute({
      merchant_id: merchantId,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      payment_method: payment_method,
      customer_country: customer_country.toUpperCase()
    });

    const transactionId = `tx_${uuidv4().substring(0, 10)}`;

    // If critical fraud detected, block immediately
    if (fraudAssessment.decision === 'DECLINE') {
      const blockedTx = {
        id: transactionId,
        merchant_id: merchantId,
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        customer_amount: conversion.converted_amount,
        customer_currency: targetCurrency,
        exchange_rate: conversion.effective_rate,
        customer_email: customer_email,
        customer_country: customer_country.toUpperCase(),
        payment_method: payment_method,
        primary_provider: routeDecision.primary_provider,
        executed_provider: 'none',
        status: 'blocked',
        risk_score: fraudAssessment.risk_score,
        risk_level: fraudAssessment.risk_level,
        decline_code: 'suspected_fraud',
        decline_reason: `Blocked by AI Risk Engine: ${fraudAssessment.triggered_rules.map(r => r.code).join(', ')}`,
        fee_charged: 0.0,
        latency_ms: 35,
        metadata_json: JSON.stringify({ fraud_assessment: fraudAssessment }),
        created_at: new Date().toISOString()
      };
      await db.table('transactions').insert(blockedTx);

      await db.table('fraud_assessments').insert({
        id: `fraud_${uuidv4().substring(0, 8)}`,
        transaction_id: transactionId,
        risk_score: fraudAssessment.risk_score,
        risk_level: fraudAssessment.risk_level,
        decision: 'DECLINE',
        triggered_rules_json: JSON.stringify(fraudAssessment.triggered_rules || []),
        score_breakdown_json: JSON.stringify(fraudAssessment.score_breakdown || {}),
        assessed_at: new Date().toISOString()
      });

      return res.status(403).json({
        status: 'blocked',
        transaction_id: transactionId,
        error: 'Transaction blocked by fraud risk assessment.',
        fraud_assessment: fraudAssessment
      });
    }

    // Create initiated transaction (or pending parent approval if student limit triggered)
    const initialStatus = requiresParentApproval ? 'pending_parent_approval' : 'initiated';

    let guardianApproval = null;
    if (requiresParentApproval) {
      guardianApproval = await studentPaymentService.requestGuardianApproval(
        student_id || customer_email,
        transactionId,
        {
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          merchant_name: merchant_name,
          merchant_category: merchant_category,
          purpose_description: `Educational checkout on ${merchant_name}`
        }
      );
    }

    const initialTx = {
      id: transactionId,
      merchant_id: merchantId,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      customer_amount: conversion.converted_amount,
      customer_currency: targetCurrency,
      exchange_rate: conversion.effective_rate,
      customer_email: customer_email,
      customer_country: customer_country.toUpperCase(),
      payment_method: payment_method,
      primary_provider: routeDecision.primary_provider,
      executed_provider: routeDecision.primary_provider,
      status: initialStatus,
      risk_score: fraudAssessment.risk_score,
      risk_level: fraudAssessment.risk_level,
      decline_code: null,
      decline_reason: requiresParentApproval ? 'Payment held awaiting parent/guardian approval.' : null,
      fee_charged: 0.0,
      latency_ms: 0,
      metadata_json: JSON.stringify({
        cascade_options: routeDecision.cascade_fallback_order,
        applied_rule: routeDecision.applied_rule,
        is_student_payment: Boolean(is_student_payment),
        student_id: student_id,
        guardian_approval_id: guardianApproval ? guardianApproval.id : null
      }),
      created_at: new Date().toISOString()
    };
    await db.table('transactions').insert(initialTx);

    // Save routing audit log
    await db.table('routing_logs').insert({
      id: `rout_${uuidv4().substring(0, 8)}`,
      transaction_id: transactionId,
      evaluated_at: new Date().toISOString(),
      candidates_json: JSON.stringify(routeDecision.cascade_candidates || []),
      chosen_provider: routeDecision.primary_provider,
      cascade_order_json: JSON.stringify(routeDecision.cascade_fallback_order || []),
      rationale: routeDecision.routing_rationale
    });

    res.json({
      session_id: transactionId,
      transaction_id: transactionId,
      status: initialStatus,
      corridor: compCheck,
      conversion: conversion,
      fraud_assessment: fraudAssessment,
      routing: routeDecision,
      payment_methods: compCheck.compatible_methods,
      student_verification: studentVerification,
      guardian_approval: guardianApproval
    });
  } catch (err) {
    console.error('[Checkout Initiate Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /process (Executes the payment attempt with smart cascading recovery)
router.post('/process', optionalAuth, async (req, res) => {
  try {
    const {
      transaction_id,
      payment_method = 'credit_card',
      payment_data = {},
      simulate_decline = null
    } = req.body;

    const tx = await db.table('transactions').findById(transaction_id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found or session expired.' });
    }

    // Guard against executing live payment processing when FX is simulated in production
    if (currencyService.isProductionOrLivePayment() && !currencyService.isLiveFx()) {
      return res.status(503).json({
        error: 'Production payment blocked: FX service is running in simulated mode. Live payment processing requires a verified live FX market feed.',
        code: 'FX_SIMULATED_IN_PRODUCTION_BLOCKED'
      });
    }

    const metadata = typeof tx.metadata_json === 'string' ? JSON.parse(tx.metadata_json || '{}') : (tx.metadata_json || {});
    const cascadeOptions = metadata.cascade_options || ['adyen', 'stripe', 'paypal'];

    // Select primary provider
    const providerId = tx.primary_provider || 'stripe';
    const provider = getProvider(providerId);

    const paymentDetails = {
      order_id: tx.id,
      amount: parseFloat(tx.amount),
      currency: tx.currency,
      customer_email: tx.customer_email,
      customer_country: tx.customer_country,
      payment_method: payment_method,
      simulate_decline: simulate_decline,
      ...payment_data
    };

    // Primary Gateway Execution
    const result = await provider.processPayment(paymentDetails);

    // Handle 3DS Action
    if (result.status === 'pending_3ds') {
      await db.table('transactions').update(tx.id, {
        status: 'pending_3ds',
        executed_provider: providerId,
        latency_ms: result.latency_ms
      });
      return res.json({
        status: 'pending_3ds',
        transaction_id: tx.id,
        requires_action: result.requires_action
      });
    }

    // Handle UPI Collect Action
    if (result.status === 'pending_upi') {
      await db.table('transactions').update(tx.id, {
        status: 'pending_upi',
        executed_provider: providerId,
        latency_ms: result.latency_ms
      });
      return res.json({
        status: 'pending_upi',
        transaction_id: tx.id,
        requires_action: result.requires_action
      });
    }

    // Handle Successful Settlement
    if (result.success && result.status === 'settled') {
      await db.table('transactions').update(tx.id, {
        status: 'settled',
        executed_provider: providerId,
        fee_charged: result.fee_charged,
        latency_ms: result.latency_ms
      });
      return res.json({
        status: 'settled',
        transaction_id: tx.id,
        provider: providerId,
        gateway_reference: result.gateway_reference,
        fee_charged: result.fee_charged,
        latency_ms: result.latency_ms,
        metadata: result.metadata
      });
    }

    // Primary Failed / Declined -> Trigger Recovery Engine (Cascading Fallback!)
    console.log(`⚠️ Primary gateway ${providerId} declined transaction ${tx.id} (${result.decline_code}). Invoking Recovery Engine...`);
    const recoveryResult = await recoveryEngine.handlePaymentDecline(tx, result, paymentDetails, cascadeOptions);

    if (recoveryResult.recovered) {
      return res.json({
        status: 'recovered',
        transaction_id: tx.id,
        message: 'Payment recovered automatically via intelligent cascading fallback!',
        provider: recoveryResult.final_provider,
        recovered_from: recoveryResult.original_provider,
        recovery_details: recoveryResult.result
      });
    }

    // Terminal Failure
    res.status(402).json({
      status: 'failed',
      transaction_id: tx.id,
      error: result.decline_reason || 'Payment was declined',
      decline_code: result.decline_code,
      recovery_analysis: recoveryResult.analysis
    });
  } catch (err) {
    console.error('[Checkout Process Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /verify-3ds (Simulates OTP / Biometric completion for Strong Customer Authentication)
router.post('/verify-3ds', async (req, res) => {
  try {
    const { transaction_id, otp = '123456' } = req.body;
    const tx = await db.table('transactions').findById(transaction_id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const fee = Math.round(((parseFloat(tx.amount) * 0.029) + 0.30) * 100) / 100;
    await db.table('transactions').update(tx.id, {
      status: 'settled',
      fee_charged: fee,
      latency_ms: (tx.latency_ms || 250) + 120
    });

    res.json({
      status: 'settled',
      transaction_id: tx.id,
      message: '3-D Secure Strong Customer Authentication verified successfully.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /verify-upi (Simulates user approving UPI request on mobile device)
router.post('/verify-upi', async (req, res) => {
  try {
    const { transaction_id } = req.body;
    const tx = await db.table('transactions').findById(transaction_id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const fee = Math.round((parseFloat(tx.amount) * 0.005) * 100) / 100;
    await db.table('transactions').update(tx.id, {
      status: 'settled',
      fee_charged: fee,
      latency_ms: (tx.latency_ms || 180) + 95
    });

    res.json({
      status: 'settled',
      transaction_id: tx.id,
      message: 'UPI collect transaction authorized by payer via mobile banking app.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /status/:id
router.get('/status/:id', async (req, res) => {
  try {
    const tx = await db.table('transactions').findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({
      transaction_id: tx.id,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      provider: tx.executed_provider,
      risk_score: tx.risk_score
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

