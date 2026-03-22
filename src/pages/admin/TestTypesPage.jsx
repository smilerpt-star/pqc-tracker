import React, { useState } from 'react'
import { Plus, RefreshCw, Pencil } from 'lucide-react'
import { useApi, useApiMutation } from '../../hooks/useApi.js'
import { api } from '../../lib/api.js'
import {
  LoadingState, ErrorState, EmptyState, Modal, FormField, Alert, Toggle, ActiveBadge
} from '../../components/shared/UI.jsx'

const RUNNER_TYPES = ['script', 'http', 'dns', 'tls', 'certificate', 'pqc', 'custom']

const EMPTY = {
  key: '', name: '', description: '', runner_type: '', active: true,
}

export default function TestTypesPage() {
  const { data: testTypes, loading, error, reload } = useApi(() => api.getTestTypes())
  const { loading: saving, error: saveError, mutate, reset } = useApiMutation()

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function openCreate() {
    setForm(EMPTY); reset(); setSaveSuccess(false)
    setModal({ mode: 'create' })
  }

  function openEdit(tt) {
    setForm({
      key: tt.key || '',
      name: tt.name || '',
      description: tt.description || '',
      runner_type: tt.runner_type || '',
      active: tt.active !== false,
    })
    reset(); setSaveSuccess(false)
    setModal({ mode: 'edit', tt })
  }

  function closeModal() { setModal(null); reset(); setSaveSuccess(false) }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      key: form.key.trim(),
      name: form.name.trim(),
      description: form.description || undefined,
      runner_type: form.runner_type || undefined,
      active: form.active,
    }
    await mutate(
      () => modal.mode === 'create'
        ? api.createTestType(payload)
        : api.updateTestType(modal.tt.id, payload),
      () => { setSaveSuccess(true); reload(); setTimeout(closeModal, 1000) }
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title mb-2">Management</p>
          <h1 className="page-title">Test Types</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={reload} className="btn-ghost flex items-center gap-2">
            <RefreshCw size={12} /> Refresh
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={13} /> Add Test Type
          </button>
        </div>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}

      {!loading && !error && (
        <>
          {(!testTypes || testTypes.length === 0) ? (
            <EmptyState message="No test types configured" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-void">
                    <th className="table-header text-left">Key</th>
                    <th className="table-header text-left">Name</th>
                    <th className="table-header text-left hidden md:table-cell">Description</th>
                    <th className="table-header text-left hidden lg:table-cell">Runner</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header" />
                  </tr>
                </thead>
                <tbody>
                  {testTypes.map(tt => (
                    <tr key={tt.id} className="table-row">
                      <td className="table-cell">
                        <code className="text-xs text-accent/80 bg-accent/5 px-2 py-0.5 rounded-sm">
                          {tt.key}
                        </code>
                      </td>
                      <td className="table-cell text-xs text-primary font-medium">{tt.name}</td>
                      <td className="table-cell hidden md:table-cell text-xs max-w-xs">
                        <span className="line-clamp-2">{tt.description || '—'}</span>
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        {tt.runner_type
                          ? <span className="badge-info">{tt.runner_type}</span>
                          : <span className="text-muted text-xs">—</span>
                        }
                      </td>
                      <td className="table-cell text-center"><ActiveBadge active={tt.active !== false} /></td>
                      <td className="table-cell">
                        <button
                          onClick={() => openEdit(tt)}
                          className="text-muted hover:text-accent transition-colors"
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

      {/* Modal */}
      <Modal
        open={!!modal}
        onClose={closeModal}
        title={modal?.mode === 'create' ? 'Add Test Type' : `Edit — ${modal?.tt?.name}`}
      >
        {saveSuccess ? (
          <div className="text-center py-6">
            <div className="text-signal text-sm">✓ Saved successfully</div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {saveError && <Alert type="error">{saveError}</Alert>}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Key *" hint="Unique machine-readable identifier">
                <input
                  value={form.key}
                  onChange={e => set('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="pqc_tls_check"
                  className="input-field"
                  required
                />
              </FormField>
              <FormField label="Runner Type">
                <select value={form.runner_type} onChange={e => set('runner_type', e.target.value)} className="select-field">
                  <option value="">None</option>
                  {RUNNER_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Name *">
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="PQC TLS Check"
                className="input-field"
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="input-field"
                rows={3}
                placeholder="What does this test check?"
                style={{ resize: 'vertical' }}
              />
            </FormField>

            <Toggle checked={form.active} onChange={v => set('active', v)} label="Active" />

            <div className="flex gap-3 pt-2 border-t border-void">
              <button type="submit" disabled={saving || !form.key || !form.name} className="btn-primary">
                {saving ? 'Saving…' : modal?.mode === 'create' ? 'Add Test Type' : 'Save Changes'}
              </button>
              <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
