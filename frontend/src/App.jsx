import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import DashboardHeader from './components/DashboardHeader';

// 13 Core Pages + Auth & Landing
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentCompatibilityPage from './pages/PaymentCompatibilityPage';
import RoutingRulesPage from './pages/RoutingRulesPage';
import StudentPaymentsPage from './pages/StudentPaymentsPage';
import ParentApprovalPage from './pages/ParentApprovalPage';
import AgenticRefundPage from './pages/AgenticRefundPage';
import FraudDashboardPage from './pages/FraudDashboardPage';
import CurrencyEnginePage from './pages/CurrencyEnginePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProvidersPage from './pages/ProvidersPage';
import TransactionsPage from './pages/TransactionsPage';
import SettingsPage from './pages/SettingsPage';
import RecoveryPage from './pages/RecoveryPage';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState('merchant'); // 'merchant' | 'student' | 'guardian'

  const isPublicView = ['landing', 'login', 'register'].includes(activePage);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0E17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {isPublicView ? (
        // Public Marketing View (Navbar + Page + Footer)
        <div className="flex flex-col min-h-screen">
          <Navbar activePage={activePage} setActivePage={setActivePage} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            {activePage === 'landing' && <LandingPage setActivePage={setActivePage} />}
            {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
            {activePage === 'register' && <RegisterPage setActivePage={setActivePage} />}
          </main>
          <Footer setActivePage={setActivePage} />
        </div>
      ) : (
        // Modern FinTech AI Dashboard Layout
        <div className="flex min-h-screen">
          {/* Collapsible Sidebar */}
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            userRole={userRole}
            setUserRole={setUserRole}
          />

          {/* Main Workspace Area with Dynamic Margin */}
          <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'
            }`}>
            <DashboardHeader
              activePage={activePage}
              setActivePage={setActivePage}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              userRole={userRole}
              setUserRole={setUserRole}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {activePage === 'dashboard' && <DashboardPage setActivePage={setActivePage} />}
              {activePage === 'checkout' && <CheckoutPage setActivePage={setActivePage} />}
              {activePage === 'compatibility' && <PaymentCompatibilityPage setActivePage={setActivePage} />}
              {activePage === 'routing' && <RoutingRulesPage setActivePage={setActivePage} />}
              {activePage === 'student' && <StudentPaymentsPage setActivePage={setActivePage} />}
              {activePage === 'guardian' && <ParentApprovalPage setActivePage={setActivePage} />}
              {activePage === 'agentic-refund' && <AgenticRefundPage setActivePage={setActivePage} />}
              {activePage === 'recovery' && <AgenticRefundPage setActivePage={setActivePage} />}
              {activePage === 'fraud' && <FraudDashboardPage setActivePage={setActivePage} />}
              {activePage === 'currency' && <CurrencyEnginePage setActivePage={setActivePage} />}
              {activePage === 'analytics' && <AnalyticsPage setActivePage={setActivePage} />}
              {activePage === 'providers' && <ProvidersPage setActivePage={setActivePage} />}
              {activePage === 'transactions' && <TransactionsPage setActivePage={setActivePage} />}
              {activePage === 'settings' && <SettingsPage setActivePage={setActivePage} />}
            </main>

            <footer className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
              ATLAS.PAY Platform v2.5 • Autonomous Cross-Border Multi-Rail Orchestration • Sandbox & Simulators
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
