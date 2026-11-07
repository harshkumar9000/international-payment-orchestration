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
  ArrowRight
} from 'lucide-react';

export default function StudentPaymentsPage({ setActivePage }) {
  const [profile, setProfile] = useState(null);
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

  async function loadStudentData() {
    setLoading(true);
    try {
      const studentId = 'stu_aarav_sharma';
      const [pRes, aRes, tRes] = await Promise.all([
        api.student.getProfile(studentId).catch(() => ({
          student: {
            id: 'stu_aarav_sharma',
            first_name: 'Aarav',
            last_name: 'Sharma',
            email: 'aarav.sharma@student.edu',
            age: 17,
            is_minor: true,
            guardian_id: 'guard_priya_sharma',
            guardian_email: 'priya.sharma@guardian.com',
            spending_limits: {
              daily_limit: 100,
              weekly_limit: 250,
              monthly_limit: 500,
              current_daily_spend: 0,
              current_weekly_spend: 49,
              current_monthly_spend: 128
            },
            whitelisted_categories: ['education', 'books', 'software_tools', 'certification_fees']
          }
        })),
        api.student.listApprovals(studentId).catch(() => ({ approvals: [] })),
        api.student.getRecentTransactions(studentId).catch(() => ({ transactions: [] }))
      ]);

      setProfile(pRes.student || pRes);
      setApprovals(aRes.approvals || []);
      setRecentTxs(tRes.transactions || []);
    } catch (err) {
      console.error('Error loading student data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudentData();
  }, []);

  async function handleCreatePaymentIntent(e) {
    e.preventDefault();
    setSubmitting(true);
    setIntentResult(null);

    try {
      const res = await api.student.createPaymentIntent({
        student_id: profile?.id || 'stu_aarav_sharma',
        merchant_name: courseName,
        merchant_category: merchantCategory,
        amount: parseFloat(amount),
        currency,
        course_name: courseName
      });
      setIntentResult(res);
      // Reload approvals
      loadStudentData();
    } catch (err) {
      console.error('Error creating student payment intent:', err);
      setIntentResult({
        success: false,
        status: 'error',
        message: err.message || 'Payment intent submission failed.'
      });
    } finally {
      setSubmitting(false);
    }
  }

  const monthlyLimit = profile?.spending_limits?.monthly_limit || 500;
  const currentMonthlySpend = profile?.spending_limits?.current_monthly_spend || 128;
  const remainingAllowance = Math.max(0, monthlyLimit - currentMonthlySpend);
  const percentUsed = Math.min(100, Math.round((currentMonthlySpend / monthlyLimit) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Student Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-teal-950 p-6 rounded-2xl border border-indigo-500/20 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Under-18 Student Account
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Guardian Active: {profile?.guardian_email || 'priya.sharma@guardian.com'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {profile?.first_name} {profile?.last_name} ({profile?.age || 17} yrs)
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Empowered for verified global education, international tuition, and technical certifications under parent/guardian supervision.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('guardian')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Switch to Guardian View
          </button>
          <button
            onClick={loadStudentData}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Spending Limits & Safety Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Monthly Limit Progress */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Monthly Spending Limit</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{percentUsed}% used</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            ${currentMonthlySpend}{' '}
            <span className="text-sm font-normal text-slate-400">/ ${monthlyLimit}</span>
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
            Available Allowance: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">${remainingAllowance} USD</strong>
          </span>
        </div>

        {/* Daily & Weekly Cap */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">Velocity & Daily Safety Cap</span>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Daily Max:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${profile?.spending_limits?.daily_limit || 100} USD
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Weekly Max:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${profile?.spending_limits?.weekly_limit || 250} USD
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Consent Rule:</span>
              <span className="font-semibold text-teal-600 dark:text-teal-400">Required if &gt; $50</span>
            </div>
          </div>
        </div>

        {/* Regulatory Protection & Prohibited Categories */}
        <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">Under-18 Safety Guardrails</span>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ Education Whitelisted
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              ✕ No Gambling / Crypto
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              ✕ No Alcohol / Adult
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              ✓ 2FA Guardian Push
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
              Pay for Course or Educational Subscription
            </h2>
            <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
              5% LRS TCS Rate
            </span>
          </div>

          <form onSubmit={handleCreatePaymentIntent} className="space-y-4">
            {/* Quick Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                Quick Select Verified Educational Providers:
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
                Course / Program Description
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
                Simulate Category Compliance:
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
                  Gambling/Crypto (Blocked Demo)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {submitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit for Guardian Consent & Payment
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
                ) : intentResult.status === 'requires_guardian_approval' ? (
                  <Clock className="w-4 h-4 text-amber-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>Status: {intentResult.status}</span>
              </div>
              <p>{intentResult.message || intentResult.reason || 'Payment intent evaluated by Student Engine.'}</p>
              {intentResult.approval_id && (
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[11px]">Approval ID: {intentResult.approval_id}</span>
                  <button
                    onClick={() => setActivePage('guardian')}
                    className="font-bold underline text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 cursor-pointer"
                  >
                    Open Guardian Approval Screen →
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
                Pending Guardian Requests
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {approvals.filter((a) => a.status === 'pending').length} Pending
              </span>
            </div>

            <div className="space-y-2">
              {approvals.filter((a) => a.status === 'pending').length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 text-center text-xs text-slate-400">
                  No pending requests waiting for parent review.
                </div>
              ) : (
                approvals
                  .filter((a) => a.status === 'pending')
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
                          Review in Guardian Portal →
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Student Educational History */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Approved Educational Payments
            </h2>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Coursera: Machine Learning by Andrew Ng
                  </span>
                  <span className="text-[10px] text-slate-400">Approved by Priya Sharma • Settled via Stripe</span>
                </div>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  $49.00 USD
                </span>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    AWS Certified Cloud Practitioner Exam
                  </span>
                  <span className="text-[10px] text-slate-400">Approved by Priya Sharma • Settled via PayPal</span>
                </div>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  $79.00 USD
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

