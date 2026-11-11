import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  GraduationCap,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  UserCheck,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';

export default function StudentPaymentsPage({ setActivePage }) {
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  // New course payment form state
  const [courseName, setCourseName] = useState('Coursera Deep Learning Specialization');
  const [merchantCategory, setMerchantCategory] = useState('education');
  const [amount, setAmount] = useState('79.00');
  const [currency, setCurrency] = useState('USD');
  const [submitting, setSubmitting] = useState(false);
  const [intentResult, setIntentResult] = useState(null);
  const submittingRef = React.useRef(false);

  async function loadStudentData() {
    setLoading(true);
    setProfileError(null);
    try {
      const studentId = 'stu_aarav_sharma_01';
      const [pRes, aRes, tRes] = await Promise.all([
        (typeof api.student?.getProfile === 'function'
          ? api.student.getProfile(studentId)
          : Promise.reject(new Error('Student profile service is unavailable.'))
        ),
        (typeof api.student?.listApprovals === 'function'
          ? api.student.listApprovals(studentId)
          : Promise.resolve({ approvals: [] })
        ).catch(() => ({ approvals: [] })),
        (typeof api.student?.getRecentTransactions === 'function'
          ? api.student.getRecentTransactions(studentId)
          : Promise.resolve({ transactions: [] })
        ).catch(() => ({ transactions: [] }))
      ]);

      const stuProfile = pRes?.student || pRes?.profile || pRes;
      if (!stuProfile) {
        throw new Error('Student profile not found.');
      }
      setProfile(stuProfile);
      const rawApprovals = aRes?.approvals || [];
      const uniqueApprovals = [];
      const seenApprIds = new Set();
      for (const item of rawApprovals) {
        if (item && item.id && !seenApprIds.has(item.id)) {
          seenApprIds.add(item.id);
          uniqueApprovals.push(item);
        }
      }
      setApprovals(uniqueApprovals);
      setRecentTxs(tRes?.transactions || []);
    } catch (err) {
      console.error('Error loading student data:', err);
      setProfileError(err.message || 'Unable to load verified student profile.');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentData();

    // Auto-sync every 4 seconds so approval changes reflect immediately
    const interval = setInterval(() => {
      loadStudentData();
    }, 4000);

    const handleSync = () => loadStudentData();
    window.addEventListener('focus', handleSync);
    window.addEventListener('guardian_approval_updated', handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleSync);
      window.removeEventListener('guardian_approval_updated', handleSync);
    };
  }, []);

  async function handleCreatePaymentIntent(e) {
    e.preventDefault();
    if (submittingRef.current || submitting) {
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setIntentResult(null);

    try {
      if (typeof api.student?.createPaymentIntent !== 'function') {
        throw new Error('Student payment service is currently not connected.');
      }
      const idempotencyKey = `idem_${profile?.id || 'stu_aarav_sharma'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const res = await api.student.createPaymentIntent({
        student_id: profile?.id || 'stu_aarav_sharma',
        merchant_name: courseName,
        merchant_category: merchantCategory,
        amount: parseFloat(amount),
        currency,
        course_name: courseName,
        idempotency_key: idempotencyKey
      });
      setIntentResult(res);
      await loadStudentData();
    } catch (err) {
      console.error('Error creating student payment intent:', err);
      setIntentResult({
        success: false,
        status: 'error',
        message: err.message || 'Payment request could not be submitted.'
      });
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  // Dynamically compute approved payments from settled transactions and approved guardian approvals
  const approvedPayments = React.useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Add from recent settled transactions
    for (const tx of recentTxs) {
      if (tx.status === 'settled') {
        let meta = {};
        try {
          meta = typeof tx.metadata_json === 'string' ? JSON.parse(tx.metadata_json) : (tx.metadata_json || {});
        } catch (e) {}

        const courseName = meta.course_name || meta.order_id || 'Educational Payment';
        const normKey = `${courseName.toLowerCase().trim()}_${parseFloat(tx.amount || 0).toFixed(2)}`;
        if (!seen.has(normKey)) {
          seen.add(normKey);
          list.push({
            id: tx.id,
            course_name: courseName,
            amount: parseFloat(tx.amount || 0).toFixed(2),
            currency: tx.currency || 'USD',
            provider: tx.executed_provider || meta.provider_channel || 'Stripe',
            approved_by: 'Priya Sharma',
            date: tx.created_at,
            is_sandbox: true
          });
        }
      }
    }

    // 2. Also incorporate approved guardian requests if not already covered
    for (const appr of approvals) {
      if (appr.status?.toUpperCase() === 'APPROVED') {
        const courseName = appr.merchant_name || 'Educational Course';
        const normKey = `${courseName.toLowerCase().trim()}_${parseFloat(appr.amount || 0).toFixed(2)}`;
        if (!seen.has(normKey)) {
          seen.add(normKey);
          list.push({
            id: appr.id,
            course_name: courseName,
            amount: parseFloat(appr.amount || 0).toFixed(2),
            currency: appr.currency || 'USD',
            provider: 'Stripe',
            approved_by: 'Priya Sharma',
            date: appr.decided_at || appr.requested_at,
            is_sandbox: true
          });
        }
      }
    }

    return list;
  }, [recentTxs, approvals]);

  const monthlyLimit = parseFloat(profile?.spending_limits?.monthly_limit || 500);
  const calculatedSpend = recentTxs
    .filter(t => t.status === 'settled')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const currentMonthlySpend = typeof profile?.spending_limits?.current_monthly_spend === 'number' && profile.spending_limits.current_monthly_spend > 0
    ? profile.spending_limits.current_monthly_spend
    : parseFloat(calculatedSpend.toFixed(2));
  const remainingAllowance = Math.max(0, parseFloat((monthlyLimit - currentMonthlySpend).toFixed(2)));
  const percentUsed = Math.min(100, Math.round((currentMonthlySpend / (monthlyLimit || 1)) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Profile Error State (Fail Closed) */}
      {profileError && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <h3 className="font-bold text-rose-300 text-sm">Student Profile Unavailable</h3>
              <p className="text-xs text-rose-200/90">{profileError}</p>
            </div>
          </div>
          <button
            onClick={loadStudentData}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shrink-0"
          >
            Retry Verification
          </button>
        </div>
      )}

      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 p-6 rounded-2xl border border-indigo-500/20 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {profile?.age !== null && profile?.age !== undefined ? (
              profile?.is_minor ? (
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Verified Student (Under 18)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Verified Student (Adult, 18+)
                </span>
              )
            ) : (
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Age Unverified
              </span>
            )}
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Parent Linked: {profile?.guardian_email || 'priya.sharma@parent.in'}
            </span>
          </div>
          <h1 className="page-heading text-[26px] sm:text-[30px] font-semibold tracking-[-0.025em] text-white leading-tight">
            {profile?.student_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Student'} ({profile?.age !== null && profile?.age !== undefined ? `${profile.age} Years Old` : 'Age Unverified'})
          </h1>
          <p className="text-[14.5px] text-slate-300 max-w-2xl font-normal leading-[1.5]">
            Pay safely for international university courses, tech certifications, and learning tools with spending limits and parent guidance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('guardian')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[14px] rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Open Parent Approval Portal
          </button>
          <button
            onClick={loadStudentData}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Refresh Student Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Age Unverified Warning Banner */}
      {(!profile?.age && profile?.age !== 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-300">Age Verification Required</p>
            <p className="text-amber-200/90 leading-relaxed">
              Date of birth is unverified. Minor safety rules and guardian controls require verified age before educational payment processing.
            </p>
          </div>
        </div>
      )}

      {/* Spending Limits & Safety Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Limit Progress */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Monthly Spending Allowance</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{percentUsed}% used</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ${currentMonthlySpend}{' '}
            <span className="text-sm font-normal text-slate-400">spent / ${monthlyLimit} limit</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 85 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block pt-1">
            Remaining Allowance: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">${remainingAllowance} USD</strong>
          </span>
        </div>

        {/* Daily & Weekly Cap */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">Daily & Weekly Safety Limits</span>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Daily Maximum:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${profile?.spending_limits?.daily_limit || 100} USD
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Weekly Maximum:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${profile?.spending_limits?.weekly_limit || 250} USD
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Parent Approval Rule:</span>
              <span className="font-semibold text-teal-600 dark:text-teal-400">Needed for payments over $50</span>
            </div>
          </div>
        </div>

        {/* Safety Guardrails */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">Allowed & Blocked Categories</span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ Education & Courses
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ Academic Books
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              ✕ No Gambling / Crypto
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              ✕ No Adult / Alcohol
            </span>
          </div>
        </div>
      </div>

      {/* International Educational Payment Initiator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Course Checkout Form (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Pay for an Online Course or Learning Subscription
            </h2>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              5% Education Tax Rate (TCS)
            </span>
          </div>

          <form onSubmit={handleCreatePaymentIntent} className="space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Quick-Select Sample Educational Courses:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCourseName('Coursera Deep Learning Specialization');
                    setAmount('79.00');
                    setMerchantCategory('education');
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    courseName.includes('Coursera')
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold block truncate">Coursera DL</span>
                  <span className="text-[11px] text-slate-400 font-mono">$79.00 USD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCourseName('Harvard CS50 Verified Certificate (edX)');
                    setAmount('199.00');
                    setMerchantCategory('education');
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    courseName.includes('Harvard')
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold block truncate">Harvard CS50</span>
                  <span className="text-[11px] text-slate-400 font-mono">$199.00 USD</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCourseName('Duolingo Super Annual Plan');
                    setAmount('59.99');
                    setMerchantCategory('education');
                  }}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    courseName.includes('Duolingo')
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold block truncate">Duolingo Super</span>
                  <span className="text-[11px] text-slate-400 font-mono">$59.99 USD</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Course or Program Name
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            {/* Ineligible test alert: Prohibited Category Demo */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Simulate Category Safety Check:
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMerchantCategory('education')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    merchantCategory === 'education'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Educational (Allowed)
                </button>
                <button
                  type="button"
                  onClick={() => setMerchantCategory('gambling_crypto')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    merchantCategory === 'gambling_crypto'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Gambling / Crypto (Blocked Demo)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || (!profile?.age && profile?.age !== 0) || !profile}
              className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all ${
                submitting || (!profile?.age && profile?.age !== 0) || !profile
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (!profile?.age && profile?.age !== 0) ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Age Verification Required Before Payment</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Request for Parent Approval</span>
                </>
              )}
            </button>
          </form>

          {/* Submission feedback */}
          {intentResult && (
            <div
              className={`p-4 rounded-xl border mt-3 text-xs space-y-1.5 ${
                intentResult.status === 'requires_guardian_approval' || intentResult.status === 'pending_parent_approval'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  : intentResult.status === 'approved' || intentResult.status === 'settled'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                {intentResult.status === 'approved' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : intentResult.status === 'requires_guardian_approval' || intentResult.status === 'pending_parent_approval' ? (
                  <Clock className="w-4 h-4 text-amber-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>
                  {intentResult.status === 'approved' ? 'Payment Approved!' : (intentResult.status === 'requires_guardian_approval' || intentResult.status === 'pending_parent_approval') ? 'Waiting for Parent Approval' : 'Payment Blocked'}
                </span>
              </div>
              <p>{intentResult.message || intentResult.reason || 'Payment intent evaluated by Student Safety Engine.'}</p>
              {intentResult.approval_id && (
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[11px]">Request ID: {intentResult.approval_id}</span>
                  <button
                    onClick={() => setActivePage('guardian')}
                    className="font-bold underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 cursor-pointer"
                  >
                    Open Parent Approval Screen →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pending Approvals & Past Submissions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Requests Waiting for Parent Approval
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {approvals.filter((a) => a.status?.toLowerCase() === 'pending').length} Waiting
              </span>
            </div>

            <div className="space-y-2">
              {approvals.filter((a) => a.status?.toLowerCase() === 'pending').length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                  No pending requests waiting for parent review.
                </div>
              ) : (
                approvals
                  .filter((a) => a.status?.toLowerCase() === 'pending')
                  .map((appr) => (
                    <div
                      key={appr.id}
                      className="p-3 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {appr.merchant_name || 'Educational Course'}
                        </span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {appr.currency} {appr.amount}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Requested on {new Date(appr.created_at || Date.now()).toLocaleDateString()}
                      </p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Sent to: {profile?.guardian_email}
                        </span>
                        <button
                          onClick={() => setActivePage('guardian')}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          Review in Parent Portal →
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Student Educational History */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Approved Learning Payments
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {approvedPayments.length} Approved
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {approvedPayments.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                  No approved learning payments yet.
                </div>
              ) : (
                approvedPayments.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {item.course_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Approved by {item.approved_by} • Settled via {item.provider?.toUpperCase()} <span className="font-semibold text-teal-600 dark:text-teal-400">[Sandbox]</span>
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      ${item.amount} {item.currency}
                    </span>
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
