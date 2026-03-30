import React from 'react'
import { Link } from 'react-router-dom'
import { Globe, FlaskConical, Link2, Play, RefreshCw, ArrowRight, Layers } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../lib/api.js'
import { LoadingState, StatusBadge, ScoreBadge } from '../../components/shared/UI.jsx'
import { formatDate } from '../../lib/utils.js'

function StatCard({ icon: Icon, label, value, to, color = 'text-accent' }) {
  const inner = (
    <div className="stat-card flex items-center justify-between group">
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
      <Icon size={20} className={`${color} opacity-40 group-hover:opacity-70 transition-opacity`} />
    </div>
  )
  return to ? <Link to={to} className="card-hover block">{inner}</Link> : <div>{inner}</div>
}

export default function DashboardPage() {
  const { data: domains, loading: dL } = useApi(() => api.getDomains())
  const { data: testTypes, loading: ttL } = useApi(() => api.getTestTypes())
  const { data: domainTests, loading: dtL } = useApi(() => api.getDomainTests())
  const { data: runs, loading: rL, reload: reloadRuns } = useApi(() => api.getRuns())

  const loading = dL || ttL || dtL || rL
  const activeDomains = (domains || []).filter(d => d.active !== false).length
  const activeTests = (testTypes || []).filter(t => t.active !== false).length
  const recentRuns = (runs || [])
    .sort((a, b) => new Date(b.started_at || b.createdAt || 0) - new Date(a.started_at || a.createdAt || 0))
    .slice(0, 10)

  const runStats = (runs || []).reduce((acc, r) => {
    const s = (r.status || '').toLowerCase()
    if (s === 'pass' || s === 'passed' || s === 'success' || s === 'completed') acc.pass++
    else if (s === 'fail' || s === 'failed' || s === 'error') acc.fail++
    else acc.other++
    return acc
  }, { pass: 0, fail: 0, other: 0 })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title mb-2">Operations</p>
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="dot-live" />
          <span className="text-xs tracking-widest uppercase text-muted">Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Globe} label="Total Domains" value={domains?.length} to="/admin/domains" color="text-accent" />
        <StatCard icon={FlaskConical} label="Active Test Types" value={activeTests} to="/admin/test-types" color="text-signal" />
        <StatCard icon={Link2} label="Domain Tests" value={domainTests?.length} to="/admin/domain-tests" color="text-warn" />
        <StatCard icon={Play} label="Total Runs" value={runs?.length} to="/admin/runs" color="text-accent" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/domains" className="card p-4 block card-hover">
          <div className="section-title mb-4">Domain Activity</div>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-light text-signal">{activeDomains}</div>
              <div className="stat-label">Active</div>
            </div>
            <div>
              <div className="text-xl font-light text-muted">{(domains?.length || 0) - activeDomains}</div>
              <div className="stat-label">Inactive</div>
            </div>
          </div>
        </Link>
        <Link to="/admin/runs" className="card p-4 block card-hover">
          <div className="section-title mb-4">Run Outcomes</div>
          <div className="flex gap-6">
            <div>
              <div className="text-xl font-light text-signal">{runStats.pass}</div>
              <div className="stat-label">Passed</div>
            </div>
            <div>
              <div className="text-xl font-light text-critical">{runStats.fail}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div>
              <div className="text-xl font-light text-muted">{runStats.other}</div>
              <div className="stat-label">Other</div>
            </div>
          </div>
        </Link>
        <div className="card p-4">
          <div className="section-title mb-4">Quick Actions</div>
          <div className="flex flex-col gap-2">
            <Link to="/admin/scheduler" className="btn-secondary text-xs flex items-center justify-between">
              Scheduler <ArrowRight size={11} />
            </Link>
            <Link to="/admin/indexes" className="btn-secondary text-xs flex items-center justify-between">
              Indexes <ArrowRight size={11} />
            </Link>
            <Link to="/admin/domains" className="btn-ghost text-xs flex items-center justify-between">
              Add Domain <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent runs */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-void flex items-center justify-between">
          <span className="section-title">Recent Runs</span>
          <div className="flex items-center gap-3">
            <button onClick={reloadRuns} className="text-muted hover:text-secondary">
              <RefreshCw size={12} />
            </button>
            <Link to="/admin/runs" className="text-xs text-accent/70 hover:text-accent">
              View all →
            </Link>
          </div>
        </div>
        {rL ? (
          <div className="py-8"><LoadingState /></div>
        ) : recentRuns.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted tracking-wider uppercase">No runs yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-left">Status</th>
                <th className="table-header text-left hidden md:table-cell">Score</th>
                <th className="table-header text-left">Started</th>
                <th className="table-header text-left hidden lg:table-cell">Triggered By</th>
                <th className="table-header text-left hidden lg:table-cell">Run ID</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-cell"><StatusBadge status={r.status} /></td>
                  <td className="table-cell hidden md:table-cell"><ScoreBadge score={r.score} /></td>
                  <td className="table-cell text-xs">{formatDate(r.started_at || r.createdAt)}</td>
                  <td className="table-cell hidden lg:table-cell text-xs">{r.triggered_by || '—'}</td>
                  <td className="table-cell hidden lg:table-cell text-xs text-muted">{r.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
