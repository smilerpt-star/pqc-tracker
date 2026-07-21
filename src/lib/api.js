const BASE = import.meta.env.VITE_API_BASE_URL || 'https://pqc-readiness-tracker-production.up.railway.app'

export function getToken() { return localStorage.getItem('admin_token') }
export function setToken(t) { localStorage.setItem('admin_token', t) }
export function clearToken() { localStorage.removeItem('admin_token') }

// Cold-start tolerance: Railway may return 502/503/504 (or the socket may hang)
// for a few seconds while the backend spins up. Retry those transparently so the
// UI shows a slightly longer loading state instead of an error / empty tables.
const MAX_RETRIES = 4
const PER_ATTEMPT_TIMEOUT_MS = 15000
const COLD_START_STATUSES = new Set([502, 503, 504])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function request(path, options = {}) {
  const url = `${BASE}${path}`
  const token = getToken()

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...options,
      })

      if (!res.ok) {
        // Retry transient cold-start statuses; surface everything else immediately.
        if (COLD_START_STATUSES.has(res.status) && attempt < MAX_RETRIES) {
          await sleep(Math.min(1000 * 2 ** attempt, 8000))
          continue
        }
        let msg = `HTTP ${res.status}`
        try { const body = await res.json(); msg = body.message || body.error || msg } catch {}
        throw new Error(msg)
      }

      const text = await res.text()
      if (!text) return null
      return JSON.parse(text)
    } catch (e) {
      // Network error or aborted timeout — likely the backend is still waking up.
      const isTransient = e.name === 'AbortError' || e.name === 'TypeError'
      if (isTransient && attempt < MAX_RETRIES) {
        await sleep(Math.min(1000 * 2 ** attempt, 8000))
        continue
      }
      throw e
    } finally {
      clearTimeout(timer)
    }
  }
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
  getRuns: (limit) => request(limit ? `/runs?limit=${limit}` : '/runs'),
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

  // Indexes
  getIndexes: () => request('/indexes'),
  getIndex: (id) => request(`/indexes/${id}`),
  createIndex: (data) => request('/indexes', { method: 'POST', body: JSON.stringify(data) }),
  updateIndex: (id, data) => request(`/indexes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getIndexDomains: (id) => request(`/indexes/${id}/domains`),
  importToIndex: (id, rows) => request(`/indexes/${id}/import`, { method: 'POST', body: JSON.stringify({ rows }) }),

  // Config
  getConfig: () => request('/config'),
  updateConfig: (data) => request('/config', { method: 'PUT', body: JSON.stringify(data) }),

  // Scheduler
  runNow: () => request('/scheduler/run-now', { method: 'POST' }),
  schedulerStatus: () => request('/scheduler/status'),

  // Auth
  verifyToken: (token) => request('/auth/verify', { headers: { 'Authorization': `Bearer ${token}` } }),
}

export function unwrap(response) {
  if (!response) return null
  if (Array.isArray(response)) return response
  if (response.data !== undefined) return response.data
  return response
}
