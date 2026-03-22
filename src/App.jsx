import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'

// Public pages
import HomePage from './pages/public/HomePage.jsx'
import TestDomainPage from './pages/public/TestDomainPage.jsx'
import ExplorePage from './pages/public/ExplorePage.jsx'
import SubmitDomainPage from './pages/public/SubmitDomainPage.jsx'
import DomainDetailPage from './pages/public/DomainDetailPage.jsx'

// Admin pages
import DashboardPage from './pages/admin/DashboardPage.jsx'
import DomainsPage from './pages/admin/DomainsPage.jsx'
import TestTypesPage from './pages/admin/TestTypesPage.jsx'
import DomainTestsPage from './pages/admin/DomainTestsPage.jsx'
import RunsPage from './pages/admin/RunsPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<TestDomainPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/submit" element={<SubmitDomainPage />} />
          <Route path="/domain/:id" element={<DomainDetailPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="domains" element={<DomainsPage />} />
          <Route path="test-types" element={<TestTypesPage />} />
          <Route path="domain-tests" element={<DomainTestsPage />} />
          <Route path="runs" element={<RunsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
