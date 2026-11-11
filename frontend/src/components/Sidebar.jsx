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
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#DEDEDE] dark:border-[#222222]">
          <div
            onClick={() => handleNavigate(isAuthenticated ? 'dashboard' : 'landing')}
            className="flex items-center space-x-3 cursor-pointer select-none group"
            title={isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
          >
            <img
              src="/atlas_pay_favicon.png"
              alt="ATLAS.PAY"
              className="w-9 h-9 rounded-xl object-contain shadow-sm shrink-0 transition-transform group-hover:scale-105"
            />
            {!isCollapsed && (
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-base tracking-tight text-[#111111] dark:text-white">
                    ATLAS<span className="text-[#666666] dark:text-[#999999]">.PAY</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider bg-[#EEEEEE] text-[#111111] dark:bg-[#1E1E1E] dark:text-white rounded border border-[#DEDEDE] dark:border-[#333333]">
                    B2B
                  </span>
                </div>
                <p className="text-[10.5px] text-[#666666] dark:text-[#999999] truncate max-w-[140px] font-normal">
                  Payments. Without Borders.
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-lg text-[#666666] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1E1E1E] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="py-5 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id ||
              ((activePage === 'student' || activePage === 'guardian') && item.id === 'student-payments');

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                    : 'text-[#666666] dark:text-[#999999] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1E1E1E]'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-black' : 'text-[#666666] dark:text-[#999999]'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Strip */}
      <div className="p-3 border-t border-[#DEDEDE] dark:border-[#222222] space-y-2">
        {!isCollapsed ? (
          <>
            <div className="p-2.5 rounded-xl bg-[#F7F7F7] dark:bg-[#111111] border border-[#DEDEDE] dark:border-[#262626] flex items-center justify-between text-[11px] text-[#666666] dark:text-[#999999]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse" />
                <span>Sandbox Active</span>
              </div>
              <button
                onClick={() => handleNavigate('landing')}
                className="text-[#111111] dark:text-white hover:underline font-semibold cursor-pointer"
              >
                Public View
              </button>
            </div>

            <button
              onClick={() => {
                logout();
                handleNavigate('login');
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl text-xs font-semibold text-[#666666] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1E1E1E] transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </>
        ) : (
          <div className="text-center py-2 space-y-2">
            <span className="w-2 h-2 mx-auto rounded-full bg-black dark:bg-white block" title="Sandbox Active" />
            <button
              onClick={() => {
                logout();
                handleNavigate('login');
              }}
              className="p-1.5 rounded-lg text-[#666666] hover:text-[#111111] dark:hover:text-white hover:bg-[#EEEEEE] dark:hover:bg-[#1E1E1E] block mx-auto cursor-pointer"
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
        className={`hidden lg:flex fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-[#080808] border-r border-[#DEDEDE] dark:border-[#222222] flex-col justify-between ${
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
          <div className="relative w-64 bg-white dark:bg-[#080808] border-r border-[#DEDEDE] dark:border-[#222222] flex-col justify-between z-10 flex">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
