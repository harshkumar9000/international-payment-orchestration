import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CheckoutPage from './pages/CheckoutPage';
import RoutingRulesPage from './pages/RoutingRulesPage';
import FraudDashboardPage from './pages/FraudDashboardPage';
import RecoveryPage from './pages/RecoveryPage';
import TransactionsPage from './pages/TransactionsPage';
import ProvidersPage from './pages/ProvidersPage';
import CurrencyEnginePage from './pages/CurrencyEnginePage';

function AppContent() {
  const [activePage, setActivePage] = useState('landing');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0A0E17] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activePage === 'landing' && <LandingPage setActivePage={setActivePage} />}
        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}
        {activePage === 'register' && <RegisterPage setActivePage={setActivePage} />}
        {activePage === 'dashboard' && <DashboardPage setActivePage={setActivePage} />}
        {activePage === 'checkout' && <CheckoutPage setActivePage={setActivePage} />}
        {activePage === 'routing' && <RoutingRulesPage setActivePage={setActivePage} />}
        {activePage === 'fraud' && <FraudDashboardPage setActivePage={setActivePage} />}
        {activePage === 'recovery' && <RecoveryPage setActivePage={setActivePage} />}
        {activePage === 'transactions' && <TransactionsPage setActivePage={setActivePage} />}
        {activePage === 'providers' && <ProvidersPage setActivePage={setActivePage} />}
        {activePage === 'currency' && <CurrencyEnginePage setActivePage={setActivePage} />}
      </main>

      <Footer setActivePage={setActivePage} />
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

