import React, { useState, useRef } from 'react'
import { Layers, Plus, Upload, CheckCircle, X } from 'lucide-react'
import { api, unwrap } from '../../lib/api.js'
import { useApi } from '../../hooks/useApi.js'
import { LoadingState, ErrorState } from '../../components/shared/UI.jsx'

function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, '_'))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
    return obj
  }).filter(r => r.domain)
}

export default function IndexesPage() {
  const { data: rawIndexes, loading, error, reload } = useApi(() => api.getIndexes())
  const indexes = rawIndexes || []

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ key: '', name: '', description: '', source_url: '', year: new Date().getFullYear() })

  const [uploadTargetId, setUploadTargetId] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importIndexId, setImportIndexId] = useState(null)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    try {
      await api.createIndex({ ...form, year: Number(form.year) })
      setShowCreate(false)
      setForm({ key: '', name: '', description: '', source_url: '', year: new Date().getFullYear() })
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleFileUpload(indexId, file) {
    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) { alert('No valid rows found. CSV needs a header row with at least a "domain" column.'); return }

    setImportIndexId(indexId)
    setImporting(true)
    setImportResult(null)
    try {
      const res = await api.importToIndex(indexId, rows)
      setImportResult(unwrap(res))
    } catch (err) {
      alert('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  if (loading) return <LoadingState message="Loading indexes…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="section-title mb-1">Observatory</p>
          <h1 className="page-title">Indexes</h1>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /><span>New Index</span>
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary">New Index</span>
            <button onClick={() => setShowCreate(false)}><X size={14} className="text-muted" /></button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Key (unique slug)</label>
              <input className="input-field w-full" placeholder="forbes-global-2000" value={form.key} onChange={e => setForm(f => ({...f, key: e.target.value}))} required />
            </div>
            <div>
              <label className="field-label">Name</label>
              <input className="input-field w-full" placeholder="Forbes Global 2000" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="col-span-2">
              <label className="field-label">Description</label>
              <input className="input-field w-full" placeholder="Annual list of the world's largest public companies" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Source URL</label>
              <input className="input-field w-full" placeholder="https://..." value={form.source_url} onChange={e => setForm(f => ({...f, source_url: e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Year</label>
              <input className="input-field w-full" type="number" value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating…' : 'Create Index'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="card p-4 mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-signal flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-medium text-primary mb-1">Import complete</div>
              <div className="text-xs text-secondary">
                {importResult.created} new domains created · {importResult.existing} already existed
                {importResult.errors?.length > 0 && <span className="text-warn"> · {importResult.errors.length} errors</span>}
              </div>
            </div>
          </div>
          <button onClick={() => setImportResult(null)}><X size={13} className="text-muted" /></button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => {
          if (e.target.files[0] && uploadTargetId) handleFileUpload(uploadTargetId, e.target.files[0])
          e.target.value = ''
        }}
      />

      {/* Index list */}
      {indexes.length === 0 ? (
        <div className="card p-10 text-center text-sm text-muted">No indexes yet. Create one to start importing domains.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {indexes.map(idx => {
            const count = Array.isArray(idx.domain_count) ? idx.domain_count[0]?.count : (idx.domain_count?.count || 0)
            return (
              <div key={idx.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layers size={16} className="text-accent flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-primary">{idx.name}</div>
                      <div className="text-[10px] text-muted mt-0.5">{idx.key} · {idx.year || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-light text-primary">{count || 0}</div>
                      <div className="stat-label">domains</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setUploadTargetId(idx.id); setTimeout(() => fileRef.current?.click(), 0) }}
                        disabled={importing && importIndexId === idx.id}
                        className="btn-secondary flex items-center gap-2 text-xs"
                      >
                        <Upload size={12} />
                        {importing && importIndexId === idx.id ? 'Importing…' : 'Import CSV'}
                      </button>
                    </div>
                  </div>
                </div>
                {idx.description && <p className="text-xs text-muted mt-3 ml-7">{idx.description}</p>}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 card p-4">
        <div className="text-xs font-medium text-primary mb-2">CSV Format</div>
        <p className="text-xs text-muted mb-2">Upload a CSV file with the following columns (header row required):</p>
        <code className="text-xs text-accent/80 block bg-black/20 rounded px-3 py-2">domain,company_name,country,sector,rank</code>
        <p className="text-xs text-muted mt-2">Only <code className="text-accent/70">domain</code> is required. Existing domains are reused — no duplicates created.</p>
      </div>
    </div>
  )
}
