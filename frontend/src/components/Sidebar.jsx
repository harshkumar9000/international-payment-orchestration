import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShieldCheck,
  GitBranch,
  GraduationCap,
  Users2,
  RotateCcw,
  ShieldAlert,
  ArrowRightLeft,
  BarChart3,
  Layers,
  ListOrdered,
  Settings,
  Globe2,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Building2
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, isCollapsed, setIsCollapsed, userRole, setUserRole }) {
  const navigationGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, badge: 'Live' }
      ]
    },
    {
      title: 'PAYMENTS',
      items: [
        { id: 'checkout', label: 'Payment Checkout', icon: CreditCard, highlight: true },
        { id: 'compatibility', label: 'Domestic Cards & UPI', icon: Globe2, badge: 'RuPay/UPI' },
        { id: 'routing', label: 'Choose Best Provider', icon: GitBranch },
        { id: 'currency', label: 'Currency & Taxes', icon: ArrowRightLeft }
      ]
    },
    {
      title: 'STUDENT & PARENT',
      items: [
        { id: 'student', label: 'Student Payments', icon: GraduationCap, badge: 'Under-18' },
        { id: 'guardian', label: 'Parent Approval', icon: Users2 }
      ]
    },
    {
      title: 'SECURITY & REFUNDS',
      items: [
        { id: 'agentic-refund', label: 'Automatic Refund Assistant', icon: RotateCcw, highlight: true },
        { id: 'fraud', label: 'Suspicious Payment Shield', icon: ShieldAlert }
      ]
    },
    {
      title: 'REPORTS & SETTINGS',
      items: [
        { id: 'analytics', label: 'Business Reports', icon: BarChart3 },
        { id: 'providers', label: 'Payment Providers', icon: Layers },
        { id: 'transactions', label: 'Payment History', icon: ListOrdered },
        { id: 'settings', label: 'Platform Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
          <div
            onClick={() => setActivePage('dashboard')}
            className="flex items-center space-x-3 cursor-pointer select-none"
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
                  Smarter Payments. Borderless.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="py-4 px-3 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20'
                        : item.highlight
                        ? 'text-teal-600 dark:text-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
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
          ))}
        </div>
      </div>

      {/* Role Indicator Footer */}
      {!isCollapsed ? (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>Switch User Perspective:</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => { setUserRole('merchant'); setActivePage('dashboard'); }}
              className={`py-1 text-[10px] font-bold rounded ${userRole === 'merchant' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
            >
              Merchant
            </button>
            <button
              onClick={() => { setUserRole('student'); setActivePage('student'); }}
              className={`py-1 text-[10px] font-bold rounded ${userRole === 'student' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
            >
              Student
            </button>
            <button
              onClick={() => { setUserRole('guardian'); setActivePage('guardian'); }}
              className={`py-1 text-[10px] font-bold rounded ${userRole === 'guardian' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
            >
              Parent
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800">
          <div className="w-2.5 h-2.5 mx-auto rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
    </aside>
  );
}
