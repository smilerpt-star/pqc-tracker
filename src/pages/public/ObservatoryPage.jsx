import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp, Globe2, Shield, ArrowRight } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../lib/api.js'
import { LoadingState, ErrorState } from '../../components/shared/UI.jsx'
import { formatDateShort, SCORE_TIERS } from '../../lib/utils.js'

// ── Inline SVG charts (no deps) ───────────────────────────────────────────────

function ScoreBar({ value, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-void rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-muted w-8 text-right">{value}</span>
    </div>
  )
}

function ScoreGauge({ score }) {
  if (score === null || score === undefined) return <span className="text-muted text-xs">—</span>
  const color = score >= 80 ? '#00ff88' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <span className="font-mono text-sm" style={{ color }}>
      {score}
    </span>
  )
}

function DistributionChart({ data }) {
  const [hovered, setHovered] = useState(null)
  if (!data?.length) return null

  const tierMeta = { legacy: SCORE_TIERS[0], transitioning: SCORE_TIERS[1], pqc_active: SCORE_TIERS[2] }
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 360, H = 90, BAR_W = 90, GAP = 22
  const totalBars = data.length
  const totalWidth = totalBars * BAR_W + (totalBars - 1) * GAP
  const offsetX = (W - totalWidth) / 2

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full max-w-sm mx-auto">
        {data.map((d, i) => {
          const meta = tierMeta[d.key] || {}
          const h = Math.max(3, Math.round((d.count / max) * H))
          const x = offsetX + i * (BAR_W + GAP)
          const color = meta.color || '#6b7280'
          return (
            <g
              key={d.key || d.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              <rect x={x} y={H - h} width={BAR_W} height={h} fill={color} opacity={hovered === i ? 1 : 0.75} rx={3} />
              <text x={x + BAR_W / 2} y={H + 12} textAnchor="middle" fill="#6b7280" fontSize={9}>{d.label}</text>
              <text x={x + BAR_W / 2} y={H - h - 4} textAnchor="middle" fill={color} fontSize={10} fontWeight="500">{d.count}</text>
            </g>
          )
        })}
      </svg>
      {/* Tooltip */}
      {hovered !== null && data[hovered] && (() => {
        const d = data[hovered]
        const meta = tierMeta[d.key] || {}
        return (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-surface border border-void rounded px-3 py-2 shadow-lg pointer-events-none z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-xs font-medium text-primary">{d.label}</span>
              <span className="text-xs text-muted ml-auto font-mono">{meta.range}</span>
            </div>
            <p className="text-[10px] text-secondary leading-relaxed">{meta.desc}</p>
            <div className="mt-1.5 text-[10px] text-muted">{d.count} organisation{d.count !== 1 ? 's' : ''}</div>
          </div>
        )
      })()}
    </div>
  )
}

function TrendChart({ data }) {
  if (!data?.length) return (
    <div className="text-xs text-muted text-center py-6 tracking-wider uppercase">No trend data yet — runs needed</div>
  )
  const W = 400, H = 80, PAD = 12
  const scores = data.map(d => d.avg_score).filter(s => s !== null)
  if (!scores.length) return null
  const minS = Math.max(0,  Math.min(...scores) - 5)
  const maxS = Math.min(100, Math.max(...scores) + 5)
  const xStep = (W - PAD * 2) / Math.max(data.length - 1, 1)
  const yScale = s => H - PAD - ((s - minS) / (maxS - minS || 1)) * (H - PAD * 2)

  const pts = data.map((d, i) => ({ x: PAD + i * xStep, y: yScale(d.avg_score ?? minS) }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full">
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#tg)" />
      <path d={line} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
      ))}
      {/* first and last date labels */}
      {data.length > 1 && (
        <>
          <text x={pts[0].x} y={H + 14} textAnchor="start" fill="#6b7280" fontSize={8}>
            {data[0].week?.slice(5)}
          </text>
          <text x={pts[pts.length - 1].x} y={H + 14} textAnchor="end" fill="#6b7280" fontSize={8}>
            {data[data.length - 1].week?.slice(5)}
          </text>
        </>
      )}
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ObservatoryPage() {
  const navigate = useNavigate()
  const { data: statsData, loading, error, reload } = useApi(() => api.getStats())
  const stats = statsData?.data || statsData || null

  const topCountries = useMemo(() =>
    (stats?.by_country || []).filter(r => r.scored > 0).sort((a, b) => (b.avg_score ?? -1) - (a.avg_score ?? -1)).slice(0, 15),
    [stats])

  const topSectors = useMemo(() =>
    (stats?.by_sector || []).filter(r => r.scored > 0),
    [stats])

  const maxCountryCount = Math.max(...(stats?.by_country || []).map(r => r.count), 1)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <p className="section-title mb-3">Global Intelligence</p>
          <h1 className="page-title mb-2">PQC Readiness Observatory</h1>
          <p className="text-sm text-secondary max-w-xl">
            Real-time post-quantum cryptography readiness across {stats?.total_scored ?? '…'} major organisations
            from S&P 500 and STOXX Europe 600.
            {stats?.last_scan_at && (
              <span className="text-muted ml-1">Last scan: {formatDateShort(stats.last_scan_at)}.</span>
            )}
          </p>
        </div>
        <button onClick={reload} className="btn-ghost flex items-center gap-2 flex-shrink-0">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading && <LoadingState message="Loading observatory data…" />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && stats && (
        <>
          {/* ── Headline numbers ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Organisations', value: stats.total_scored ?? stats.active_domains, color: 'text-primary' },
              { label: 'Avg PQC Score', value: stats.avg_score !== null ? stats.avg_score : '—', color: stats.avg_score >= 80 ? 'text-signal' : stats.avg_score >= 40 ? 'text-warn' : 'text-critical' },
              { label: 'PQC Active', value: stats.pqc_ready?.count ? `${stats.pqc_ready.count} (${stats.pqc_ready.pct}%)` : '0', color: 'text-signal' },
              { label: 'Legacy TLS', value: stats.pqc_legacy?.count ? `${stats.pqc_legacy.count} (${stats.pqc_legacy.pct}%)` : '0', color: 'text-critical' },
            ].map(s => (
              <div key={s.label} className="card px-4 py-3">
                <div className={`text-2xl font-light ${s.color}`}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Index comparison + Distribution ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* By index */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-void section-title">By Index</div>
              <div className="divide-y divide-void/30">
                {(stats.by_index || []).map(idx => (
                  <div key={idx.key} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs text-primary font-medium">{idx.index}</span>
                        <span className="text-[10px] text-muted ml-2">{idx.scored} scored / {idx.count} total</span>
                      </div>
                      <ScoreGauge score={idx.avg_score} />
                    </div>
                    <ScoreBar
                      value={idx.pqc_ready}
                      max={idx.scored}
                      color="#00ff88"
                    />
                    <div className="text-[10px] text-muted mt-1">{idx.pct_ready}% PQC-active</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score distribution */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-void section-title">Score Distribution</div>
              <div className="px-4 py-6 flex flex-col items-center gap-4">
                <DistributionChart data={stats.score_distribution} />
                <div className="w-full grid grid-cols-3 gap-2">
                  {[
                    { label: 'PQC-Active',     key: 'pqc_ready',   color: 'text-signal'   },
                    { label: 'Transitioning', key: 'pqc_partial', color: 'text-warn'     },
                    { label: 'Legacy',         key: 'pqc_legacy',  color: 'text-critical' },
                  ].map(b => (
                    <div key={b.key} className="text-center">
                      <div className={`text-lg font-light ${b.color}`}>{stats[b.key]?.pct ?? 0}%</div>
                      <div className="text-[10px] text-muted tracking-wider uppercase">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Trend ── */}
          <div className="card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-void flex items-center gap-2 section-title">
              <TrendingUp size={12} /> Weekly Avg Score Trend
            </div>
            <div className="px-4 py-4">
              <TrendChart data={stats.trend_weekly} />
            </div>
          </div>

          {/* ── Country + Sector ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* By country */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-void section-title flex items-center gap-2">
                <Globe2 size={12} /> By Country <span className="text-muted font-normal">(ranked by avg score)</span>
              </div>
              <div className="divide-y divide-void/30 max-h-96 overflow-y-auto">
                {topCountries.map(row => (
                  <button
                    key={row.country}
                    onClick={() => navigate(`/explore?country=${encodeURIComponent(row.country)}`)}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-void/30 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-secondary truncate group-hover:text-primary transition-colors">{row.country}</span>
                        <div className="flex items-center gap-2">
                          <ScoreGauge score={row.avg_score} />
                          <ArrowRight size={10} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <ScoreBar value={row.count} max={maxCountryCount} color="#3b82f6" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* By sector */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-void section-title flex items-center gap-2">
                <Shield size={12} /> By Sector
              </div>
              <div className="divide-y divide-void/30 max-h-96 overflow-y-auto">
                {topSectors.map(row => (
                  <button
                    key={row.sector}
                    onClick={() => navigate(`/explore?sector=${encodeURIComponent(row.sector)}`)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-void/30 transition-colors text-left group"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-secondary truncate group-hover:text-primary transition-colors">{row.sector}</span>
                        <div className="flex items-center gap-2">
                          <ScoreGauge score={row.avg_score} />
                          <ArrowRight size={10} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-void rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${row.scored > 0 ? Math.round(row.pqc_ready / row.scored * 100) : 0}%`, background: '#00ff88' }} />
                        </div>
                        <span className="text-[10px] text-muted w-16 text-right">{row.pqc_ready}/{row.scored} PQC</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="flex items-center justify-between border-t border-void pt-6">
            <p className="text-xs text-muted">
              Monitoring {stats.active_domains} domains across S&P 500 and STOXX Europe 600.
              Scans run daily at 02:00 UTC.
            </p>
            <div className="flex gap-3">
              <Link to="/explore" className="btn-ghost text-xs">Explore domains →</Link>
              <Link to="/methodology" className="btn-ghost text-xs">Methodology →</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
