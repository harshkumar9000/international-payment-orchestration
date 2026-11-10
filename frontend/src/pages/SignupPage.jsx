import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  ShieldCheck
} from 'lucide-react';

export default function SignupPage({ setActivePage }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Compute password strength
  function getPasswordStrength(pwd) {
    if (!pwd) return { label: '', percent: 0, color: 'bg-slate-700' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { label: 'Weak', percent: 25, color: 'bg-rose-500' };
    if (score === 2) return { label: 'Moderate', percent: 50, color: 'bg-amber-500' };
    if (score === 3) return { label: 'Good', percent: 75, color: 'bg-teal-500' };
    return { label: 'Strong', percent: 100, color: 'bg-emerald-500' };
  }

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service & Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim(), 'USD');
      setSuccess(true);
      setTimeout(() => {
        const target = sessionStorage.getItem('atlas_redirect_after_login');
        if (target) {
          sessionStorage.removeItem('atlas_redirect_after_login');
          setActivePage(target.replace(/^\//, '') || 'dashboard');
        } else {
          setActivePage('dashboard');
        }
      }, 1200);
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
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
              Create an Account
            </h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-1 font-normal leading-[1.5]">
              Get started with cross-border payments and domestic card linking.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Account created successfully! Redirecting to dashboard...</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Swapnil Sharma"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
              />
            </div>
          </div>

          {/* Email Address */}
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
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Strength</span>
                  <span className="font-semibold text-slate-300">{pwdStrength.label}</span>
                </div>
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pwdStrength.color} transition-all duration-300`}
                    style={{ width: `${pwdStrength.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-[#DEDEDE] dark:border-[#222222] text-slate-900 dark:text-white focus:outline-none focus:border-black dark:border-white"
              />
            </div>
            {confirmPassword && password !== confirmPassword && (
              <span className="text-[10px] text-rose-500 font-medium block mt-1">
                Passwords do not match
              </span>
            )}
          </div>

          {/* Terms and Conditions Checkbox */}
          <div>
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 leading-snug">
              <input
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="rounded border-slate-700 text-teal-600 focus:ring-black dark:focus:ring-white w-4 h-4 mt-0.5"
              />
              <span>
                I agree to the <span className="text-[#111111] dark:text-white font-semibold">Terms of Service</span> and <span className="text-[#111111] dark:text-white font-semibold">Privacy Policy</span>.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-[#222222] dark:bg-white dark:text-black dark:hover:bg-[#EEEEEE] text-white font-bold text-xs shadow-md shadow-sm hover:shadow-teal-600/35 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Link to Login */}
        <div className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setActivePage('login')}
            className="font-bold text-[#111111] dark:text-white hover:underline cursor-pointer"
          >
            Sign In here
          </button>
        </div>

      </div>
    </div>
  );
}

