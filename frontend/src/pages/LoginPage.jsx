import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage({ setActivePage }) {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function getRedirectTarget() {
    const target = sessionStorage.getItem('atlas_redirect_after_login');
    if (target) {
      sessionStorage.removeItem('atlas_redirect_after_login');
      // If target begins with slash, convert to page id or strip
      const clean = target.replace(/^\//, '');
      return clean || 'dashboard';
    }
    return 'dashboard';
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      const destination = getRedirectTarget();
      setActivePage(destination);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      const destination = getRedirectTarget();
      setActivePage(destination);
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
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
              Welcome back
            </h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
              Sign in to manage your cross-border payments and domestic cards.
            </p>
          </div>
        </div>

        {/* Instant Demo Access Pill */}
        <div className="p-3.5 rounded-xl bg-[#EEEEEE] dark:bg-[#1A1A1A] border border-[#DEDEDE] dark:border-[#333333] text-center space-y-2">
          <div className="flex items-center justify-center space-x-1.5 text-[12.5px] text-[#111111] dark:text-white font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Demo Access</span>
          </div>
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-lg bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-semibold text-[14px] shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In with 1 Click (merchant@example.com)'}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#DEDEDE] dark:border-[#222222]" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-white dark:bg-[#080808] px-2 text-slate-400 font-semibold">
              Or sign in with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setActivePage('forgot-password')}
                className="text-xs font-semibold text-[#111111] dark:text-white hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-700 text-teal-600 focus:ring-black dark:focus:ring-white w-4 h-4"
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md shadow-sm hover:shadow-teal-600/35 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Create Account Link */}
        <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => setActivePage('signup')}
            className="font-bold text-[#111111] dark:text-white hover:underline cursor-pointer"
          >
            Create an Account
          </button>
        </div>

      </div>
    </div>
  );
}
