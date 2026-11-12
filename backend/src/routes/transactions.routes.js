const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { optionalAuth } = require('../middleware/auth.middleware');

// GET /
router.get('/', optionalAuth, async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const { status, currency, provider, search, limit = 50, page = 1 } = req.query;
    let list = await db.table('transactions').find(t => t.merchant_id === merchantId);

    // Filters
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    if (currency && currency !== 'all') {
      list = list.filter(t => t.currency.toUpperCase() === currency.toUpperCase());
    }
    if (provider && provider !== 'all') {
      list = list.filter(t => t.executed_provider === provider || t.primary_provider === provider);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t =>
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.customer_email && t.customer_email.toLowerCase().includes(q)) ||
        (t.customer_country && t.customer_country.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginated = list.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      transactions: paginated,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /export/csv
router.get('/export/csv', optionalAuth, async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const transactions = await db.table('transactions').find(t => t.merchant_id === merchantId);
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const headers = ['ID', 'Date', 'Customer Email', 'Country', 'Amount', 'Currency', 'Method', 'Primary Gateway', 'Executed Gateway', 'Status', 'Risk Score', 'Fee Charged', 'Latency (ms)', 'Decline Reason'];
    const rows = transactions.map(t => [
      t.id,
      t.created_at,
      t.customer_email || 'N/A',
      t.customer_country,
      t.amount,
      t.currency,
      t.payment_method,
      t.primary_provider,
      t.executed_provider,
      t.status,
      t.risk_score || 0,
      t.fee_charged || 0,
      t.latency_ms || 0,
      `"${(t.decline_reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /export/json
router.get('/export/json', optionalAuth, async (req, res) => {
  try {
    const merchantId = req.merchant?.id || 'mer_demo_orchestration_01';
    const transactions = await db.table('transactions').find(t => t.merchant_id === merchantId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions_export.json"');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id (Detailed view with audit timeline)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const tx = await db.table('transactions').findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const routingLogs = await db.table('routing_logs').find(l => l.transaction_id === tx.id);
    const recoveryLogs = await db.table('recovery_logs').find(l => l.transaction_id === tx.id);
    const fraudLogs = await db.table('fraud_assessments').find(f => f.transaction_id === tx.id);

    // Build chronological audit trail
    const timeline = [
      {
        timestamp: tx.created_at,
        stage: 'INITIATED',
        title: 'Payment Request Received',
        description: `Customer initiated checkout for ${tx.currency} ${tx.amount} via ${tx.payment_method} from ${tx.customer_country}.`,
        badge: 'info'
      }
    ];

    if (tx.risk_score !== undefined) {
      timeline.push({
        timestamp: new Date(new Date(tx.created_at).getTime() + 15).toISOString(),
        stage: 'FRAUD_CHECK',
        title: `AI Risk Assessment: Score ${tx.risk_score}/100 (${tx.risk_level})`,
        description: tx.risk_score > 80 ? 'Transaction blocked by AI fraud engine.' : 'Passed velocity, sanctions, and proxy verification checks.',
        badge: tx.risk_score > 80 ? 'danger' : (tx.risk_score > 30 ? 'warning' : 'success')
      });
    }

    if (tx.primary_provider) {
      timeline.push({
        timestamp: new Date(new Date(tx.created_at).getTime() + 35).toISOString(),
        stage: 'ROUTING_OPTIMIZATION',
        title: `Intelligent Route Selected: ${tx.primary_provider.toUpperCase()}`,
        description: `Selected based on cost efficiency, currency affinity, and gateway health.`,
        badge: 'info'
      });
    }

    if (recoveryLogs.length > 0) {
      const rec = recoveryLogs[0];
      timeline.push({
        timestamp: new Date(new Date(tx.created_at).getTime() + 120).toISOString(),
        stage: 'CASCADING_RECOVERY',
        title: `Automatic Gateway Cascade Triggered`,
        description: `Initial provider ${rec.original_provider} declined (${rec.decline_code}). Instantly cascaded to ${rec.retry_provider}.`,
        badge: 'warning'
      });
    }

    timeline.push({
      timestamp: tx.updated_at || tx.created_at,
      stage: 'FINAL_SETTLEMENT',
      title: `Final Status: ${tx.status.toUpperCase()}`,
      description: tx.status === 'settled' || tx.status === 'recovered'
        ? `Successfully settled on ${tx.executed_provider} (Fee: $${tx.fee_charged || 0}, Latency: ${tx.latency_ms}ms).`
        : `Transaction ${tx.status}: ${tx.decline_reason || 'Declined'}.`,
      badge: tx.status === 'settled' || tx.status === 'recovered' ? 'success' : 'danger'
    });

    res.json({
      transaction: {
        ...tx,
        metadata: typeof tx.metadata_json === 'string' ? JSON.parse(tx.metadata_json) : tx.metadata_json
      },
      timeline,
      routing_logs: routingLogs,
      recovery_logs: recoveryLogs,
      fraud_assessments: fraudLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

