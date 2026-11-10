import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ListOrdered,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Clock,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  // Selected Transaction for Drawer / Modal
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await api.transactions.list({
        search,
        status: statusFilter,
        currency: currencyFilter,
        provider: providerFilter,
        limit: 100
      });
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('[Load Transactions Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [statusFilter, currencyFilter, providerFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTransactions();
  };

  const handleOpenDetail = async (id) => {
    setSelectedTxId(id);
    setLoadingDetail(true);
    try {
      const res = await api.transactions.getById(id);
      setDetailData(res);
    } catch (err) {
      alert(err.message || 'Failed to load details');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <ListOrdered className="w-4 h-4" />
            <span>Payment Records</span>
          </div>
          <h1 className="page-heading text-[28px] sm:text-[32px] font-semibold text-slate-900 dark:text-white tracking-[-0.025em] leading-tight mt-1">
            Payment History & Details
          </h1>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
            Search, filter, and inspect step-by-step history and routing decisions for all international payments.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <a
            href={api.transactions.getCsvExportUrl()}
            download
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[14px] shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Download CSV</span>
          </a>
          <a
            href={api.transactions.getJsonExportUrl()}
            download
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Download JSON</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Payment ID, email, country..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            />
          </form>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">Status: All</option>
              <option value="settled">Completed</option>
              <option value="recovered">Recovered via Backup</option>
              <option value="failed">Failed</option>
              <option value="blocked">Blocked (Suspicious)</option>
              <option value="pending_3ds">Waiting for Bank Check</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div className="sm:col-span-2">
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium font-mono"
            >
              <option value="all">Currency: All</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="BRL">BRL (R$)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div className="sm:col-span-3">
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">Provider: All</option>
              <option value="stripe">Stripe Global</option>
              <option value="adyen">Adyen European</option>
              <option value="paypal">PayPal Sandbox</option>
              <option value="razorpay_upi">Razorpay UPI</option>
              <option value="dlocal">dLocal Emerging</option>
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading payment history...</div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No payments match your search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Provider Used</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Fee</th>
                  <th className="pb-3 text-right">View Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400 font-bold">
                      {tx.id}
                    </td>
                    <td className="py-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                        {tx.customer_email || 'Guest'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {tx.customer_country}
                      </div>
                    </td>
                    <td className="py-3 font-bold font-mono text-slate-900 dark:text-white">
                      {tx.currency} {parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 capitalize text-slate-600 dark:text-slate-300">
                      {tx.payment_method.replace('_', ' ')}
                    </td>
                    <td className="py-3 font-mono text-[11px]">
                      {tx.status === 'recovered' ? (
                        <div className="space-x-1">
                          <span className="line-through text-slate-400 uppercase">{tx.primary_provider}</span>
                          <span>→</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400 uppercase">{tx.executed_provider}</span>
                        </div>
                      ) : (
                        <span className="uppercase text-slate-600 dark:text-slate-300">{tx.executed_provider}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tx.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : tx.status === 'recovered'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : tx.status === 'blocked'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {tx.status === 'settled'
                          ? 'Completed'
                          : tx.status === 'recovered'
                          ? 'Recovered'
                          : tx.status === 'blocked'
                          ? 'Blocked'
                          : tx.status === 'pending_3ds'
                          ? 'Verification Pending'
                          : 'Failed'}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-emerald-600">
                      ${tx.fee_charged || '0.00'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                        title="View Full Payment History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Drawer Modal */}
      {selectedTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-mono text-blue-500 font-bold">{selectedTxId}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Step-by-Step History</h3>
              </div>
              <button
                onClick={() => setSelectedTxId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading payment details...</div>
            ) : detailData ? (
              <div className="space-y-6">
                
                {/* Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Amount</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {detailData.transaction.currency} {parseFloat(detailData.transaction.amount).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Final Status</span>
                    <span className="font-bold uppercase text-emerald-500">
                      {detailData.transaction.status === 'settled' ? 'Completed' : detailData.transaction.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Provider Used</span>
                    <span className="font-mono uppercase font-bold text-blue-500">
                      {detailData.transaction.executed_provider}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fraud Score</span>
                    <span className="font-mono font-bold text-amber-500">
                      {detailData.transaction.risk_score || 0}/100
                    </span>
                  </div>
                </div>

                {/* Chronological Audit Trail Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                    What Happened During This Payment
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {detailData.timeline?.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-[#121826] ${
                          step.badge === 'success' ? 'bg-emerald-500' :
                          step.badge === 'danger' ? 'bg-rose-500' :
                          step.badge === 'warning' ? 'bg-purple-500' : 'bg-blue-500'
                        }`} />
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          <span>{step.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
}
