import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { FormField, Alert } from '../../components/shared/UI.jsx'
import { api, unwrap } from '../../lib/api.js'
import { COUNTRIES, SECTORS } from '../../lib/utils.js'

export default function SubmitDomainPage() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    domain: params.get('domain') || '',
    company_name: '',
    country: '',
    sector: '',
    notes: '',
    submitter_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [existingDomains, setExistingDomains] = useState([])

  useEffect(() => {
    api.getDomains()
      .then(r => setExistingDomains(unwrap(r) || []))
      .catch(() => {})
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const domainExists = form.domain.trim()
    ? existingDomains.find(d => d.domain?.toLowerCase() === form.domain.trim().toLowerCase() && d.active !== false)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.domain.trim()) return
    setLoading(true)
    setError(null)
    try {
      await api.createDomain({
        domain: form.domain.trim().toLowerCase(),
        company_name: form.company_name || undefined,
        country: form.country || undefined,
        sector: form.sector || undefined,
        notes: [
          form.notes,
          form.submitter_name ? `Submitted by: ${form.submitter_name}` : null,
          'Source: public submission',
        ].filter(Boolean).join('\n') || undefined,
        active: false, // pending review
      })
      setSuccess(true)
    } catch (e) {
      setError(e.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center animate-fade-in">
        <div className="flex justify-center mb-6">
          <CheckCircle2 size={40} className="text-signal" />
        </div>
        <h1 className="text-2xl font-light text-primary mb-4">Domain Submitted</h1>
        <p className="text-sm text-secondary mb-2">
          <span className="text-primary font-medium">{form.domain}</span> has been submitted for review.
        </p>
        <p className="text-xs text-muted mb-8">
          Submitted domains are reviewed before being added to the continuous monitoring programme.
          Once active, public results will be visible in the Explorer.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => { setSuccess(false); setForm({ domain: '', company_name: '', country: '', sector: '', notes: '', submitter_name: '' }) }}
            className="btn-secondary text-xs">
            Submit Another
          </button>
          <a href="/explore" className="btn-ghost text-xs">View Explorer</a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="section-title mb-3">Contribute to the Dataset</p>
        <h1 className="page-title mb-3">Submit a Domain</h1>
        <p className="text-sm text-secondary leading-relaxed">
          Suggest a domain for inclusion in the PQC Readiness monitoring universe.
          Submissions are reviewed before being added to continuous monitoring.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="card p-6 flex flex-col gap-5">
          <div className="section-title pb-2 border-b border-void">Domain Details</div>

          <FormField label="Domain *" hint="The internet-facing domain to monitor, e.g. example.com">
            <input
              type="text"
              value={form.domain}
              onChange={e => set('domain', e.target.value)}
              placeholder="example.com"
              className="input-field"
              required
              spellCheck={false}
              autoComplete="off"
            />
            {domainExists && (
              <div className="mt-2 text-xs text-accent/80 bg-accent/5 border border-accent/20 rounded px-3 py-2">
                This domain is already being monitored.{' '}
                <Link to={`/domain/${domainExists.id}`} className="underline hover:text-accent">
                  View current status →
                </Link>
              </div>
            )}
          </FormField>

          <FormField label="Organisation / Company">
            <input
              type="text"
              value={form.company_name}
              onChange={e => set('company_name', e.target.value)}
              placeholder="Acme Corp"
              className="input-field"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Country">
              <select
                value={form.country}
                onChange={e => set('country', e.target.value)}
                className="select-field"
              >
                <option value="">Select country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FormField>

            <FormField label="Industry / Sector">
              <select
                value={form.sector}
                onChange={e => set('sector', e.target.value)}
                className="select-field"
              >
                <option value="">Select sector…</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <div className="card p-6 flex flex-col gap-5">
          <div className="section-title pb-2 border-b border-void">Optional Context</div>

          <FormField
            label="Notes"
            hint="Why is this domain relevant? Any context that might help prioritise monitoring."
          >
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="e.g. Major financial institution, publicly critical infrastructure, operates payment systems…"
              className="input-field"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </FormField>

          <FormField label="Your Name / Organisation" hint="Optional. Not publicly displayed.">
            <input
              type="text"
              value={form.submitter_name}
              onChange={e => set('submitter_name', e.target.value)}
              placeholder="Jane Smith, Example Security Ltd"
              className="input-field"
            />
          </FormField>
        </div>

        <div className="flex items-start gap-4 pt-2">
          <button
            type="submit"
            disabled={!form.domain.trim() || loading || !!domainExists}
            className="btn-primary"
          >
            {loading ? 'Submitting…' : 'Submit Domain'}
          </button>
          <p className="text-xs text-muted leading-relaxed mt-1">
            Submitted domains are set to inactive pending admin review.
            No automated testing begins until reviewed and approved.
          </p>
        </div>
      </form>
    </div>
  )
}
