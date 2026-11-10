import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Globe2,
  Sun,
  Moon,
  LayoutDashboard,
  CreditCard,
  GraduationCap,
  Menu,
  X,
  ArrowRight,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';

export default function Navbar({ activePage, setActivePage }) {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, merchant, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNav(id) {
    setActivePage(id);
    setMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    setActivePage('landing');
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-[#111827]/90 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name -> Navigates to Dashboard if logged in, Landing if not */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'landing')}
            title={isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black shadow-md shadow-teal-600/20">
              <span className="text-xl tracking-tighter">A</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  ATLAS<span className="text-teal-500">.PAY</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Demo
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Your Payments. Without Borders.
              </p>
            </div>
          </div>

          {/* Desktop Middle Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNav('landing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activePage === 'landing'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleNav('rupay-upi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activePage === 'rupay-upi'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              RuPay & UPI
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePage === 'dashboard'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNav('checkout')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePage === 'checkout'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50'
                  }`}
                >
                  Payment Checkout
                </button>
                <button
                  onClick={() => handleNav('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePage === 'cards'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  My Cards
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>

            {/* Auth Buttons: Unauthenticated vs Authenticated */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => handleNav('dashboard')}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => handleNav('landing')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => handleNav('rupay-upi')}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              RuPay & UPI
            </button>

            {!isAuthenticated ? (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => handleNav('login')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs text-center cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav('signup')}
                  className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs text-center cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => handleNav('dashboard')}
                  className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs text-center cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNav('checkout')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs text-center cursor-pointer"
                >
                  Payment Checkout
                </button>
                <button
                  onClick={() => handleNav('cards')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs text-center cursor-pointer"
                >
                  My Cards
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2 text-rose-400 font-bold text-xs text-center cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
