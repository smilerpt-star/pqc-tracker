import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Clock, RefreshCw } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { api, unwrap } from '../../lib/api.js'
import {
  LoadingState, ErrorState, StatusBadge, ScoreBadge, ActiveBadge, CodeBlock, Drawer
} from '../../components/shared/UI.jsx'
import { formatDate, formatDateShort, scoreColor } from '../../lib/utils.js'

export default function DomainDetailPage() {
  const { id } = useParams()
  const [selectedRun, setSelectedRun] = useState(null)

  const { data: domains, loading: dLoading, error: dError } = useApi(() => api.getDomains())
  const { data: domainTests, loading: tLoading } = useApi(() => api.getDomainTests())
  const { data: runs, loading: rLoading, reload: reloadRuns } = useApi(() => api.getRuns())

  const domain = (domains || []).find(d => String(d.id) === String(id))
  const tests = (domainTests || []).filter(t =>
    t.domain_id === domain?.id || t.domainId === domain?.id || t.domain?.id === domain?.id
  )
  const testIds = new Set(tests.map(t => t.id))
  const domainRuns = (runs || [])
    .filter(r => testIds.has(r.domain_test_id || r.domainTestId))
    .sort((a, b) => new Date(b.started_at || b.createdAt || 0) - new Date(a.started_at || a.createdAt || 0))

  const loading = dLoading || tLoading || rLoading

  if (loading) return <div className="max-w-5xl mx-auto px-6 py-16"><LoadingState /></div>
  if (dError) return <div className="max-w-5xl mx-auto px-6 py-16"><ErrorState message={dError} /></div>
  if (!domain) return (
    <div className="max-w-5xl mx-auto px-6 py-16 text-center">
      <p className="text-muted text-sm mb-4">Domain not found.</p>
      <Link to="/explore" className="btn-secondary text-xs">Back to Explorer</Link>
    </div>
  )

  const latestRun = domainRuns[0]
  const overallScore = latestRun?.score ?? tests.reduce((acc, t) => {
    if (t.last_score !== null && t.last_score !== undefined) return acc === null ? t.last_score : Math.round((acc + t.last_score) / 2)
    return acc
  }, null)

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
      {/* Breadcrumb */}
      <Link to="/explore" className="flex items-center gap-2 text-xs text-muted hover:text-secondary mb-8 transition-colors">
        <ArrowLeft size={12} /> Explorer
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-light text-primary">{domain.domain}</h1>
            <ActiveBadge active={domain.active !== false} />
          </div>
          {domain.company_name && (
            <p className="text-sm text-secondary mb-1">{domain.company_name}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {domain.country && <span className="badge-neutral">{domain.country}</span>}
            {domain.sector && <span className="badge-neutral">{domain.sector}</span>}
          </div>
        </div>

        {/* Score widget */}
        <div className="card p-5 text-center flex-shrink-0 min-w-32">
          {overallScore !== null && overallScore !== undefined ? (
            <>
              <div className={`text-4xl font-light ${scoreColor(overallScore)} mb-1`}>
                {overallScore}
              </div>
              <div className="text-[10px] tracking-[0.15em] uppercase text-muted">Readiness Score</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-light text-muted mb-1">N/A</div>
              <div className="text-[10px] tracking-[0.15em] uppercase text-muted">No Score Yet</div>
            </>
          )}
          {latestRun && (
            <div className="mt-2 text-[10px] text-muted">
              {formatDateShort(latestRun.started_at || latestRun.createdAt)}
            </div>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="stat-label mb-2">Configured Tests</div>
          <div className="text-xl font-light text-primary">{tests.length}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label mb-2">Total Runs</div>
          <div className="text-xl font-light text-primary">{domainRuns.length}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label mb-2">Latest Run</div>
          <div className="text-sm font-light text-primary">
            {latestRun ? formatDateShort(latestRun.started_at || latestRun.createdAt) : '—'}
          </div>
        </div>
      </div>

      {/* Configured tests */}
      {tests.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-void">
            <span className="section-title">Monitoring Configuration</span>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Test</th>
                <th className="table-header text-left hidden md:table-cell">Schedule</th>
                <th className="table-header text-center">Last Status</th>
                <th className="table-header text-center">Last Score</th>
                <th className="table-header text-left hidden lg:table-cell">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-cell text-xs text-primary">
                    {t.test_type?.name || t.testType?.name || `Test ${t.id}`}
                  </td>
                  <td className="table-cell hidden md:table-cell">
                    {t.schedule_enabled
                      ? <span className="text-xs text-secondary flex items-center gap-1">
                          <Clock size={10} /> {t.schedule_frequency || 'scheduled'}
                        </span>
                      : <span className="text-xs text-muted">manual</span>
                    }
                  </td>
                  <td className="table-cell text-center"><StatusBadge status={t.last_status} /></td>
                  <td className="table-cell text-center"><ScoreBadge score={t.last_score} /></td>
                  <td className="table-cell hidden lg:table-cell text-xs">
                    {formatDate(t.last_run_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Run history */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-void flex items-center justify-between">
          <span className="section-title">Run History</span>
          <button onClick={reloadRuns} className="text-muted hover:text-secondary transition-colors">
            <RefreshCw size={12} />
          </button>
        </div>
        {rLoading ? (
          <div className="py-8"><LoadingState message="Loading runs…" /></div>
        ) : domainRuns.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-xs text-muted tracking-wider uppercase">No runs recorded yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left">Score</th>
                <th className="table-header text-left hidden md:table-cell">Started</th>
                <th className="table-header text-left hidden lg:table-cell">Duration</th>
                <th className="table-header text-left hidden md:table-cell">Triggered By</th>
                <th className="table-header" />
              </tr>
            </thead>
            <tbody>
              {domainRuns.map(r => {
                const dur = r.started_at && r.finished_at
                  ? Math.round((new Date(r.finished_at) - new Date(r.started_at)) / 1000)
                  : null
                return (
                  <tr key={r.id} className="table-row cursor-pointer" onClick={() => setSelectedRun(r)}>
                    <td className="table-cell"><StatusBadge status={r.status} /></td>
                    <td className="table-cell"><ScoreBadge score={r.score} /></td>
                    <td className="table-cell hidden md:table-cell text-xs">{formatDate(r.started_at || r.createdAt)}</td>
                    <td className="table-cell hidden lg:table-cell text-xs">{dur !== null ? `${dur}s` : '—'}</td>
                    <td className="table-cell hidden md:table-cell text-xs">{r.triggered_by || '—'}</td>
                    <td className="table-cell text-xs text-accent/60">Detail →</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Notes */}
      {domain.notes && (
        <div className="card p-5">
          <div className="section-title mb-3">Notes</div>
          <p className="text-xs text-secondary leading-relaxed whitespace-pre-wrap">{domain.notes}</p>
        </div>
      )}

      {/* Run Detail Drawer */}
      <Drawer open={!!selectedRun} onClose={() => setSelectedRun(null)} title={`Run Detail — ${selectedRun?.id}`}>
        {selectedRun && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Status', <StatusBadge status={selectedRun.status} />],
                ['Score', <ScoreBadge score={selectedRun.score} />],
                ['Started', formatDate(selectedRun.started_at)],
                ['Finished', formatDate(selectedRun.finished_at)],
                ['Triggered By', selectedRun.triggered_by || '—'],
                ['Run ID', selectedRun.id],
              ].map(([label, value]) => (
                <div key={label} className="card p-3">
                  <div className="text-[10px] tracking-widest uppercase text-muted mb-1">{label}</div>
                  <div className="text-xs text-primary">{value}</div>
                </div>
              ))}
            </div>
            {selectedRun.error_message && (
              <div>
                <div className="section-title mb-2">Error</div>
                <div className="text-xs text-critical bg-critical/5 border border-critical/20 px-3 py-2 rounded-sm">
                  {selectedRun.error_message}
                </div>
              </div>
            )}
            {selectedRun.summary_json && (
              <div>
                <div className="section-title mb-2">Summary</div>
                <CodeBlock data={selectedRun.summary_json} />
              </div>
            )}
            {selectedRun.raw_json && (
              <div>
                <div className="section-title mb-2">Raw Output</div>
                <CodeBlock data={selectedRun.raw_json} />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
