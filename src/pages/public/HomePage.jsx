import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Shield, Search, Database, Globe2, Lock, Cpu, AlertTriangle } from 'lucide-react'
import { api, unwrap } from '../../lib/api.js'

const STATS_REFRESH = 30000

export default function HomePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [testInput, setTestInput] = useState('')

  function handleHeroTest(e) {
    e.preventDefault()
    const d = testInput.trim()
    if (d) navigate(`/test?domain=${encodeURIComponent(d)}`)
  }

  useEffect(() => {
    async function load() {
      try {
        const [domains, runs] = await Promise.all([
          api.getDomains().then(unwrap),
          api.getRuns().then(unwrap),
        ])
        setStats({
          domains: Array.isArray(domains) ? domains.filter(d => d.active !== false).length : '—',
          runs: Array.isArray(runs) ? runs.length : '—',
        })
      } catch {}
    }
    load()
    const t = setInterval(load, STATS_REFRESH)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-void">
        <div
          className="absolute inset-0 bg-grid opacity-100"
          style={{ backgroundSize: '32px 32px' }}
        />
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(0,212,255,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-8">
              <div className="dot-live" />
              <span className="text-xs tracking-[0.2em] uppercase text-muted">
                Live Monitoring Active
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-primary mb-6 leading-tight">
              Post-Quantum<br />
              <span className="text-accent">Cryptographic</span><br />
              Readiness Tracking
            </h1>

            <p className="text-base text-secondary leading-relaxed mb-8 max-w-xl">
              Continuous external monitoring of TLS posture, certificate hygiene,
              and post-quantum cryptography readiness across internet-facing domains.
            </p>

            {/* Inline domain test */}
            <form onSubmit={handleHeroTest} className="mb-4 max-w-xl">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={testInput}
                    onChange={e => setTestInput(e.target.value)}
                    placeholder="enter a domain — e.g. cloudflare.com"
                    className="input-field pl-9 h-10 text-sm"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!testInput.trim()}
                  className="btn-primary h-10 px-5 flex items-center gap-2 whitespace-nowrap text-xs"
                >
                  Test Now <ArrowRight size={12} />
                </button>
              </div>
              <p className="text-xs text-muted mt-2">Live TLS scan — no account required.</p>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link to="/explore" className="btn-secondary flex items-center gap-2 text-xs">
                <Globe2 size={13} />
                Browse Explorer
              </Link>
              <Link to="/submit" className="btn-ghost flex items-center gap-2 text-xs">
                <Database size={13} />
                Submit a Domain
              </Link>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-16 flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-light text-primary tracking-tight">{stats.domains}</div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted mt-1">Domains Monitored</div>
              </div>
              <div className="w-px bg-void self-stretch hidden sm:block" />
              <div>
                <div className="text-3xl font-light text-primary tracking-tight">{stats.runs}</div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted mt-1">Tests Executed</div>
              </div>
              <div className="w-px bg-void self-stretch hidden sm:block" />
              <div>
                <div className="text-3xl font-light text-accent tracking-tight">PQC</div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-muted mt-1">NIST Ready Testing</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What we track */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="section-title mb-3">What We Track</p>
          <h2 className="text-2xl font-light text-primary">External cryptographic posture.<br />Objectively measured.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Shield size={18} />,
              title: 'PQC Readiness',
              desc: 'Checks for post-quantum algorithm support across TLS endpoints. Tracks migration to NIST-standardised algorithms like ML-KEM, ML-DSA, and hybrid schemes.',
              color: 'text-accent',
            },
            {
              icon: <Lock size={18} />,
              title: 'TLS Posture',
              desc: 'Cipher suite hygiene, protocol version support, HSTS headers, and resistance to known TLS downgrade and interception vectors.',
              color: 'text-signal',
            },
            {
              icon: <AlertTriangle size={18} />,
              title: 'Certificate Exposure',
              desc: 'Certificate validity, chain trust, expiry timelines, key sizes, and signature algorithm suitability for the post-quantum era.',
              color: 'text-warn',
            },
            {
              icon: <Globe2 size={18} />,
              title: 'DNS Security',
              desc: 'DNSSEC deployment, SPF/DKIM/DMARC configuration, and DNS-based attack surface relevant to cryptographic posture.',
              color: 'text-accent',
            },
            {
              icon: <Cpu size={18} />,
              title: 'Algorithm Intelligence',
              desc: 'Structured analysis of cryptographic algorithm choices across the estate — identifying quantum-vulnerable RSA and ECC deployments.',
              color: 'text-signal',
            },
            {
              icon: <Database size={18} />,
              title: 'Cross-Sector Benchmarking',
              desc: 'Compare readiness posture across industries, countries, and domain portfolios. Understand where your sector sits relative to peers.',
              color: 'text-warn',
            },
          ].map((item, i) => (
            <div key={i} className="card-hover p-5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`${item.color} mb-4 opacity-80`}>{item.icon}</div>
              <h3 className="text-sm font-medium text-primary mb-2">{item.title}</h3>
              <p className="text-xs text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="border-y border-void bg-panel">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-xl font-light text-primary mb-2">
              Is your domain quantum-ready?
            </h2>
            <p className="text-sm text-secondary">
              Run an instant check against our testing framework. No account required.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link to="/test" className="btn-primary flex items-center gap-2 text-xs">
              Test Now <ArrowRight size={12} />
            </Link>
            <Link to="/submit" className="btn-secondary text-xs">
              Add to Monitoring
            </Link>
          </div>
        </div>
      </section>

      {/* Public context */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <p className="section-title mb-4">Why It Matters</p>
            <h2 className="text-xl font-light text-primary mb-4">The quantum transition is not theoretical.</h2>
            <p className="text-sm text-secondary leading-relaxed mb-4">
              NIST finalised its first post-quantum cryptography standards in 2024. Governments and regulators
              are issuing migration timelines. The harvest-now-decrypt-later threat is active.
            </p>
            <p className="text-sm text-secondary leading-relaxed mb-4">
              Yet the vast majority of internet-facing infrastructure remains deployed on RSA and ECC —
              cryptographic algorithms that will be broken by sufficiently powerful quantum computers.
            </p>
            <p className="text-sm text-secondary leading-relaxed">
              PQC Readiness Tracker exists to make this exposure visible, measurable, and trackable
              across the domains and organisations that matter.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="card p-5">
              <div className="text-2xl font-light text-critical mb-1">2030</div>
              <div className="text-xs text-muted tracking-wide">Est. Year-1 cryptographically-relevant quantum computers</div>
            </div>
            <div className="card p-5">
              <div className="text-2xl font-light text-warn mb-1">CNSA 2.0</div>
              <div className="text-xs text-muted tracking-wide">US NSA mandate for PQC migration across national security systems</div>
            </div>
            <div className="card p-5">
              <div className="text-2xl font-light text-accent mb-1">FIPS 203/4/5</div>
              <div className="text-xs text-muted tracking-wide">NIST post-quantum standards finalised August 2024</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
