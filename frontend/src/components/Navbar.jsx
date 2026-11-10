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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-[#080808]/95 border-b border-[#DEDEDE] dark:border-[#222222] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'landing')}
            title={isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          >
            <img
              src="/atlas_pay_favicon.png"
              alt="ATLAS.PAY"
              className="w-9 h-9 rounded-xl object-contain shadow-sm transition-transform group-hover:scale-105"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-[#111111] dark:text-white">
                  ATLAS<span className="text-[#666666] dark:text-[#999999]">.PAY</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider rounded bg-[#EEEEEE] text-[#111111] dark:bg-[#1E1E1E] dark:text-[#FFFFFF] border border-[#DEDEDE] dark:border-[#333333]">
                  B2B
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Middle Navigation Links (400-500 weight, 14-15px) */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNav('landing')}
              className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                activePage === 'landing'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => handleNav('rupay-upi')}
              className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                activePage === 'rupay-upi'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                  : 'text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]'
              }`}
            >
              RuPay & UPI
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                    activePage === 'dashboard'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNav('checkout')}
                  className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                    activePage === 'checkout'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  Payment Checkout
                </button>
                <button
                  onClick={() => handleNav('cards')}
                  className={`px-3.5 py-2 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                    activePage === 'cards'
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]'
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
              className="p-2 rounded-xl text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
            </button>

            {/* Auth Buttons (500-600 weight, 14-15px) */}
            {!isAuthenticated ? (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => handleNav('login')}
                  className="px-4 py-2 rounded-xl text-[14px] font-medium text-[#111111] dark:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-all cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => handleNav('signup')}
                  className="px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold text-[14px] hover:bg-[#222222] dark:hover:bg-[#EEEEEE] transition-all cursor-pointer active:scale-95 shadow-sm flex items-center space-x-1.5"
                >
                  <span>Sign up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <button
                  onClick={() => handleNav('dashboard')}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-[14px] hover:bg-[#222222] dark:hover:bg-[#EEEEEE] transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-[#666666] hover:text-[#111111] dark:text-[#999999] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DEDEDE] dark:border-[#222222] bg-white dark:bg-[#080808] px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => handleNav('landing')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#111111] dark:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]"
          >
            Overview
          </button>
          <button
            onClick={() => handleNav('rupay-upi')}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#111111] dark:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]"
          >
            RuPay & UPI
          </button>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => handleNav('dashboard')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#111111] dark:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]"
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNav('checkout')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#111111] dark:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]"
              >
                Payment Checkout
              </button>
              <button
                onClick={() => handleNav('cards')}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#111111] dark:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]"
              >
                My Cards
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#666666] hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleNav('login')}
                className="w-full py-2.5 rounded-xl border border-[#DEDEDE] dark:border-[#333333] text-xs font-bold text-[#111111] dark:text-white"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('signup')}
                className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
