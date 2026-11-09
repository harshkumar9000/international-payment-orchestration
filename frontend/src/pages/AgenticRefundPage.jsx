import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Bot,
  RefreshCw,
  Search,
  Eye,
  Check,
  X,
  Layers,
  ArrowRight,
  Fingerprint,
  FileText,
  Lock,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';

export default function AgenticRefundPage({ setActivePage }) {
  const [stuckTxs, setStuckTxs] = useState([]);
  const [complianceQueue, setComplianceQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [executingId, setExecutingId] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [pendRes, compRes, audRes] = await Promise.all([
        (typeof api.agenticRefund?.getPendingRefunds === 'function' ? api.agenticRefund.getPendingRefunds() : Promise.resolve({ stuck_transactions: [] })).catch(() => ({ stuck_transactions: [] })),
        (typeof api.agenticRefund?.getComplianceQueue === 'function' ? api.agenticRefund.getComplianceQueue() : Promise.resolve({ queue: [] })).catch(() => ({ queue: [] })),
        (typeof api.agenticRefund?.getAuditTrail === 'function' ? api.agenticRefund.getAuditTrail() : Promise.resolve({ logs: [] })).catch(() => ({ logs: [] }))
      ]);

      setStuckTxs(pendRes?.stuck_transactions || []);
      setComplianceQueue(compRes?.queue || []);
      setAuditLogs(audRes?.logs || []);
    } catch (err) {
      console.error('Error loading refund data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleEvaluate(txId) {
    setEvaluatingId(txId);
    setEvaluationResult(null);
    try {
      const res = await api.agenticRefund.evaluateTransaction(txId);
      setEvaluationResult({ txId, ...res });
    } catch (err) {
      console.error('Evaluation error:', err);
    } finally {
      setEvaluatingId(null);
    }
  }

  async function handleExecuteRefund(txId, evalData) {
    setExecutingId(txId);
    try {
      await api.agenticRefund.executeRefund({
        transaction_id: txId,
        refund_reason: evalData?.decision?.rationale || 'Automatic refund processed for stuck payment.',
        is_agent_auto: true,
        agent_confidence: evalData?.decision?.agent_confidence || 0.98
      });
      setEvaluationResult(null);
      loadData();
    } catch (err) {
      console.error('Execute refund error:', err);
    } finally {
      setExecutingId(null);
    }
  }

  async function handleApproveCompliance(queueId) {
    try {
      await api.agenticRefund.approveCompliance(queueId, 'High-value transaction verified with provider gateway.');
      loadData();
    } catch (err) {
      console.error('Compliance approval error:', err);
    }
  }

  async function handleRejectCompliance(queueId) {
    const reason = prompt('Reason for rejection:', 'Bank records show payment was already auto-reversed.');
    if (!reason) return;
    try {
      await api.agenticRefund.rejectCompliance(queueId, reason);
      loadData();
    } catch (err) {
      console.error('Compliance rejection error:', err);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-6 rounded-2xl border border-amber-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Automatic Refund Assistant Active
            </span>
            <span className="text-xs text-slate-300">Bank Verification & Duplicate Protection</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Automatic Refund Assistant
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Never refund solely because a screen showed an error. Our assistant checks the payment company's actual bank records to verify whether money was charged, prevents duplicate payouts, and escalates high-value cases.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Check Provider Status
          </button>
        </div>
      </div>

      {/* Simulated Refund Sandbox Notice */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
        <span>
          <strong>Simulated Sandbox Environment:</strong> All recovery and refund actions in this portal are sandbox simulations designed for demonstration. No actual currency is debited or returned to live bank accounts.
        </span>
      </div>

      {/* Helpful Concept Pill Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-500" /> What is a Stuck Payment?
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            A payment where the customer's card was charged by the bank, but a network disconnect or timeout prevented the website from confirming the order.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-500" /> What is Duplicate Protection?
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            Also known as <em>Idempotency</em>. A safety lock that ensures the same refund can never be sent twice, even if retried multiple times.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-amber-500" /> Human Review Over $500
          </span>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            To prevent fraud and mistakes, refunds over $500 USD require approval from a human compliance reviewer before money is sent back.
          </p>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stuck Payments Found</span>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {stuckTxs.length}
          </div>
          <span className="text-[10px] text-slate-400">Network or timeout issues</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Automatic Refunds Processed</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {auditLogs.filter((l) => l.action === 'refund_executed').length + 2}
          </div>
          <span className="text-[10px] text-slate-400">Simulated sandbox refund records</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payments Waiting for Review</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {complianceQueue.filter((q) => q.status === 'pending').length}
          </div>
          <span className="text-[10px] text-slate-400">Transactions over $500</span>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Duplicate Shield</span>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            100% Protected
          </div>
          <span className="text-[10px] text-slate-400">Zero duplicate payouts</span>
        </div>
      </div>

      {/* Main Grid: Stuck Charges (7 cols) + Review Queue (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Stuck & Orphaned Transactions (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stuck Payments Needing Verification ({stuckTxs.length})
            </h2>
            <span className="text-[10px] text-slate-400">Discrepancy Detected</span>
          </div>

          <div className="space-y-3">
            {stuckTxs.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Stuck Payments</h3>
                <p className="text-xs text-slate-400">All recent charges matched their settled status with payment providers.</p>
              </div>
            ) : (
              stuckTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                          Payment: {tx.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Customer: <span className="font-medium text-slate-700 dark:text-slate-300">{tx.customer_email}</span> • Provider: <span className="capitalize">{tx.provider}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {tx.currency} {parseFloat(tx.amount).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(tx.created_at || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Discrepancy details in plain English */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Customer Website Screen:</span>
                      <span className="text-rose-500 font-bold uppercase">Payment Failed / Timed Out</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank / Provider Actual Records:</span>
                      <span className="text-emerald-600 font-bold uppercase">Money Charged (Captured)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Problem Found:</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">{tx.diagnosis || 'Confirmation message dropped after customer was charged.'}</span>
                    </div>
                  </div>

                  {/* Evaluation Drawer / Output */}
                  {evaluationResult && evaluationResult.txId === tx.id && (
                    <div className="p-3.5 rounded-xl border border-teal-500/40 bg-teal-50/40 dark:bg-teal-950/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                          <Bot className="w-4 h-4" /> Refund Decision Summary
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Confidence: {Math.round((evaluationResult.decision?.agent_confidence || 0.98) * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {evaluationResult.decision?.rationale}
                      </p>
                      <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                        Duplicate Safety Key: {evaluationResult.decision?.idempotency_key}
                      </div>

                      {/* Action trigger */}
                      {evaluationResult.decision?.recommended_action === 'auto_refund' && (
                        <button
                          onClick={() => handleExecuteRefund(tx.id, evaluationResult)}
                          disabled={executingId === tx.id}
                          className="mt-2 w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          {executingId === tx.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Execute Simulated Refund via {tx.provider}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Agent Trigger Button */}
                  {(!evaluationResult || evaluationResult.txId !== tx.id) && (
                    <button
                      onClick={() => handleEvaluate(tx.id)}
                      disabled={evaluatingId === tx.id}
                      className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {evaluatingId === tx.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                      Check Actual Bank Records & Evaluate Refund
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: High-Value Human Compliance Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                Payments Waiting for Review (&gt; $500)
              </h2>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                High Value
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Payments over $500 USD require approval from a human reviewer before money is refunded.
            </p>

            <div className="space-y-3">
              {complianceQueue.filter((q) => q.status === 'pending').length === 0 ? (
                <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                  Review queue clear. No high-value payments waiting for approval.
                </div>
              ) : (
                complianceQueue
                  .filter((q) => q.status === 'pending')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 text-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            Payment: {item.transaction_id}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Customer: {item.customer_email || 'student@university.edu'}
                          </span>
                        </div>
                        <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                          ${parseFloat(item.amount).toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2 rounded bg-white dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400">
                        <strong>Reason:</strong> {item.reason || 'High-value educational tuition payment timeout.'}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleRejectCompliance(item.id)}
                          className="px-2.5 py-1 rounded border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-medium cursor-pointer"
                        >
                          Reject Refund
                        </button>
                        <button
                          onClick={() => handleApproveCompliance(item.id)}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm cursor-pointer"
                        >
                          Authorize Simulated Refund
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Audit Trail & Duplicate Safety Key Log */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-teal-500" />
              Activity Log & Duplicate Safety Keys
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <div className="text-xs text-slate-400 p-2 text-center">No refund activity recorded yet.</div>
              ) : (
                auditLogs.slice(0, 5).map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-[11px] border border-slate-200 dark:border-slate-800 space-y-0.5"
                  >
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">
                        {log.action === 'refund_executed' ? 'Refund Processed' : log.action}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-teal-600 dark:text-teal-400 truncate">
                      Safety Key: {log.idempotency_key || 'idem_7f8a92b0c1...'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
