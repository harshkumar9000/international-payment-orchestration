/**
 * Failed Payment Recovery Engine
 * Manages decline classification, automated cascading retry, and APM fallback.
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const pythonBridge = require('./pythonBridge.service');
const { getProvider } = require('./paymentProviders');

async function handlePaymentDecline(transaction, declineResult, paymentDetails, cascadeOptions = []) {
  // 1. Analyze recoverability via Python Intelligence Service
  const analysis = await pythonBridge.analyzeRecovery({
    decline_code: declineResult.decline_code,
    decline_message: declineResult.decline_reason,
    attempt_count: 1,
    failed_provider: declineResult.provider_id,
    cascade_options: cascadeOptions,
    currency: transaction.currency,
    payment_method: transaction.payment_method
  });

  // 2. If recoverable and fallback gateway is available, execute instant cascading retry!
  if (analysis.is_recoverable && analysis.fallback_provider) {
    const fallbackId = analysis.fallback_provider;
    console.log(`⚡ [Recovery Engine] Cascading failed payment ${transaction.id} to secondary provider: ${fallbackId}`);

    const fallbackProvider = getProvider(fallbackId);
    // Execute fallback attempt (without simulating the same artificial decline)
    const cleanDetails = { ...paymentDetails, simulate_decline: null };
    const retryResult = await fallbackProvider.processPayment(cleanDetails);

    if (retryResult.success && retryResult.status === 'settled') {
      // SUCCESSFUL RECOVERY!
      console.log(`🎉 [Recovery Engine] Payment ${transaction.id} successfully RECOVERED via ${fallbackId}!`);

      // Update transaction record
      await db.table('transactions').update(transaction.id, {
        status: 'recovered',
        executed_provider: fallbackId,
        fee_charged: retryResult.fee_charged,
        latency_ms: (transaction.latency_ms || 0) + (retryResult.latency_ms || 0),
        decline_code: declineResult.decline_code,
        decline_reason: `Initial attempt on ${declineResult.provider_id} failed (${declineResult.decline_reason}). Recovered automatically via cascade to ${fallbackId}.`
      });

      // Log recovery audit
      await db.table('recovery_logs').insert({
        id: `rec_${uuidv4().substring(0, 8)}`,
        transaction_id: transaction.id,
        original_provider: declineResult.provider_id,
        retry_provider: fallbackId,
        decline_code: declineResult.decline_code,
        is_successful: true,
        strategy_used: 'CASCADE_FALLBACK_INSTANT',
        recovered_at: new Date().toISOString()
      });

      return {
        recovered: true,
        status: 'recovered',
        final_provider: fallbackId,
        original_provider: declineResult.provider_id,
        result: retryResult,
        analysis
      };
    } else {
      // Cascaded retry also failed
      await db.table('recovery_logs').insert({
        id: `rec_${uuidv4().substring(0, 8)}`,
        transaction_id: transaction.id,
        original_provider: declineResult.provider_id,
        retry_provider: fallbackId,
        decline_code: retryResult.decline_code || declineResult.decline_code,
        is_successful: false,
        strategy_used: 'CASCADE_FALLBACK_INSTANT',
        recovered_at: new Date().toISOString()
      });
    }
  }

  // If not recovered
  await db.table('transactions').update(transaction.id, {
    status: 'failed',
    decline_code: declineResult.decline_code,
    decline_reason: declineResult.decline_reason
  });

  return {
    recovered: false,
    status: 'failed',
    original_provider: declineResult.provider_id,
    analysis
  };
}

module.exports = {
  handlePaymentDecline
};

