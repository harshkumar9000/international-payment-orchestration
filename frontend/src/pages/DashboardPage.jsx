import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AddCardModal, LinkBankAccountModal } from '../components/LinkInstrumentModals';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  Globe2,
  Clock,
  ChevronRight,
  Building2,
  Trash2
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
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showLinkBankModal, setShowLinkBankModal] = useState(false);
  const [inventoryNotice, setInventoryNotice] = useState('');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let partialFailures = 0;

    // 1. Core Analytics Metrics
    let mRes = null;
    try {
      mRes = await api.analytics.getMetrics();
    } catch (mErr) {
      console.warn('[Dashboard] Metrics endpoint offline, using baseline cached metrics:', mErr.message);
      partialFailures++;
      mRes = {
        total_volume_usd: 0,
        total_transactions: 0,
        settled_transactions: 0,
        failed_transactions: 0,
        conversion_rate_percent: 0,
        is_cached_baseline: false
      };
    }

    // 2. Volume Chart Data
    let vRes = null;
    try {
      vRes = await api.analytics.getVolumeChart();
    } catch (vErr) {
      console.warn('[Dashboard] Volume chart endpoint offline, using baseline curve:', vErr.message);
      partialFailures++;
      vRes = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        volumes: [0, 0, 0, 0, 0, 0, 0],
        transactions_count: [0, 0, 0, 0, 0, 0, 0],
        is_cached_baseline: false
      };
    }

    // 3. Recent Real Transactions
    let tRes = null;
    try {
      tRes = await api.transactions.list({ limit: 6 });
    } catch (tErr) {
      console.warn('[Dashboard] Transactions endpoint offline:', tErr.message);
      partialFailures++;
      tRes = { transactions: [] };
    }

    // 4. Linked Cards
    let cRes = null;
    try {
      cRes = await api.cards.list();
    } catch (cErr) {
      console.warn('[Dashboard] Cards endpoint offline:', cErr.message);
      partialFailures++;
      cRes = { cards: [] };
    }

    // 5. Linked Bank Accounts
    let bRes = null;
    try {
      bRes = await api.bankAccounts.list();
    } catch (bErr) {
      console.warn('[Dashboard] Bank accounts endpoint offline:', bErr.message);
      bRes = { bank_accounts: [] };
    }

    setMetrics(mRes);
    setVolumeChart(vRes);
    setRecentTxs(Array.isArray(tRes?.transactions) ? tRes.transactions : []);
    setSavedCards(Array.isArray(cRes?.cards) ? cRes.cards : []);
    setBankAccounts(Array.isArray(bRes?.bank_accounts) ? bRes.bank_accounts : []);

    if (partialFailures >= 3) {
      setError('Live payment analytics sync temporarily unavailable.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Format Recharts chart data safely
  const defaultDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartLabels = Array.isArray(volumeChart?.labels) && volumeChart.labels.length > 0
    ? volumeChart.labels
    : defaultDays;

  const chartData = chartLabels.map((day, idx) => ({
    name: day,
    volume: Array.isArray(volumeChart?.volumes) && volumeChart.volumes[idx] !== undefined
      ? Number(volumeChart.volumes[idx]) || 0
      : 0,
    count: Array.isArray(volumeChart?.transactions_count) && volumeChart.transactions_count[idx] !== undefined
      ? Number(volumeChart.transactions_count[idx]) || 0
      : 0
  }));

  const activeTotalVolume = Number(metrics?.total_volume_usd ?? 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-left">

      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#DEDEDE] dark:border-[#222222]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#EEEEEE] text-[#111111] dark:bg-[#1A1A1A] dark:text-white rounded border border-[#DEDEDE] dark:border-[#333333]">
              Overview
            </span>
            <span className="px-2 py-0.5 text-[10px] font-semibold text-[#666666] dark:text-[#999999] bg-[#F7F7F7] dark:bg-[#111111] rounded border border-[#DEDEDE] dark:border-[#262626]">
              {metrics?.is_cached_baseline ? 'Simulated Baseline' : 'Live Orchestration'}
            </span>
            {loading && (
              <span className="flex items-center gap-1 text-[10px] text-[#666666] dark:text-[#999999] font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing...
              </span>
            )}
          </div>
          <h1 className="page-heading text-[28px] sm:text-[32px] font-semibold text-[#111111] dark:text-white tracking-[-0.025em] leading-tight">
            Payments Dashboard
          </h1>
          <p className="text-[15px] text-[#666666] dark:text-[#999999] mt-1 font-normal leading-[1.5]">
            Real-time monitoring of your cross-border transactions and domestic payment rails.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white dark:bg-[#111111] hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] text-[#111111] dark:text-white border border-[#DEDEDE] dark:border-[#262626] shadow-sm cursor-pointer transition-all active:scale-95"
            title="Refresh Dashboard Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddCardModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#111111] hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] text-[#111111] dark:text-white font-semibold text-[14px] border border-[#DEDEDE] dark:border-[#262626] shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#111111] dark:text-white" />
            <span>Add Card</span>
          </button>
          <button
            type="button"
            onClick={() => setShowLinkBankModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#111111] hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E] text-[#111111] dark:text-white font-semibold text-[14px] border border-[#DEDEDE] dark:border-[#262626] shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Building2 className="w-4 h-4 text-[#111111] dark:text-white" />
            <span>Link Bank Account</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage('checkout')}
            className="px-4 py-2.5 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-black font-semibold text-[14px] shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <CreditCard className="w-4 h-4" />
            <span>Make Payment</span>
          </button>
        </div>
      </div>

      {/* Partial Offline / Retry Notice */}
      {error && (
        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/30 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Retry Sync</span>
          </button>
        </div>
      )}

      {inventoryNotice && (
        <div className="p-3.5 rounded-2xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#262626] text-xs font-medium text-[#111111] dark:text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{inventoryNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setInventoryNotice('')}
            className="text-[11px] text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!loading && savedCards.length === 0 && bankAccounts.length === 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#080808] border border-dashed border-[#DEDEDE] dark:border-[#2E2E2E] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wider font-semibold text-[#666666] dark:text-[#999999]">
              Empty Payment Inventory
            </div>
            <h2 className="text-lg font-semibold text-[#111111] dark:text-white">
              Your account is ready — no cards or bank accounts linked yet
            </h2>
            <p className="text-xs text-[#666666] dark:text-[#999999]">
              Link a payment card or settlement bank account to start processing international payments and payouts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddCardModal(true)}
              className="px-4 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Add Payment Card</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLinkBankModal(true)}
              className="px-4 py-2.5 rounded-full bg-[#F7F7F7] dark:bg-[#141414] text-[#111111] dark:text-white border border-[#DEDEDE] dark:border-[#333333] font-semibold text-xs flex items-center gap-2 hover:bg-[#EEEEEE] dark:hover:bg-[#1E1E1E] transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Link Bank Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Digital Banking Multi-Currency Vault */}
      <div className="p-6 sm:p-7 rounded-[32px] bg-[#080808] border border-[#222222] text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1E1E1E] relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-white flex items-center justify-center font-bold border border-[#333333]">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white">Global Treasury & Multi-Currency Liquidity</span>
                <span className="px-2 py-0.5 text-[10px] font-mono text-white bg-[#1A1A1A] rounded-full border border-[#333333]">
                  Live Reserve
                </span>
              </div>
              <span className="text-xs text-[#999999]">Institutional settlement across Indian and overseas correspondent rails</span>
            </div>
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-[#141414] border border-[#2A2A2A] text-xs font-bold self-start sm:self-auto">
            {['USD', 'EUR', 'INR'].map((curr) => (
              <button
                type="button"
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  selectedCurrency === curr
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#999999] hover:text-white'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5 relative z-10">
          <div>
            <span className="text-[11px] uppercase font-bold text-[#999999] tracking-wider block">
              Active Total Balance ({selectedCurrency})
            </span>
            <div className="text-3xl font-black font-mono tracking-tight text-white mt-1">
              {selectedCurrency === 'USD' && `$${activeTotalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              {selectedCurrency === 'EUR' && `€${(activeTotalVolume * 0.916).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              {selectedCurrency === 'INR' && `₹${(activeTotalVolume * 83.42).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
            </div>
            <div className="text-xs text-[#CCCCCC] flex items-center space-x-1 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {activeTotalVolume > 0 ? 'Live settled balance' : 'No settled balance yet'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#111111] border border-[#222222]">
            <span className="text-[10px] uppercase font-bold text-[#999999] tracking-wider block">
              Domestic Corridor Speed
            </span>
            <div className="text-xl font-black font-mono text-white mt-0.5">
              0.84 Seconds
            </div>
            <span className="text-[11px] text-[#999999] block mt-0.5">
              NPCI Bilateral / RuPay Global
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#111111] border border-[#222222]">
            <span className="text-[10px] uppercase font-bold text-[#999999] tracking-wider block">
              Transparent FX Markup
            </span>
            <div className="text-xl font-black font-mono text-white mt-0.5">
              1.25% Fixed
            </div>
            <span className="text-[11px] text-[#999999] block mt-0.5">
              Mid-Market Interbank Guaranteed
            </span>
          </div>
        </div>
      </div>

      {/* 4 Essential Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Total Payment Volume */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#999999]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Volume</span>
            <div className="p-2 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111] dark:text-white font-mono tracking-tight">
              ${activeTotalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-[#666666] dark:text-[#999999] flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {activeTotalVolume > 0 ? 'Settled across active corridors' : '0 settled volume'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#999999]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Transactions</span>
            <div className="p-2 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111] dark:text-white font-mono tracking-tight">
              {(Number(metrics?.total_transactions ?? 0)).toLocaleString()}
            </div>
            <div className="text-xs text-[#666666] dark:text-[#999999] mt-1">
              Cross-border & domestic rails
            </div>
          </div>
        </div>

        {/* Successful Payments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#999999]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Successful Payments</span>
            <div className="p-2 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111] dark:text-white font-mono tracking-tight">
              {(Number(metrics?.settled_transactions ?? 0)).toLocaleString()}
            </div>
            <div className="text-xs text-[#666666] dark:text-[#999999] flex items-center gap-1 mt-1 font-semibold">
              <span>{Number(metrics?.conversion_rate_percent ?? 0)}% success SLA</span>
            </div>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-[#666666] dark:text-[#999999]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Failed Payments</span>
            <div className="p-2 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111] dark:text-white font-mono tracking-tight">
              {(Number(metrics?.failed_transactions ?? 0)).toLocaleString()}
            </div>
            <div className="text-xs text-[#666666] dark:text-[#999999] flex items-center gap-1 mt-1">
              <span>
                {Number(metrics?.total_transactions ?? 0) > 0
                  ? `${((Number(metrics?.failed_transactions ?? 0) / Number(metrics?.total_transactions)) * 100).toFixed(1)}% decline / retry rate`
                  : 'No decline history'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Activity Chart (8 cols) & Linked Cards Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Payment Activity Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111111] dark:text-white">
                Payment Activity (7 Days)
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999] mt-0.5">
                Daily settled volume across international corridors (USD equivalent)
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EEEEEE] dark:bg-[#1A1A1A] text-[#111111] dark:text-white">
              USD ($)
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeMono" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#080808',
                    borderColor: '#262626',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#FFFFFF'
                  }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#111111" strokeWidth={2} fillOpacity={1} fill="url(#volumeMono)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Linked Payment Methods Summary */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111111] dark:text-white">
                Linked Cards
              </h3>
              <p className="text-xs text-[#666666] dark:text-[#999999] mt-0.5">
                Indian & global payment instruments
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('cards')}
              className="text-xs text-[#111111] dark:text-white hover:underline font-semibold cursor-pointer"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {savedCards.length === 0 ? (
              <div className="p-5 text-center text-xs text-[#666666] rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-dashed border-[#DEDEDE] dark:border-[#262626]">
                No cards linked yet.
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(true)}
                  className="block mx-auto mt-2 text-[#111111] dark:text-white font-bold hover:underline cursor-pointer"
                >
                  + Add Card
                </button>
              </div>
            ) : (
              savedCards.slice(0, 3).map((c) => {
                const isSupported = c.international_support === 'SUPPORTED';
                return (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-[#DEDEDE] dark:border-[#222222] bg-[#F7F7F7] dark:bg-[#111111] flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs">
                        {c.network === 'RuPay' ? 'RP' : c.network === 'Visa' ? 'VI' : 'MC'}
                      </div>
                      <div>
                        <div className="font-bold text-[#111111] dark:text-white text-xs">
                          {c.issuing_bank}
                        </div>
                        <div className="font-mono text-[11px] text-[#666666] dark:text-[#999999]">
                          {c.card_number_masked}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                          isSupported
                            ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                            : 'bg-[#EEEEEE] text-[#666666] border-[#DEDEDE] dark:bg-[#1E1E1E] dark:text-[#999999] dark:border-[#333333]'
                        }`}
                      >
                        {isSupported ? 'Global Ready' : 'Domestic'}
                      </span>
                      {c.is_default && (
                        <div className="text-[9px] font-semibold text-[#666666] dark:text-[#999999]">Default</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => setActivePage('cards')}
            className="w-full py-2.5 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] hover:bg-[#E0E0E0] dark:hover:bg-[#222222] text-[#111111] dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Cards ({savedCards.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Linked Bank Accounts Inventory */}
          <div className="pt-4 border-t border-[#DEDEDE] dark:border-[#222222] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-white">
                  Linked Bank Accounts
                </h4>
                <p className="text-[11px] text-[#666666] dark:text-[#999999]">
                  ACH, SEPA, SWIFT &amp; IMPS settlement accounts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkBankModal(true)}
                className="text-xs text-[#111111] dark:text-white hover:underline font-semibold cursor-pointer"
              >
                + Link Bank
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="p-5 text-center text-xs text-[#666666] rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-dashed border-[#DEDEDE] dark:border-[#262626]">
                No bank accounts linked yet.
                <button
                  type="button"
                  onClick={() => setShowLinkBankModal(true)}
                  className="block mx-auto mt-2 text-[#111111] dark:text-white font-bold hover:underline cursor-pointer"
                >
                  + Link Bank Account
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {bankAccounts.slice(0, 3).map((acc) => (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#262626] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[#111111] dark:text-white text-xs truncate">
                          {acc.bank_name}
                        </div>
                        <div className="font-mono text-[11px] text-[#666666] dark:text-[#999999]">
                          {acc.account_number_masked} · {acc.currency}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 text-[9px] font-bold rounded-full border bg-black text-white dark:bg-white dark:text-black border-black dark:border-white">
                        {acc.is_default ? 'Primary' : 'Verified'}
                      </span>
                      <button
                        type="button"
                        aria-label={`Unlink ${acc.bank_name}`}
                        onClick={async () => {
                          try {
                            await api.bankAccounts.delete(acc.id);
                            loadDashboardData();
                          } catch (err) {
                            console.error('[Unlink Bank Error]:', err);
                          }
                        }}
                        className="p-1 rounded-lg text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111111] dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-[#666666] dark:text-[#999999] mt-0.5">
              Latest cross-border payment charges, settlements, and corridor executions
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActivePage('transactions')}
            className="text-xs text-[#111111] dark:text-white hover:underline font-semibold cursor-pointer flex items-center gap-1"
          >
            <span>View Full History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DEDEDE] dark:border-[#222222] text-[#666666] dark:text-[#999999] uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Transaction ID</th>
                <th className="pb-3 font-semibold">Date & Time</th>
                <th className="pb-3 font-semibold">Corridor</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEEEE] dark:divide-[#1A1A1A] font-medium">
              {recentTxs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#666666]">
                    No transactions found. Make a payment in checkout to view activity.
                  </td>
                </tr>
              ) : (
                recentTxs.slice(0, 6).map((tx) => {
                  const isSettled = tx.status === 'settled';
                  const isFailed = tx.status === 'failed';

                  return (
                    <tr key={tx.id} className="hover:bg-[#F7F7F7] dark:hover:bg-[#111111] transition-colors">
                      <td className="py-3 font-mono font-bold text-[#111111] dark:text-white">
                        {(tx.id || '').slice(0, 16)}...
                      </td>
                      <td className="py-3 text-[#666666] dark:text-[#999999]">
                        {new Date(tx.created_at || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 text-[#111111] dark:text-white font-semibold">
                        {tx.customer_country || 'US'} ({tx.currency || 'USD'})
                      </td>
                      <td className="py-3 text-[#666666] dark:text-[#999999] capitalize">
                        {(tx.payment_method || 'credit_card').replace('_', ' ')}
                      </td>
                      <td className="py-3 font-mono font-bold text-[#111111] dark:text-white">
                        {tx.amount !== undefined && tx.amount !== null
                          ? `$${parseFloat(tx.amount).toFixed(2)}`
                          : '$0.00'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            isSettled
                              ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                              : isFailed
                              ? 'bg-[#111111] text-[#999999] border-[#333333]'
                              : 'bg-[#EEEEEE] text-[#666666] border-[#DEDEDE]'
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

      {/* Add Card & Link Bank Account Popups */}
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onSuccess={(card) => {
          setInventoryNotice(`Card ending in ${card.last_four} securely linked to your inventory.`);
          loadDashboardData();
        }}
      />

      <LinkBankAccountModal
        isOpen={showLinkBankModal}
        onClose={() => setShowLinkBankModal(false)}
        onSuccess={(account) => {
          setInventoryNotice(`Bank account ${account.bank_name} (${account.account_number_masked}) linked successfully.`);
          loadDashboardData();
        }}
      />
    </div>
  );
}
