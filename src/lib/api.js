const BASE = import.meta.env.VITE_API_BASE_URL || 'https://pqc-readiness-tracker-production.up.railway.app'

export function getToken() { return localStorage.getItem('admin_token') }
export function setToken(t) { localStorage.setItem('admin_token', t) }
export function clearToken() { localStorage.removeItem('admin_token') }

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const token = getToken()
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const body = await res.json(); msg = body.message || body.error || msg } catch {}
    throw new Error(msg)
  }
  const text = await res.text()
  if (!text) return null
  return JSON.parse(text)
}

export const api = {
  // Health
  health: () => request('/health'),

  // Domains
  getDomains: () => request('/domains'),
  createDomain: (data) => request('/domains', { method: 'POST', body: JSON.stringify(data) }),
  updateDomain: (id, data) => request(`/domains/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Test Types
  getTestTypes: () => request('/test-types'),
  createTestType: (data) => request('/test-types', { method: 'POST', body: JSON.stringify(data) }),
  updateTestType: (id, data) => request(`/test-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Domain Tests
  getDomainTests: () => request('/domain-tests'),
  createDomainTest: (data) => request('/domain-tests', { method: 'POST', body: JSON.stringify(data) }),
  updateDomainTest: (id, data) => request(`/domain-tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  runDomainTest: (id) => request(`/domain-tests/${id}/run`, { method: 'POST' }),

  // Runs
  getRuns: () => request('/runs'),
  getRun: (id) => request(`/runs/${id}`),

  // Stats (public)
  getStats: () => request('/stats'),

  // Domain-specific runs
  getDomainRuns: (domainId, limit = 200) => request(`/runs?domain_id=${domainId}&limit=${limit}`),

  // Public: test any domain anonymously — POST /public/test { domain }
  publicTestDomain: (domain) => request('/public/test', {
    method: 'POST',
    body: JSON.stringify({ domain }),
  }),

  // Auth
  verifyToken: (token) => request('/auth/verify', { headers: { 'Authorization': `Bearer ${token}` } }),
}

export function unwrap(response) {
  if (!response) return null
  if (Array.isArray(response)) return response
  if (response.data !== undefined) return response.data
  return response
}
