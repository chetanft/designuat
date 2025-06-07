import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'

export default function Dashboard() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch('/api/health')
      return response.json()
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports')
      return response.json()
    }
  })

  const stats = [
    {
      name: 'Total Comparisons',
      value: reports?.reports?.length || 0,
      icon: ChartBarIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Recent Reports',
      value: reports?.reports?.filter((r: any) => {
        const created = new Date(r.created || r.timestamp)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return created > dayAgo
      }).length || 0,
      icon: DocumentTextIcon,
      color: 'bg-green-500'
    },
    {
      name: 'System Status',
      value: health?.status === 'healthy' ? 'Healthy' : 'Issues',
      icon: health?.status === 'healthy' ? CheckCircleIcon : ExclamationTriangleIcon,
      color: health?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome to Design QA</h2>
        <p className="text-indigo-100">
          Compare your Figma designs with live web implementations to ensure pixel-perfect accuracy.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
          <div className="space-y-3">
            {reports?.reports?.slice(0, 5).map((report: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{report.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(report.created || report.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={report.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View
                </a>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No reports generated yet</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                health?.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {health?.status || 'Unknown'}
              </span>
            </div>
            
            {health?.figma && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Figma Integration</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  health.figma.connectionType !== 'none'
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {health.figma.connectionType || 'Not configured'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-sm text-gray-500">
                {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary text-left p-4 h-auto">
            <div>
              <h4 className="font-medium">New Comparison</h4>
              <p className="text-sm text-indigo-200 mt-1">Start comparing designs</p>
            </div>
          </button>
          
          <button className="btn-secondary text-left p-4 h-auto">
            <div>
              <h4 className="font-medium">View Reports</h4>
              <p className="text-sm text-gray-600 mt-1">Browse past comparisons</p>
            </div>
          </button>
          
          <button className="btn-secondary text-left p-4 h-auto">
            <div>
              <h4 className="font-medium">Settings</h4>
              <p className="text-sm text-gray-600 mt-1">Configure integrations</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
} 