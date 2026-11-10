import React, { useState, useEffect } from 'react';
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
import SettingsPage from './pages/SettingsPage';

// Map URL paths to internal activePage keys
function getPageFromPath(path) {
  const clean = path.replace(/\/$/, '') || '/';
  switch (clean) {
    case '/':
    case '/landing':
      return 'landing';
    case '/login':
      return 'login';
    case '/signup':
    case '/register':
      return 'signup';
    case '/forgot-password':
      return 'forgot-password';
    case '/auth/callback':
      return 'auth-callback';
    case '/dashboard':
      return 'dashboard';
    case '/checkout':
      return 'checkout';
    case '/cards':
      return 'cards';
    case '/rupay-upi':
    case '/compatibility':
      return 'rupay-upi';
    case '/transactions':
      return 'transactions';
    case '/student-payments':
    case '/student':
      return 'student-payments';
    case '/settings':
      return 'settings';
    default:
      return 'landing';
  }
}

// Map internal activePage keys to canonical URL paths
function getPathFromPage(page) {
  switch (page) {
    case 'landing':
      return '/';
    case 'login':
      return '/login';
    case 'signup':
    case 'register':
      return '/signup';
    case 'forgot-password':
      return '/forgot-password';
    case 'auth-callback':
      return '/auth/callback';
    case 'dashboard':
      return '/dashboard';
    case 'checkout':
      return '/checkout';
    case 'cards':
      return '/cards';
    case 'rupay-upi':
      return '/rupay-upi';
    case 'transactions':
      return '/transactions';
    case 'student-payments':
    case 'student':
      return '/student-payments';
    case 'settings':
      return '/settings';
    default:
      return '/';
  }
}

const PROTECTED_PAGES = [
  'dashboard',
  'checkout',
  'cards',
  'rupay-upi',
  'transactions',
  'student-payments',
  'settings'
];

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
  const setActivePage = (page) => {
    setActivePageState(page);
    const targetPath = getPathFromPage(page);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const page = getPageFromPath(window.location.pathname);
      setActivePageState(page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Access Control Enforcement:
  // If user is unauthenticated and attempts to access protected dashboard pages,
  // save the intended destination and redirect to /login
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && PROTECTED_PAGES.includes(activePage)) {
        sessionStorage.setItem('atlas_redirect_after_login', getPathFromPage(activePage));
        setActivePage('login');
      } else if (isAuthenticated && ['login', 'signup'].includes(activePage)) {
        setActivePage('dashboard');
      }
    }
  }, [isAuthenticated, activePage, loading]);

  const isPublicView = ['landing', 'login', 'signup', 'forgot-password', 'auth-callback'].includes(activePage);

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
        // Authenticated FinTech Dashboard Layout
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
              {activePage === 'settings' && <SettingsPage setActivePage={setActivePage} />}
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
