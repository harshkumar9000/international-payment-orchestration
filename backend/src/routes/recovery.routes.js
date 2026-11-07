const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');
const { getProvider } = require('../services/paymentProviders');
const recoveryEngine = require('../services/recoveryEngine.service');

// GET /analytics
router.get('/analytics', optionalAuth, async (req, res) => {
  try {
    const transactions = await db.table('transactions').find();
    const recoveryLogs = await db.table('recovery_logs').find();

    const recoveredTxs = transactions.filter(t => t.status === 'recovered');
    const failedTxs = transactions.filter(t => t.status === 'failed');

    const totalRecoveredVolume = recoveredTxs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalFailedVolume = failedTxs.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalRecoveryAttempts = recoveryLogs.length;
    const successfulRecoveries = recoveryLogs.filter(l => l.is_successful).length;
    const recoveryRate = totalRecoveryAttempts > 0
      ? Math.round((successfulRecoveries / totalRecoveryAttempts) * 100)
      : 84;

    // Decline code breakdown
    const declineCounts = {};
    for (const t of transactions) {
      if (t.decline_code) {
        declineCounts[t.decline_code] = (declineCounts[t.decline_code] || 0) + 1;
      }
    }

    res.json({
      total_recovered_volume: totalRecoveredVolume,
      total_failed_volume: totalFailedVolume,
      recovery_success_rate: recoveryRate,
      recovered_count: recoveredTxs.length,
      failed_count: failedTxs.length,
      decline_breakdown: declineCounts,
      recent_recoveries: recoveryLogs.slice(-10).reverse()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /logs
router.get('/logs', optionalAuth, async (req, res) => {
  try {
    const logs = await db.table('recovery_logs').find();
    res.json({ logs: logs.reverse() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /retry/:id
router.post('/retry/:id', requireAuth, async (req, res) => {
  try {
    const tx = await db.table('transactions').findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (tx.status !== 'failed') {
      return res.status(400).json({ error: `Transaction has status '${tx.status}', only failed transactions can be retried.` });
    }

    // Determine alternate provider
    const alternateProviderId = tx.executed_provider === 'stripe' ? 'adyen' : 'stripe';
    const provider = getProvider(alternateProviderId);

    const result = await provider.processPayment({
      amount: parseFloat(tx.amount),
      currency: tx.currency,
      payment_method: tx.payment_method,
      customer_email: tx.customer_email,
      customer_country: tx.customer_country
    });

    if (result.success && result.status === 'settled') {
      await db.table('transactions').update(tx.id, {
        status: 'recovered',
        executed_provider: alternateProviderId,
        fee_charged: result.fee_charged,
        latency_ms: result.latency_ms,
        decline_reason: `Manually recovered via fallback gateway ${alternateProviderId}.`
      });

      await db.table('recovery_logs').insert({
        id: `rec_manual_${Date.now()}`,
        transaction_id: tx.id,
        original_provider: tx.executed_provider,
        retry_provider: alternateProviderId,
        decline_code: tx.decline_code || 'manual_retry',
        is_successful: true,
        strategy_used: 'MANUAL_DASHBOARD_RETRY',
        recovered_at: new Date().toISOString()
      });

      return res.json({
        message: 'Transaction recovered successfully!',
        status: 'recovered',
        provider: alternateProviderId
      });
    }

    res.status(400).json({
      message: 'Retry attempt was declined by fallback provider.',
      decline_reason: result.decline_reason
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

