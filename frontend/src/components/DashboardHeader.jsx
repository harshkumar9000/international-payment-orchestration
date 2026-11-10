import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Sun,
  Moon,
  CreditCard,
  Globe2,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';

export default function DashboardHeader({
  activePage,
  setActivePage,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { theme, toggleTheme } = useTheme();
  const { merchant, logout } = useAuth();

  const pageTitles = {
    'dashboard': { group: 'PLATFORM', title: 'Dashboard Overview' },
    'checkout': { group: 'PAYMENTS', title: 'Payment Checkout' },
    'cards': { group: 'RAILS', title: 'My Payment Cards' },
    'rupay-upi': { group: 'RAILS', title: 'RuPay & UPI International' },
    'transactions': { group: 'RECORDS', title: 'Transaction History' },
    'student-payments': { group: 'GUARDRAILS', title: 'Student Payments' },
    'settings': { group: 'ACCOUNT', title: 'Settings' }
  };

  const current = pageTitles[activePage] || { group: 'ATLAS.PAY', title: 'Dashboard' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      
      {/* Left: Mobile Toggle / Desktop Collapse + Breadcrumb */}
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen ? setMobileOpen(!mobileOpen) : setIsCollapsed(!isCollapsed)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Header */}
        <div>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
            <span
              onClick={() => setActivePage('dashboard')}
              className="cursor-pointer hover:text-teal-500 transition-colors"
              title="Go to Dashboard"
            >
              ATLAS.PAY
            </span>
            <span>/</span>
            <span className="uppercase text-teal-600 dark:text-teal-400 font-semibold">{current.group}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {current.title}
          </h2>
        </div>
      </div>

      {/* Right: Quick Action Buttons & Theme Switch */}
      <div className="flex items-center space-x-3">
        {/* Quick Checkout Button */}
        {activePage !== 'checkout' && (
          <button
            onClick={() => setActivePage('checkout')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay Merchant</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:block text-right">
            <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
              {merchant?.company_name || merchant?.email || 'Demo Merchant'}
            </span>
            <span className="block text-[9px] text-teal-500 font-mono">
              Live Sandbox
            </span>
          </div>

          <button
            onClick={() => {
              logout();
              setActivePage('login');
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
