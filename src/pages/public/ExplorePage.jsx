import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Globe2, RefreshCw } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { api, unwrap } from '../../lib/api.js'
import { LoadingState, ErrorState, EmptyState, StatusBadge, ScoreBadge, ActiveBadge, Pill } from '../../components/shared/UI.jsx'
import { formatDateShort, COUNTRIES, SECTORS } from '../../lib/utils.js'

export default function ExplorePage() {
  const { data: domains, loading, error, reload } = useApi(() => api.getDomains())
  const { data: domainTests } = useApi(() => api.getDomainTests())

  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [sector, setSector] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const allDomains = useMemo(() => domains || [], [domains])

  const filtered = useMemo(() => {
    return allDomains.filter(d => {
      if (search && !d.domain?.toLowerCase().includes(search.toLowerCase()) &&
          !d.company_name?.toLowerCase().includes(search.toLowerCase())) return false
      if (country && d.country !== country) return false
      if (sector && d.sector !== sector) return false
      if (activeFilter === 'active' && d.active === false) return false
      if (activeFilter === 'inactive' && d.active !== false) return false
      return true
    })
  }, [allDomains, search, country, sector, activeFilter])

  const usedCountries = useMemo(() =>
    [...new Set(allDomains.map(d => d.country).filter(Boolean))].sort(), [allDomains])
  const usedSectors = useMemo(() =>
    [...new Set(allDomains.map(d => d.sector).filter(Boolean))].sort(), [allDomains])

  // Enrich with test data
  const testsMap = useMemo(() => {
    if (!domainTests) return {}
    const map = {}
    domainTests.forEach(t => {
      const did = t.domain_id || t.domainId || t.domain?.id
      if (!map[did]) map[did] = []
      map[did].push(t)
    })
    return map
  }, [domainTests])

  // Stats
  const stats = useMemo(() => ({
    total: allDomains.length,
    active: allDomains.filter(d => d.active !== false).length,
    countries: new Set(allDomains.map(d => d.country).filter(Boolean)).size,
    sectors: new Set(allDomains.map(d => d.sector).filter(Boolean)).size,
  }), [allDomains])

  const hasFilters = search || country || sector || activeFilter !== 'all'

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <p className="section-title mb-3">Public Intelligence</p>
          <h1 className="page-title mb-2">Domain Explorer</h1>
          <p className="text-sm text-secondary">Browse the monitored universe of internet-facing domains.</p>
        </div>
        <button onClick={reload} className="btn-ghost flex items-center gap-2 flex-shrink-0">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <button onClick={() => setActiveFilter('all')} className={`card px-4 py-3 text-left w-full transition-colors ${activeFilter === 'all' ? 'ring-1 ring-accent/30' : ''}`}>
          <div className="text-xl font-light text-primary">{stats.total}</div>
          <div className="stat-label">Total Domains</div>
        </button>
        <button onClick={() => setActiveFilter('active')} className={`card px-4 py-3 text-left w-full transition-colors ${activeFilter === 'active' ? 'ring-1 ring-accent/30' : ''}`}>
          <div className="text-xl font-light text-signal">{stats.active}</div>
          <div className="stat-label">Active Monitoring</div>
        </button>
        <div className="card px-4 py-3">
          <div className="text-xl font-light text-primary">{stats.countries}</div>
          <div className="stat-label">Countries</div>
        </div>
        <div className="card px-4 py-3">
          <div className="text-xl font-light text-primary">{stats.sectors}</div>
          <div className="stat-label">Sectors</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search domain or organisation…"
              className="input-field pl-9"
            />
          </div>
          <div className="w-44">
            <select value={country} onChange={e => setCountry(e.target.value)} className="select-field">
              <option value="">All Countries</option>
              {usedCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-52">
            <select value={sector} onChange={e => setSector(e.target.value)} className="select-field">
              <option value="">All Sectors</option>
              {usedSectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map(f => (
              <Pill key={f} active={activeFilter === f} onClick={() => setActiveFilter(f)}>
                {f}
              </Pill>
            ))}
          </div>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setCountry(''); setSector(''); setActiveFilter('all') }}
              className="text-xs text-muted hover:text-secondary tracking-wider uppercase"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && <LoadingState message="Loading domains…" />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted tracking-wider">
              {filtered.length} {filtered.length === 1 ? 'domain' : 'domains'}
              {hasFilters ? ' matching filters' : ' in dataset'}
            </span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState message="No domains match your filters" icon={<Globe2 size={24} />} />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-void">
                    <th className="table-header text-left">Domain</th>
                    <th className="table-header text-left hidden md:table-cell">Organisation</th>
                    <th className="table-header text-left hidden lg:table-cell">Country</th>
                    <th className="table-header text-left hidden lg:table-cell">Sector</th>
                    <th className="table-header text-center">Tests</th>
                    <th className="table-header text-center">Last Result</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-left hidden xl:table-cell">Added</th>
                    <th className="table-header" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const tests = testsMap[d.id] || []
                    const lastStatus = tests.length > 0
                      ? tests.sort((a, b) => new Date(b.last_run_at || 0) - new Date(a.last_run_at || 0))[0]?.last_status
                      : null
                    const lastScore = tests.length > 0
                      ? tests.sort((a, b) => new Date(b.last_run_at || 0) - new Date(a.last_run_at || 0))[0]?.last_score
                      : null
                    return (
                      <tr key={d.id} className="table-row">
                        <td className="table-cell">
                          <Link to={`/domain/${d.id}`} className="text-primary hover:text-accent transition-colors text-xs font-medium">
                            {d.domain}
                          </Link>
                        </td>
                        <td className="table-cell hidden md:table-cell text-xs">{d.company_name || '—'}</td>
                        <td className="table-cell hidden lg:table-cell text-xs">{d.country || '—'}</td>
                        <td className="table-cell hidden lg:table-cell text-xs">{d.sector || '—'}</td>
                        <td className="table-cell text-center text-xs">{tests.length || '—'}</td>
                        <td className="table-cell text-center">
                          {lastScore !== null && lastScore !== undefined
                            ? <ScoreBadge score={lastScore} />
                            : lastStatus
                            ? <StatusBadge status={lastStatus} />
                            : <span className="text-muted text-xs">—</span>
                          }
                        </td>
                        <td className="table-cell text-center"><ActiveBadge active={d.active !== false} /></td>
                        <td className="table-cell hidden xl:table-cell text-xs">
                          {formatDateShort(d.created_at || d.createdAt)}
                        </td>
                        <td className="table-cell">
                          <Link to={`/domain/${d.id}`} className="text-xs text-accent/60 hover:text-accent transition-colors">
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
