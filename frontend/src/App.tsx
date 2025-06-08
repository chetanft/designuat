import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import Dashboard from './pages/Dashboard'
import NewComparison from './pages/NewComparison'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { Page } from './types'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  // Map URL paths to page types
  const getPageFromPath = (pathname: string): Page => {
    if (pathname.includes('new-comparison')) {
      return 'comparison'
    }
    if (pathname.includes('reports')) {
      return 'reports'
    }
    if (pathname.includes('settings')) {
      return 'settings'
    }
    return 'dashboard'
  }

  const currentPage = getPageFromPath(location.pathname)

  const handlePageChange = (page: Page) => {
    switch (page) {
      case 'dashboard':
        navigate('/')
        break
      case 'comparison':
        navigate('/new-comparison')
        break
      case 'reports':
        navigate('/reports')
        break
      case 'settings':
        navigate('/settings')
        break
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ErrorBoundary fallback={
        <div className="w-64 bg-white border-r border-gray-200 flex items-center justify-center">
          <p className="text-sm text-gray-500">Sidebar error</p>
        </div>
      }>
      <Sidebar 
        currentPage={currentPage} 
          onPageChange={handlePageChange}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      </ErrorBoundary>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ErrorBoundary fallback={
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">Header error</p>
          </div>
        }>
        <Header 
          currentPage={currentPage}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        </ErrorBoundary>
        
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
                <Routes>
                  {/* Root routes */}
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/new-comparison" element={<NewComparison />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Modern UI routes with /modern prefix */}
                  <Route path="/modern" element={<Dashboard />} />
                  <Route path="/modern/" element={<Dashboard />} />
                  <Route path="/modern/new-comparison" element={<NewComparison />} />
                  <Route path="/modern/reports" element={<Reports />} />
                  <Route path="/modern/settings" element={<Settings />} />
                  
                  {/* Fallback to dashboard */}
                  <Route path="*" element={<Dashboard />} />
                </Routes>
            </motion.div>
          </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  )
}

export default App 