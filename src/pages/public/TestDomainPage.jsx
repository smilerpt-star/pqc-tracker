import React, { useState, useEffect, useCallback } from 'react'
import { Search, ArrowRight, CheckCircle, AlertTriangle, Info, XCircle, Shield, Lock, Globe, TrendingUp } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert, ScoreBadge, StatusBadge } from '../../components/shared/UI.jsx'
import { api, unwrap } from '../../lib/api.js'
import { SECTORS } from '../../lib/utils.js'

const FINDING_STYLES = {
  good:     { icon: CheckCircle,   color: 'text-signal' },
  info:     { icon: Info,          color: 'text-accent/70' },
  warn:     { icon: AlertTriangle, color: 'text-warn' },
  critical: { icon: XCircle,       color: 'text-critical' },
}

function FindingRow({ finding }) {
  const { icon: Icon, color } = FINDING_STYLES[finding.level] || FINDING_STYLES.info
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={13} className={`flex-shrink-0 mt-0.5 ${color}`} />
      <span className={`text-xs leading-relaxed ${color}`}>{finding.message}</span>
    </div>
  )
}

function MetaRow({ label, value, mono }) {
  if (value === null || value === undefined) return null
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-void/50 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-xs text-primary ${mono ? 'font-mono' : ''}`}>
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
      </span>
    </div>
  )
}

function ScoreBar({ label, score, myScore, color }) {
  const barColor = score >= 80 ? '#00ff88' : score >= 40 ? '#f59e0b' : '#ef4444'
  const diff = myScore !== null && score !== null ? myScore - score : null
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted w-28 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-void rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: barColor }} />
      </div>
      <span className="text-xs font-mono text-primary w-6 text-right">{score ?? '—'}</span>
      {diff !== null && (
        <span className={`text-[10px] w-10 text-right ${diff > 0 ? 'text-signal' : diff < 0 ? 'text-critical' : 'text-muted'}`}>
          {diff > 0 ? `+${diff}` : diff < 0 ? diff : '='}
        </span>
      )}
    </div>
  )
}

function BenchmarkPanel({ myScore, sector, country, stats }) {
  if (!stats || myScore === null) return null

  const globalAvg = stats.avg_score
  const sectorRow = sector ? (stats.by_sector || []).find(r => r.sector === sector) : null
  const countryRow = country ? (stats.by_country || []).find(r => r.country === country) : null

  const rows = [
    { label: 'Global avg', score: globalAvg },
    sectorRow  && { label: sectorRow.sector,  score: sectorRow.avg_score  },
    countryRow && { label: countryRow.country, score: countryRow.avg_score },
  ].filter(Boolean)

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 border-b border-void flex items-center gap-2">
        <TrendingUp size={12} className="text-muted" />
        <span className="section-title">Benchmark Comparison</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <ScoreBar label="Your score" score={myScore} myScore={null} color="accent" />
        <div className="border-t border-void/40 pt-3 space-y-2.5">
          {rows.map(r => (
            <ScoreBar key={r.label} label={r.label} score={r.score} myScore={myScore} />
          ))}
        </div>
        <p className="text-[10px] text-muted pt-1">
          Diff shown relative to your score. Based on {stats.total_scored} monitored organisations.
        </p>
      </div>
    </div>
  )
}

export default function TestDomainPage() {
  const [searchParams] = useSearchParams()
  const [domain, setDomain] = useState(() => searchParams.get('domain') || '')
  const [sector, setSector] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  // Pre-load stats for benchmark
  useEffect(() => {
    api.getStats().then(r => setStats(unwrap(r))).catch(() => {})
  }, [])

  const runScan = useCallback(async (target) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const raw = await api.publicTestDomain(target)
      setResult(unwrap(raw))
    } catch (err) {
      setError(err.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const urlDomain = searchParams.get('domain')
    if (urlDomain) runScan(urlDomain.trim())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTest(e) {
    e.preventDefault()
    if (!domain.trim()) return
    runScan(domain.trim())
  }

  const inputValid = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain.trim())

  // Countries from stats
  const countries = stats ? [...new Set((stats.by_country || []).map(r => r.country).filter(Boolean))].sort() : []

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-10">
        <p className="section-title mb-3">Domain Analysis</p>
        <h1 className="page-title mb-3">Test a Domain</h1>
        <p className="text-sm text-secondary max-w-lg">
          Run a live TLS scan and see how your domain compares against the global PQC readiness benchmark.
          Results are one-off — no data is stored.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleTest} className="mb-8">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="example.com"
              className="input-field pl-9 h-10"
              style={{ fontSize: '0.875rem' }}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValid || loading}
            className="btn-primary flex items-center gap-2 h-10 px-6 whitespace-nowrap"
          >
            {loading ? (
              <><div className="w-3 h-3 border border-void/50 border-t-void rounded-full animate-spin" /> Scanning…</>
            ) : (
              <>Analyse <ArrowRight size={12} /></>
            )}
          </button>
        </div>

        {/* Optional context for benchmark */}
        <div className="flex gap-3">
          <select
            value={sector}
            onChange={e => setSector(e.target.value)}
            className="select-field flex-1"
          >
            <option value="">My sector (optional — for benchmark)</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="select-field flex-1"
          >
            <option value="">My country (optional — for benchmark)</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted mt-2">
          Live scan — no data stored. Sector and country are used only to show you how your result compares.
        </p>
      </form>

      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Score header */}
          <div className="card p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs tracking-widest uppercase text-muted mb-1">Live Scan Result</div>
                <div className="text-xl font-light text-primary mb-1">{result.domain}</div>
                <div className="text-xs text-muted">Scanned {new Date(result.scanned_at).toLocaleString()}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <ScoreBadge score={result.score} />
                <StatusBadge status={result.status} />
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted tracking-wider uppercase">PQC Readiness Score</span>
                <span className="text-xs text-muted">{result.score} / 100</span>
              </div>
              <div className="h-1.5 bg-void rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${result.score}%`,
                    background: result.score >= 75 ? '#22c55e' : result.score >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted mt-1 tracking-wider uppercase">
                <span>Legacy</span><span>Partial</span><span>PQC-Ready</span>
              </div>
            </div>
          </div>

          {/* Benchmark */}
          <BenchmarkPanel myScore={result.score} sector={sector} country={country} stats={stats} />

          {/* Transport + Certificate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.transport && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-void flex items-center gap-2">
                  <Lock size={12} className="text-muted" />
                  <span className="section-title">Transport</span>
                </div>
                <div className="px-5 py-3">
                  <MetaRow label="TLS Version"     value={result.transport.tls_version}       mono />
                  <MetaRow label="Key Exchange"     value={result.transport.key_exchange_group} mono />
                  <MetaRow label="PQC Key Exchange" value={result.transport.pqc_kem_active} />
                  <MetaRow label="Forward Secrecy"  value={result.transport.forward_secrecy} />
                </div>
              </div>
            )}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-void flex items-center gap-2">
                <Shield size={12} className="text-muted" />
                <span className="section-title">Certificate</span>
              </div>
              <div className="px-5 py-3">
                {result.certificate ? (
                  <>
                    <MetaRow label="Algorithm" value={result.certificate.algorithm} />
                    {result.certificate.curve && <MetaRow label="Curve" value={result.certificate.curve} mono />}
                    {result.certificate.bits  && <MetaRow label="Key Size" value={`${result.certificate.bits} bits`} />}
                    <MetaRow label="Subject"  value={result.certificate.subject_cn} mono />
                    <MetaRow label="Issuer"   value={result.certificate.issuer_o} />
                    {result.certificate.days_until_expiry !== null && (
                      <MetaRow label="Expiry" value={result.certificate.days_until_expiry <= 0 ? 'Expired' : `${result.certificate.days_until_expiry} days`} />
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted">No certificate data retrieved</p>
                )}
              </div>
            </div>
          </div>

          {result.dns && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-void flex items-center gap-2">
                <Globe size={12} className="text-muted" />
                <span className="section-title">DNS</span>
              </div>
              <div className="px-5 py-3">
                <MetaRow label="DANE / TLSA" value={result.dns.dane_tlsa} />
              </div>
            </div>
          )}

          {result.pqc_outlook?.findings?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-void">
                <span className="section-title">Findings</span>
              </div>
              <div className="px-5 py-2 divide-y divide-void/30">
                {result.pqc_outlook.findings.map((f, i) => <FindingRow key={i} finding={f} />)}
              </div>
            </div>
          )}

          {result.pqc_outlook?.next_actions?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-void">
                <span className="section-title">Recommended Actions</span>
              </div>
              <div className="px-5 py-3 space-y-2">
                {result.pqc_outlook.next_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-accent/50 text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <span className="text-xs text-secondary leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA: see where they stand in the Observatory */}
          <div className="card p-5 flex items-center justify-between gap-4">
            <p className="text-xs text-secondary">
              See how <strong className="text-primary">{result.domain}</strong> compares across the full monitored universe.
            </p>
            <Link to="/observatory" className="btn-ghost text-xs flex-shrink-0 flex items-center gap-2">
              Observatory <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      )}

      {/* Explainer before first scan */}
      {!result && !error && (
        <div className="border-t border-void pt-10 mt-10">
          <p className="section-title mb-6">What gets checked</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['TLS Version & Key Exchange', 'TLS 1.3 support, deprecated protocols, and PQC hybrid key exchange detection (X25519MLKEM768).'],
              ['Certificate Analysis', 'Public key algorithm (RSA vs ECDSA), key size, quantum vulnerability, expiry, and issuer.'],
              ['DANE / TLSA', 'DNS-based certificate pinning — a strong indicator of hardened TLS deployment.'],
              ['PQC Readiness Score', '0–100 composite score with benchmark against your sector and country peers.'],
            ].map(([title, desc], i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1 bg-accent/20 flex-shrink-0 mt-1" style={{ alignSelf: 'stretch', maxHeight: '60px' }} />
                <div>
                  <div className="text-xs font-medium text-primary mb-1">{title}</div>
                  <div className="text-xs text-secondary leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
