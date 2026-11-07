/**
 * Python Intelligence Microservice Bridge
 * Calls FastAPI service for fraud scoring, dynamic routing, and decline recovery.
 * Provides instant transparent JavaScript fallback if Python service is offline.
 */

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
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

// 4. Health Check
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
  getHealth
};

