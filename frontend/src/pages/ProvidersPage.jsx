import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Zap,
  Activity,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Info,
  SlidersHorizontal
} from 'lucide-react';

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        api.providers.list(),
        api.providers.benchmark()
      ]);
      setProviders(pRes.providers || []);
      setBenchmarks(bRes.comparison || []);
    } catch (err) {
      console.error('[Load Providers Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.providers.toggle(id);
      setProviders(providers.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
    } catch (err) {
      alert(err.message || 'Toggle failed');
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Connected Gateways</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Payment Providers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare processing fees, speeds, and regional strengths across connected payment providers. You can turn individual providers on or off at any time.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition self-start sm:self-auto flex items-center space-x-1.5 text-xs font-medium cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Providers</span>
        </button>
      </div>

      {/* Real vs Simulated Sandbox Transparency Banner */}
      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-bold text-blue-900 dark:text-blue-300">
          <Info className="w-4 h-4 text-blue-600" />
          <span>About Connected Providers & Integrations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
          <div>
            <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">PayPal Sandbox (Live Sandbox API)</strong>
            Connected directly to PayPal's official developer sandbox. Live transactions and sandbox buyer accounts are processed in real time.
          </div>
          <div>
            <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">Stripe, Adyen, Razorpay, dLocal (Simulated Sandbox)</strong>
            High-fidelity simulated providers designed to test smart failover, regional routing, and fee savings without requiring live merchant contracts.
          </div>
        </div>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className={`p-5 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
              p.is_active
                ? 'bg-white dark:bg-[#121826] border-slate-200 dark:border-slate-800'
                : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/40 opacity-70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</span>
                <button
                  onClick={() => handleToggle(p.id, p.is_active)}
                  title={p.is_active ? 'Pause Provider' : 'Enable Provider'}
                  className="cursor-pointer"
                >
                  {p.is_active ? (
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold mb-3">
                {p.base_fee_percent}% + ${p.base_fee_fixed}
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-500">
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{p.avg_latency_ms} ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-mono text-emerald-600">{(p.success_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Availability:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{(p.uptime * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                p.is_active
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {p.is_active ? 'Active (In Use)' : 'Paused'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Benchmark Matrix Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
          Side-by-Side Provider Comparison
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Compare fees, latency speeds, and regional strengths to see how each provider fits your business.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3">Payment Provider</th>
                <th className="pb-3">Standard Fee</th>
                <th className="pb-3">International Fee</th>
                <th className="pb-3">Average Speed</th>
                <th className="pb-3">Best Regions</th>
                <th className="pb-3">Recommended For</th>
                <th className="pb-3">Automatic Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {benchmarks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="py-4 font-bold text-slate-900 dark:text-white text-sm">
                    {b.name}
                  </td>
                  <td className="py-4 font-mono font-semibold text-emerald-600">
                    {b.processing_fee}
                  </td>
                  <td className="py-4 text-slate-500 font-mono">
                    {b.cross_border_fee}
                  </td>
                  <td className="py-4 font-mono text-blue-600 dark:text-blue-400">
                    {b.avg_latency}
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-300">
                    {b.supported_corridors}
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-300 max-w-xs">
                    {b.best_for}
                  </td>
                  <td className="py-4">
                    {b.smart_retries ? (
                      <span className="flex items-center space-x-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Supported</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-slate-400">
                        <XCircle className="w-4 h-4" />
                        <span>Manual Only</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
