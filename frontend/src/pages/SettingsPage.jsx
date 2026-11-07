import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Key,
  Globe2,
  Bell,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Save,
  Check,
  Copy,
  RefreshCw,
  Send,
  Lock,
  Building
} from 'lucide-react';

export default function SettingsPage() {
  const { merchant } = useAuth();
  const [apiKey, setApiKey] = useState('atlas_live_sec_89f02c4b81a7d6e520');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Merchant config state
  const [businessName, setBusinessName] = useState(merchant?.business_name || 'Acme Global Digital Inc.');
  const [settlementCurrency, setSettlementCurrency] = useState('USD');
  const [routingPreference, setRoutingPreference] = useState('fee_success_balanced');
  const [agenticRefundsEnabled, setAgenticRefundsEnabled] = useState(true);
  const [fraudStrictness, setFraudStrictness] = useState('normal');
  const [studentThreshold, setStudentThreshold] = useState('50.00');

  // Webhook simulator state
  const [webhookEvent, setWebhookEvent] = useState('payment.captured');
  const [webhookUrl, setWebhookUrl] = useState('https://api.merchant.com/webhooks/atlas');
  const [webhookSending, setWebhookSending] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);

  function handleCopy() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave(e) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSendWebhook() {
    setWebhookSending(true);
    setWebhookResult(null);
    try {
      // Simulate real webhook dispatch
      await new Promise(r => setTimeout(r, 600));
      setWebhookResult({
        status: 200,
        response_time_ms: 124,
        delivery_id: `wh_del_${Math.random().toString(36).substring(2, 9)}`,
        payload: {
          event: webhookEvent,
          timestamp: new Date().toISOString(),
          data: {
            transaction_id: 'tx_sim_wh_' + Date.now().toString(36),
            status: webhookEvent === 'payment.failed' ? 'failed' : 'settled',
            amount: 79.0,
            currency: 'USD'
          }
        }
      });
    } catch (e) {
      setWebhookResult({ status: 500, error: e.message });
    } finally {
      setWebhookSending(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Configuration
            </span>
            <span className="text-xs text-slate-400">Environment & Security Preferences</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Platform Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage API credentials, autonomous agent behavior thresholds, and webhook notification destinations.
          </p>
        </div>

        {saved && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Check className="w-4 h-4" /> Settings updated successfully
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Preferences (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Merchant Profile */}
            <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-500" />
                Merchant & Settlement Profile
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Registered Business Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Primary Settlement Currency
                  </label>
                  <select
                    value={settlementCurrency}
                    onChange={(e) => setSettlementCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="USD">USD - United States Dollar ($)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="INR">INR - Indian Rupee (₹)</option>
                    <option value="SGD">SGD - Singapore Dollar (S$)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Autonomous Orchestrator Rules */}
            <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-500" />
                Autonomous Engine Controls
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Smart Routing Optimization Priority
                  </label>
                  <select
                    value={routingPreference}
                    onChange={(e) => setRoutingPreference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="fee_success_balanced">Balanced (Lowest Fee + High Success SLA - Recommended)</option>
                    <option value="lowest_fee">Lowest Cost Only (Maximum Margin Retention)</option>
                    <option value="highest_success">Highest Success Rate (Zero-Tolerance Failure)</option>
                    <option value="lowest_latency">Lowest Latency (Sub-200ms Processing)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">Agentic Auto-Refunds</span>
                    <span className="text-[11px] text-slate-400">
                      Permit autonomous AI agent to issue idempotent refunds when provider captures but app drops.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={agenticRefundsEnabled}
                    onChange={(e) => setAgenticRefundsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    AI Fraud Engine Strictness
                  </label>
                  <select
                    value={fraudStrictness}
                    onChange={(e) => setFraudStrictness(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="normal">Normal (Score &gt; 80 blocks; &gt; 50 challenges 3DS)</option>
                    <option value="strict">Strict (Score &gt; 65 blocks; High-risk IP block)</option>
                    <option value="monitor">Passive / Monitor Only (Audit logs without blocking)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Under-18 Single Transaction Guardian Consent Threshold ($ USD)
                  </label>
                  <input
                    type="number"
                    value={studentThreshold}
                    onChange={(e) => setStudentThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Any student payment above this value immediately routes to the parent approval queue.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Platform Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Right Form: API Keys & Webhook Dispatcher (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* API Keys */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              API Secret Keys
            </h2>
            <p className="text-[11px] text-slate-400">
              Use this key to authenticate REST API calls from your backend into the ATLAS.PAY orchestration engine.
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs">
                <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                  {apiKey}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-slate-400 cursor-pointer"
                  title="Copy Key"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Never share secret keys or commit to client-side repositories.
              </span>
            </div>
          </div>

          {/* Webhook Simulator */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500" />
                Simulated Webhook Dispatcher
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                Test Event
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulate real-time webhooks delivered when cross-border, refund, or student approvals fire.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Event Type
                </label>
                <select
                  value={webhookEvent}
                  onChange={(e) => setWebhookEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="payment.captured">payment.captured (Success)</option>
                  <option value="payment.failed">payment.failed (Triggers recovery)</option>
                  <option value="refund.processed">refund.processed (Agentic refund)</option>
                  <option value="student.guardian_approved">student.guardian_approved (Consent granted)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleSendWebhook}
                disabled={webhookSending}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                {webhookSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Dispatch Test Webhook Event
              </button>

              {webhookResult && (
                <div className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1 overflow-x-auto border border-slate-800">
                  <div className="text-emerald-400 font-bold">
                    ✓ Delivered ({webhookResult.response_time_ms}ms) - Status 200 OK
                  </div>
                  <pre className="text-[10px] text-slate-300">
                    {JSON.stringify(webhookResult.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

