import React from 'react'
import { Outlet, Link } from 'react-router-dom'
import PublicNav from '../components/public/PublicNav.jsx'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-void flex flex-col">
      <div className="scan-line" />
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-void py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-xs tracking-widest uppercase text-muted">PQC Readiness Tracker</span>
            <span className="text-xs text-muted opacity-40">|</span>
            <span className="text-xs text-muted">External Cryptographic Posture Monitoring</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/test" className="text-xs tracking-wider uppercase text-muted hover:text-secondary transition-colors">Test a Domain</Link>
            <Link to="/explore" className="text-xs tracking-wider uppercase text-muted hover:text-secondary transition-colors">Explorer</Link>
            <Link to="/submit" className="text-xs tracking-wider uppercase text-muted hover:text-secondary transition-colors">Submit</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
