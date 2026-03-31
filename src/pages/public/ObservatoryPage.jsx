import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RefreshCw, TrendingUp, Globe2, Shield, ArrowRight } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { api } from '../../lib/api.js'
import { LoadingState, ErrorState } from '../../components/shared/UI.jsx'
import { formatDateShort, SCORE_TIERS } from '../../lib/utils.js'

// ── Mini score gauge (inline, for tables) ─────────────────────────────────────

function ScoreGauge({ score }) {
  if (score === null || score === undefined) return <span className="text-muted text-xs">—</span>
  const color = score >= 80 ? '#00ff88' : score >= 40 ? '#f59e0b' : '#ef4444'
  return <span className="font-mono text-sm" style={{ color }}>{score}</span>
}

// ── Horizontal bar ─────────────────────────────────────────────────────────────

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

// ── Donut distribution chart ──────────────────────────────────────────────────

function DonutChart({ data, avgScore }) {
  const [hovered, setHovered] = useState(null)
  if (!data?.length) return null

  const tierMeta = { legacy: SCORE_TIERS[0], transitioning: SCORE_TIERS[1], pqc_active: SCORE_TIERS[2] }
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return null

  const CX = 70, CY = 70, R_OUT = 60, R_IN = 43

  const toRad = deg => (deg - 90) * Math.PI / 180
  const pt = (r, deg) => [
    (CX + r * Math.cos(toRad(deg))).toFixed(2),
    (CY + r * Math.sin(toRad(deg))).toFixed(2),
  ].join(' ')

  const arcPath = (s, e) => {
    const large = (e - s) > 180 ? 1 : 0
    return [
      `M ${pt(R_OUT, s)}`,
      `A ${R_OUT} ${R_OUT} 0 ${large} 1 ${pt(R_OUT, e)}`,
      `L ${pt(R_IN, e)}`,
      `A ${R_IN} ${R_IN} 0 ${large} 0 ${pt(R_IN, s)}`,
      'Z',
    ].join(' ')
  }

  // Build segments — stroke on background colour creates clean gap, no manual gap needed
  let cursor = 0
  const segments = data
    .filter(d => d.count > 0)
    .map(d => {
      const sweep = (d.count / total) * 360
      const s = cursor
      const e = cursor + sweep
      cursor += sweep
      return { ...d, s, e, pct: Math.round(d.count / total * 100) }
    })

  return (
    <div className="relative flex flex-col items-center gap-4">
      <svg viewBox="0 0 140 140" className="w-44 h-44">
        {segments.map((seg, i) => {
          const meta = tierMeta[seg.key] || {}
          return (
            <path
              key={seg.key}
              d={arcPath(seg.s, seg.e)}
              fill={meta.color || '#6b7280'}
              stroke="#050810"
              strokeWidth="2"
              opacity={hovered === null ? 0.88 : hovered === i ? 1 : 0.3}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
            />
          )
        })}
        {/* Center: avg score + org count */}
        {avgScore !== null && avgScore !== undefined ? (() => {
          const c = avgScore >= 80 ? '#00ff88' : avgScore >= 40 ? '#f59e0b' : '#ef4444'
          return (<>
            <text x={CX} y={CY + 10} textAnchor="middle" fill={c}
              fontSize="32" fontWeight="200" fontFamily="monospace">{avgScore}</text>
            <text x={CX} y={CY + 24} textAnchor="middle" fill="#374151"
              fontSize="6" letterSpacing="1.8">AVG SCORE</text>
            <text x={CX} y={CY - 12} textAnchor="middle" fill="#4b5563"
              fontSize="6.5" letterSpacing="0.5">{total} orgs scored</text>
          </>)
        })() : (<>
          <text x={CX} y={CY + 6}  textAnchor="middle" fill="#e5e7eb" fontSize="22" fontWeight="300">{total}</text>
          <text x={CX} y={CY + 18} textAnchor="middle" fill="#6b7280" fontSize="7" letterSpacing="1.5">ORGS</text>
        </>)}
      </svg>

      {/* Legend */}
      <div className="w-full space-y-1.5">
        {segments.map((seg, i) => {
          const meta = tierMeta[seg.key] || {}
          return (
            <div
              key={seg.key}
              className="flex items-center gap-2 px-1 py-0.5 rounded transition-colors cursor-default"
              style={{ opacity: hovered === null || hovered === i ? 1 : 0.4 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-[11px] text-secondary flex-1">{seg.label}</span>
              <span className="text-[11px] font-mono text-primary">{seg.count}</span>
              <span className="text-[10px] text-muted w-8 text-right">{seg.pct}%</span>
            </div>
          )
        })}
      </div>

      {/* Hover tooltip */}
      {hovered !== null && segments[hovered] && (() => {
        const seg = segments[hovered]
        const meta = tierMeta[seg.key] || {}
        return (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-60 bg-surface border border-void rounded px-3 py-2 shadow-lg pointer-events-none z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-xs font-medium text-primary">{seg.label}</span>
              <span className="text-xs text-muted ml-auto font-mono">{meta.range}</span>
            </div>
            <p className="text-[10px] text-secondary leading-relaxed">{meta.desc}</p>
            <div className="mt-1.5 text-[10px] text-muted">{seg.count} organisations · {seg.pct}%</div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Trend chart ───────────────────────────────────────────────────────────────

const PERIODS = [
  { key: 'daily',   label: 'Daily',   dataKey: 'trend_daily',   dateKey: 'day'   },
  { key: 'weekly',  label: 'Weekly',  dataKey: 'trend_weekly',  dateKey: 'week'  },
  { key: 'monthly', label: 'Monthly', dataKey: 'trend_monthly', dateKey: 'month' },
]

function fmtDate(val, period) {
  if (!val) return ''
  if (period === 'monthly') {
    const [y, m] = val.split('-')
    return `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1]} '${y.slice(2)}`
  }
  // daily or weekly: 'YYYY-MM-DD' → 'DD MMM'
  const [, m, d] = val.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${+d} ${months[+m - 1]}`
}

function TrendChart({ stats, period }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const periodCfg = PERIODS.find(p => p.key === period)
  const data = stats?.[periodCfg.dataKey] || []

  if (!data.length) return (
    <div className="text-xs text-muted text-center py-10 tracking-wider uppercase">
      No {period} data yet — more scans needed
    </div>
  )

  const W = 520, H = 130, PAD_L = 28, PAD_R = 16, PAD_T = 14, PAD_B = 24
  const iW = W - PAD_L - PAD_R
  const iH = H - PAD_T - PAD_B

  const scores = data.map(d => d.avg_score).filter(s => s !== null)
  if (!scores.length) return null

  const minS = Math.max(0,  Math.min(...scores) - 8)
  const maxS = Math.min(100, Math.max(...scores) + 8)

  const xOf = i => PAD_L + (data.length < 2 ? iW / 2 : (i / (data.length - 1)) * iW)
  const yOf = s => PAD_T + iH - ((s - minS) / (maxS - minS || 1)) * iH

  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.avg_score ?? minS), d }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x},${PAD_T + iH} L${PAD_L},${PAD_T + iH} Z`

  // Evenly-spaced x-axis label indices (up to 6)
  const labelCount = Math.min(data.length, 6)
  const labelIdxs = data.length <= labelCount
    ? data.map((_, i) => i)
    : Array.from({ length: labelCount }, (_, i) => Math.round(i * (data.length - 1) / (labelCount - 1)))

  // Tier gridlines that are within visible range
  const tierLines = [
    { s: 40, color: '#f59e0b18', dash: '4 3' },
    { s: 80, color: '#00ff8818', dash: '4 3' },
  ].filter(t => t.s > minS && t.s < maxS)

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Tier gridlines */}
        {tierLines.map(t => (
          <g key={t.s}>
            <line x1={PAD_L} y1={yOf(t.s)} x2={PAD_L + iW} y2={yOf(t.s)}
              stroke={t.color} strokeWidth="1" strokeDasharray={t.dash} />
            <text x={PAD_L - 3} y={yOf(t.s) + 3.5} textAnchor="end"
              fill="#374151" fontSize="7">{t.s}</text>
          </g>
        ))}

        {/* Y-axis min/max */}
        <text x={PAD_L - 3} y={PAD_T + 3.5} textAnchor="end" fill="#374151" fontSize="7">{Math.round(maxS)}</text>
        <text x={PAD_L - 3} y={PAD_T + iH + 3.5} textAnchor="end" fill="#374151" fontSize="7">{Math.round(minS)}</text>

        {/* Area fill + line */}
        <path d={area} fill="url(#trendGrad)" />
        <path d={line} fill="none" stroke="#3b82f6" strokeWidth="1.5" />

        {/* Hover crosshair */}
        {hoverIdx !== null && (
          <line
            x1={pts[hoverIdx].x} y1={PAD_T}
            x2={pts[hoverIdx].x} y2={PAD_T + iH}
            stroke="#3b82f630" strokeWidth="1"
          />
        )}

        {/* Data points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r={hoverIdx === i ? 4.5 : 3}
            fill={hoverIdx === i ? '#60a5fa' : '#3b82f6'}
            stroke="#080d1a" strokeWidth="1.5"
            onMouseEnter={() => setHoverIdx(i)}
            style={{ cursor: 'crosshair', transition: 'r 0.1s' }}
          />
        ))}

        {/* X-axis labels */}
        {labelIdxs.map(i => (
          <text key={i} x={pts[i].x} y={H - 6} textAnchor="middle" fill="#4b5563" fontSize="8">
            {fmtDate(data[i][periodCfg.dateKey], period)}
          </text>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hoverIdx !== null && data[hoverIdx] && (() => {
        const d = data[hoverIdx]
        const score = d.avg_score
        const color = score >= 80 ? '#00ff88' : score >= 40 ? '#f59e0b' : '#ef4444'
        const tier = score >= 80 ? 'PQC-Active' : score >= 40 ? 'Transitioning' : 'Legacy'
        const p = pts[hoverIdx]
        const leftPct = ((p.x / W) * 100)
        return (
          <div
            className="absolute pointer-events-none z-10 bg-surface border border-void rounded px-3 py-2 shadow-lg"
            style={{
              bottom: `${((H - p.y) / H * 100) + 5}%`,
              left: `${Math.min(Math.max(leftPct, 12), 78)}%`,
              transform: 'translateX(-50%)',
              minWidth: '130px',
            }}
          >
            <div className="text-[10px] text-muted mb-1 tracking-wider">
              {fmtDate(d[periodCfg.dateKey], period)}
            </div>
            <div className="text-xl font-mono font-light" style={{ color }}>{score}</div>
            <div className="text-[10px] text-muted">avg score · <span style={{ color }}>{tier}</span></div>
            <div className="text-[10px] text-muted mt-0.5">{d.count} runs</div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ObservatoryPage() {
  const navigate = useNavigate()
  const { data: statsData, loading, error, reload } = useApi(() => api.getStats())
  const stats = statsData?.data || statsData || null
  const [trendPeriod, setTrendPeriod] = useState('weekly')

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
          {/* ── Hero: 4 metric cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link to="/explore" className="card px-4 py-4 flex flex-col justify-center hover:ring-1 hover:ring-accent/30 transition-all group">
              <div className="text-2xl font-light text-primary group-hover:text-accent transition-colors">{stats.total_scored ?? stats.active_domains}</div>
              <div className="stat-label">Organisations</div>
              <div className="text-[10px] text-muted mt-1">S&P 500 + STOXX 600</div>
            </Link>
            <div className="card px-4 py-4 flex flex-col justify-center">
              {(() => {
                const s = stats.avg_score
                const color = s >= 80 ? 'text-signal' : s >= 40 ? 'text-warn' : 'text-critical'
                const tier  = s >= 80 ? 'PQC-Active' : s >= 40 ? 'Transitioning' : 'Legacy'
                return (<>
                  <div className={`text-2xl font-light font-mono ${color}`}>{s ?? '—'}</div>
                  <div className="stat-label">Avg Score</div>
                  <div className={`text-[10px] mt-1 ${color}`}>{tier}</div>
                </>)
              })()}
            </div>
            <div className="card px-4 py-4 flex flex-col justify-center">
              <div className="text-2xl font-light text-signal">
                {stats.pqc_ready?.count ?? 0}
                <span className="text-sm text-muted font-normal ml-1">({stats.pqc_ready?.pct ?? 0}%)</span>
              </div>
              <div className="stat-label">PQC-Active</div>
              <div className="text-[10px] text-muted mt-1">Hybrid KEM deployed</div>
            </div>
            <div className="card px-4 py-4 flex flex-col justify-center">
              <div className="text-2xl font-light text-critical">
                {stats.pqc_legacy?.count ?? 0}
                <span className="text-sm text-muted font-normal ml-1">({stats.pqc_legacy?.pct ?? 0}%)</span>
              </div>
              <div className="stat-label">Legacy</div>
              <div className="text-[10px] text-muted mt-1">No PQC key exchange</div>
            </div>
          </div>

          {/* ── Index comparison + Distribution ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

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
                    <ScoreBar value={idx.pqc_ready} max={idx.scored} color="#00ff88" />
                    <div className="text-[10px] text-muted mt-1">{idx.pct_ready}% PQC-active</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-void section-title">Score Distribution</div>
              <div className="px-5 py-5">
                <DonutChart data={stats.score_distribution} avgScore={stats.avg_score} />
              </div>
            </div>
          </div>

          {/* ── Trend ── */}
          <div className="card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-void flex items-center justify-between">
              <div className="flex items-center gap-2 section-title">
                <TrendingUp size={12} /> Avg Score Trend
              </div>
              <div className="flex gap-1">
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setTrendPeriod(p.key)}
                    className={`text-[10px] px-2.5 py-1 rounded tracking-wider uppercase transition-colors ${
                      trendPeriod === p.key
                        ? 'bg-accent/20 text-accent'
                        : 'text-muted hover:text-secondary'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-4">
              <TrendChart stats={stats} period={trendPeriod} />
            </div>
          </div>

          {/* ── Country + Sector ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

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
                          <div className="h-full rounded-full"
                            style={{ width: `${row.scored > 0 ? Math.round(row.pqc_ready / row.scored * 100) : 0}%`, background: '#00ff88' }} />
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
