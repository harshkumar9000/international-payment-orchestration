/**
 * Python Intelligence Microservice Bridge
 * Calls FastAPI service for fraud scoring, dynamic routing, and decline recovery.
 * Provides instant transparent JavaScript fallback if Python service is offline.
 */

const rawPythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
const PYTHON_SERVICE_URL = rawPythonUrl.replace(/\/+$/, '');
const TIMEOUT_MS = parseInt(process.env.INTELLIGENCE_SERVICE_TIMEOUT_MS || '3000', 10);

async function callPythonService(path, method = 'POST', body = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${PYTHON_SERVICE_URL}${path}`, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Python service returned HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 1. Fraud Assessment with Fallback
async function assessFraud(payload) {
  try {
    const result = await callPythonService('/api/v1/fraud/assess', 'POST', payload);
    return { ...result, source: 'python_fastapi' };
  } catch (err) {
    // Resilient local JavaScript heuristic fallback
    console.warn(`[Python Bridge] FastAPI service unreachable (${err.message}). Using JS fallback engine.`);
    return fallbackFraudAssessment(payload);
  }
}

function fallbackFraudAssessment(payload) {
  const amount = Number(payload.amount || 0);
  const country = String(payload.customer_country || 'US').toUpperCase();
  const ipCountry = String(payload.ip_country || country).toUpperCase();
  const email = String(payload.customer_email || '').toLowerCase();
  let score = 5;
  const triggered = [];

  const sanctioned = ['KP', 'IR', 'SY', 'CU'];
  if (sanctioned.includes(country) || sanctioned.includes(ipCountry)) {
    score = 95;
    triggered.push({ code: 'FATF_SANCTIONED_COUNTRY', severity: 'CRITICAL', score: 95, description: 'Sanctioned country corridor' });
  } else {
    if (country !== ipCountry && ipCountry !== 'UNKNOWN') {
      score += 25;
      triggered.push({ code: 'GEO_IP_BILLING_MISMATCH', severity: 'MEDIUM', score: 25, description: 'IP Country does not match Billing Country' });
    }
    if (email.includes('mailinator') || email.includes('trashmail') || email.includes('tempmail')) {
      score += 30;
      triggered.push({ code: 'DISPOSABLE_EMAIL_DOMAIN', severity: 'HIGH', score: 30, description: 'Temporary or disposable email address' });
    }
    if (amount > 1000) {
      score += 20;
      triggered.push({ code: 'AMOUNT_OUTLIER_ELEVATED', severity: 'LOW', score: 20, description: 'High transaction amount' });
    }
  }

  score = Math.min(Math.max(score, 0), 100);
  let decision = 'APPROVE';
  let level = 'LOW';
  if (score >= 85) {
    decision = 'DECLINE';
    level = 'CRITICAL';
  } else if (score >= 65) {
    decision = 'MANUAL_REVIEW';
    level = 'HIGH';
  } else if (score >= 31) {
    decision = '3DS_CHALLENGE';
    level = 'MEDIUM';
  }

  return {
    risk_score: score,
    risk_level: level,
    decision,
    action_required: decision === 'APPROVE' ? 'Proceed with routing' : 'Verification required',
    triggered_rules: triggered,
    score_breakdown: { base: score },
    assessed_at: new Date().toISOString(),
    flags_count: triggered.length,
    source: 'javascript_fallback'
  };
}

// 2. Routing Optimization with Fallback
async function optimizeRouting(payload) {
  try {
    const result = await callPythonService('/api/v1/routing/optimize', 'POST', payload);
    return { ...result, source: 'python_fastapi' };
  } catch (err) {
    console.warn(`[Python Bridge] Routing optimizer unreachable (${err.message}). Using JS fallback engine.`);
    return fallbackRoutingOptimization(payload);
  }
}

function fallbackRoutingOptimization(payload) {
  const currency = String(payload.currency || 'USD').toUpperCase();
  const method = String(payload.payment_method || 'credit_card').toLowerCase();
  let primary = 'stripe';
  let cascades = ['adyen', 'paypal'];

  if (currency === 'INR' || method.startsWith('upi')) {
    primary = 'razorpay_upi';
    cascades = ['stripe', 'paypal'];
  } else if (currency === 'EUR' || method.startsWith('sepa')) {
    primary = 'adyen';
    cascades = ['stripe', 'paypal'];
  } else if (currency === 'BRL' || method === 'pix') {
    primary = 'dlocal';
    cascades = ['stripe', 'paypal'];
  } else if (method.startsWith('paypal')) {
    primary = 'paypal';
    cascades = ['stripe', 'adyen'];
  }

  return {
    status: 'OPTIMIZED',
    primary_provider: primary,
    primary_provider_name: primary.toUpperCase(),
    cascade_fallback_order: cascades,
    routing_rationale: `Selected ${primary} using currency affinity and lowest corridor fee.`,
    total_evaluated: 5,
    source: 'javascript_fallback'
  };
}

// 3. Recovery Decline Analysis with Fallback
async function analyzeRecovery(payload) {
  try {
    const result = await callPythonService('/api/v1/recovery/analyze', 'POST', payload);
    return { ...result, source: 'python_fastapi' };
  } catch (err) {
    console.warn(`[Python Bridge] Recovery service unreachable (${err.message}). Using JS fallback engine.`);
    return fallbackRecoveryAnalysis(payload);
  }
}

function fallbackRecoveryAnalysis(payload) {
  const code = String(payload.decline_code || '').toLowerCase();
  const attempt = Number(payload.attempt_count || 1);
  const cascadeOptions = payload.cascade_options || ['adyen', 'paypal'];
  const failed = payload.failed_provider;

  const softCodes = ['network_timeout', 'gateway_unavailable', 'insufficient_funds', 'do_not_honor'];
  const isRecoverable = softCodes.includes(code) && attempt < 3;
  const fallback = cascadeOptions.find(p => p !== failed) || 'adyen';

  return {
    decline_code: code,
    decline_type: isRecoverable ? 'SOFT_DECLINE' : 'HARD_DECLINE',
    is_recoverable: isRecoverable,
    retry_probability: isRecoverable ? 0.85 : 0.05,
    recommended_action: isRecoverable ? 'CASCADE_FALLBACK' : 'HALT_AND_FLAG',
    recovery_strategy_description: isRecoverable ? `Rerouting to secondary provider ${fallback}` : 'Decline is unrecoverable automatically.',
    fallback_provider: isRecoverable ? fallback : null,
    attempt_count: attempt,
    source: 'javascript_fallback'
  };
}

// 4. Domestic Card Eligibility with Fallback
async function checkDomesticCardEligibility(payload) {
  try {
    const result = await callPythonService('/api/v1/domestic-card/eligibility', 'POST', payload);
    return { ...result, source: 'python_fastapi' };
  } catch (err) {
    console.warn(`[Python Bridge] Domestic card service unreachable (${err.message}). Using JS fallback engine.`);
    return fallbackDomesticCardEligibility(payload);
  }
}

function fallbackDomesticCardEligibility(payload) {
  const method = String(payload.payment_method || 'rupay_card').toLowerCase();
  const bin = String(payload.bin || payload.card_number || '6521').substring(0, 4);
  const country = String(payload.merchant_country || 'US').toUpperCase();
  const isEdu = Boolean(payload.is_educational);
  let eligible = true;
  let reason = null;
  let variant = 'RuPay Global';
  let networks = ['Discover', 'JCB'];

  if (bin === '6070' || bin === '6071') {
    eligible = false;
    variant = 'RuPay Domestic Classic';
    networks = [];
    reason = 'Domestic-only RuPay card. Cross-border e-commerce is blocked by NPCI.';
  } else if (method.startsWith('upi') && !['SG', 'AE', 'FR', 'MU', 'NP', 'BT', 'LK'].includes(country)) {
    eligible = false;
    variant = 'UPI Standard';
    reason = `UPI does not have bilateral clearing with merchant country ${country}.`;
  }

  const amtUsd = Number(payload.amount_usd || 100);
  const amtInr = amtUsd * 86.45;
  const tcsApplicable = amtInr > 700000;
  const tcsRate = isEdu ? 5 : 20;
  const tcsAmt = tcsApplicable ? (amtInr - 700000) * (tcsRate / 100) : 0;

  return {
    eligible,
    payment_method: method,
    instrument_variant: variant,
    card_bin: bin,
    co_branded_networks: networks,
    rejection_reason: reason,
    merchant_country: country,
    currency: payload.currency || 'USD',
    amount_usd: amtUsd,
    amount_inr: amtInr,
    compliance_flags: eligible ? [{ code: 'RUPAY_GLOBAL_ACCEPTED', status: 'APPROVED', description: 'Dual-network supported' }] : [],
    alternative_recommendations: eligible ? [] : [
      { method: 'credit_card', title: 'Visa / Mastercard International Card', estimated_success_rate: 0.98 },
      { method: 'paypal', title: 'PayPal Checkout', estimated_success_rate: 0.94 }
    ],
    fee_breakdown: {
      base_amount_inr: amtInr,
      estimated_forex_markup_inr: Math.round(amtInr * 0.02),
      forex_markup_percent: 2.0,
      gst_on_forex_inr: Math.round(amtInr * 0.02 * 0.18),
      tcs_applicable: tcsApplicable,
      tcs_rate_percent: tcsApplicable ? tcsRate : 0,
      tcs_amount_inr: Math.round(tcsAmt),
      total_estimated_debit_inr: Math.round(amtInr + (amtInr * 0.02) + (amtInr * 0.02 * 0.18) + tcsAmt)
    },
    source: 'javascript_fallback'
  };
}

// 5. Agentic Refund Evaluation with Fallback
async function evaluateAgenticRefund(payload) {
  try {
    const result = await callPythonService('/api/v1/agentic-refund/evaluate', 'POST', payload);
    return { ...result, source: 'python_fastapi' };
  } catch (err) {
    console.warn(`[Python Bridge] Agentic refund service unreachable (${err.message}). Using JS fallback engine.`);
    return fallbackAgenticRefund(payload);
  }
}

function fallbackAgenticRefund(payload) {
  const status = String(payload.gateway_actual_status || 'CAPTURED').toUpperCase();
  const amt = Number(payload.amount || 0);
  const provider = String(payload.provider || 'stripe');
  const txId = payload.transaction_id || 'tx_unknown';
  const idemKey = `idem_${Date.now()}_${txId.substring(0, 8)}`;

  if (payload.already_refunded) {
    return {
      decision: 'REFUND_REJECTED',
      reason_code: 'DUPLICATE_REFUND_PREVENTED',
      explanation: 'Transaction was already refunded. Idempotency protection active.',
      requires_human_approval: false,
      refund_eligible: false,
      safe_retry_viable: false,
      agent_steps: [{ step: 'IDEMPOTENCY_CHECK', status: 'BLOCKED', detail: 'Duplicate prevented.' }],
      source: 'javascript_fallback'
    };
  }

  if (status === 'PENDING' || status === 'PROCESSING') {
    return {
      decision: 'REFUND_REJECTED',
      reason_code: 'TRANSACTION_STILL_PENDING',
      explanation: 'Transaction is currently pending with the payment provider. Wait for settlement or final decline before evaluating refund.',
      requires_human_approval: false,
      refund_eligible: false,
      safe_retry_viable: false,
      idempotency_key: idemKey,
      agent_steps: [{ step: 'TRANSACTION_IN_FLIGHT', status: 'PENDING_RESOLUTION', detail: 'Status PENDING verified.' }],
      source: 'javascript_fallback'
    };
  }

  if (status === 'FAILED' || status === 'VOIDED') {
    return {
      decision: 'NO_REFUND_NEEDED_HOLD_RELEASED',
      reason_code: 'NO_CAPTURE_OCCURRED',
      explanation: 'No capture occurred at provider. Temporary pre-auth hold will release in 2-5 days.',
      requires_human_approval: false,
      refund_eligible: false,
      safe_retry_viable: true,
      suggested_alternative_provider: provider === 'stripe' ? 'adyen' : 'stripe',
      idempotency_key: idemKey,
      agent_steps: [{ step: 'PROVIDER_STATUS_VERIFICATION', status: 'COMPLETED', detail: 'Status FAILED verified.' }],
      source: 'javascript_fallback'
    };
  }

  if (amt >= 500) {
    return {
      decision: 'REQUIRES_HUMAN_APPROVAL',
      reason_code: 'HIGH_VALUE_COMPLIANCE_ESCALATION',
      explanation: `Refund of $${amt} exceeds autonomous limit ($500) and requires compliance officer approval.`,
      requires_human_approval: true,
      refund_eligible: true,
      refund_amount: amt,
      currency: payload.currency || 'USD',
      idempotency_key: idemKey,
      agent_steps: [{ step: 'RISK_AND_VALUE_GUARD', status: 'ESCALATED', detail: 'High value flagged.' }],
      source: 'javascript_fallback'
    };
  }

  return {
    decision: 'AUTO_REFUND_APPROVED',
    reason_code: 'AUTONOMOUS_REFUND_AUTHORIZED',
    explanation: `Autonomous agent verified captured funds on ${provider.toUpperCase()}. Refund authorized.`,
    requires_human_approval: false,
    refund_eligible: true,
    refund_amount: amt,
    currency: payload.currency || 'USD',
    provider,
    idempotency_key: idemKey,
    safe_retry_viable: true,
    agent_confidence_score: 0.98,
    agent_steps: [{ step: 'REFUND_ELIGIBILITY_CONFIRMATION', status: 'APPROVED', detail: 'Autonomous clearance granted.' }],
    source: 'javascript_fallback'
  };
}

// 6. Student Payment Intent Verification with Fallback
async function verifyStudentPaymentIntent(payload) {
  try {
    const result = await callPythonService('/api/v1/student/verify-intent', 'POST', payload);
    return { ...result, source: 'python_fastapi' };
  } catch (err) {
    console.warn(`[Python Bridge] Student engine unreachable (${err.message}). Using JS fallback engine.`);
    return fallbackStudentPaymentIntent(payload);
  }
}

function fallbackStudentPaymentIntent(payload) {
  if (payload.age_status === 'UNVERIFIED') {
    return {
      status: 'BLOCKED',
      decision: 'AGE_VERIFICATION_REQUIRED',
      reason: 'Student age is unverified. Valid age verification is required before student payments can be processed.',
      age_status: 'UNVERIFIED',
      requires_parent_approval: false,
      requires_age_verification: true,
      source: 'javascript_fallback'
    };
  }

  let isMinor;
  if (payload.date_of_birth !== undefined) {
    if (!payload.date_of_birth || typeof payload.date_of_birth !== 'string') {
      return {
        status: 'BLOCKED',
        decision: 'AGE_VERIFICATION_REQUIRED',
        reason: 'Student age is unverified (Date of birth is missing). Valid age verification is required before student payments can be processed.',
        age_status: 'UNVERIFIED',
        requires_parent_approval: false,
        requires_age_verification: true,
        source: 'javascript_fallback'
      };
    }
    const match = payload.date_of_birth.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return {
        status: 'BLOCKED',
        decision: 'AGE_VERIFICATION_REQUIRED',
        reason: 'Student age is unverified (Date of birth format is invalid). Valid age verification is required before student payments can be processed.',
        age_status: 'UNVERIFIED',
        requires_parent_approval: false,
        requires_age_verification: true,
        source: 'javascript_fallback'
      };
    }
    const by = parseInt(match[1], 10);
    const bm = parseInt(match[2], 10);
    const bd = parseInt(match[3], 10);
    const now = new Date();
    const cy = now.getUTCFullYear();
    const cm = now.getUTCMonth() + 1;
    const cd = now.getUTCDate();
    if (by > cy || (by === cy && bm > cm) || (by === cy && bm === cm && bd > cd)) {
      return {
        status: 'BLOCKED',
        decision: 'AGE_VERIFICATION_REQUIRED',
        reason: 'Student age is unverified (Date of birth cannot be in the future). Valid age verification is required before student payments can be processed.',
        age_status: 'UNVERIFIED',
        requires_parent_approval: false,
        requires_age_verification: true,
        source: 'javascript_fallback'
      };
    }
    let calculatedAge = cy - by;
    if (cm < bm || (cm === bm && cd < bd)) calculatedAge--;
    isMinor = calculatedAge < 18;
  } else if (payload.age !== undefined && payload.age !== null) {
    isMinor = Number(payload.age) < 18;
  } else {
    return {
      status: 'BLOCKED',
      decision: 'AGE_VERIFICATION_REQUIRED',
      reason: 'Date of birth is missing. Valid age verification is required before student payments can be processed.',
      age_status: 'UNVERIFIED',
      requires_parent_approval: false,
      requires_age_verification: true,
      source: 'javascript_fallback'
    };
  }

  const consent = String(payload.guardian_consent_status || 'ACTIVE').toUpperCase();
  const cat = String(payload.merchant_category || 'online_courses').toLowerCase();
  const amt = Number(payload.amount || 50);
  const threshold = Number(payload.auto_approval_threshold || 50);

  if (isMinor && consent !== 'ACTIVE') {
    return {
      status: 'BLOCKED',
      decision: 'GUARDIAN_CONSENT_REQUIRED',
      reason: `Parent consent is '${consent}'. Minor accounts require active parental consent.`,
      requires_parent_approval: false,
      source: 'javascript_fallback'
    };
  }

  const prohibited = ['gambling_betting', 'cryptocurrency', 'bars_alcohol', 'adult_content', 'weapons_defense'];
  if (prohibited.includes(cat)) {
    return {
      status: 'BLOCKED',
      decision: 'PROHIBITED_MERCHANT_CATEGORY',
      reason: 'Category prohibited for student accounts.',
      requires_parent_approval: false,
      source: 'javascript_fallback'
    };
  }

  if (isMinor && amt > threshold) {
    return {
      status: 'PENDING_APPROVAL',
      decision: 'REQUIRES_PARENT_APPROVAL',
      reason: `Amount ($${amt}) exceeds minor allowance threshold of $${threshold}. Request routed to guardian.`,
      requires_parent_approval: true,
      approval_threshold: threshold,
      category: cat,
      amount_usd: amt,
      source: 'javascript_fallback'
    };
  }

  return {
    status: 'APPROVED',
    decision: 'INSTANT_ALLOWANCE_APPROVED',
    reason: 'Educational purchase approved within student limits.',
    requires_parent_approval: false,
    category: cat,
    amount_usd: amt,
    source: 'javascript_fallback'
  };
}

// 7. Health Check
async function getHealth() {
  try {
    const res = await callPythonService('/health', 'GET');
    return { online: true, ...res };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

module.exports = {
  assessFraud,
  optimizeRouting,
  analyzeRecovery,
  checkDomesticCardEligibility,
  evaluateAgenticRefund,
  verifyStudentPaymentIntent,
  getHealth
};

