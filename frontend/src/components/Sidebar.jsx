import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CreditCard,
  Globe2,
  ListOrdered,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  LogOut
} from 'lucide-react';

export default function Sidebar({
  activePage,
  setActivePage,
  isCollapsed,
  setIsCollapsed,
  mobileOpen,
  setMobileOpen
}) {
  const { isAuthenticated, logout } = useAuth();
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'checkout', label: 'Payment Checkout', icon: CreditCard, path: '/checkout' },
    { id: 'cards', label: 'My Cards', icon: CreditCard, path: '/cards' },
    { id: 'rupay-upi', label: 'RuPay & UPI', icon: Globe2, path: '/rupay-upi' },
    { id: 'transactions', label: 'Transaction History', icon: ListOrdered, path: '/transactions' },
    { id: 'student-payments', label: 'Student Payments', icon: GraduationCap, path: '/student-payments' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  function handleNavigate(id) {
    setActivePage(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      {/* Brand & Top Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div
            onClick={() => handleNavigate(isAuthenticated ? 'dashboard' : 'landing')}
            className="flex items-center space-x-3 cursor-pointer select-none"
            title={isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md shadow-teal-600/20 shrink-0">
              <span className="text-lg tracking-tighter">A</span>
            </div>
            {!isCollapsed && (
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                    ATLAS<span className="text-teal-500">.PAY</span>
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/80 dark:text-teal-300 rounded border border-teal-200 dark:border-teal-800">
                    Demo
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                  Payments. Without Borders.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-5 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id || (activePage === 'student' && item.id === 'student-payments');

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-500' : 'text-slate-400 dark:text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] rounded font-mono font-bold ${
                    isActive
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Strip */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {!isCollapsed ? (
          <>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sandbox Online</span>
              </div>
              <button
                onClick={() => handleNavigate('landing')}
                className="text-teal-500 hover:underline font-semibold cursor-pointer"
              >
                Public View
              </button>
            </div>

            <button
              onClick={() => {
                logout();
                handleNavigate('login');
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="text-center py-2 space-y-2">
            <span className="w-2 h-2 mx-auto rounded-full bg-emerald-500 block" title="Sandbox Online" />
            <button
              onClick={() => {
                logout();
                handleNavigate('login');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 block mx-auto cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex-col justify-between ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Visible when mobileOpen is true) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Off-canvas sidebar */}
          <div className="relative w-64 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
