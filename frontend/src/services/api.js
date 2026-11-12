/**
 * API Client for International Payment Orchestration Backend
 */

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, '');

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('atlas_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : { 'x-demo-merchant': '1' }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (netErr) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${endpoint}:`, netErr.message);
    const friendlyError = new Error('Unable to connect to payment service. Please ensure the backend server is reachable.');
    friendlyError.status = 0;
    friendlyError.isNetworkError = true;
    friendlyError.originalError = netErr;
    throw friendlyError;
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch (e) {
      if (response.status === 401) {
        errorMsg = 'Authentication required. Please sign in to perform this action.';
      } else if (response.status === 403) {
        errorMsg = 'Access forbidden. You do not have permission to perform this action.';
      } else if (response.status === 404) {
        errorMsg = 'Service endpoint not found.';
      } else if (response.status >= 500) {
        errorMsg = 'Payment service is temporarily unavailable. Database operation failed.';
      }
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  return await response.json();
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
    register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
    demoLogin: () => request('/auth/demo-login', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: data }),
    resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: data })
  },

  // Checkout
  checkout: {
    initiate: (data) => request('/checkout/initiate', { method: 'POST', body: data }),
    process: (data) => request('/checkout/process', { method: 'POST', body: data }),
    verify3ds: (data) => request('/checkout/verify-3ds', { method: 'POST', body: data }),
    verifyUpi: (data) => request('/checkout/verify-upi', { method: 'POST', body: data }),
    getStatus: (id) => request(`/checkout/status/${id}`)
  },

  // Currency
  currency: {
    getRates: () => request('/currency/rates'),
    convert: (data) => request('/currency/convert', { method: 'POST', body: data }),
    getMarkup: () => request('/currency/markup'),
    updateMarkup: (markup_percentage) => request('/currency/markup', { method: 'PUT', body: { markup_percentage } })
  },

  // Compatibility
  compatibility: {
    check: (country, currency, amount) => request(`/compatibility/check?country=${country}&currency=${currency || ''}&amount=${amount || 100}`),
    getMatrix: () => request('/compatibility/matrix')
  },

  // Routing
  routing: {
    getRules: () => request('/routing/rules'),
    createRule: (rule) => request('/routing/rules', { method: 'POST', body: rule }),
    updateRule: (id, updates) => request(`/routing/rules/${id}`, { method: 'PUT', body: updates }),
    deleteRule: (id) => request(`/routing/rules/${id}`, { method: 'DELETE' }),
    simulate: (context) => request('/routing/simulate', { method: 'POST', body: context })
  },

  // Fraud
  fraud: {
    assess: (data) => request('/fraud/assess', { method: 'POST', body: data }),
    getHistory: () => request('/fraud/history'),
    review: (id, decision, notes) => request(`/fraud/review/${id}`, { method: 'POST', body: { decision, notes } })
  },

  // Recovery
  recovery: {
    getAnalytics: () => request('/recovery/analytics'),
    getLogs: () => request('/recovery/logs'),
    retry: (id) => request(`/recovery/retry/${id}`, { method: 'POST' })
  },

  // Cards (Domestic & International)
  cards: {
    list: () => request('/cards'),
    create: (cardData) => request('/cards', { method: 'POST', body: cardData }),
    delete: (id) => request(`/cards/${id}`, { method: 'DELETE' }),
    setDefault: (id) => request(`/cards/${id}/default`, { method: 'PUT' }),
    getById: (id) => request(`/cards/${id}`)
  },

  // Bank Accounts (Settlement & Payout Rails)
  bankAccounts: {
    list: () => request('/bank-accounts'),
    create: (accountData) => request('/bank-accounts', { method: 'POST', body: accountData }),
    delete: (id) => request(`/bank-accounts/${id}`, { method: 'DELETE' }),
    setDefault: (id) => request(`/bank-accounts/${id}/default`, { method: 'PUT' })
  },

  // Domestic Card & UPI International
  domesticCard: {
    checkEligibility: (payload) => request('/domestic-card/check-eligibility', { method: 'POST', body: payload }),
    getSupportedRails: () => request('/domestic-card/supported-rails'),
    calculateTcs: (payload) => request('/domestic-card/tcs-calculator', { method: 'POST', body: payload })
  },

  // Agentic Refund & Autonomous Recovery
  agenticRefund: {
    analyze: (txId, reason) => request(`/agentic-refund/analyze/${txId}`, { method: 'POST', body: { reason } }),
    evaluateTransaction: (txId, reason) => request(`/agentic-refund/analyze/${txId}`, { method: 'POST', body: { reason } }),
    execute: (txId, reason, overrideByHuman = false) => request(`/agentic-refund/execute/${txId}`, { method: 'POST', body: { reason, overrideByHuman } }),
    executeRefund: (payload) => {
      const txId = typeof payload === 'string' ? payload : (payload?.transaction_id || payload?.txId);
      const reason = payload?.refund_reason || payload?.reason || 'Automatic refund processed';
      const override = Boolean(payload?.overrideByHuman || payload?.is_human_override);
      return request(`/agentic-refund/execute/${txId}`, { method: 'POST', body: { reason, overrideByHuman: override } });
    },
    getHistory: () => request('/agentic-refund/history'),
    getAuditTrail: async () => {
      try {
        const res = await request('/agentic-refund/history');
        return { logs: res.audit_logs || [] };
      } catch (err) {
        console.warn('[API Client] Error fetching refund audit trail:', err.message);
        return { logs: [] };
      }
    },
    getPendingRefunds: async () => {
      try {
        const res = await request('/transactions?status=failed&limit=10');
        return { stuck_transactions: res.transactions || [] };
      } catch (err) {
        console.warn('[API Client] Error fetching pending refunds:', err.message);
        return { stuck_transactions: [] };
      }
    },
    getApprovalsQueue: () => request('/agentic-refund/approvals-queue'),
    getComplianceQueue: async () => {
      try {
        const res = await request('/agentic-refund/approvals-queue');
        return { queue: res.pending_approvals || [] };
      } catch (err) {
        console.warn('[API Client] Error fetching compliance queue:', err.message);
        return { queue: [] };
      }
    },
    approveManual: (refundId) => request(`/agentic-refund/approve-manual/${refundId}`, { method: 'POST' }),
    approveCompliance: (queueId, notes) => request(`/agentic-refund/approve-manual/${queueId}`, { method: 'POST', body: { notes } }),
    rejectCompliance: (queueId, reason) => request(`/agentic-refund/approve-manual/${queueId}`, { method: 'POST', body: { decision: 'REJECT', reason } })
  },

  // Student & Under-18 Management
  student: {
    getProfile: (studentId) => request(`/student/profile${studentId ? `?student_id=${studentId}` : ''}`),
    createProfile: (payload) => request('/student/profile', { method: 'POST', body: payload }),
    verifyIntent: (payload) => request('/student/verify-intent', { method: 'POST', body: payload }),
    createPaymentIntent: (data) => request('/student/create-intent', { method: 'POST', body: data }),
    listApprovals: (studentId) => request(`/student/approvals${studentId ? `?student_id=${studentId}` : ''}`),
    getRecentTransactions: (studentId) => request(`/student/transactions${studentId ? `?student_id=${studentId}` : ''}`),
    updateLimits: (studentIdOrPayload, maybeLimits) => {
      const body = typeof studentIdOrPayload === 'object' && studentIdOrPayload !== null
        ? studentIdOrPayload
        : { student_id: studentIdOrPayload, ...(maybeLimits || {}) };
      return request('/student/limits', { method: 'PUT', body });
    },
    getCategories: () => request('/student/categories')
  },

  // Parent / Guardian Approval Portal
  guardian: {
    getPending: (guardianId) => request(`/guardian/pending-approvals${guardianId ? `?guardian_id=${guardianId}` : ''}`),
    getPendingApprovals: (guardianId) => request(`/guardian/pending-approvals${guardianId ? `?guardian_id=${guardianId}` : ''}`),
    createProfile: (payload) => request('/guardian/profile', { method: 'POST', body: payload }),
    approve: (id, reason) => request(`/guardian/approve/${id}`, { method: 'POST', body: { reason } }),
    reject: (id, reason) => request(`/guardian/reject/${id}`, { method: 'POST', body: { reason } }),
    updateLimits: (studentIdOrPayload, maybeLimits) => {
      const body = typeof studentIdOrPayload === 'object' && studentIdOrPayload !== null
        ? studentIdOrPayload
        : { student_id: studentIdOrPayload, ...(maybeLimits || {}) };
      return request('/guardian/limits', { method: 'PUT', body });
    },
    getOverview: (guardianId) => request(`/guardian/overview${guardianId ? `?guardian_id=${guardianId}` : ''}`)
  },

  // Transactions
  transactions: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/transactions${q ? `?${q}` : ''}`);
    },
    getById: (id) => request(`/transactions/${id}`),
    getCsvExportUrl: () => `${API_BASE_URL}/transactions/export/csv`,
    getJsonExportUrl: () => `${API_BASE_URL}/transactions/export/json`
  },

  // Analytics
  analytics: {
    getMetrics: () => request('/analytics/metrics'),
    getVolumeChart: () => request('/analytics/volume-chart'),
    getCorridors: () => request('/analytics/corridors'),
    getProviderHealth: () => request('/analytics/provider-health')
  },

  // Providers
  providers: {
    list: () => request('/providers'),
    benchmark: () => request('/providers/benchmark'),
    toggle: (id) => request(`/providers/toggle/${id}`, { method: 'POST' })
  },

  // Health
  health: () => request('/health')
};

