import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  DollarSign,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  Activity,
  ArrowUpRight,
  CreditCard,
  GitBranch,
  RefreshCw,
  Layers,
  Globe,
  ArrowDownRight,
  Sparkles,
  AlertTriangle,
  GraduationCap,
  Users2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Info
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
  const [corridors, setCorridors] = useState(null);
  const [providersHealth, setProvidersHealth] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [refundStats, setRefundStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7d');

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [mRes, vRes, cRes, hRes, tRes, refRes, studRes] = await Promise.all([
        api.analytics.getMetrics().catch(() => ({
          total_volume_usd: 148920.50,
          total_transactions: 1248,
          settled_transactions: 1204,
          recovered_transactions: 38,
          blocked_transactions: 24,
          failed_transactions: 20,
          conversion_rate_percent: 96.4,
          cost_savings_usd: 4890.20,
          fraud_blocked_rate_percent: 1.9
        })),
        api.analytics.getVolumeChart().catch(() => ({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          volumes: [14200, 18500, 24100, 19800, 31200, 28900, 36400],
          transactions_count: [48, 65, 89, 74, 118, 102, 138]
        })),
        api.analytics.getCorridors().catch(() => null),
        api.analytics.getProviderHealth().catch(() => ({ providers: [] })),
        api.transactions.list({ limit: 6 }).catch(() => ({ transactions: [] })),
        (typeof api.agenticRefund?.getAuditTrail === 'function'
          ? api.agenticRefund.getAuditTrail()
          : Promise.resolve({ logs: [] })
        ).catch(() => ({ logs: [] })),
        (typeof api.student?.getProfile === 'function'
          ? api.student.getProfile('stu_aarav_sharma')
          : Promise.resolve(null)
        ).catch(() => null)
      ]);

      setMetrics(mRes);
      setVolumeChart(vRes);
      setCorridors(cRes);
      setProvidersHealth(hRes?.providers || []);
      setRecentTxs(tRes?.transactions || []);
      setRefundStats({
        totalLogs: refRes?.logs ? refRes.logs.length : 0,
        autoRefunded: 2,
        pendingEscalated: 1
      });
      setStudentStats(studRes);
    } catch (err) {
      console.error('[Dashboard Load Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format chart data for Recharts
  const chartData = volumeChart && volumeChart.labels ? volumeChart.labels.map((label, idx) => ({
    name: label,
    volume: volumeChart.volumes[idx] || 0,
    count: volumeChart.transactions_count[idx] || 0
  })) : [
    { name: 'Mon', volume: 14200, count: 48 },
    { name: 'Tue', volume: 18500, count: 65 },
    { name: 'Wed', volume: 24100, count: 89 },
    { name: 'Thu', volume: 19800, count: 74 },
    { name: 'Fri', volume: 31200, count: 118 },
    { name: 'Sat', volume: 28900, count: 102 },
    { name: 'Sun', volume: 36400, count: 138 }
  ];

  const totalVolume = metrics?.total_volume_usd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$148,920.50';
  const settledCount = metrics?.settled_transactions || 1204;
  const failedCount = metrics?.failed_transactions || 20;
  const conversionRate = metrics?.conversion_rate_percent || 96.4;
  const costSavings = metrics?.cost_savings_usd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$4,890.20';
  const blockedRate = metrics?.fraud_blocked_rate_percent || 1.9;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-2xl text-white shadow-xl border border-slate-800">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Payment System Online (Demo Mode)
            </span>
            <span className="text-xs text-slate-400">Sample & Sandbox Data</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Welcome back, {merchant?.business_name || 'Acme Global Digital'}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            All systems active: Automatic provider selection, Indian card and UPI support, student payment controls, and automatic refund assistant.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActivePage('checkout')}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Try Payment Checkout
          </button>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Payment Volume */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Payment Volume
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{totalVolume}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.8% this week (Demo Data)</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Completed Payments:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{settledCount} payments</span>
          </div>
        </div>

        {/* Card 2: Success Rate */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Success Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{conversionRate}%</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Automatic backup routing enabled</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Declined Payments:</span>
            <span className="font-semibold text-rose-500">{failedCount} payments</span>
          </div>
        </div>

        {/* Card 3: Automatic Refunds & Recoveries */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Automatic Refunds
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics?.recovered_transactions || 38} Resolved
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Duplicate protection active</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Waiting for Review:</span>
            <span className="font-semibold text-amber-500">1 payment over $500</span>
          </div>
        </div>

        {/* Card 4: Fee Savings */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fee Savings
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{costSavings}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Suspicious payments blocked: {blockedRate}%</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Saved vs flat 3.5% fees</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">-28% fees</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Key Feature Spotlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recharts Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Daily Payment Volume & Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total payments processed daily across international currencies (Demo Data)</p>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
              {['24h', '7d', '30d', '90d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [
                    name === 'volume' ? `$${Number(value).toLocaleString()}` : value,
                    name === 'volume' ? 'Total Payment Value' : 'Number of Payments'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#14B8A6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Highest Daily Volume</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">$36,400</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Average Payments / Day</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">98 payments</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Average Payment Size</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">$119.32</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Key Features */}
        <div className="space-y-4">
          {/* Feature 1 */}
          <div className="bg-gradient-to-br from-teal-900/30 to-slate-900 border border-teal-500/30 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Feature 1
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">Indian Cards & UPI Payments</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Checks whether your RuPay card or UPI account works for international payments, and calculates applicable taxes (TCS).
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePage('compatibility')}
              className="mt-3 w-full py-1.5 px-3 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Check Card & UPI Compatibility <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 2 */}
          <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Feature 2
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">Student & Parent Controls</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Helps students pay for international courses safely, with parent approval for payments over $50 and strict limits.
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setActivePage('student')}
                className="flex-1 py-1.5 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium rounded-lg text-center transition-all cursor-pointer"
              >
                Student View
              </button>
              <button
                onClick={() => setActivePage('guardian')}
                className="flex-1 py-1.5 px-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium rounded-lg text-center transition-all cursor-pointer"
              >
                Parent Portal
              </button>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-gradient-to-br from-amber-900/30 to-slate-900 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Feature 3
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">Automatic Refund Assistant</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Checks the bank's actual records to verify whether stuck payments were charged, preventing duplicate payouts.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePage('agentic-refund')}
              className="mt-3 w-full py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              Open Refund Assistant <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Provider Health & Live Performance Matrix */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Connected Payment Providers</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Response speed, uptime, and success rates (Simulated Benchmarks)</p>
          </div>
          <button
            onClick={() => setActivePage('providers')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Compare All Providers <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {providersHealth.map((provider) => (
            <div
              key={provider.id}
              className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{provider.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    provider.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                  title={provider.is_active ? 'Provider Online' : 'Provider Offline'}
                />
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Success Rate:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{provider.success_rate_percent}%</span>
              </div>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Response Speed:</span>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{provider.avg_latency_ms} ms</span>
              </div>
              <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 text-[10px]">Processing Fee:</span>
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{provider.base_fee_display}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Customer Payments Feed */}
      <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Customer Payments</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live payment feed with student badges and payment method details</p>
          </div>
          <button
            onClick={() => setActivePage('transactions')}
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Complete Payment History ({recentTxs.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Payment ID</th>
                <th className="py-2.5 px-3 font-semibold">Customer Email</th>
                <th className="py-2.5 px-3 font-semibold">Country & Currency</th>
                <th className="py-2.5 px-3 font-semibold">Amount</th>
                <th className="py-2.5 px-3 font-semibold">Provider Used</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTxs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    No recent payments recorded yet.
                  </td>
                </tr>
              ) : (
                recentTxs.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {tx.id.substring(0, 16)}...
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-white truncate max-w-[140px]">
                        {tx.customer_email || 'guest@example.com'}
                      </div>
                      {tx.is_student && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-semibold">
                          <GraduationCap className="w-3 h-3" /> Student
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {tx.customer_country || 'US'} ({tx.currency || 'USD'})
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {tx.currency} {parseFloat(tx.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                        {tx.executed_provider || tx.provider || 'stripe'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          tx.status === 'settled' || tx.status === 'success'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.status === 'recovered' || tx.status === 'refunded'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : tx.status === 'blocked'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {tx.status === 'settled' ? 'Completed' : tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setActivePage('transactions')}
                        className="text-teal-600 dark:text-teal-400 hover:text-teal-700 text-xs font-semibold cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
