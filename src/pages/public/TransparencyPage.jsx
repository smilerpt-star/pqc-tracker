import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Eye, Server, Mail, Database, Clock, Globe2 } from 'lucide-react'

function Block({ icon, title, children }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h3 className="text-sm font-medium text-primary">{title}</h3>
      </div>
      <div className="text-xs text-secondary leading-relaxed">{children}</div>
    </div>
  )
}

export default function TransparencyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="section-title mb-3">Transparency</p>
        <h1 className="page-title mb-4">About Our Scanning</h1>
        <p className="text-sm text-secondary leading-relaxed max-w-2xl">
          We scan internet-facing domains to assess post-quantum cryptographic readiness.
          This page explains what we do, why, and what rights you have.
        </p>
      </div>

      <div className="mb-10">
        <div className="card p-6 border-accent/20">
          <h2 className="text-sm font-medium text-primary mb-2">Is your domain being scanned?</h2>
          <p className="text-xs text-secondary leading-relaxed mb-4">
            PQC Readiness Tracker performs automated daily scans of internet-facing domains to
            measure their post-quantum cryptographic readiness. If your domain is in our dataset,
            it is being scanned once per day via a standard TLS handshake to port 443.
          </p>
          <p className="text-xs text-secondary leading-relaxed">
            This is equivalent to what any web browser or TLS client does when connecting to your server.
            No data is exfiltrated, no vulnerabilities are exploited, and no traffic is generated beyond
            the initial TLS negotiation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Block icon={<Eye size={16} />} title="What We Observe">
          During a scan we observe only what your server publicly advertises during a TLS handshake:
          protocol version, cipher suite, key exchange algorithm, and certificate metadata.
          We do not read application data, inject traffic, or test for vulnerabilities.
        </Block>

        <Block icon={<Server size={16} />} title="How It Works">
          Scans are conducted using OpenSSL 3.5.0 via a standard <code className="text-accent/80">s_client</code> connection
          to port 443. The connection is terminated immediately after the handshake completes.
          Total connection time is typically under 3 seconds.
        </Block>

        <Block icon={<Database size={16} />} title="What We Store">
          We store the TLS configuration observed (protocol, ciphers, certificate info) and a derived
          readiness score. We do not store private keys, session data, or any application content.
          Historical scan records are retained to enable trend analysis.
        </Block>

        <Block icon={<Clock size={16} />} title="Scan Frequency">
          Domains in our monitored dataset are scanned once per day at a scheduled UTC time.
          Ad-hoc scans via the <Link to="/test" className="text-accent/80 hover:text-accent underline">Test Domain</Link> tool
          are triggered on demand and are not stored in the continuous monitoring dataset.
        </Block>

        <Block icon={<Globe2 size={16} />} title="Why We Do This">
          The post-quantum transition is a critical infrastructure challenge. NIST finalised
          its PQC standards in 2024. We exist to make the state of internet-facing cryptographic
          posture measurable, comparable, and publicly visible — particularly across EMEA.
        </Block>

        <Block icon={<Shield size={16} />} title="Responsible Disclosure">
          All findings are used to generate aggregate readiness statistics and per-domain reports.
          We do not use scan data to exploit vulnerabilities or engage in any form of attack.
          Our scanning IP ranges and User-Agent are identifiable.
        </Block>
      </div>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium text-primary mb-3">Opt-Out / Domain Removal</h2>
        <p className="text-xs text-secondary leading-relaxed mb-4">
          If you are responsible for a domain in our dataset and wish to have it removed from
          continuous monitoring, you can request removal by contacting us. Please include the domain name
          and a verifiable association (e.g. a DNS TXT record or email from the domain).
        </p>
        <p className="text-xs text-muted">
          Note: removing a domain from continuous monitoring does not prevent ad-hoc scans via the public
          Test Domain tool, which is available to anyone on the internet.
        </p>
      </div>

      <div className="card p-5 flex items-start gap-3">
        <Mail size={14} className="text-accent flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-medium text-primary mb-1">Contact</div>
          <p className="text-xs text-secondary">
            For questions about our scanning programme, data removal requests, or methodology queries,
            see the <Link to="/methodology" className="text-accent/80 hover:text-accent underline">Methodology</Link> page
            or explore our dataset in the <Link to="/explore" className="text-accent/80 hover:text-accent underline">Explorer</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
