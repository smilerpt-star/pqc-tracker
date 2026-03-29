import React, { useState, useMemo } from 'react'
import { Plus, RefreshCw, Pencil, Play, Search, Clock } from 'lucide-react'
import { useApi, useApiMutation } from '../../hooks/useApi.js'
import { api, unwrap } from '../../lib/api.js'
import {
  LoadingState, ErrorState, EmptyState, Modal, FormField,
  Alert, Toggle, StatusBadge, ScoreBadge
} from '../../components/shared/UI.jsx'
import { formatDate, SCHEDULE_FREQUENCIES } from '../../lib/utils.js'

const EMPTY = {
  domain_id: '',
  test_type_id: '',
  active: true,
  schedule_enabled: false,
  schedule_frequency: 'daily',
  schedule_time: '02:00',
}

export default function DomainTestsPage() {
  const { data: domains } = useApi(() => api.getDomains())
  const { data: testTypes } = useApi(() => api.getTestTypes())
  const { data: domainTests, loading, error, reload } = useApi(() => api.getDomainTests())
  const { loading: saving, error: saveError, mutate, reset } = useApiMutation()

  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [runningId, setRunningId] = useState(null)
  const [runResult, setRunResult] = useState({}) // id → { success, error }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Build lookup maps
  const domainMap = useMemo(() => {
    const m = {}; (domains || []).forEach(d => m[d.id] = d); return m
  }, [domains])
  const testTypeMap = useMemo(() => {
    const m = {}; (testTypes || []).forEach(t => m[t.id] = t); return m
  }, [testTypes])

  // Enrich domain tests
  const enriched = useMemo(() => {
    return (domainTests || []).map(dt => ({
      ...dt,
      _domain: domainMap[dt.domain_id || dt.domainId] || dt.domain,
      _testType: testTypeMap[dt.test_type_id || dt.testTypeId] || dt.test_type || dt.testType,
    }))
  }, [domainTests, domainMap, testTypeMap])

  const filtered = useMemo(() => {
    if (!search) return enriched
    const q = search.toLowerCase()
    return enriched.filter(dt =>
      dt._domain?.domain?.toLowerCase().includes(q) ||
      dt._testType?.name?.toLowerCase().includes(q) ||
      dt._testType?.key?.toLowerCase().includes(q)
    )
  }, [enriched, search])

  function openCreate() {
    setForm(EMPTY); reset(); setSaveSuccess(false)
    setModal({ mode: 'create' })
  }

  function openEdit(dt) {
    setForm({
      domain_id: String(dt.domain_id || dt.domainId || dt._domain?.id || ''),
      test_type_id: String(dt.test_type_id || dt.testTypeId || dt._testType?.id || ''),
      active: dt.active !== false,
      schedule_enabled: dt.schedule_enabled || false,
      schedule_frequency: dt.schedule_frequency || 'daily',
      schedule_time: dt.schedule_time || '02:00',
    })
    reset(); setSaveSuccess(false)
    setModal({ mode: 'edit', dt })
  }

  function closeModal() { setModal(null); reset(); setSaveSuccess(false) }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      domain_id: Number(form.domain_id),
      test_type_id: Number(form.test_type_id),
      active: form.active,
      schedule_enabled: form.schedule_enabled,
      schedule_frequency: form.schedule_enabled ? form.schedule_frequency : undefined,
      schedule_time: form.schedule_enabled ? form.schedule_time : undefined,
    }
    await mutate(
      () => modal.mode === 'create'
        ? api.createDomainTest(payload)
        : api.updateDomainTest(modal.dt.id, payload),
      () => { setSaveSuccess(true); reload(); setTimeout(closeModal, 1200) }
    )
  }

  async function handleRun(dt) {
    setRunningId(dt.id)
    setRunResult(r => ({ ...r, [dt.id]: null }))
    try {
      await api.runDomainTest(dt.id)
      setRunResult(r => ({ ...r, [dt.id]: { success: true } }))
      setTimeout(() => {
        setRunResult(r => { const n = { ...r }; delete n[dt.id]; return n })
        reload()
      }, 3000)
    } catch (e) {
      setRunResult(r => ({ ...r, [dt.id]: { error: e.message || 'Run failed' } }))
    } finally {
      setRunningId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title mb-2">Management</p>
          <h1 className="page-title">Schedules</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={reload} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={13} /> Add Schedule
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by domain or test type…"
          className="input-field pl-9"
        />
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          <div className="text-xs text-muted tracking-wider mb-3">
            {filtered.length} domain test{filtered.length !== 1 ? 's' : ''}
          </div>
          {filtered.length === 0 ? (
            <EmptyState message="No domain tests configured" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-void">
                    <th className="table-header text-left">Domain</th>
                    <th className="table-header text-left">Test Type</th>
                    <th className="table-header text-left hidden lg:table-cell">Schedule</th>
                    <th className="table-header text-center hidden md:table-cell">Last Status</th>
                    <th className="table-header text-center hidden md:table-cell">Score</th>
                    <th className="table-header text-left hidden xl:table-cell">Last Run</th>
                    <th className="table-header text-left hidden xl:table-cell">Next Run</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(dt => {
                    const res = runResult[dt.id]
                    return (
                      <tr key={dt.id} className={`table-row ${res?.success ? 'bg-signal/5' : ''}`}>
                        <td className="table-cell text-xs text-primary font-medium">
                          {dt._domain?.domain || `Domain ${dt.domain_id || dt.domainId}`}
                        </td>
                        <td className="table-cell">
                          <div className="text-xs text-secondary">
                            {dt._testType?.name || `Test ${dt.test_type_id || dt.testTypeId}`}
                          </div>
                          {dt._testType?.key && (
                            <code className="text-[10px] text-accent/50">{dt._testType.key}</code>
                          )}
                        </td>
                        <td className="table-cell hidden lg:table-cell">
                          {dt.schedule_enabled ? (
                            <span className="text-xs text-secondary flex items-center gap-1">
                              <Clock size={10} className="text-accent" />
                              {dt.schedule_frequency}
                              {dt.schedule_time && ` @ ${dt.schedule_time}`}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">manual</span>
                          )}
                        </td>
                        <td className="table-cell hidden md:table-cell text-center">
                          <StatusBadge status={dt.last_status} />
                        </td>
                        <td className="table-cell hidden md:table-cell text-center">
                          <ScoreBadge score={dt.last_score} />
                        </td>
                        <td className="table-cell hidden xl:table-cell text-xs">{formatDate(dt.last_run_at)}</td>
                        <td className="table-cell hidden xl:table-cell text-xs">{formatDate(dt.next_run_at)}</td>
                        <td className="table-cell">
                          <div className="flex items-center justify-center gap-2">
                            {res?.error && (
                              <span className="text-[10px] text-critical">✗ {res.error.slice(0, 20)}</span>
                            )}
                            {res?.success && (
                              <span className="text-[10px] text-signal">✓ Queued</span>
                            )}
                            <button
                              onClick={() => handleRun(dt)}
                              disabled={runningId === dt.id}
                              className="text-muted hover:text-signal transition-colors disabled:opacity-40"
                              title="Run now"
                            >
                              {runningId === dt.id
                                ? <div className="w-3 h-3 border border-signal/40 border-t-signal rounded-full animate-spin" />
                                : <Play size={13} />
                              }
                            </button>
                            <button
                              onClick={() => openEdit(dt)}
                              className="text-muted hover:text-accent transition-colors"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
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

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Add Schedule' : 'Edit Schedule'}
      >
        {saveSuccess ? (
          <div className="text-center py-6">
            <div className="text-signal text-sm">✓ Saved successfully</div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {saveError && <Alert type="error">{saveError}</Alert>}

            <FormField label="Domain *">
              <select
                value={form.domain_id}
                onChange={e => set('domain_id', e.target.value)}
                className="select-field"
                required
              >
                <option value="">Select domain…</option>
                {(domains || []).map(d => (
                  <option key={d.id} value={d.id}>{d.domain}{d.company_name ? ` — ${d.company_name}` : ''}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Test Type *">
              <select
                value={form.test_type_id}
                onChange={e => set('test_type_id', e.target.value)}
                className="select-field"
                required
              >
                <option value="">Select test type…</option>
                {(testTypes || []).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.key})</option>
                ))}
              </select>
            </FormField>

            {modal?.mode === 'create' && form.domain_id && form.test_type_id && (domainTests || []).some(
              dt => String(dt.domain_id || dt.domainId) === form.domain_id &&
                    String(dt.test_type_id || dt.testTypeId) === form.test_type_id
            ) && (
              <p className="text-xs text-warn -mt-2">This domain already has this test type assigned.</p>
            )}

            <div className="border border-void rounded-sm p-4 flex flex-col gap-4">
              <Toggle
                checked={form.schedule_enabled}
                onChange={v => set('schedule_enabled', v)}
                label="Enable scheduled runs"
              />
              {form.schedule_enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Frequency">
                    <select value={form.schedule_frequency} onChange={e => set('schedule_frequency', e.target.value)} className="select-field">
                      {SCHEDULE_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Time (UTC)">
                    <input
                      type="time"
                      value={form.schedule_time}
                      onChange={e => set('schedule_time', e.target.value)}
                      className="input-field"
                    />
                  </FormField>
                </div>
              )}
            </div>

            <Toggle checked={form.active} onChange={v => set('active', v)} label="Active" />

            <div className="flex gap-3 pt-2 border-t border-void">
              <button
                type="submit"
                disabled={saving || !form.domain_id || !form.test_type_id || (modal?.mode === 'create' && (domainTests || []).some(dt => String(dt.domain_id || dt.domainId) === form.domain_id && String(dt.test_type_id || dt.testTypeId) === form.test_type_id))}
                className="btn-primary"
              >
                {saving ? 'Saving…' : modal?.mode === 'create' ? 'Add Schedule' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
