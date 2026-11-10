import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Globe2, Server } from 'lucide-react';

export default function Footer({ setActivePage }) {
  const { isAuthenticated } = useAuth();
  return (
    <footer className="bg-[#F7F7F7] dark:bg-[#080808] border-t border-[#DEDEDE] dark:border-[#222222] text-[#666666] dark:text-[#999999] py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div
              onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'landing')}
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
              title={isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
            >
              <img
                src="/atlas_pay_favicon.png"
                alt="ATLAS.PAY"
                className="w-8 h-8 rounded-xl object-contain shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="font-bold text-lg text-[#111111] dark:text-white tracking-tight">
                ATLAS<span className="text-[#666666] dark:text-[#999999]">.PAY</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#666666] dark:text-[#999999]">
              International payment platform providing domestic Indian payment card support, transparent currency conversion, and secure payment processing.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-[#111111] dark:text-white font-medium">
              <Server className="w-3.5 h-3.5" />
              <span>Payment Services Online (Sandbox Mode)</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#111111] dark:text-white uppercase tracking-wider mb-3">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActivePage('dashboard')} className="hover:text-black dark:hover:text-white transition cursor-pointer">Dashboard Overview</button></li>
              <li><button onClick={() => setActivePage('checkout')} className="hover:text-black dark:hover:text-white transition cursor-pointer">Payment Checkout</button></li>
              <li><button onClick={() => setActivePage('cards')} className="hover:text-black dark:hover:text-white transition cursor-pointer">My Payment Cards</button></li>
              <li><button onClick={() => setActivePage('rupay-upi')} className="hover:text-black dark:hover:text-white transition cursor-pointer">RuPay & UPI Compatibility</button></li>
              <li><button onClick={() => setActivePage('transactions')} className="hover:text-black dark:hover:text-white transition cursor-pointer">Transaction History</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#111111] dark:text-white uppercase tracking-wider mb-3">
              Payment Rails Supported
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" /><span>RuPay Global (Discover/Diners Co-badged)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" /><span>Visa & Mastercard Global</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" /><span>UPI International (NIPL Bilateral Corridors)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" /><span>PayPal Sandbox REST API</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#111111] dark:text-white uppercase tracking-wider mb-3">
              Security & Compliance
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-[#111111] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
                <span>Zero Card Number / CVV Storage</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[#111111] dark:text-white">
                <Lock className="w-4 h-4 text-black dark:text-white" />
                <span>Simulated Vault Tokenization</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[#111111] dark:text-white">
                <Globe2 className="w-4 h-4 text-black dark:text-white" />
                <span>Transparent FX Spread & TCS Estimation</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-[#DEDEDE] dark:border-[#222222] flex flex-col sm:flex-row items-center justify-between text-xs text-[#666666] dark:text-[#999999]">
          <div>
            © {new Date().getFullYear()} ATLAS.PAY — Monochromatic International Banking Platform.
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0 font-mono text-[11px]">
            <span>PCI-DSS Level 1</span>
            <span>•</span>
            <span>EMV 3DS 2.2</span>
            <span>•</span>
            <span>Sandbox Mode</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
