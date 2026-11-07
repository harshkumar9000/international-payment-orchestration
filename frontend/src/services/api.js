/**
 * API Client for International Payment Orchestration Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.error || errData.message || errorMsg;
    } catch (e) {
      // ignore
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
    getMe: () => request('/auth/me')
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

