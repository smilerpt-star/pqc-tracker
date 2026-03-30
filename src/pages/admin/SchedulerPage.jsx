import React, { useState, useEffect } from 'react'
import { Play, Clock, CheckCircle, RefreshCw, Settings, Zap } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useApi } from '../../hooks/useApi.js'
import { LoadingState, StatusBadge } from '../../components/shared/UI.jsx'

function duration(ms) {
  if (!ms) return '—'
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`
  return `${(ms / 60000).toFixed(1)}m`
}

function timeAgo(isoStr) {
  if (!isoStr) return '—'
  const diff = Date.now() - new Date(isoStr).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

export default function SchedulerPage() {
  // useApi already calls unwrap internally, so data is the unwrapped value
  const { data: config, reload: reloadConfig } = useApi(() => api.getConfig())
  const { data: status, loading: statusLoading, reload: reloadStatus } = useApi(() => api.schedulerStatus())
  const { data: runs, reload: reloadRuns } = useApi(() => api.getRuns(50))

  const safeConfig = config || {}
  const safeStatus = status || {}
  const safeRuns = Array.isArray(runs) ? runs : []

  const [scanTime, setScanTime] = useState('')
  const [savingTime, setSavingTime] = useState(false)
  const [running, setRunning] = useState(false)
  const [forceResult, setForceResult] = useState(null)

  useEffect(() => {
    if (safeConfig.daily_scan_time) setScanTime(safeConfig.daily_scan_time)
  }, [safeConfig.daily_scan_time])

  // Poll status every 10s if running
  useEffect(() => {
    const interval = setInterval(() => {
      reloadStatus()
      if (safeStatus.running) reloadRuns()
    }, 10000)
    return () => clearInterval(interval)
  }, [safeStatus.running])

  async function handleSaveTime(e) {
    e.preventDefault()
    if (!scanTime.match(/^\d{2}:\d{2}$/)) { alert('Use HH:MM format (e.g. 02:00)'); return }
    setSavingTime(true)
    try {
      await api.updateConfig({ daily_scan_time: scanTime })
      reloadConfig()
    } catch (err) { alert(err.message) }
    finally { setSavingTime(false) }
  }

  async function handleRunNow() {
    if (!confirm('Force-run all active domains now?')) return
    setRunning(true)
    setForceResult(null)
    try {
      const res = await api.runNow()
      // res may be { data: {...} } — extract if needed
      const result = res && res.data !== undefined ? res.data : res
      setForceResult(result)
      reloadRuns()
      reloadStatus()
    } catch (err) { alert(err.message) }
    finally { setRunning(false) }
  }

  const recentRuns = safeRuns.slice(0, 20)

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <p className="section-title mb-1">Admin</p>
        <h1 className="page-title">Scheduler</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Status card */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted">
            <RefreshCw size={14} className={safeStatus.running ? 'animate-spin text-accent' : ''} />
            <span className="text-xs tracking-wider uppercase">Status</span>
          </div>
          <div className={`text-sm font-medium ${safeStatus.running ? 'text-accent' : 'text-signal'}`}>
            {safeStatus.running ? 'Scanning…' : 'Idle'}
          </div>
        </div>

        {/* Schedule card */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted">
            <Clock size={14} />
            <span className="text-xs tracking-wider uppercase">Daily Run</span>
          </div>
          <div className="text-sm font-medium text-primary">
            {safeConfig.daily_scan_time || '02:00'} <span className="text-xs text-muted font-normal">UTC</span>
          </div>
        </div>

        {/* Last run card */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-muted">
            <CheckCircle size={14} />
            <span className="text-xs tracking-wider uppercase">Last Run</span>
          </div>
          {safeStatus.last_run ? (
            <div>
              <div className="text-sm font-medium text-primary">{timeAgo(safeStatus.last_run.date)}</div>
              <div className="text-[10px] text-muted mt-1">
                {safeStatus.last_run.total} domains · {safeStatus.last_run.pass} passed · {safeStatus.last_run.fail} failed · {duration(safeStatus.last_run.duration_ms)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted">No run recorded this session</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Change scan time */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={14} className="text-accent" />
            <span className="text-xs font-medium text-primary tracking-wider uppercase">Scan Time (UTC)</span>
          </div>
          <form onSubmit={handleSaveTime} className="flex items-center gap-3">
            <input
              type="text"
              value={scanTime}
              onChange={e => setScanTime(e.target.value)}
              placeholder="02:00"
              pattern="^\d{2}:\d{2}$"
              className="input-field w-24 font-mono text-center"
            />
            <span className="text-xs text-muted">UTC</span>
            <button type="submit" disabled={savingTime} className="btn-primary text-xs">
              {savingTime ? 'Saving…' : 'Save'}
            </button>
          </form>
          <p className="text-[11px] text-muted mt-3">All active domains are scanned once daily at this time. Rate-limited to 10 concurrent.</p>
        </div>

        {/* Force run */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-warn" />
            <span className="text-xs font-medium text-primary tracking-wider uppercase">Force Run Now</span>
          </div>
          <button
            onClick={handleRunNow}
            disabled={running || safeStatus.running}
            className="btn-primary flex items-center gap-2 mb-3"
          >
            <Play size={13} />
            {running ? 'Running…' : safeStatus.running ? 'Already running…' : 'Run all domains now'}
          </button>
          <p className="text-[11px] text-muted">Triggers an immediate scan of all active domains. Respects rate limits.</p>
          {forceResult && (
            <div className="mt-3 text-xs text-signal">
              Done: {forceResult.total} domains · {forceResult.pass} passed · {forceResult.fail} failed · {duration(forceResult.duration_ms)}
            </div>
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-void flex items-center justify-between">
          <span className="section-title">Recent Runs</span>
          <button onClick={reloadRuns} className="text-[10px] text-muted hover:text-secondary tracking-wider uppercase">Refresh</button>
        </div>
        {recentRuns.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted">No runs yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-void">
                <th className="table-header text-left">Domain</th>
                <th className="table-header text-left">Time</th>
                <th className="table-header text-right">Score</th>
                <th className="table-header text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map(run => (
                <tr key={run.id} className="table-row">
                  <td className="table-cell text-xs text-primary font-mono">
                    {run.domain_test?.domain?.domain || '—'}
                  </td>
                  <td className="table-cell text-xs text-muted">
                    {run.started_at ? timeAgo(run.started_at) : '—'}
                  </td>
                  <td className="table-cell text-right">
                    {run.score !== null && run.score !== undefined ? (
                      <span className={`text-xs font-mono ${run.score >= 80 ? 'text-signal' : run.score >= 50 ? 'text-warn' : 'text-critical'}`}>
                        {run.score}
                      </span>
                    ) : <span className="text-xs text-muted">—</span>}
                  </td>
                  <td className="table-cell text-right">
                    <StatusBadge status={run.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
