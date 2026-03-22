import React from 'react'
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react'

export function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={20} className="text-accent animate-spin" />
      <p className="text-xs tracking-widest uppercase text-muted">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle size={20} className="text-warn" />
      <p className="text-sm text-secondary text-center max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost flex items-center gap-2">
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message = 'No data found', icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      {icon && <div className="text-muted">{icon}</div>}
      <p className="text-xs tracking-widest uppercase text-muted">{message}</p>
    </div>
  )
}

export function Alert({ type = 'info', children, onClose }) {
  const styles = {
    info: 'border-accent/30 bg-accent/5 text-accent',
    success: 'border-signal/30 bg-signal/5 text-signal',
    warn: 'border-warn/30 bg-warn/5 text-warn',
    error: 'border-critical/30 bg-critical/5 text-critical',
  }
  return (
    <div className={`border px-4 py-3 text-sm flex items-start gap-3 ${styles[type]}`} style={{borderRadius:2}}>
      <span className="flex-1">{children}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">✕</button>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 'max-w-xl' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`card w-full ${width} animate-slide-up`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-void">
          <h2 className="text-sm font-medium tracking-wide text-primary">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary text-lg leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      style={{ background: 'rgba(5,8,16,0.7)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card w-full max-w-2xl flex flex-col animate-slide-up"
        style={{ borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-void flex-shrink-0">
          <h2 className="text-sm font-medium tracking-wide text-primary">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-secondary text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function FormField({ label, error, children, hint }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="text-muted text-xs mt-1">{hint}</p>}
      {error && <p className="text-critical text-xs mt-1">{error}</p>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
        style={{ background: checked ? '#00d4ff' : '#1a2235' }}
      >
        <div
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: checked ? '#050810' : '#4a5568',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
          }}
        />
      </div>
      {label && <span className="text-xs text-secondary">{label}</span>}
    </label>
  )
}

export function CodeBlock({ data }) {
  if (!data) return <span className="text-muted text-xs">—</span>
  let display
  try {
    display = typeof data === 'string' ? JSON.stringify(JSON.parse(data), null, 2) : JSON.stringify(data, null, 2)
  } catch {
    display = String(data)
  }
  return (
    <pre
      className="text-xs text-accent/80 bg-void p-4 overflow-auto"
      style={{ maxHeight: 320, borderRadius: 2, border: '1px solid #1a2235', fontFamily: 'IBM Plex Mono, monospace' }}
    >
      {display}
    </pre>
  )
}

export function Pill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs tracking-wider uppercase px-3 py-1 transition-all"
      style={{
        border: '1px solid',
        borderColor: active ? '#00d4ff' : '#1a2235',
        color: active ? '#00d4ff' : '#4a5568',
        background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
        borderRadius: 2,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span className="badge-neutral">N/A</span>
  let cls = 'badge-critical'
  if (score >= 80) cls = 'badge-success'
  else if (score >= 50) cls = 'badge-warn'
  return <span className={cls}>{score}</span>
}

export function StatusBadge({ status }) {
  if (!status) return <span className="badge-neutral">unknown</span>
  const s = status.toLowerCase()
  let cls = 'badge-neutral'
  if (s === 'pass' || s === 'passed' || s === 'success' || s === 'completed') cls = 'badge-success'
  else if (s === 'fail' || s === 'failed' || s === 'error') cls = 'badge-critical'
  else if (s === 'running' || s === 'pending') cls = 'badge-info'
  else if (s === 'warn' || s === 'warning') cls = 'badge-warn'
  return <span className={cls}>{status}</span>
}

export function ActiveBadge({ active }) {
  return active
    ? <span className="badge-success">active</span>
    : <span className="badge-neutral">inactive</span>
}
