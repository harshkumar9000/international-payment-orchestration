import React from 'react';
import { ShieldCheck, Lock, Globe, Server, Cpu } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-100 dark:bg-[#070A10] border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg fintech-gradient flex items-center justify-center text-white font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight">ATLAS.PAY</span>
            </div>
            <p className="text-xs leading-relaxed">
              Enterprise payment orchestration engine. Multi-rail smart routing, real-time AI fraud detection, automated decline cascade, and dynamic FX conversion.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Server className="w-3.5 h-3.5" />
              <span>Zero Downtime Architecture</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Engine Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActivePage('routing')} className="hover:text-blue-500 transition">Intelligent Payment Routing</button></li>
              <li><button onClick={() => setActivePage('fraud')} className="hover:text-blue-500 transition">Python AI Fraud Detection</button></li>
              <li><button onClick={() => setActivePage('recovery')} className="hover:text-blue-500 transition">Automated Cascading Recovery</button></li>
              <li><button onClick={() => setActivePage('currency')} className="hover:text-blue-500 transition">Multi-Currency FX Engine</button></li>
              <li><button onClick={() => setActivePage('checkout')} className="hover:text-blue-500 transition">Global Unified Checkout</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Connected Rails
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /><span>Stripe Global (Cards & Wallets)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span>Adyen (EU SEPA & iDEAL)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /><span>PayPal Sandbox REST API</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /><span>Razorpay & UPI India Instant</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span>dLocal (Brazil Pix & LATAM)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Compliance & Security
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>PCI-DSS Level 1 Ready Vault</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>EU PSD2 / Strong Customer Auth</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <Cpu className="w-4 h-4 text-purple-500" />
                <span>FastAPI ML Risk Scoring</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} International Payment Orchestration Platform.
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span>Node.js Express + Python FastAPI + React Vite</span>
            <span>•</span>
            <span className="text-emerald-500 font-medium">Production Sandbox Environment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

