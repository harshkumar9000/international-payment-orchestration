import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

export default function ForgotPasswordPage({ setActivePage }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setSuccessNotice(res.message || 'Verification token generated. Please enter your new password.');
      setToken(res.resetToken || 'rst_simulated');
      setStep('reset');
    } catch (err) {
      setError(err.message || 'Could not find an account with that email.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), token, newPassword);
      setSuccessNotice('Password successfully updated! Redirecting to login...');
      setTimeout(() => {
        setActivePage('login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-md w-full space-y-6 p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#080808] border border-[#DEDEDE] dark:border-[#222222] shadow-xl transition-colors">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            onClick={() => setActivePage('landing')}
            className="inline-block cursor-pointer group"
          >
            <img
              src="/atlas_pay_favicon.png"
              alt="ATLAS.PAY"
              className="w-14 h-14 rounded-2xl object-contain mx-auto shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105"
            />
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1.5 mt-2">
              <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                ATLAS<span className="text-[#666666] dark:text-[#999999]">.PAY</span>
              </span>
            </div>
            <h2 className="text-[20px] font-semibold text-slate-800 dark:text-slate-200 mt-1 tracking-tight">
              Reset Your Password
            </h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
              {step === 'request'
                ? 'Enter your registered email address to receive verification instructions.'
                : 'Enter your new password below.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md shadow-sm hover:shadow-teal-600/35 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <span>{loading ? 'Sending Instructions...' : 'Send Reset Instructions'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md shadow-sm hover:shadow-teal-600/35 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Return to Sign In */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setActivePage('login')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#111111] dark:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>

      </div>
    </div>
  );
}

