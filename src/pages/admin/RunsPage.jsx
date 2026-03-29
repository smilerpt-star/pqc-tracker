import React, { useState, useMemo } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../lib/api.js'
import {
  LoadingState, ErrorState, EmptyState, Drawer, StatusBadge, ScoreBadge, CodeBlock, Pill
} from '../../components/shared/UI.jsx'
import { formatDate } from '../../lib/utils.js'

export default function RunsPage() {
  const { data: runs, loading, error, reload } = useApi(() => api.getRuns())
  const { data: domainTests } = useApi(() => api.getDomainTests())
  const { data: domains } = useApi(() => api.getDomains())

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRun, setSelectedRun] = useState(null)
  const [drawerLoading, setDrawerLoading] = useState(false)

  // Build lookup maps
  const domainTestMap = useMemo(() => {
    const m = {}; (domainTests || []).forEach(dt => m[dt.id] = dt); return m
  }, [domainTests])
  const domainMap = useMemo(() => {
    const m = {}; (domains || []).forEach(d => m[d.id] = d); return m
  }, [domains])

  const enriched = useMemo(() => {
    return (runs || []).map(r => {
      const dt = domainTestMap[r.domain_test_id || r.domainTestId]
      const domain = dt ? domainMap[dt.domain_id || dt.domainId] : null
      return { ...r, _dt: dt, _domain: domain }
    }).sort((a, b) =>
      new Date(b.started_at || b.createdAt || 0) - new Date(a.started_at || a.createdAt || 0)
    )
  }, [runs, domainTestMap, domainMap])

  const filtered = useMemo(() => {
    return enriched.filter(r => {
      if (statusFilter !== 'all') {
        const s = (r.status || '').toLowerCase()
        if (statusFilter === 'pass' && !['pass','passed','success','completed'].includes(s)) return false
        if (statusFilter === 'fail' && !['fail','failed','error'].includes(s)) return false
        if (statusFilter === 'pending' && !['running','pending'].includes(s)) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!r._domain?.domain?.toLowerCase().includes(q) &&
            !String(r.id).includes(q) &&
            !(r.triggered_by || '').toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [enriched, statusFilter, search])

  async function openRunDetail(run) {
    setSelectedRun(run)
    // Try to fetch detailed run if available
    try {
      setDrawerLoading(true)
      const detail = await api.getRun(run.id)
      if (detail) {
        const rich = detail.data || detail
        setSelectedRun(r => ({ ...r, ...rich }))
      }
    } catch {} finally {
      setDrawerLoading(false)
    }
  }

  const statusCounts = useMemo(() => {
    return enriched.reduce((acc, r) => {
      const s = (r.status || '').toLowerCase()
      if (['pass','passed','success','completed'].includes(s)) acc.pass++
      else if (['fail','failed','error'].includes(s)) acc.fail++
      else acc.other++
      return acc
    }, { pass: 0, fail: 0, other: 0, total: enriched.length })
  }, [enriched])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title mb-2">Execution History</p>
          <h1 className="page-title">Runs</h1>
        </div>
        <button onClick={reload} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Runs', value: statusCounts.total, cls: 'text-primary', filter: 'all' },
          { label: 'Passed', value: statusCounts.pass, cls: 'text-signal', filter: 'pass' },
          { label: 'Failed', value: statusCounts.fail, cls: 'text-critical', filter: 'fail' },
          { label: 'Other', value: statusCounts.other, cls: 'text-muted', filter: 'pending' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={`card px-4 py-3 text-left w-full transition-colors hover:border-void/80 ${statusFilter === s.filter ? 'ring-1 ring-accent/30' : ''}`}
          >
            <div className={`text-xl font-light ${s.cls}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by domain or run ID…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'pass', label: 'Passed' },
            { key: 'fail', label: 'Failed' },
            { key: 'pending', label: 'Running' },
          ].map(f => (
            <Pill key={f.key} active={statusFilter === f.key} onClick={() => setStatusFilter(f.key)}>
              {f.label}
            </Pill>
          ))}
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          <div className="text-xs text-muted tracking-wider mb-3">
            {filtered.length} run{filtered.length !== 1 ? 's' : ''}
          </div>
          {filtered.length === 0 ? (
            <EmptyState message="No runs found" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-void">
                    <th className="table-header text-left">Status</th>
                    <th className="table-header text-left hidden md:table-cell">Score</th>
                    <th className="table-header text-left">Domain</th>
                    <th className="table-header text-left hidden lg:table-cell">Test Type</th>
                    <th className="table-header text-left">Started</th>
                    <th className="table-header text-left hidden xl:table-cell">Duration</th>
                    <th className="table-header text-left hidden lg:table-cell">Triggered By</th>
                    <th className="table-header" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const dur = r.started_at && r.finished_at
                      ? Math.round((new Date(r.finished_at) - new Date(r.started_at)) / 1000)
                      : null
                    const dtObj = r._dt
                    const testType = dtObj
                      ? (dtObj.test_type?.name || dtObj.testType?.name || `Test ${dtObj.test_type_id || dtObj.testTypeId}`)
                      : '—'
                    return (
                      <tr
                        key={r.id}
                        className="table-row cursor-pointer"
                        onClick={() => openRunDetail(r)}
                      >
                        <td className="table-cell"><StatusBadge status={r.status} /></td>
                        <td className="table-cell hidden md:table-cell"><ScoreBadge score={r.score} /></td>
                        <td className="table-cell text-xs text-primary">
                          {r._domain?.domain || '—'}
                        </td>
                        <td className="table-cell hidden lg:table-cell text-xs">{testType}</td>
                        <td className="table-cell text-xs">{formatDate(r.started_at || r.createdAt)}</td>
                        <td className="table-cell hidden xl:table-cell text-xs">{dur !== null ? `${dur}s` : '—'}</td>
                        <td className="table-cell hidden lg:table-cell text-xs">{r.triggered_by || '—'}</td>
                        <td className="table-cell text-xs text-accent/60">Detail →</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Run Detail Drawer */}
      <Drawer
        open={!!selectedRun}
        onClose={() => setSelectedRun(null)}
        title={`Run — ${selectedRun?.id}`}
      >
        {selectedRun && (
          <div className="flex flex-col gap-5">
            {drawerLoading && <div className="text-xs text-muted tracking-wider animate-pulse">Loading detail…</div>}

            {/* Core fields */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Status', <StatusBadge status={selectedRun.status} />],
                ['Score', <ScoreBadge score={selectedRun.score} />],
                ['Started', formatDate(selectedRun.started_at)],
                ['Finished', formatDate(selectedRun.finished_at)],
                ['Triggered By', selectedRun.triggered_by || '—'],
                ['Run ID', <span className="text-accent/70 text-[11px]">{selectedRun.id}</span>],
              ].map(([label, val]) => (
                <div key={label} className="card p-3">
                  <div className="text-[10px] tracking-widest uppercase text-muted mb-1">{label}</div>
                  <div className="text-xs text-primary">{val}</div>
                </div>
              ))}
            </div>

            {/* Domain + test context */}
            {(selectedRun._domain || selectedRun._dt) && (
              <div className="card p-4 flex flex-col gap-2">
                <div className="section-title mb-1">Context</div>
                {selectedRun._domain && (
                  <div className="text-xs">
                    <span className="text-muted mr-2">Domain</span>
                    <span className="text-primary">{selectedRun._domain.domain}</span>
                    {selectedRun._domain.company_name && (
                      <span className="text-muted ml-2">— {selectedRun._domain.company_name}</span>
                    )}
                  </div>
                )}
                {selectedRun._dt && (
                  <div className="text-xs">
                    <span className="text-muted mr-2">Test</span>
                    <span className="text-primary">
                      {selectedRun._dt.test_type?.name || selectedRun._dt.testType?.name || `Test ${selectedRun._dt.id}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {selectedRun.error_message && (
              <div>
                <div className="section-title mb-2">Error</div>
                <div className="text-xs text-critical bg-critical/5 border border-critical/20 px-3 py-2"
                  style={{ borderRadius: 2 }}>
                  {selectedRun.error_message}
                </div>
              </div>
            )}

            {/* Summary JSON */}
            {selectedRun.summary_json && (
              <div>
                <div className="section-title mb-2">Summary</div>
                <CodeBlock data={selectedRun.summary_json} />
              </div>
            )}

            {/* Raw JSON */}
            {selectedRun.raw_json && (
              <div>
                <div className="section-title mb-2">Raw Output</div>
                <CodeBlock data={selectedRun.raw_json} />
              </div>
            )}

            {!selectedRun.summary_json && !selectedRun.raw_json && !selectedRun.error_message && (
              <div className="text-xs text-muted text-center py-4 tracking-wider uppercase">
                No additional output available for this run
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
