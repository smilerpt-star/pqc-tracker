import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { api, setToken } from '../../lib/api.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [token, setInput] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      await api.verifyToken(token.trim())
      setToken(token.trim())
      navigate('/admin', { replace: true })
    } catch {
      setError('Invalid token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={20} className="text-accent" />
          <div>
            <div className="text-xs font-medium tracking-[0.15em] uppercase text-primary">PQC Tracker</div>
            <div className="text-[10px] tracking-[0.12em] uppercase text-muted">Admin Console</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
          <div className="text-sm text-secondary mb-2">Enter your admin token to continue.</div>

          {error && (
            <div className="text-xs text-critical bg-critical/5 border border-critical/20 px-3 py-2 rounded-sm">
              {error}
            </div>
          )}

          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={token}
              onChange={e => setInput(e.target.value)}
              placeholder="Admin token"
              className="input-field pr-10 w-full"
              autoFocus
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!token.trim() || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
