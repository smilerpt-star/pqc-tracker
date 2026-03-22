import React, { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Shield, Menu, X } from 'lucide-react'

export default function PublicNav() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/test', label: 'Test Domain' },
    { to: '/explore', label: 'Explorer' },
    { to: '/submit', label: 'Submit Domain' },
  ]

  return (
    <header
      className="sticky top-0 z-40 border-b border-void"
      style={{ background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <Shield size={18} className="text-accent" />
            <div className="absolute inset-0 text-accent blur-sm opacity-40">
              <Shield size={18} />
            </div>
          </div>
          <div>
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-primary">PQC</span>
            <span className="text-xs font-light tracking-[0.12em] uppercase text-secondary ml-1">Readiness Tracker</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-xs tracking-widest uppercase px-3 py-1.5 transition-colors ${
                  isActive ? 'text-accent' : 'text-secondary hover:text-primary'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/admin"
            className="ml-4 btn-ghost text-xs"
          >
            Admin
          </Link>
        </nav>

        <button className="md:hidden text-secondary" onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-void bg-surface px-6 py-4 flex flex-col gap-3">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className="text-xs tracking-widest uppercase text-secondary py-1"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/admin" className="text-xs tracking-widest uppercase text-muted py-1" onClick={() => setOpen(false)}>
            Admin Console →
          </Link>
        </div>
      )}
    </header>
  )
}
