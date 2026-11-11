import React, { useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Protected Core Application Pages
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import MyCardsPage from './pages/MyCardsPage';
import PaymentCompatibilityPage from './pages/PaymentCompatibilityPage';
import TransactionsPage from './pages/TransactionsPage';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import ParentApprovalPage from './pages/ParentApprovalPage';
import SettingsPage from './pages/SettingsPage';

// Route Utilities
import {
  getPageFromPath,
  getPathFromPage,
  PROTECTED_PAGES,
  PUBLIC_PAGES,
  resolveAuthRedirect
} from './utils/routeUtils';

import {
  AlertTriangle,
  LayoutDashboard,
  Globe2,
  ArrowRight
} from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  const [activePage, setActivePageState] = useState(() => {
    if (typeof window !== 'undefined') {
      return getPageFromPath(window.location.pathname);
    }
    return 'landing';
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Synchronize browser history and URL when activePage changes
  const setActivePage = useCallback((page) => {
    setActivePageState(page);
    if (typeof window !== 'undefined') {
      const targetPath = getPathFromPage(page);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ page }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const page = getPageFromPath(window.location.pathname);
        setActivePageState(page);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Access Control & Protected Route Enforcement
  useEffect(() => {
    if (loading) return;

    let savedRedirect = null;
    try {
      savedRedirect = sessionStorage.getItem('atlas_redirect_after_login');
    } catch (_) {}

    const { redirect, saveRedirect } = resolveAuthRedirect({
      isAuthenticated,
      activePage,
      savedRedirect
    });

    if (saveRedirect) {
      try {
        sessionStorage.setItem('atlas_redirect_after_login', saveRedirect);
      } catch (_) {}
    }

    if (redirect) {
      if (redirect === 'dashboard' && savedRedirect) {
        try {
          sessionStorage.removeItem('atlas_redirect_after_login');
        } catch (_) {}
      }
      setActivePage(redirect);
    }
  }, [isAuthenticated, activePage, loading, setActivePage]);

  // Determine if the current activePage belongs in the public navbar/footer layout
  const isPublicView = PUBLIC_PAGES.includes(activePage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E17] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-black text-lg animate-pulse">
            A
          </div>
          <span className="text-xs font-mono text-slate-400">Loading ATLAS.PAY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-[#080808] text-[#111111] dark:text-[#FFFFFF] transition-colors duration-200">
      {isPublicView ? (
        activePage === 'landing' ? (
          <div className="min-h-screen bg-black">
            <LandingPage setActivePage={setActivePage} />
          </div>
        ) : activePage === 'not-found' ? (
          <div className="flex flex-col min-h-screen bg-[#F7F7F7] dark:bg-[#080808] text-[#111111] dark:text-white">
            <Navbar activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center">
              <div className="max-w-md w-full text-center space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-[#EEEEEE] dark:bg-[#1A1A1A] border border-[#DEDEDE] dark:border-[#333333] text-[#111111] dark:text-white flex items-center justify-center mx-auto shadow-sm">
                  <Globe2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-[#111111] dark:text-white">
                    404 — Page Not Found
                  </h1>
                  <p className="text-xs text-[#666666] dark:text-[#999999] leading-relaxed">
                    The requested URL path does not exist on the ATLAS.PAY platform.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePage('landing')}
                    className="px-4 py-2 border border-[#DEDEDE] dark:border-[#333333] hover:bg-[#EEEEEE] dark:hover:bg-[#1A1A1A] text-[#111111] dark:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Home Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'login')}
                    className="px-4 py-2 bg-black hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-black font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>{isAuthenticated ? 'Go to Dashboard' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </main>
            <Footer setActivePage={setActivePage} />
          </div>
        ) : (
          <div className="flex flex-col min-h-screen bg-[#F7F7F7] text-[#111111]">
            <Navbar activePage={activePage} setActivePage={setActivePage} />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
              {activePage === 'signup' && <SignupPage setActivePage={setActivePage} />}
              {activePage === 'forgot-password' && <ForgotPasswordPage setActivePage={setActivePage} />}
              {activePage === 'auth-callback' && <AuthCallbackPage setActivePage={setActivePage} />}
            </main>
            <Footer setActivePage={setActivePage} />
          </div>
        )
      ) : (
        // Authenticated FinTech Workspace Shell
        <div className="flex min-h-screen">
          {/* Collapsible & Mobile Sidebar */}
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          {/* Main Workspace Area with Dynamic Desktop Margin */}
          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${
              isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
            }`}
          >
            <DashboardHeader
              activePage={activePage}
              setActivePage={setActivePage}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {activePage === 'dashboard' && <DashboardPage setActivePage={setActivePage} />}
              {activePage === 'checkout' && <CheckoutPage setActivePage={setActivePage} />}
              {activePage === 'cards' && <MyCardsPage setActivePage={setActivePage} />}
              {activePage === 'rupay-upi' && <PaymentCompatibilityPage setActivePage={setActivePage} />}
              {activePage === 'transactions' && <TransactionsPage setActivePage={setActivePage} />}
              {activePage === 'student-payments' && <StudentPaymentsPage setActivePage={setActivePage} />}
              {activePage === 'guardian' && <ParentApprovalPage setActivePage={setActivePage} />}
              {activePage === 'settings' && <SettingsPage setActivePage={setActivePage} />}

              {/* Defensive Fallback: Guarantees authenticated workspace NEVER renders an empty/blank container */}
              {!PROTECTED_PAGES.includes(activePage) && (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-[#111111] dark:text-white">Workspace Page Not Found</h2>
                  <p className="text-xs text-[#666666] dark:text-[#999999] leading-relaxed">
                    The requested workspace view <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px]">{activePage}</code> is not supported or does not exist.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActivePage('dashboard')}
                    className="px-4 py-2 bg-black hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-black font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Return to Dashboard</span>
                  </button>
                </div>
              )}
            </main>

            <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              ATLAS.PAY • International Payment Orchestration Platform • Sandbox Mode
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
