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

// Canonical score tiers (must match statsService thresholds):
//   PQC-Active   >= 80  — hybrid PQC key exchange active
//   Transitioning 40–79 — good TLS hygiene, no PQC KEM yet
//   Legacy        < 40  — classical crypto, quantum-vulnerable
export function scoreColor(score) {
  if (score === null || score === undefined) return 'text-secondary'
  if (score >= 80) return 'text-signal'
  if (score >= 40) return 'text-warn'
  return 'text-critical'
}

export function scoreBadgeClass(score) {
  if (score === null || score === undefined) return 'badge-neutral'
  if (score >= 80) return 'badge-success'
  if (score >= 40) return 'badge-warn'
  return 'badge-critical'
}

export function scoreTier(score) {
  if (score === null || score === undefined) return null
  if (score >= 80) return 'PQC-Active'
  if (score >= 40) return 'Transitioning'
  return 'Legacy'
}

export const SCORE_TIERS = [
  { key: 'legacy',        label: 'Legacy',        range: '0–39',  color: '#ef4444', desc: 'Classical RSA/ECC. No post-quantum key exchange. Vulnerable to harvest-now-decrypt-later.' },
  { key: 'transitioning', label: 'Transitioning',  range: '40–79', color: '#f59e0b', desc: 'Good TLS hygiene but no PQC key exchange yet. Partial readiness — migration pending.' },
  { key: 'pqc_active',   label: 'PQC-Active',     range: '80–100', color: '#00ff88', desc: 'Post-quantum hybrid key exchange active (e.g. X25519MLKEM768). Resistant to quantum-enabled decryption.' },
]

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
  // Western Europe
  'Andorra', 'Austria', 'Belgium', 'Cyprus', 'Denmark', 'Finland', 'France',
  'Germany', 'Greece', 'Iceland', 'Ireland', 'Italy', 'Liechtenstein', 'Luxembourg',
  'Malta', 'Monaco', 'Netherlands', 'Norway', 'Portugal', 'San Marino',
  'Spain', 'Sweden', 'Switzerland', 'United Kingdom', 'Vatican City',
  // Central & Eastern Europe
  'Albania', 'Bosnia & Herzegovina', 'Bulgaria', 'Croatia', 'Czech Republic',
  'Estonia', 'Hungary', 'Kosovo', 'Latvia', 'Lithuania', 'Moldova', 'Montenegro',
  'North Macedonia', 'Poland', 'Romania', 'Serbia', 'Slovakia', 'Slovenia', 'Ukraine',
  // CIS / Wider Europe
  'Armenia', 'Azerbaijan', 'Belarus', 'Georgia', 'Kazakhstan', 'Russia', 'Turkey',
  // Middle East & North Africa (MEA)
  'Bahrain', 'Egypt', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon', 'Libya',
  'Morocco', 'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Tunisia',
  'United Arab Emirates', 'Yemen',
  // Sub-Saharan Africa
  'Kenya', 'Nigeria', 'South Africa',
  // Americas
  'Brazil', 'Canada', 'United States',
  // Asia-Pacific
  'Australia', 'China', 'India', 'Japan', 'New Zealand', 'Singapore', 'South Korea',
  'Other',
]

export const SECTORS = [
  'Banking & Finance', 'Government & Public Sector', 'Healthcare', 'Technology',
  'Telecommunications', 'Energy & Utilities', 'Retail & E-commerce', 'Media & Entertainment',
  'Education', 'Legal & Professional Services', 'Insurance', 'Transportation & Logistics',
  'Defence & Security', 'Critical Infrastructure', 'Cloud & Hosting', 'Other',
]

export const SCHEDULE_FREQUENCIES = ['hourly', 'daily', 'weekly', 'monthly']
