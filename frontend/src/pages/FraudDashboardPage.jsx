import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Cpu,
  CheckCircle,
  XCircle,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Normal Trustworthy Buyer',
    payload: {
      amount: 49.99,
      currency: 'USD',
      customer_country: 'US',
      customer_email: 'sarah.connor@acme.com',
      ip_country: 'US',
      is_vpn: false,
      cvc_provided: true
    }
  },
  {
    name: 'Location Mismatch (VPN Used)',
    payload: {
      amount: 280.00,
      currency: 'USD',
      customer_country: 'US',
      customer_email: 'buyer@outlook.com',
      ip_country: 'FR',
      is_vpn: true,
      cvc_provided: true
    }
  },
  {
    name: 'Temporary / Burner Email Bot',
    payload: {
      amount: 140.00,
      currency: 'USD',
      customer_country: 'US',
      customer_email: 'test_user992@mailinator.com',
      ip_country: 'US',
      is_vpn: false,
      cvc_provided: true
    }
  },
  {
    name: 'Prohibited Country Region',
    payload: {
      amount: 500.00,
      currency: 'USD',
      customer_country: 'KP',
      customer_email: 'client@pyongyang-trade.kp',
      ip_country: 'KP',
      is_vpn: false,
      cvc_provided: true
    }
  }
];

export default function FraudDashboardPage() {
  const [testPayload, setTestPayload] = useState(PRESETS[0].payload);
  const [selectedPresetName, setSelectedPresetName] = useState(PRESETS[0].name);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [assessing, setAssessing] = useState(false);

  // Review Queue State
  const [flaggedTxs, setFlaggedTxs] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  async function loadHistory() {
    setLoadingQueue(true);
    try {
      const res = await api.transactions.list({ limit: 10 });
      setFlaggedTxs(res.transactions.filter(t => t.fraud_score > 30 || t.status === 'blocked') || []);
    } catch (err) {
      console.error('[Load Fraud History Error]:', err);
    } finally {
      setLoadingQueue(false);
    }
  }

  useEffect(() => {
    loadHistory();
    // Run initial assessment
    runAssessment(PRESETS[0].payload);
  }, []);

  const handleSelectPreset = (p) => {
    setSelectedPresetName(p.name);
    setTestPayload(p.payload);
    runAssessment(p.payload);
  };

  const runAssessment = async (payload) => {
    setAssessing(true);
    try {
      const res = await api.fraud.evaluate(payload);
      setAssessmentResult(res);
    } catch (err) {
      console.error('[Fraud Eval Error]:', err);
    } finally {
      setAssessing(false);
    }
  };

  const handleRunAssessment = (e) => {
    e.preventDefault();
    runAssessment(testPayload);
  };

  const handleComplianceAction = async (id, decision) => {
    try {
      await api.fraud.review(id, decision, 'Compliance Officer Manual Override');
      alert(`Transaction ${id} marked as ${decision}`);
      loadHistory();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-6xl mx-auto pb-12">
      
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Security & Protection Shield</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Check for Suspicious Payments (Fraud Shield)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Automatically scores every payment to detect stolen cards, fake emails, or suspicious IP locations before money is lost.
        </p>
      </div>

      {/* Helpful Concept Card */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <strong>What is a Fraud Score?</strong> A safety score from 0 to 100 calculated for every payment. Lower scores are safe. Scores above 80 are automatically blocked, while scores between 50 and 80 require an extra bank security verification (3D Secure).
        </div>
      </div>

      {/* Interactive Fraud Simulator */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Test Sample Payment Scenarios</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select a preset scenario below to see how ATLAS.PAY scores and protects against risky payments:</p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>Python Intelligence Engine Online</span>
          </div>
        </div>

        {/* Presets Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedPresetName === p.name
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs */}
          <form onSubmit={handleRunAssessment} className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={testPayload.amount}
                  onChange={(e) => setTestPayload({ ...testPayload, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Country</label>
                <input
                  type="text"
                  required
                  value={testPayload.customer_country}
                  onChange={(e) => setTestPayload({ ...testPayload, customer_country: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IP / Internet Location</label>
                <input
                  type="text"
                  required
                  value={testPayload.ip_country}
                  onChange={(e) => setTestPayload({ ...testPayload, ip_country: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Customer Email</label>
                <input
                  type="email"
                  required
                  value={testPayload.customer_email}
                  onChange={(e) => setTestPayload({ ...testPayload, customer_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testPayload.is_vpn}
                  onChange={(e) => setTestPayload({ ...testPayload, is_vpn: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span>Simulate VPN or Proxy Usage</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testPayload.cvc_provided}
                  onChange={(e) => setTestPayload({ ...testPayload, cvc_provided: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span>Card CVC Security Code Entered</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={assessing}
              className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{assessing ? 'Evaluating...' : 'Check Payment Risk'}</span>
            </button>
          </form>

          {/* Assessment Output Gauge */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            {assessmentResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Assessment Result</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    assessmentResult.action === 'allow'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : assessmentResult.action === 'block'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {assessmentResult.action === 'allow' ? 'Safe to Process' : assessmentResult.action === 'block' ? 'Automatically Blocked' : 'Extra Verification Required'}
                  </span>
                </div>

                {/* Score Number Gauge */}
                <div className="text-center py-2">
                  <div className={`text-4xl font-extrabold font-mono ${
                    assessmentResult.fraud_score < 30 ? 'text-emerald-500' : assessmentResult.fraud_score < 75 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {assessmentResult.fraud_score} / 100
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                    Calculated Risk Score ({assessmentResult.risk_level} Risk)
                  </span>
                </div>

                {/* Reasons Breakdown */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">Security Factors Checked:</div>
                  {assessmentResult.reasons && assessmentResult.reasons.length > 0 ? (
                    assessmentResult.reasons.map((r, i) => (
                      <div key={i} className="flex items-start space-x-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                        <span className="text-rose-500">•</span>
                        <span>{r}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-emerald-600 text-[11px] flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>No suspicious indicators found. Clean transaction.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">Loading risk assessment...</div>
            )}
          </div>
        </div>
      </div>

      {/* Flagged Payments Review Section */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Flagged Payments History</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Recent payments evaluated with heightened risk scores:</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Payment ID</th>
                <th className="py-2.5 px-3 font-semibold">Customer Email</th>
                <th className="py-2.5 px-3 font-semibold">Amount</th>
                <th className="py-2.5 px-3 font-semibold">Risk Score</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingQueue ? (
                <tr><td colSpan="6" className="py-4 text-center text-slate-400">Loading review records...</td></tr>
              ) : flaggedTxs.length === 0 ? (
                <tr><td colSpan="6" className="py-6 text-center text-slate-400">No high-risk payments flagged recently.</td></tr>
              ) : (
                flaggedTxs.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-medium">{t.id.substring(0, 16)}...</td>
                    <td className="py-3 px-3">{t.customer_email}</td>
                    <td className="py-3 px-3 font-mono font-semibold">{t.currency} {parseFloat(t.amount).toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={t.fraud_score > 70 ? 'text-rose-500' : 'text-amber-500'}>
                        {t.fraud_score || 0} / 100
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleComplianceAction(t.id, 'approve')}
                        className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleComplianceAction(t.id, 'reject')}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold cursor-pointer"
                      >
                        Confirm Block
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
