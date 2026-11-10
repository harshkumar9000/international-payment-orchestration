import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Globe2, Server, CreditCard, GraduationCap } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-slate-100 dark:bg-[#070A10] border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div
              onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'landing')}
              className="flex items-center space-x-2 cursor-pointer select-none"
              title={isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
            >
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black">
                <span>A</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
                ATLAS<span className="text-teal-500">.PAY</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              International payment platform providing domestic Indian payment card support, transparent currency conversion, and secure payment processing.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Server className="w-3.5 h-3.5" />
              <span>Payment Services Online (Sandbox Mode)</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActivePage('dashboard')} className="hover:text-teal-500 transition cursor-pointer">Dashboard Overview</button></li>
              <li><button onClick={() => setActivePage('checkout')} className="hover:text-teal-500 transition cursor-pointer">Payment Checkout</button></li>
              <li><button onClick={() => setActivePage('cards')} className="hover:text-teal-500 transition cursor-pointer">My Payment Cards</button></li>
              <li><button onClick={() => setActivePage('rupay-upi')} className="hover:text-teal-500 transition cursor-pointer">RuPay & UPI Compatibility</button></li>
              <li><button onClick={() => setActivePage('transactions')} className="hover:text-teal-500 transition cursor-pointer">Transaction History</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Payment Rails Supported
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /><span>RuPay Global (Discover/Diners Co-badged)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span>Visa & Mastercard Global</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /><span>UPI International (NIPL Bilateral Corridors)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><span>PayPal Sandbox REST API</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Security & Compliance
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Card Number / CVV Storage</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-teal-500" />
                <span>Simulated Vault Tokenization</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <Globe2 className="w-4 h-4 text-indigo-400" />
                <span>Transparent FX Spread & TCS Estimation</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} ATLAS.PAY — Your Payments. Without Borders.
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span>FastAPI Intelligence + Express Backend + React Frontend</span>
            <span>•</span>
            <span className="text-teal-500 font-medium">Sandbox Mode</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
