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
  Sparkles,
  Info
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
    <div className="space-y-6 py-6 max-w-6xl mx-auto pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
            <GitBranch className="w-4 h-4" />
            <span>Automatic Provider Selection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Choose Best Payment Provider
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Set up rules so ATLAS.PAY automatically selects the fastest, cheapest, and most reliable payment provider for each customer.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow hover:shadow-md transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* Info Explanation Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <strong>What is Smart Routing?</strong> Instead of sending every payment through one expensive provider, smart routing checks the customer's country, currency, and payment method to pick the cheapest and most reliable provider (like Stripe, Adyen, Razorpay, or PayPal).
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Rules Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center justify-between">
              <span>Active Routing Rules</span>
              <span className="text-xs font-normal text-slate-500">{rules.length} configured</span>
            </h3>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading rules...</div>
            ) : rules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No custom rules yet. Standard balanced selection is active.</div>
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
                      <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                          <span>{rule.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 uppercase">
                            → {rule.target_provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          IF: {rule.condition ? Object.entries(rule.condition).map(([k, v]) => `${k} == '${v}'`).join(' AND ') : 'ALL PAYMENTS'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleToggle(rule.id, rule.is_active)}
                        className="p-1 rounded text-slate-400 hover:text-teal-500 cursor-pointer"
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
                        className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
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

        {/* Simulator Tool (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Test Provider Selection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter payment details to see which provider ATLAS.PAY chooses:
              </p>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={simCurrency}
                    onChange={(e) => setSimCurrency(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="BRL">BRL (R$)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Customer Country
                  </label>
                  <select
                    value={simCountry}
                    onChange={(e) => setSimCountry(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="BR">Brazil (BR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={simMethod}
                    onChange={(e) => setSimMethod(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="upi">UPI Instant</option>
                    <option value="credit_card">Card Payment</option>
                    <option value="paypal">PayPal</option>
                    <option value="pix">Pix Instant</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{simulating ? 'Evaluating...' : 'Run Selection Test'}</span>
              </button>
            </form>

            {simResult && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span>Selected Provider:</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 uppercase text-sm">
                    {simResult.selected_provider}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Reason for Selection:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{simResult.reason}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Estimated Processing Fee:</span>
                  <span className="font-mono font-semibold text-emerald-600">${simResult.estimated_fee}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Expected Response Speed:</span>
                  <span className="font-mono">{simResult.expected_latency_ms} ms</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Create New Routing Rule
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Route Indian UPI payments to Razorpay"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={condCurrency}
                    onChange={(e) => setCondCurrency(e.target.value)}
                    placeholder="e.g. EUR"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={condCountry}
                    onChange={(e) => setCondCountry(e.target.value)}
                    placeholder="e.g. DE"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Method
                  </label>
                  <input
                    type="text"
                    value={condMethod}
                    onChange={(e) => setCondMethod(e.target.value)}
                    placeholder="e.g. upi"
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Payment Provider
                </label>
                <select
                  value={targetProvider}
                  onChange={(e) => setTargetProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="stripe">Stripe</option>
                  <option value="adyen">Adyen</option>
                  <option value="paypal">PayPal</option>
                  <option value="razorpay">Razorpay</option>
                  <option value="dlocal">dLocal</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
