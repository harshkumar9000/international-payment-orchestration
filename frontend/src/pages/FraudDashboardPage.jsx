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
  Sparkles
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Clean Trustworthy Buyer',
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
    name: 'Severe Geo Mismatch (IP != Billing)',
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
    name: 'Disposable Burner Email Bot',
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
    name: 'Sanctioned Country Corridor (OFAC)',
    payload: {
      amount: 500.00,
      currency: 'USD',
      customer_country: 'KP',
      customer_email: 'client@pyongyang-trade.kp',
      ip_country: 'KP',
      is_vpn: false,
      cvc_provided: true
    }
  },
  {
    name: 'Extreme Ticket Outlier (> 10x Avg)',
    payload: {
      amount: 4800.00,
      currency: 'USD',
      customer_country: 'US',
      customer_email: 'whale@crypto-speculator.io',
      ip_country: 'US',
      is_vpn: false,
      cvc_provided: true
    }
  }
];

export default function FraudDashboardPage() {
  const [testPayload, setTestPayload] = useState(PRESETS[0].payload);
  const [selectedPresetName, setSelectedPresetName] = useState(PRESETS[0].name);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await api.fraud.getHistory();
      setHistory(res.assessments || []);
    } catch (err) {
      console.error('[Load Fraud History Error]:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelectPreset = (p) => {
    setSelectedPresetName(p.name);
    setTestPayload({ ...p.payload });
    setEvaluationResult(null);
  };

  const handleRunAssessment = async (e) => {
    e.preventDefault();
    setEvaluating(true);
    try {
      const res = await api.fraud.assess(testPayload);
      setEvaluationResult(res);
      loadHistory();
    } catch (err) {
      alert(err.message || 'Fraud assessment failed');
    } finally {
      setEvaluating(false);
    }
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
    <div className="space-y-8 py-6 max-w-6xl mx-auto">
      
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Python FastAPI Intelligence Microservice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          AI Real-Time Fraud & Risk Defense
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Continuous risk scoring evaluating velocity bursts, geolocation mismatches, OFAC blacklists, and anomaly patterns.
        </p>
      </div>

      {/* Top Interactive Fraud Simulator */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Interactive Scenario Simulator</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select an attack pattern or configure custom parameters to run real-time risk assessment.</p>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 font-medium">
            <Cpu className="w-3.5 h-3.5" />
            <span>FastAPI ML Rules Engine</span>
          </div>
        </div>

        {/* Presets Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (USD)</label>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">IP Country</label>
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
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Simulate Anonymous VPN / Proxy Node</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={testPayload.cvc_provided}
                  onChange={(e) => setTestPayload({ ...testPayload, cvc_provided: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>CVC Provided</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{evaluating ? 'Analyzing Risk Vector...' : 'Execute AI Risk Assessment'}</span>
            </button>
          </form>

          {/* Assessment Result Panel */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            {evaluationResult ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Risk Assessment Score</span>
                  <span className="text-[10px] font-mono font-medium text-slate-400">Scale 0 - 100</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className={`text-4xl font-extrabold font-mono ${
                    evaluationResult.risk_score >= 80 ? 'text-rose-600 dark:text-rose-400' :
                    evaluationResult.risk_score >= 35 ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {evaluationResult.risk_score}/100
                  </div>

                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      evaluationResult.decision === 'DECLINE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      evaluationResult.decision === '3DS_CHALLENGE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      evaluationResult.decision === 'MANUAL_REVIEW' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {evaluationResult.decision}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1">Tier: {evaluationResult.risk_level}</div>
                  </div>
                </div>

                {/* Triggered Rules */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Triggered Risk Heuristics ({evaluationResult.triggered_rules?.length || 0}):
                  </div>
                  {evaluationResult.triggered_rules?.length > 0 ? (
                    evaluationResult.triggered_rules.map((rule, idx) => (
                      <div key={idx} className="p-2 rounded bg-white dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <div className="font-mono font-bold text-rose-500 flex justify-between">
                          <span>{rule.code}</span>
                          <span>+{rule.score} pts</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{rule.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-emerald-600 flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Zero high-risk signals detected.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs">Click 'Execute AI Risk Assessment' to run real-time vector analysis across velocity, geo-anomalies, and sanctions.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fraud Audit Log */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4">Past Risk Assessment Audit Trail</h3>
        
        {loadingHistory ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading audit history...</div>
        ) : history.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">No past risk assessments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3">Assessment ID</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Decision</th>
                  <th className="pb-3">Flags Triggered</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {history.slice(0, 10).map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400">{h.id}</td>
                    <td className="py-3 font-mono font-bold">
                      <span className={h.risk_score >= 80 ? 'text-rose-500' : h.risk_score >= 35 ? 'text-amber-500' : 'text-emerald-500'}>
                        {h.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        h.decision === 'DECLINE' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        h.decision === '3DS_CHALLENGE' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {h.decision}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-mono text-[11px]">
                      {h.triggered_rules && h.triggered_rules.length > 0
                        ? h.triggered_rules.map(r => r.code || r).join(', ')
                        : 'Clean'}
                    </td>
                    <td className="py-3 text-slate-400 text-[11px] font-mono">
                      {new Date(h.assessed_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

