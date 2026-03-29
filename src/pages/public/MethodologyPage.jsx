import React from 'react'
import { Shield, Lock, Globe, CheckCircle, AlertTriangle, Info } from 'lucide-react'

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="text-lg font-light text-primary mb-4 pb-2 border-b border-void">{title}</h2>
      {children}
    </section>
  )
}

function DataRow({ label, value, sub }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-void/40 last:border-0 gap-4">
      <span className="text-xs text-muted w-40 flex-shrink-0">{label}</span>
      <div className="flex-1 text-right">
        <div className="text-xs text-primary">{value}</div>
        {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="section-title mb-3">Documentation</p>
        <h1 className="page-title mb-4">Testing Methodology</h1>
        <p className="text-sm text-secondary leading-relaxed max-w-2xl">
          This page documents how PQC Readiness Tracker scans domains, what data is collected,
          how the readiness score is calculated, and what the results mean.
        </p>
      </div>

      <Section title="What We Test">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[
            {
              icon: <Lock size={16} />,
              title: 'TLS Configuration',
              items: ['TLS protocol version (1.0 → 1.3)', 'Cipher suite negotiated', 'Key exchange algorithm & group', 'Forward secrecy (ephemeral keys)', 'PQC hybrid key exchange (ML-KEM)'],
            },
            {
              icon: <Shield size={16} />,
              title: 'Certificate',
              items: ['Public key algorithm (RSA / ECDSA / etc.)', 'Key size (bits)', 'Signature algorithm', 'Days until expiry', 'Subject CN & issuer organisation'],
            },
            {
              icon: <Globe size={16} />,
              title: 'DNS / DANE',
              items: ['TLSA record presence (DANE)', 'DNS-based certificate pinning'],
            },
            {
              icon: <Shield size={16} />,
              title: 'PQC Readiness',
              items: ['ML-KEM (Kyber) key exchange active', 'Hybrid PQC+classical schemes', 'Quantum-vulnerable algorithm identification'],
            },
          ].map((block, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-2 text-accent mb-3">{block.icon}<span className="text-xs font-medium text-primary">{block.title}</span></div>
              <ul className="space-y-1">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-secondary">
                    <span className="text-accent/40 mt-0.5 flex-shrink-0">—</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Scoring System">
        <p className="text-xs text-secondary mb-5 leading-relaxed">
          Each scan produces a composite score from 0 to 100. The score reflects the current state of
          post-quantum readiness based on observable TLS and certificate properties.
        </p>

        <div className="card overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-void">
                <th className="table-header text-left">Category</th>
                <th className="table-header text-right">Max Points</th>
                <th className="table-header text-left hidden md:table-cell">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['TLS Version (1.3)', '20', 'TLS 1.3 is required for PQC hybrid key exchange'],
                ['PQC Key Exchange (ML-KEM)', '40', 'Active use of NIST-standardised post-quantum KEM'],
                ['Hybrid Key Exchange', '10', 'PQC+classical hybrid scheme (transition best practice)'],
                ['Forward Secrecy', '15', 'Ephemeral key exchange — limits retroactive decryption exposure'],
                ['Certificate Algorithm', '10', 'ECDSA preferred over RSA for smaller quantum attack surface'],
                ['DANE / TLSA', '5', 'DNS-based certificate pinning as defence-in-depth'],
              ].map(([cat, pts, rationale]) => (
                <tr key={cat} className="table-row">
                  <td className="table-cell text-xs text-primary">{cat}</td>
                  <td className="table-cell text-xs text-right font-mono">{pts}</td>
                  <td className="table-cell hidden md:table-cell text-xs text-secondary">{rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { range: '0 – 49', label: 'Legacy', color: 'text-critical', desc: 'No meaningful PQC posture. Quantum-vulnerable by current standards.' },
            { range: '50 – 79', label: 'Partial', color: 'text-warn', desc: 'Some modern TLS practices in place, but no active PQC key exchange.' },
            { range: '80 – 100', label: 'Readying', color: 'text-signal', desc: 'Active PQC hybrid key exchange detected. On the right trajectory.' },
          ].map(s => (
            <div key={s.label} className="card p-4">
              <div className={`text-lg font-light ${s.color} mb-1`}>{s.range}</div>
              <div className={`text-xs font-medium ${s.color} mb-2`}>{s.label}</div>
              <p className="text-[11px] text-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Technical Stack">
        <div className="card p-5">
          {[
            ['Scanner', 'openssl s_client (OpenSSL 3.5.0)', 'Built with ML-KEM and hybrid PQC support'],
            ['PQC Detection', 'ML-KEM-768 (FIPS 203)', 'NIST-standardised post-quantum KEM, client-side advertisement'],
            ['Scan Method', 'External passive TLS handshake', 'Port 443 only. No exploitation. No data injection.'],
            ['Scan Frequency', 'Daily (automated scheduler)', 'Runs at configurable UTC time per domain'],
            ['Data Retention', 'Full run history retained', 'Enables longitudinal trend analysis'],
            ['Score Version', 'tls-pqc-v2', 'Versioned scoring ensures historical comparability'],
          ].map(([label, value, sub]) => (
            <DataRow key={label} label={label} value={value} sub={sub} />
          ))}
        </div>
      </Section>

      <Section title="Limitations">
        <div className="space-y-3">
          {[
            { level: 'info', text: 'We test port 443 only. Other TLS-protected ports (465, 8443, etc.) are not currently scanned.' },
            { level: 'info', text: 'PQC detection depends on TLS negotiation — a server must actively support and advertise ML-KEM for it to be detected.' },
            { level: 'warn', text: 'A high score does not mean a domain is fully quantum-secure. Internal systems, non-TLS protocols, and upstream dependencies are not evaluated.' },
            { level: 'info', text: 'Scores reflect the state at scan time. Infrastructure can change between scans.' },
          ].map((item, i) => {
            const Icon = item.level === 'warn' ? AlertTriangle : Info
            const color = item.level === 'warn' ? 'text-warn' : 'text-accent/70'
            return (
              <div key={i} className="flex items-start gap-3">
                <Icon size={13} className={`flex-shrink-0 mt-0.5 ${color}`} />
                <p className={`text-xs leading-relaxed ${color}`}>{item.text}</p>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
