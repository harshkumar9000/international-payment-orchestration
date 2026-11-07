import React from 'react';
import { ShieldCheck, Lock, Globe2, Server, Cpu, GraduationCap, RotateCcw } from 'lucide-react';

export default function Footer({ setActivePage }) {
  return (
    <footer className="bg-slate-100 dark:bg-[#070A10] border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-black">
                <span>A</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
                ATLAS<span className="text-teal-500">.PAY</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Smarter Payments. Borderless Possibilities. Enterprise multi-rail payment orchestration with RuPay & UPI international bridges, Under-18 educational guardrails, and autonomous agentic refunds.
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Server className="w-3.5 h-3.5" />
              <span>Multi-Rail Intelligent Orchestrator Live</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => setActivePage('compatibility')} className="hover:text-teal-500 transition cursor-pointer">Domestic RuPay & UPI Cross-Border</button></li>
              <li><button onClick={() => setActivePage('student')} className="hover:text-teal-500 transition cursor-pointer">Under-18 Student Payments</button></li>
              <li><button onClick={() => setActivePage('guardian')} className="hover:text-teal-500 transition cursor-pointer">Guardian Consent Portal</button></li>
              <li><button onClick={() => setActivePage('agentic-refund')} className="hover:text-teal-500 transition cursor-pointer">Agentic Refund & Recovery</button></li>
              <li><button onClick={() => setActivePage('routing')} className="hover:text-teal-500 transition cursor-pointer">Smart Routing Rules Engine</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Connected Rails
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" /><span>Stripe Global (Cards & Wallets)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><span>Adyen (EU SEPA & iDEAL)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" /><span>PayPal Sandbox REST API</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /><span>Razorpay & UPI Bilateral Link</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /><span>dLocal (Brazil Pix & LATAM)</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">
              Security & Compliance
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>PCI-DSS Level 1 Ready Vault</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <Lock className="w-4 h-4 text-teal-500" />
                <span>RBI LRS & TCS 20% / 5% Engine</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-700 dark:text-slate-300">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Idempotent SHA256 Refund Agent</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} ATLAS.PAY — Smarter Payments. Borderless Possibilities.
          </div>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <span>Node.js Express + Python FastAPI + React Vite</span>
            <span>•</span>
            <span className="text-teal-500 font-medium">Production Sandbox Environment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
