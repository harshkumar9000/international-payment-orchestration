import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Globe2,
  Sun,
  Moon,
  LayoutDashboard,
  CreditCard,
  GitBranch,
  ShieldAlert,
  RotateCcw,
  ListOrdered,
  Layers,
  ArrowRightLeft,
  LogIn,
  LogOut,
  User,
  Activity,
  Menu,
  X,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { theme, toggleTheme } = useTheme();
  const { merchant, isAuthenticated, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    async function checkBackend() {
      try {
        const res = await api.health();
        setHealthStatus(res.status === 'online' ? 'online' : 'degraded');
      } catch (e) {
        setHealthStatus('offline');
      }
    }
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: Globe2 },
    { id: 'dashboard', label: 'AI Dashboard', icon: LayoutDashboard },
    { id: 'checkout', label: 'Live Checkout', icon: CreditCard, highlight: true },
    { id: 'compatibility', label: 'RuPay & UPI', icon: Globe2 },
    { id: 'student', label: 'Student Hub', icon: GraduationCap },
    { id: 'agentic-refund', label: 'Agentic Refund', icon: RotateCcw },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#111827]/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActivePage('landing')}>
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black shadow-md shadow-teal-600/20">
              <span className="text-xl tracking-tighter">A</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  ATLAS<span className="text-teal-500">.PAY</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Smarter Payments. Borderless Possibilities.
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                    : item.highlight
                      ? 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">

            {/* Health Indicator Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className={`w-2 h-2 rounded-full ${healthStatus === 'online' ? 'bg-emerald-500 animate-pulse' : healthStatus === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              <span className="text-slate-600 dark:text-slate-300">
                {healthStatus === 'online' ? 'Engines 99.99%' : 'Simulators Active'}
              </span>
            </div>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User State */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActivePage('dashboard')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white shadow-sm shadow-teal-600/20 hover:bg-teal-500 transition cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Open App</span>
                </button>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    await demoLogin();
                    setActivePage('dashboard');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition cursor-pointer"
                >
                  Quick Demo
                </button>
                <button
                  onClick={() => setActivePage('login')}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-sm shadow-teal-600/20 transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-left ${activePage === item.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
