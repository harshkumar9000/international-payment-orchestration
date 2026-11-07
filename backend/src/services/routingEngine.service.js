/**
 * Intelligent Routing Engine Service
 * Orchestrates rule execution, communicates with Python microservice,
 * and maintains audit traces of all routing evaluations.
 */
const db = require('../db/db');
const pythonBridge = require('./pythonBridge.service');

async function selectOptimalRoute(paymentContext) {
  const { merchant_id, amount, currency, payment_method, customer_country } = paymentContext;

  // 1. Fetch active merchant custom rules
  let activeRules = [];
  try {
    const rules = await db.table('routing_rules').find(r => r.merchant_id === merchant_id && r.is_active);
    activeRules = rules.sort((a, b) => a.priority_order - b.priority_order).map(r => ({
      id: r.id,
      name: r.name,
      priority: r.priority_order,
      is_active: r.is_active,
      condition: typeof r.condition_json === 'string' ? JSON.parse(r.condition_json) : r.condition_json,
      target_provider: r.target_provider
    }));
  } catch (err) {
    console.warn('[Routing Engine] Error fetching custom rules:', err.message);
  }

  // 2. Call Python Intelligence Service
  const routingPayload = {
    amount: parseFloat(amount) || 100.0,
    currency: (currency || 'USD').toUpperCase(),
    payment_method: payment_method || 'credit_card',
    customer_country: (customer_country || 'US').toUpperCase(),
    merchant_id: merchant_id,
    custom_rules: activeRules,
    cost_weight: 0.35,
    success_weight: 0.35,
    latency_weight: 0.15,
    uptime_weight: 0.15
  };

  const decision = await pythonBridge.optimizeRouting(routingPayload);

  return {
    primary_provider: decision.primary_provider,
    primary_provider_name: decision.primary_provider_name,
    primary_details: decision.primary_details,
    cascade_fallback_order: decision.cascade_fallback_order || ['stripe', 'adyen'],
    cascade_candidates: decision.cascade_candidates || [],
    routing_rationale: decision.routing_rationale,
    applied_rule: decision.applied_rule,
    source: decision.source
  };
}

module.exports = {
  selectOptimalRoute
};

