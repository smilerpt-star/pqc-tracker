export function formatDate(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return str }
}

export function formatDateShort(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return str }
}

export function scoreColor(score) {
  if (score === null || score === undefined) return 'text-secondary'
  if (score >= 80) return 'text-signal'
  if (score >= 50) return 'text-warn'
  return 'text-critical'
}

export function scoreBadgeClass(score) {
  if (score === null || score === undefined) return 'badge-neutral'
  if (score >= 80) return 'badge-success'
  if (score >= 50) return 'badge-warn'
  return 'badge-critical'
}

export function statusBadgeClass(status) {
  if (!status) return 'badge-neutral'
  const s = status.toLowerCase()
  if (s === 'pass' || s === 'passed' || s === 'success' || s === 'completed') return 'badge-success'
  if (s === 'fail' || s === 'failed' || s === 'error') return 'badge-critical'
  if (s === 'running' || s === 'pending') return 'badge-info'
  if (s === 'warn' || s === 'warning') return 'badge-warn'
  return 'badge-neutral'
}

export function truncate(str, n = 40) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function slugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'China', 'Denmark',
  'Finland', 'France', 'Germany', 'India', 'Ireland', 'Israel', 'Italy',
  'Japan', 'Luxembourg', 'Netherlands', 'New Zealand', 'Norway', 'Portugal',
  'Singapore', 'South Korea', 'Spain', 'Sweden', 'Switzerland',
  'United Kingdom', 'United States', 'Other',
]

export const SECTORS = [
  'Banking & Finance', 'Government & Public Sector', 'Healthcare', 'Technology',
  'Telecommunications', 'Energy & Utilities', 'Retail & E-commerce', 'Media & Entertainment',
  'Education', 'Legal & Professional Services', 'Insurance', 'Transportation & Logistics',
  'Defence & Security', 'Critical Infrastructure', 'Cloud & Hosting', 'Other',
]

export const SCHEDULE_FREQUENCIES = ['hourly', 'daily', 'weekly', 'monthly']
