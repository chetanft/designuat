import React from 'react'

export default function NewComparison() {
  return (
    <div className="p-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">New Comparison</h2>
        <p className="text-gray-600">
          This page will contain the modern comparison form. Coming soon...
        </p>
        <div className="mt-4">
          <a 
            href="/?legacy=true" 
            className="btn-primary"
          >
            Use Legacy Comparison Form
          </a>
        </div>
      </div>
    </div>
  )
} 