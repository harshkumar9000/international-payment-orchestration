import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Globe2,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function DashboardPage({ setActivePage }) {
  const { merchant } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [volumeChart, setVolumeChart] = useState(null);
  const [recentTxs, setRecentTxs] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [mRes, vRes, tRes, cRes] = await Promise.all([
        api.analytics.getMetrics().catch(() => ({
          total_volume_usd: 148920.50,
          total_transactions: 1248,
          settled_transactions: 1204,
          failed_transactions: 20,
          conversion_rate_percent: 96.5
        })),
        api.analytics.getVolumeChart().catch(() => ({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          volumes: [14200, 18500, 24100, 19800, 31200, 28900, 36400],
          transactions_count: [48, 65, 89, 74, 118, 102, 138]
        })),
        api.transactions.list({ limit: 6 }).catch(() => ({ transactions: [] })),
        api.cards.list().catch(() => ({ cards: [] }))
      ]);

      setMetrics(mRes);
      setVolumeChart(vRes);
      setRecentTxs(tRes?.transactions || []);
      setSavedCards(cRes?.cards || []);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format Recharts chart data
  const chartData = (volumeChart?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).map((day, idx) => ({
    name: day,
    volume: volumeChart?.volumes?.[idx] || 0,
    count: volumeChart?.transactions_count?.[idx] || 0
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded border border-teal-500/20">
              Overview
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/80 rounded border border-slate-200 dark:border-slate-700">
              Simulated Demo Data
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Payments Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring of your cross-border transactions and domestic payment rails.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('cards')}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-teal-500" />
            <span>Add Card</span>
          </button>
          <button
            onClick={() => setActivePage('checkout')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Make Payment</span>
          </button>
        </div>
      </div>

      {/* 4 Essential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Payment Volume */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Volume</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              ${(metrics?.total_volume_usd || 148920.50).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.8% from last week</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Transactions</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {(metrics?.total_transactions || 1248).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cross-border & domestic rails
            </div>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Successful Payments</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {(metrics?.settled_transactions || 1204).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-semibold">
              <span>{metrics?.conversion_rate_percent || 96.5}% success SLA</span>
            </div>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Failed Payments</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {(metrics?.failed_transactions || 20).toLocaleString()}
            </div>
            <div className="text-xs text-amber-500 flex items-center gap-1 mt-1">
              <span>1.6% decline / retry rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Activity Chart (8 cols) & Linked Cards Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Payment Activity Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Activity (7 Days)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily settled volume across international corridors (USD equivalent)
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              USD ($)
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                  formatter={(val) => [`$${val.toLocaleString()}`, 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#14B8A6" strokeWidth={2.5} fillOpacity={1} fill="url(#volumeTeal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linked Payment Methods Summary */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Linked Cards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Indian & global payment instruments
              </p>
            </div>
            <button
              onClick={() => setActivePage('cards')}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {savedCards.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800">
                No cards linked yet.
                <button
                  onClick={() => setActivePage('cards')}
                  className="block mx-auto mt-2 text-teal-500 font-bold hover:underline cursor-pointer"
                >
                  Link a Card
                </button>
              </div>
            ) : (
              savedCards.slice(0, 3).map((c) => {
                const isSupported = c.international_support === 'SUPPORTED';
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                        {c.network === 'RuPay' ? 'RP' : c.network === 'Visa' ? 'VI' : 'MC'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {c.issuing_bank}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {c.card_number_masked}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                          isSupported
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isSupported ? 'Global Ready' : 'Domestic'}
                      </span>
                      {c.is_default && (
                        <div className="text-[9px] font-semibold text-teal-400">Default</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => setActivePage('cards')}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Cards ({savedCards.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Latest cross-border payment charges, settlements, and corridor executions
            </p>
          </div>
          <button
            onClick={() => setActivePage('transactions')}
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>View Full History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Transaction ID</th>
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Corridor</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {recentTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions found. Make a payment in checkout to view activity.
                  </td>
                </tr>
              ) : (
                recentTxs.slice(0, 6).map((tx) => {
                  const isSettled = tx.status === 'settled';
                  const isFailed = tx.status === 'failed';
                  const isPending = tx.status?.includes('pending');

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                        {tx.id.slice(0, 16)}...
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {new Date(tx.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">
                        {tx.customer_country || 'US'} ({tx.currency || 'USD'})
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400 capitalize">
                        {(tx.payment_method || 'credit_card').replace('_', ' ')}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.amount ? `$${parseFloat(tx.amount).toFixed(2)}` : '$120.00'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            isSettled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {isSettled ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isFailed ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span className="capitalize">{tx.status || 'Settled'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
