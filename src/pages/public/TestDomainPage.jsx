import React, { useState, useEffect } from 'react'
import { Search, ArrowRight, CheckCircle, AlertTriangle, Info, XCircle, Shield, Lock, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Alert, ScoreBadge, StatusBadge } from '../../components/shared/UI.jsx'
import { api, unwrap } from '../../lib/api.js'

const FINDING_STYLES = {
  good:     { icon: CheckCircle,    color: 'text-signal' },
  info:     { icon: Info,           color: 'text-accent/70' },
  warn:     { icon: AlertTriangle,  color: 'text-warn' },
  critical: { icon: XCircle,        color: 'text-critical' },
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

export default function TestDomainPage() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [monitoredDomains, setMonitoredDomains] = useState([])

  useEffect(() => {
    api.getDomains()
      .then(r => setMonitoredDomains((unwrap(r) || []).filter(d => d.active !== false)))
      .catch(() => {})
  }, [])

  async function handleTest(e) {
    e.preventDefault()
    if (!domain.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const raw = await api.publicTestDomain(domain.trim())
      setResult(unwrap(raw))
    } catch (err) {
      setError(err.message || 'Scan failed')
    } finally {
      setLoading(false)
    }
  }

  const inputValid = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(domain.trim())

  const monitoredEntry = result
    ? monitoredDomains.find(d => d.domain?.toLowerCase() === result.domain?.toLowerCase())
    : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="section-title mb-3">Domain Analysis</p>
        <h1 className="page-title mb-3">Test a Domain</h1>
        <p className="text-sm text-secondary max-w-lg">
          Enter any internet-facing domain to run a live TLS scan and assess its post-quantum cryptographic readiness.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleTest} className="mb-10">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="example.com"
              className="input-field pl-9 h-10"
              style={{ fontSize: '0.875rem', letterSpacing: '0.02em' }}
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
              <>
                <div className="w-3 h-3 border border-void/50 border-t-void rounded-full animate-spin" />
                Scanning…
              </>
            ) : (
              <>Analyse <ArrowRight size={12} /></>
            )}
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          Live scan — connects to port 443 and checks TLS configuration in real time.
        </p>
      </form>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-slide-up">
          {/* Score header */}
          <div className="card p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs tracking-widest uppercase text-muted mb-1">Live Scan Result</div>
                <div className="text-xl font-light text-primary mb-1">{result.domain}</div>
                <div className="text-xs text-muted">
                  Scanned {new Date(result.scanned_at).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <ScoreBadge score={result.score} />
                <StatusBadge status={result.status} />
              </div>
            </div>

            {/* Exposure bar */}
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
                <span>Legacy</span>
                <span>Partial</span>
                <span>PQC-Ready</span>
              </div>
            </div>
          </div>

          {/* Transport + Certificate side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transport */}
            {result.transport && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-void flex items-center gap-2">
                  <Lock size={12} className="text-muted" />
                  <span className="section-title">Transport</span>
                </div>
                <div className="px-5 py-3">
                  <MetaRow label="TLS Version" value={result.transport.tls_version} mono />
                  <MetaRow label="Key Exchange" value={result.transport.key_exchange_group} mono />
                  <MetaRow label="PQC Key Exchange" value={result.transport.pqc_kem_active} />
                  <MetaRow label="Forward Secrecy" value={result.transport.forward_secrecy} />
                </div>
              </div>
            )}

            {/* Certificate */}
            {result.certificate ? (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-void flex items-center gap-2">
                  <Shield size={12} className="text-muted" />
                  <span className="section-title">Certificate</span>
                </div>
                <div className="px-5 py-3">
                  <MetaRow label="Algorithm" value={result.certificate.algorithm} />
                  {result.certificate.curve && <MetaRow label="Curve" value={result.certificate.curve} mono />}
                  {result.certificate.bits && <MetaRow label="Key Size" value={`${result.certificate.bits} bits`} />}
                  <MetaRow label="Subject" value={result.certificate.subject_cn} mono />
                  <MetaRow label="Issuer" value={result.certificate.issuer_o} />
                  {result.certificate.days_until_expiry !== null && (
                    <MetaRow
                      label="Expiry"
                      value={
                        result.certificate.days_until_expiry <= 0
                          ? 'Expired'
                          : `${result.certificate.days_until_expiry} days`
                      }
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-void flex items-center gap-2">
                  <Shield size={12} className="text-muted" />
                  <span className="section-title">Certificate</span>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-muted">No certificate data retrieved</p>
                </div>
              </div>
            )}
          </div>

          {/* DNS */}
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

          {/* Findings */}
          {result.pqc_outlook?.findings?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-void">
                <span className="section-title">Findings</span>
              </div>
              <div className="px-5 py-2 divide-y divide-void/30">
                {result.pqc_outlook.findings.map((f, i) => (
                  <FindingRow key={i} finding={f} />
                ))}
              </div>
            </div>
          )}

          {/* Next Actions */}
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

          {/* Submit for monitoring CTA */}
          <div className="card p-5 border-accent/10">
            {monitoredEntry ? (
              <>
                <p className="text-xs text-secondary mb-3">
                  <strong className="text-primary">{result.domain}</strong> is already being continuously monitored.
                </p>
                <Link
                  to={`/domain/${monitoredEntry.id}`}
                  className="btn-primary text-xs inline-flex items-center gap-2"
                >
                  View Monitoring Details <ArrowRight size={11} />
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs text-secondary mb-3">
                  Want to track <strong className="text-primary">{result.domain}</strong> continuously?
                </p>
                <Link
                  to={`/submit?domain=${encodeURIComponent(result.domain)}`}
                  className="btn-primary text-xs inline-flex items-center gap-2"
                >
                  Submit for Monitoring <ArrowRight size={11} />
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Explainer shown before first scan */}
      {!result && !error && (
        <div className="border-t border-void pt-10 mt-10">
          <p className="section-title mb-6">What gets checked</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['TLS Version & Ciphers', 'TLS 1.3 support, deprecated protocol versions, cipher suite forward secrecy, and PQC hybrid key exchange detection.'],
              ['Certificate Analysis', 'Public key algorithm (RSA vs ECDSA), key size, quantum vulnerability, expiry, and issuer chain.'],
              ['DANE / TLSA', 'DNS-based certificate pinning via TLSA records — a strong indicator of hardened deployment.'],
              ['PQC Readiness Score', 'A 0–100 composite score with status: Legacy · Partial · Readying. Based on current NIST PQC transition guidance.'],
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
