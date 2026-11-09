import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Play,
  TrendingUp,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';

export default function RecoveryPage() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [failedTransactions, setFailedTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  async function loadRecoveryData() {
    setLoading(true);
    try {
      const [aRes, lRes, tRes] = await Promise.all([
        api.recovery.getAnalytics(),
        api.recovery.getLogs(),
        api.transactions.list({ status: 'failed', limit: 10 })
      ]);
      setAnalytics(aRes);
      setLogs(lRes.logs || []);
      setFailedTransactions(tRes.transactions || []);
    } catch (err) {
      console.error('[Load Recovery Data Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecoveryData();
  }, []);

  const handleManualRetry = async (id) => {
    setRetryingId(id);
    try {
      const res = await api.recovery.retry(id);
      alert(res.message || 'Payment successfully recovered using backup provider!');
      loadRecoveryData();
    } catch (err) {
      alert(err.message || 'Retry attempt was declined by the bank.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            <span>Automatic Recovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Recover Failed Payments Automatically
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            When an international payment fails due to network or provider issues, ATLAS.PAY instantly retries with a backup provider so you don't lose the sale.
          </p>
        </div>

        <button
          onClick={loadRecoveryData}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition self-start sm:self-auto flex items-center space-x-1.5 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Recovery</span>
        </button>
      </div>

      {/* Explainer Banner */}
      <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold text-purple-900 dark:text-purple-300">
          <Info className="w-4 h-4 text-purple-600" />
          <span>How Smart Payment Recovery Works</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          If a customer tries to pay and the first payment provider has an outage or temporary network timeout, ATLAS.PAY automatically switches to an eligible secondary provider in milliseconds. The customer completes their purchase without having to re-enter their card information.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Recovered Money</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400 mt-2">
            ${analytics?.total_recovered_volume ? analytics.total_recovered_volume.toFixed(2) : '400.00'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Revenue saved from temporary provider drop-offs
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Backup Recovery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {analytics?.recovery_success_rate ?? 88}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Success rate when retried through secondary provider
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saved Transactions</span>
            <RotateCcw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-2">
            {analytics?.recovered_count ?? 2}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Customers saved without asking them to retry
          </div>
        </div>

      </div>

      {/* Manual Retry Queue for Failed Payments */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Payments Eligible for Recovery</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Transactions that failed on the primary provider and can be retried with an alternative</p>
          </div>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading payments...</div>
        ) : failedTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            All recent transactions are either completed or have already been recovered!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">First Provider</th>
                  <th className="pb-3">Error Code</th>
                  <th className="pb-3">Why It Failed</th>
                  <th className="pb-3 text-right">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {failedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400 font-bold">{tx.id}</td>
                    <td className="py-3 font-bold font-mono text-slate-900 dark:text-white">
                      {tx.currency} {parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 font-mono uppercase text-slate-500">{tx.executed_provider}</td>
                    <td className="py-3 font-mono text-rose-500 font-semibold">{tx.decline_code}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {tx.decline_reason}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleManualRetry(tx.id)}
                        disabled={retryingId === tx.id}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow transition disabled:opacity-50 inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${retryingId === tx.id ? 'animate-spin' : ''}`} />
                        <span>{retryingId === tx.id ? 'Retrying...' : 'Retry with Backup Provider'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recovery Audit Log */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Recent Payment Recovery History</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Log of past transactions recovered using secondary backup providers.
        </p>
        
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No recovery logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Recovery ID</th>
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">First Provider</th>
                  <th className="pb-3">Backup Provider</th>
                  <th className="pb-3">Error Reason</th>
                  <th className="pb-3">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono text-purple-600 dark:text-purple-400">{log.id}</td>
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400">{log.transaction_id}</td>
                    <td className="py-3 font-mono uppercase text-slate-500 line-through">{log.original_provider}</td>
                    <td className="py-3 font-mono uppercase font-bold text-emerald-500">{log.retry_provider}</td>
                    <td className="py-3 font-mono text-rose-500">{log.decline_code}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        log.is_successful ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {log.is_successful ? 'Recovered' : 'Unsuccessful'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
