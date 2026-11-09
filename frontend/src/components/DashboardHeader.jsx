import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  Sun,
  Moon,
  Search,
  CreditCard,
  Bell,
  Globe2,
  Users2,
  GraduationCap,
  Building2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function DashboardHeader({
  activePage,
  setActivePage,
  isCollapsed,
  setIsCollapsed,
  userRole,
  setUserRole
}) {
  const { theme, toggleTheme } = useTheme();
  const { merchant, logout } = useAuth();

  // Page titles map in simple English
  const pageTitles = {
    'dashboard': { group: 'OVERVIEW', title: 'Dashboard Overview' },
    'checkout': { group: 'PAYMENTS', title: 'Payment Checkout' },
    'compatibility': { group: 'PAYMENTS', title: 'Domestic Cards & UPI Check' },
    'routing': { group: 'PAYMENTS', title: 'Choose Best Payment Provider' },
    'currency': { group: 'PAYMENTS', title: 'Currency Conversion & Taxes' },
    'student': { group: 'STUDENT & PARENT', title: 'Student Payments (Under-18)' },
    'guardian': { group: 'STUDENT & PARENT', title: 'Parent Approval Portal' },
    'agentic-refund': { group: 'SECURITY & REFUNDS', title: 'Automatic Refund Assistant' },
    'fraud': { group: 'SECURITY & REFUNDS', title: 'Suspicious Payment Shield' },
    'analytics': { group: 'REPORTS & SETTINGS', title: 'Business Reports' },
    'providers': { group: 'REPORTS & SETTINGS', title: 'Payment Providers' },
    'transactions': { group: 'REPORTS & SETTINGS', title: 'Payment History' },
    'settings': { group: 'REPORTS & SETTINGS', title: 'Platform Settings' },
    'recovery': { group: 'SECURITY & REFUNDS', title: 'Recover Failed Payments' }
  };

  const current = pageTitles[activePage] || { group: 'ATLAS.PAY', title: 'Dashboard' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      
      {/* Left: Collapse Button + Breadcrumb */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
            <span>ATLAS.PAY</span>
            <span>/</span>
            <span className="uppercase">{current.group}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {current.title}
          </h2>
        </div>
      </div>

      {/* Right: Role Switcher + Checkout Quick Button + Theme Toggle + Website link */}
      <div className="flex items-center space-x-2.5">
        
        {/* Role Toggle Selector */}
        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setUserRole('merchant');
              setActivePage('dashboard');
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              userRole === 'merchant'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="View dashboard as a Merchant / Business Owner"
          >
            <Building2 className="w-3 h-3" /> Merchant
          </button>
          <button
            onClick={() => {
              setUserRole('student');
              setActivePage('student');
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              userRole === 'student'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="View as a Student enrolled in courses"
          >
            <GraduationCap className="w-3 h-3" /> Student
          </button>
          <button
            onClick={() => {
              setUserRole('guardian');
              setActivePage('guardian');
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              userRole === 'guardian'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
            title="View as a Parent or Legal Guardian approving payments"
          >
            <Users2 className="w-3 h-3" /> Parent
          </button>
        </div>

        {/* Quick Checkout Trigger */}
        <button
          onClick={() => setActivePage('checkout')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg shadow-sm shadow-teal-600/20 transition-all cursor-pointer"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Try Payment Checkout</span>
        </button>

        {/* AI Health Pulse */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Services Online</span>
        </div>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Back to Public Site */}
        <button
          onClick={() => setActivePage('landing')}
          className="p-2 rounded-lg text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Back to Landing Page"
        >
          <Globe2 className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
}
