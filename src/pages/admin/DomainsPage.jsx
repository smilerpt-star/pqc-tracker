import React, { useState, useMemo } from 'react'
import { Plus, Search, RefreshCw, Pencil } from 'lucide-react'
import { useApi, useApiMutation } from '../../hooks/useApi.js'
import { api, unwrap } from '../../lib/api.js'
import {
  LoadingState, ErrorState, EmptyState, Modal, FormField, Alert, Toggle, ActiveBadge
} from '../../components/shared/UI.jsx'
import { formatDateShort, COUNTRIES, SECTORS } from '../../lib/utils.js'

const EMPTY = {
  domain: '', company_name: '', country: '', sector: '',
  active: true, notes: '',
}

export default function DomainsPage() {
  const { data: domains, loading, error, reload } = useApi(() => api.getDomains())
  const { loading: saving, error: saveError, mutate, reset } = useApiMutation()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [modal, setModal] = useState(null) // null | { mode: 'create'|'edit', domain }
  const [form, setForm] = useState(EMPTY)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const filtered = useMemo(() => {
    return (domains || []).filter(d => {
      if (search && !d.domain?.toLowerCase().includes(search.toLowerCase()) &&
          !d.company_name?.toLowerCase().includes(search.toLowerCase())) return false
      if (activeFilter === 'active' && d.active === false) return false
      if (activeFilter === 'inactive' && d.active !== false) return false
      return true
    })
  }, [domains, search, activeFilter])

  function openCreate() {
    setForm(EMPTY)
    reset()
    setSaveSuccess(false)
    setModal({ mode: 'create' })
  }

  function openEdit(domain) {
    setForm({
      domain: domain.domain || '',
      company_name: domain.company_name || '',
      country: domain.country || '',
      sector: domain.sector || '',
      active: domain.active !== false,
      notes: domain.notes || '',
    })
    reset()
    setSaveSuccess(false)
    setModal({ mode: 'edit', domain })
  }

  function closeModal() {
    setModal(null)
    reset()
    setSaveSuccess(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      domain: form.domain.trim().toLowerCase(),
      company_name: form.company_name || undefined,
      country: form.country || undefined,
      sector: form.sector || undefined,
      active: form.active,
      notes: form.notes || undefined,
    }
    await mutate(
      () => modal.mode === 'create'
        ? api.createDomain(payload)
        : api.updateDomain(modal.domain.id, payload),
      () => { setSaveSuccess(true); reload(); setTimeout(closeModal, 1000) }
    )
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title mb-2">Management</p>
          <h1 className="page-title">Domains</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={reload} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={13} /> Add Domain
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search domains…"
            className="input-field pl-9"
          />
        </div>
        <select value={activeFilter} onChange={e => setActiveFilter(e.target.value)} className="select-field w-36">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && (
        <>
          <div className="text-xs text-muted tracking-wider mb-3">
            {filtered.length} domain{filtered.length !== 1 ? 's' : ''}
          </div>
          {filtered.length === 0 ? (
            <EmptyState message="No domains found" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-void">
                    <th className="table-header text-left">Domain</th>
                    <th className="table-header text-left hidden md:table-cell">Organisation</th>
                    <th className="table-header text-left hidden lg:table-cell">Country</th>
                    <th className="table-header text-left hidden lg:table-cell">Sector</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-left hidden xl:table-cell">Added</th>
                    <th className="table-header" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id} className="table-row">
                      <td className="table-cell font-medium text-xs text-primary">{d.domain}</td>
                      <td className="table-cell hidden md:table-cell text-xs">{d.company_name || '—'}</td>
                      <td className="table-cell hidden lg:table-cell text-xs">{d.country || '—'}</td>
                      <td className="table-cell hidden lg:table-cell text-xs">{d.sector || '—'}</td>
                      <td className="table-cell text-center"><ActiveBadge active={d.active !== false} /></td>
                      <td className="table-cell hidden xl:table-cell text-xs">{formatDateShort(d.created_at || d.createdAt)}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-muted hover:text-accent transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Add Domain' : `Edit — ${modal?.domain?.domain}`}
      >
        {saveSuccess ? (
          <div className="text-center py-6">
            <div className="text-signal text-sm mb-2">✓ Saved successfully</div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {saveError && <Alert type="error">{saveError}</Alert>}

            <FormField label="Domain *">
              <input
                value={form.domain}
                onChange={e => set('domain', e.target.value)}
                placeholder="example.com"
                className="input-field"
                required
                spellCheck={false}
              />
              {modal?.mode === 'create' && form.domain.trim() && (domains || []).some(
                d => d.domain?.toLowerCase() === form.domain.trim().toLowerCase()
              ) && (
                <p className="text-xs text-warn mt-1">This domain already exists.</p>
              )}
            </FormField>

            <FormField label="Organisation">
              <input
                value={form.company_name}
                onChange={e => set('company_name', e.target.value)}
                placeholder="Acme Corp"
                className="input-field"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Country">
                <select value={form.country} onChange={e => set('country', e.target.value)} className="select-field">
                  <option value="">None</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Sector">
                <select value={form.sector} onChange={e => set('sector', e.target.value)} className="select-field">
                  <option value="">None</option>
                  {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Notes">
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                className="input-field"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </FormField>

            <Toggle checked={form.active} onChange={v => set('active', v)} label="Active monitoring" />

            <div className="flex gap-3 pt-2 border-t border-void">
              <button type="submit" disabled={saving || !form.domain.trim() || (modal?.mode === 'create' && (domains || []).some(d => d.domain?.toLowerCase() === form.domain.trim().toLowerCase()))} className="btn-primary">
                {saving ? 'Saving…' : modal?.mode === 'create' ? 'Add Domain' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
