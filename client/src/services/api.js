const API_BASE = import.meta.env.VITE_API_URL || '/api';


function getAuthHeaders() {
  const token = localStorage.getItem('fintrack_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('fintrack_token');
    localStorage.removeItem('fintrack_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  login: (email, password) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(handleResponse),

  register: (payload) =>
    fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  demoLogin: () =>
    fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(handleResponse),

  getMe: () =>
    fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    }).then(handleResponse),

  resetDemo: () =>
    fetch(`${API_BASE}/auth/reset-demo`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Accounts
  getAccounts: () =>
    fetch(`${API_BASE}/accounts`, { headers: getAuthHeaders() }).then(handleResponse),

  createAccount: (data) =>
    fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  updateAccount: (id, data) =>
    fetch(`${API_BASE}/accounts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteAccount: (id) =>
    fetch(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Categories
  getCategories: () =>
    fetch(`${API_BASE}/categories`, { headers: getAuthHeaders() }).then(handleResponse),

  createCategory: (data) =>
    fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteCategory: (id) =>
    fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Transactions
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/transactions?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },

  createTransaction: (data) =>
    fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  updateTransaction: (id, data) =>
    fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteTransaction: (id) =>
    fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  bulkDeleteTransactions: (transactionIds) =>
    fetch(`${API_BASE}/transactions/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transactionIds })
    }).then(handleResponse),

  bulkRecategorizeTransactions: (transactionIds, categoryId) =>
    fetch(`${API_BASE}/transactions/bulk-recategorize`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transactionIds, categoryId })
    }).then(handleResponse),

  importCsv: (formData) => {
    const token = localStorage.getItem('fintrack_token');
    return fetch(`${API_BASE}/transactions/import-csv`, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData
    }).then(handleResponse);
  },

  // Budgets
  getBudgets: (month) => {
    const query = month ? `?month=${month}` : '';
    return fetch(`${API_BASE}/budgets${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },

  saveBudget: (data) =>
    fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  bulkUpsertBudgets: (data) =>
    fetch(`${API_BASE}/budgets/bulk-upsert`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteBudget: (id) =>
    fetch(`${API_BASE}/budgets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Subscriptions
  getSubscriptions: () =>
    fetch(`${API_BASE}/subscriptions`, { headers: getAuthHeaders() }).then(handleResponse),

  createSubscription: (data) =>
    fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  updateSubscription: (id, data) =>
    fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteSubscription: (id) =>
    fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  detectRecurring: () =>
    fetch(`${API_BASE}/subscriptions/detect-recurring`, { headers: getAuthHeaders() }).then(handleResponse),

  // Goals
  getGoals: () =>
    fetch(`${API_BASE}/goals`, { headers: getAuthHeaders() }).then(handleResponse),

  createGoal: (data) =>
    fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  updateGoal: (id, data) =>
    fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  deleteGoal: (id) =>
    fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    }).then(handleResponse),

  // Reports
  getReportsSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetch(`${API_BASE}/reports/summary?${query}`, { headers: getAuthHeaders() }).then(handleResponse);
  },

  // AI Assistant
  askAI: (question, conversationHistory = []) =>
    fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, conversationHistory })
    }).then(handleResponse),

  getAIInsights: () =>
    fetch(`${API_BASE}/ai/insights`, { headers: getAuthHeaders() }).then(handleResponse),

  dismissInsight: (id) =>
    fetch(`${API_BASE}/ai/insights/${id}/dismiss`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(handleResponse),

  suggestAIBudget: () =>
    fetch(`${API_BASE}/ai/suggest-budget`, { headers: getAuthHeaders() }).then(handleResponse),

  // Settings
  updateProfile: (data) =>
    fetch(`${API_BASE}/settings/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse),

  changePassword: (data) =>
    fetch(`${API_BASE}/settings/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    }).then(handleResponse)
}