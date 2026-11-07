import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  GitBranch,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  Zap,
  Play,
  CheckCircle,
  HelpCircle,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export default function RoutingRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Rule Form Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [condCurrency, setCondCurrency] = useState('');
  const [condCountry, setCondCountry] = useState('');
  const [condMethod, setCondMethod] = useState('');
  const [targetProvider, setTargetProvider] = useState('stripe');

  // Simulation Tool state
  const [simAmount, setSimAmount] = useState('250.00');
  const [simCurrency, setSimCurrency] = useState('INR');
  const [simCountry, setSimCountry] = useState('IN');
  const [simMethod, setSimMethod] = useState('upi');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await api.routing.getRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error('[Load Rules Error]:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.routing.updateRule(id, { is_active: !currentStatus });
      setRules(rules.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    } catch (err) {
      alert(err.message || 'Failed to update rule');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this routing rule?')) return;
    try {
      await api.routing.deleteRule(id);
      setRules(rules.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete rule');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const condition = {};
      if (condCurrency.trim()) condition.currency = condCurrency.trim().toUpperCase();
      if (condCountry.trim()) condition.country = condCountry.trim().toUpperCase();
      if (condMethod.trim()) condition.payment_method = condMethod.trim().toLowerCase();

      await api.routing.createRule({
        name: newRuleName,
        condition,
        target_provider: targetProvider
      });

      setShowAddModal(false);
      setNewRuleName('');
      setCondCurrency('');
      setCondCountry('');
      setCondMethod('');
      loadRules();
    } catch (err) {
      alert(err.message || 'Failed to create rule');
    }
  };

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    setSimulating(true);
    try {
      const res = await api.routing.simulate({
        amount: parseFloat(simAmount),
        currency: simCurrency,
        customer_country: simCountry,
        payment_method: simMethod
      });
      setSimResult(res);
    } catch (err) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <GitBranch className="w-4 h-4" />
            <span>Intelligent Routing Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Rule-Based Routing & Cascade Priority
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure custom corridor rules, multi-factor weighting (cost, uptime, latency), and test simulated routing paths.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl fintech-gradient text-white text-xs font-semibold shadow hover:shadow-md transition flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Routing Rule</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Rules Table (8 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center justify-between">
              <span>Active Merchant Priority Rules</span>
              <span className="text-xs font-normal text-slate-500">{rules.length} configured</span>
            </h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No custom rules yet. Standard AI multi-factor weighting is active.</div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between gap-4 ${
                      rule.is_active
                        ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                        : 'bg-slate-50/40 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{rule.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 uppercase">
                            → {rule.target_provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          IF: {rule.condition ? Object.entries(rule.condition).map(([k, v]) => `${k} == '${v}'`).join(' AND ') : 'ALL'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleToggle(rule.id, rule.is_active)}
                        className="p-1 rounded text-slate-400 hover:text-blue-500"
                        title={rule.is_active ? 'Disable Rule' : 'Enable Rule'}
                      >
                        {rule.is_active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Simulator Tool (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4" />
              <span>Interactive Route Simulator</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">
              Simulate Gateway Selection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Test how the AI & rule engine routes any transaction without charging.
            </p>

            <form onSubmit={handleRunSimulation} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Currency</label>
                  <select
                    value={simCurrency}
                    onChange={(e) => setSimCurrency(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono"
                  >
                    <option value="INR">INR (India)</option>
                    <option value="EUR">EUR (Eurozone)</option>
                    <option value="USD">USD (US Global)</option>
                    <option value="BRL">BRL (Brazil)</option>
                    <option value="GBP">GBP (UK)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Method</label>
                  <select
                    value={simMethod}
                    onChange={(e) => setSimMethod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <option value="upi">UPI Rail</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="sepa_debit">SEPA Direct Debit</option>
                    <option value="pix">Pix Instant</option>
                    <option value="paypal">PayPal Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow transition flex items-center justify-center space-x-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{simulating ? 'Evaluating...' : 'Simulate Routing Decision'}</span>
              </button>
            </form>

            {/* Simulation Results Preview */}
            {simResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-500">Selected Primary Gateway:</span>
                  <span className="px-2 py-0.5 rounded font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                    {simResult.primary_provider}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Cascade Fallback Order:</span>
                  <span className="font-mono text-purple-600 dark:text-purple-400 font-medium">
                    {simResult.cascade_fallback_order?.join(' → ') || 'None'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                  <b>Rationale:</b> {simResult.routing_rationale}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Intelligent Routing Rule</h3>
            
            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Route EUR SEPA to Adyen"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Currency (Optional)</label>
                  <input
                    type="text"
                    value={condCurrency}
                    onChange={(e) => setCondCurrency(e.target.value)}
                    placeholder="e.g. EUR"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Country Code (Optional)</label>
                  <input
                    type="text"
                    value={condCountry}
                    onChange={(e) => setCondCountry(e.target.value)}
                    placeholder="e.g. DE"
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Provider</label>
                <select
                  value={targetProvider}
                  onChange={(e) => setTargetProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium"
                >
                  <option value="stripe">Stripe Global</option>
                  <option value="adyen">Adyen European & Global</option>
                  <option value="paypal">PayPal Sandbox / Enterprise</option>
                  <option value="razorpay_upi">Razorpay UPI India</option>
                  <option value="dlocal">dLocal Emerging Corridors</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg fintech-gradient text-white font-semibold shadow"
                >
                  Save Routing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

