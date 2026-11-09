import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users2,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Settings,
  DollarSign,
  GraduationCap,
  RefreshCw,
  Save,
  Check,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function ParentApprovalPage({ setActivePage }) {
  const [guardianId] = useState('guard_priya_sharma');
  const [studentId] = useState('stu_aarav_sharma');
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Spending limits edit state
  const [dailyLimit, setDailyLimit] = useState(100);
  const [weeklyLimit, setWeeklyLimit] = useState(250);
  const [monthlyLimit, setMonthlyLimit] = useState(500);
  const [savingLimits, setSavingLimits] = useState(false);
  const [limitsSaved, setLimitsSaved] = useState(false);

  // Whitelisted categories
  const [categories, setCategories] = useState([
    { id: 'education', label: 'Online Courses & Universities (Coursera, edX)', enabled: true },
    { id: 'certifications', label: 'Tech Certifications (AWS, Google Cloud)', enabled: true },
    { id: 'books', label: 'Academic Books & Digital Libraries', enabled: true },
    { id: 'software_tools', label: 'Developer Software & Cloud Subscriptions', enabled: true },
    { id: 'gaming', label: 'Gaming & In-App Purchases', enabled: false },
    { id: 'crypto', label: 'Cryptocurrency & Virtual Assets', enabled: false }
  ]);

  async function loadData() {
    setLoading(true);
    try {
      const [pendRes, profRes] = await Promise.all([
        (typeof api.guardian?.getPending === 'function'
          ? api.guardian.getPending(guardianId)
          : typeof api.guardian?.getPendingApprovals === 'function'
          ? api.guardian.getPendingApprovals(guardianId)
          : Promise.resolve({ pending: [] })
        ).catch(() => ({ pending: [] })),
        (typeof api.student?.getProfile === 'function'
          ? api.student.getProfile(studentId)
          : Promise.resolve(null)
        ).catch(() => null)
      ]);

      const rawPending = pendRes?.pending || [];
      const uniquePending = [];
      const seenIds = new Set();
      for (const item of rawPending) {
        if (item && item.id && !seenIds.has(item.id) && item.status?.toUpperCase() === 'PENDING') {
          seenIds.add(item.id);
          uniquePending.push(item);
        }
      }
      setPendingApprovals(uniquePending);
      const stuProfile = profRes?.student || profRes?.profile || profRes;
      if (stuProfile) {
        setProfile(stuProfile);
        setDailyLimit(stuProfile.spending_limits?.daily_limit || stuProfile.daily_limit || 100);
        setWeeklyLimit(stuProfile.spending_limits?.weekly_limit || stuProfile.weekly_limit || 250);
        setMonthlyLimit(stuProfile.spending_limits?.monthly_limit || stuProfile.monthly_limit || 500);
      }
    } catch (err) {
      console.error('Error loading guardian data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleApprove(approvalId) {
    setActionLoading(approvalId);
    setFeedback(null);
    try {
      const res = await api.guardian.approve(approvalId, 'Approved by Priya Sharma for educational advancement.');
      setFeedback({ type: 'success', message: res.message || 'Payment approved! Authorized by parent in portal.' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('guardian_approval_updated'));
      }
      loadData();
    } catch (err) {
      console.error('Approve error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to approve payment.' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(approvalId) {
    const reason = prompt('Please provide a reason for rejecting this request:', 'This course exceeds the current monthly educational budget.');
    if (!reason) return;

    setActionLoading(approvalId);
    setFeedback(null);
    try {
      await api.guardian.reject(approvalId, reason);
      setFeedback({ type: 'success', message: 'Payment request rejected. Student has been notified.' });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('guardian_approval_updated'));
      }
      loadData();
    } catch (err) {
      console.error('Reject error:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to reject transaction.' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveLimits(e) {
    e.preventDefault();
    setSavingLimits(true);
    try {
      const res = await api.guardian.updateLimits(studentId, {
        daily_limit: parseFloat(dailyLimit),
        weekly_limit: parseFloat(weeklyLimit),
        monthly_limit: parseFloat(monthlyLimit)
      });
      setLimitsSaved(true);
      if (res?.profile) {
        setProfile(res.profile);
      }
      setTimeout(() => setLimitsSaved(false), 3000);
    } catch (err) {
      console.error('Error saving limits:', err);
    } finally {
      setSavingLimits(false);
    }
  }

  function toggleCategory(catId) {
    setCategories(prev =>
      prev.map(c => (c.id === catId ? { ...c, enabled: !c.enabled } : c))
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Guardian Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5" />
              Parent & Legal Guardian Portal
            </span>
            <span className="text-xs text-slate-300">Logged in as: Priya Sharma (priya.sharma@guardian.com)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Supervising Student: Aarav Sharma (Age 17)
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Review and approve your student's online learning course payments, adjust daily and monthly spending allowances, and manage allowed purchase categories.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('student')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Switch to Student View
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white/10 hover:bg-white/15 text-white rounded-xl border border-white/10 transition-all cursor-pointer"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Pending Approvals (7 cols) + Spending Controls (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Pending Approval Requests */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Payments Waiting for Your Approval ({pendingApprovals.length})
            </h2>
            <span className="text-[10px] text-slate-400">Parent Consent Required</span>
          </div>

          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Pending Requests</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All current payment requests from your student have been resolved.
                </p>
              </div>
            ) : (
              pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {appr.merchant_name || 'International Online Course'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                          {appr.merchant_category || 'Education'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Course: {appr.course_name || appr.notes || 'Online Learning Program'}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                        {appr.currency} {parseFloat(appr.amount).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Requested: {new Date(appr.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Why approval is needed */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <strong className="text-teal-600 dark:text-teal-400">Why approval is needed:</strong>{' '}
                    {appr.amount > 50
                      ? 'The amount exceeds your student\'s $50 auto-approval limit.'
                      : 'International educational purchase requires parent confirmation.'}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleReject(appr.id)}
                      disabled={actionLoading === appr.id}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleApprove(appr.id)}
                      disabled={actionLoading === appr.id}
                      className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
                    >
                      {actionLoading === appr.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Approve & Pay Course
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Spending Limit Sliders & Category Whitelisting (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Spending Limit Sliders */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-teal-500" />
                Configure Spending Limits for Aarav
              </h2>
              {limitsSaved && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved!
                </span>
              )}
            </div>

            <form onSubmit={handleSaveLimits} className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Daily Maximum:</span>
                  <span className="font-mono text-slate-900 dark:text-white">${dailyLimit} USD</span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="300"
                  step="25"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(e.target.value)}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Weekly Maximum:</span>
                  <span className="font-mono text-slate-900 dark:text-white">${weeklyLimit} USD</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={weeklyLimit}
                  onChange={(e) => setWeeklyLimit(e.target.value)}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  <span>Monthly Maximum:</span>
                  <span className="font-mono text-slate-900 dark:text-white">${monthlyLimit} USD</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={savingLimits}
                className="w-full py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {savingLimits ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Spending Limits
              </button>
            </form>
          </div>

          {/* Whitelisted & Blocked Categories Toggle */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Allowed Purchase Categories
            </h2>
            <p className="text-[11px] text-slate-400">
              Only checked merchant categories are allowed. Non-educational categories like gambling or crypto are strictly blocked.
            </p>

            <div className="space-y-2 pt-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer select-none transition-all ${
                    cat.enabled
                      ? 'border-teal-500/40 bg-teal-50/30 dark:bg-teal-950/20 text-slate-800 dark:text-slate-200'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  <span className="font-medium pr-2">{cat.label}</span>
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                      cat.enabled ? 'bg-teal-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {cat.enabled && <Check className="w-3 h-3" />}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
