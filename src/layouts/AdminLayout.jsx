import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import {
  Shield, LayoutDashboard, Globe, FlaskConical, Link2,
  Play, ChevronLeft, Menu, ExternalLink
} from 'lucide-react'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/domains', icon: Globe, label: 'Domains' },
  { to: '/admin/test-types', icon: FlaskConical, label: 'Test Types' },
  { to: '/admin/domain-tests', icon: Link2, label: 'Domain Tests' },
  { to: '/admin/runs', icon: Play, label: 'Runs' },
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col border-r border-void transition-all duration-200"
        style={{
          width: collapsed ? 56 : 220,
          background: '#090d1a',
        }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-void flex-shrink-0 gap-3 overflow-hidden">
          <Shield size={18} className="text-accent flex-shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-xs font-medium tracking-[0.15em] uppercase text-primary leading-tight">PQC Tracker</div>
              <div className="text-[10px] tracking-[0.12em] uppercase text-muted">Admin Console</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-0.5 px-2 overflow-hidden">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 rounded-sm transition-all duration-100 group ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-secondary hover:text-primary hover:bg-white/[0.03]'
                }`
              }
              title={collapsed ? label : ''}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-xs tracking-wider uppercase overflow-hidden whitespace-nowrap">{label}</span>
                  )}
                  {!collapsed && isActive && (
                    <div className="ml-auto w-1 h-1 rounded-full bg-accent" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-void p-2 flex flex-col gap-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-2 py-2 text-muted hover:text-secondary transition-colors"
            title="Public Site"
          >
            <ExternalLink size={13} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs tracking-wider uppercase">Public Site</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-2 py-2 text-muted hover:text-secondary transition-colors w-full"
          >
            <ChevronLeft size={13} className={`flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span className="text-xs tracking-wider uppercase">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
