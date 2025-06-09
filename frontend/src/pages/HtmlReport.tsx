import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function HtmlReport() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHtmlReport = async () => {
      if (!reportId) {
        setError('Report ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        // Fetch the HTML content from the server
        const response = await fetch(`/output/reports/${reportId}.html`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.status} ${response.statusText}`)
        }
        
        const content = await response.text()
        setHtmlContent(content)
      } catch (err) {
        console.error('Error fetching HTML report:', err)
        setError(err instanceof Error ? err.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }

    fetchHtmlReport()
  }, [reportId])

  // Execute JavaScript functions after HTML content is loaded
  useEffect(() => {
    if (htmlContent) {
      // Wait for DOM to be updated, then execute the scripts
      setTimeout(() => {
        // Define the JavaScript functions that the HTML report needs
        (window as any).showTab = function(tabName: string) {
          console.log('showTab called:', tabName)
          
          // Hide all tab contents
          const tabContents = document.querySelectorAll('.tab-content')
          tabContents.forEach(content => {
            content.classList.remove('active')
            ;(content as HTMLElement).style.display = 'none'
          })
          
          // Remove active class from all nav tabs
          const navTabs = document.querySelectorAll('.nav-tab')
          navTabs.forEach(tab => {
            tab.classList.remove('active')
          })
          
          // Show selected tab content
          const selectedContent = document.getElementById(`${tabName}-content`)
          if (selectedContent) {
            selectedContent.classList.add('active')
            ;(selectedContent as HTMLElement).style.display = 'block'
          }
          
          // Activate the clicked nav tab
          const clickedTab = document.querySelector(`[onclick="showTab('${tabName}')"]`)
          if (clickedTab) {
            clickedTab.classList.add('active')
          }
        };

        (window as any).showMainTab = function(tabName: string) {
          console.log('showMainTab called:', tabName)
          
          // Hide all main tab contents
          const mainTabContents = document.querySelectorAll('.main-tab-content')
          mainTabContents.forEach(content => {
            content.classList.remove('active')
            ;(content as HTMLElement).style.display = 'none'
          })
          
          // Remove active class from all main nav tabs
          const mainNavTabs = document.querySelectorAll('.main-nav-tab')
          mainNavTabs.forEach(tab => {
            tab.classList.remove('active')
          })
          
          // Show selected main tab content
          const selectedContent = document.getElementById(`${tabName}-content`)
          if (selectedContent) {
            selectedContent.classList.add('active')
            ;(selectedContent as HTMLElement).style.display = 'block'
          }
          
          // Activate the clicked main nav tab
          const clickedTab = document.querySelector(`[onclick="showMainTab('${tabName}')"]`)
          if (clickedTab) {
            clickedTab.classList.add('active')
          }
        };

        (window as any).toggleAccordion = function(element: HTMLElement) {
          console.log('toggleAccordion called:', element)
          
          const accordion = element.parentElement
          if (accordion) {
            const content = accordion.querySelector('.accordion-content')
            const isOpen = accordion.classList.contains('open')
            
            if (isOpen) {
              accordion.classList.remove('open')
              if (content) {
                (content as HTMLElement).style.display = 'none'
              }
            } else {
              accordion.classList.add('open')
              if (content) {
                (content as HTMLElement).style.display = 'block'
              }
            }
          }
        };
        
        console.log('JavaScript functions attached to window')
      }, 100)
    }
  }, [htmlContent])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Report</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/reports')}
            className="btn-primary flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back to Reports</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Reports</span>
            </button>
            <h1 className="text-lg font-medium text-gray-900">
              Report: {reportId}
            </h1>
          </div>
        </div>
      </div>

      {/* HTML Report Content */}
      <div className="report-content">
        <div
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="w-full"
        />
      </div>

      <style>{`
        /* Modern UI Design System Overrides for HTML Reports - Scoped to report content only */
        .report-content {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" !important;
          line-height: 1.6 !important;
          color: #1f2937 !important;
          background-color: #f9fafb !important;
        }
        
        /* Ensure input fields outside report content are not affected */
        input:not(.report-content input), 
        select:not(.report-content select), 
        textarea:not(.report-content textarea) {
          /* Reset any global overrides for form elements outside report content */
        }
        
        .report-content body {
          margin: 0 !important;
          padding: 0 !important;
          background-color: #f9fafb !important;
        }
        
        .report-content .container {
          max-width: none !important;
          margin: 0 !important;
          padding: 24px !important;
          background-color: #f9fafb !important;
        }
        
        /* Header styling */
        .report-content .header {
          margin-top: 0 !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border-radius: 12px !important;
          padding: 32px !important;
          color: white !important;
          margin-bottom: 32px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .report-content .header h1 {
          font-size: 2.25rem !important;
          font-weight: 700 !important;
          margin: 0 !important;
          text-align: center !important;
        }
        
        /* Section styling */
        .report-content .section {
          background: white !important;
          border-radius: 12px !important;
          padding: 24px !important;
          margin-bottom: 24px !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
          border: 1px solid #e5e7eb !important;
        }
        
        .report-content .section h2 {
          font-size: 1.5rem !important;
          font-weight: 600 !important;
          color: #1f2937 !important;
          margin: 0 0 16px 0 !important;
          border-bottom: 2px solid #e5e7eb !important;
          padding-bottom: 8px !important;
        }
        
        .report-content .section h3 {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: #374151 !important;
          margin: 24px 0 16px 0 !important;
        }
        
        /* Navigation tabs - Modern styling */
        .report-content .nav-tabs {
          display: flex !important;
          border-bottom: 1px solid #e5e7eb !important;
          margin-bottom: 24px !important;
          background: #f9fafb !important;
          border-radius: 8px !important;
          padding: 4px !important;
        }
        
        .report-content .nav-tab {
          padding: 12px 20px !important;
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
          color: #6b7280 !important;
          transition: all 0.2s ease !important;
          margin-right: 4px !important;
        }
        
        .report-content .nav-tab:hover {
          background: #f3f4f6 !important;
          color: #374151 !important;
        }
        
        .report-content .nav-tab.active {
          background: #3b82f6 !important;
          color: white !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        
        /* Tab content visibility */
        .report-content .tab-content {
          display: none !important;
        }
        
        .report-content .tab-content.active {
          display: block !important;
        }
        
        .report-content .main-tab-content {
          display: none !important;
        }
        
        .report-content .main-tab-content.active {
          display: block !important;
        }
        
        /* Main navigation tabs */
        .report-content .main-nav-tabs {
          display: flex !important;
          border-bottom: 2px solid #e5e7eb !important;
          margin-bottom: 32px !important;
          background: white !important;
          border-radius: 12px 12px 0 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        
        .report-content .main-nav-tab {
          padding: 16px 24px !important;
          background: #f9fafb !important;
          border: none !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          color: #6b7280 !important;
          transition: all 0.2s ease !important;
          border-right: 1px solid #e5e7eb !important;
          font-size: 1rem !important;
        }
        
        .report-content .main-nav-tab:hover {
          background: #f3f4f6 !important;
          color: #374151 !important;
        }
        
        .report-content .main-nav-tab.active {
          background: white !important;
          color: #3b82f6 !important;
          border-bottom: 2px solid #3b82f6 !important;
          margin-bottom: -2px !important;
        }
        
        /* Component grid */
        .report-content .component-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)) !important;
          gap: 16px !important;
          margin: 16px 0 !important;
        }
        
        .report-content .component-card {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          padding: 16px !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        
        .report-content .component-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          border-color: #d1d5db !important;
        }
        
        .report-content .component-card h4 {
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: #1f2937 !important;
          margin: 0 0 8px 0 !important;
        }
        
        .report-content .component-card .meta {
          font-size: 0.875rem !important;
          color: #6b7280 !important;
          margin-bottom: 12px !important;
        }
        
        .report-content .component-card .properties {
          font-size: 0.875rem !important;
          color: #374151 !important;
        }
        
        .report-content .component-card .properties div {
          margin-bottom: 4px !important;
        }
        
        .report-content .component-card .properties strong {
          color: #1f2937 !important;
          font-weight: 500 !important;
        }
        
        /* Summary grid */
        .report-content .summary-grid {
          display: grid !important;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
          gap: 16px !important;
          margin: 24px 0 !important;
        }
        
        .report-content .summary-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          padding: 20px !important;
          border-radius: 12px !important;
          text-align: center !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        
        .report-content .summary-card h3 {
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          margin: 0 0 8px 0 !important;
          opacity: 0.9 !important;
          color: white !important;
        }
        
        .report-content .summary-card .number {
          font-size: 2rem !important;
          font-weight: 700 !important;
          display: block !important;
          margin-bottom: 4px !important;
        }
        
        .report-content .summary-card .label {
          font-size: 0.75rem !important;
          opacity: 0.8 !important;
        }
        
        /* Accordion styling */
        .report-content .accordion {
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          margin-bottom: 16px !important;
          overflow: hidden !important;
        }
        
        .report-content .accordion-header {
          background: #f9fafb !important;
          padding: 16px !important;
          cursor: pointer !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          transition: all 0.2s ease !important;
        }
        
        .report-content .accordion-header:hover {
          background: #f3f4f6 !important;
        }
        
        .report-content .accordion-header h4 {
          margin: 0 !important;
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: #1f2937 !important;
        }
        
        .report-content .accordion-icon {
          color: #6b7280 !important;
          transition: transform 0.2s ease !important;
        }
        
        .report-content .accordion.open .accordion-icon {
          transform: rotate(180deg) !important;
        }
        
        .report-content .accordion-content {
          padding: 16px !important;
          background: white !important;
          display: none !important;
        }
        
        .report-content .accordion.open .accordion-content {
          display: block !important;
        }
        
        /* Color swatches */
        .report-content .color-swatch {
          width: 32px !important;
          height: 32px !important;
          border-radius: 6px !important;
          border: 2px solid #e5e7eb !important;
          display: inline-block !important;
          margin-right: 12px !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
        }
        
        .report-content .color-value {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 0.875rem !important;
          color: #374151 !important;
          font-weight: 500 !important;
        }
        
        /* Count indicators */
        .report-content .count-indicator {
          background: #3b82f6 !important;
          color: white !important;
          font-size: 0.75rem !important;
          padding: 2px 8px !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
          margin-left: 8px !important;
        }
        
        /* Tables */
        .report-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 16px 0 !important;
          background: white !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
        }
        
        .report-content th {
          background: #f9fafb !important;
          padding: 12px !important;
          font-weight: 600 !important;
          color: #374151 !important;
          border-bottom: 1px solid #e5e7eb !important;
          text-align: left !important;
        }
        
        .report-content td {
          padding: 12px !important;
          border-bottom: 1px solid #f3f4f6 !important;
          color: #374151 !important;
        }
        
        .report-content tr:hover {
          background: #f9fafb !important;
        }
        
        /* Badges and indicators */
        .report-content .category-badge {
          background: #dbeafe !important;
          color: #1d4ed8 !important;
          padding: 2px 8px !important;
          border-radius: 12px !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          margin-left: 8px !important;
        }
        
        /* Design tokens section */
        .report-content .design-tokens-section {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 20px !important;
          margin: 24px 0 !important;
        }
        
        .report-content .design-tokens-section h3 {
          color: #1e293b !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          margin: 0 0 16px 0 !important;
          display: flex !important;
          align-items: center !important;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .report-content .container {
            padding: 16px !important;
          }
          
          .report-content .component-grid {
            grid-template-columns: 1fr !important;
          }
          
          .report-content .summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          
          .report-content .nav-tabs {
            flex-wrap: wrap !important;
          }
          
          .report-content .main-nav-tabs {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
} 