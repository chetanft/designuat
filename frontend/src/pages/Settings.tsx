import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm, Controller } from 'react-hook-form'
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  ServerIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  KeyIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { PLACEHOLDER_TEXT, PLACEHOLDER_URLS, getPlaceholder } from '../constants/placeholders'

interface SettingsForm {
  // General Settings
  defaultTimeout: number
  maxConcurrentComparisons: number
  autoDeleteOldReports: boolean
  reportRetentionDays: number
  
  // Figma Settings
  figmaPersonalAccessToken: string
  defaultFigmaExportFormat: 'svg' | 'png'
  figmaExportScale: number
  
  // MCP Settings
  mcpConnectionMethod: 'api' | 'mcp-server' | 'mcp-tools' | 'none'
  mcpServerUrl: string
  mcpEndpoint: string
  mcpToolsEnvironment: 'auto' | 'global' | 'local'
  
  // Web Scraping Settings
  defaultViewport: {
    width: number
    height: number
  }
  userAgent: string
  enableJavaScript: boolean
  waitForNetworkIdle: boolean
  
  // Visual Comparison Settings
  pixelMatchThreshold: number
  includeAntiAliasing: boolean
  ignoreColors: boolean
  
  // Notifications
  emailNotifications: boolean
  slackWebhook: string
  notifyOnCompletion: boolean
  notifyOnError: boolean
}

// Settings form placeholders
const SETTINGS_PLACEHOLDERS = {
  figmaToken: getPlaceholder('token'),
  webhookUrl: 'https://hooks.slack.com/services/...',
  mcpServerUrl: PLACEHOLDER_URLS.api.mcpServer,
  searchReports: 'Search reports by name, date, or status...'
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isLoading, setIsLoading] = useState(true)

  const { control, handleSubmit, formState: { errors, isDirty }, reset } = useForm<SettingsForm>({
    defaultValues: {
      defaultTimeout: 30000,
      maxConcurrentComparisons: 3,
      autoDeleteOldReports: false,
      reportRetentionDays: 30,
      figmaPersonalAccessToken: '',
      defaultFigmaExportFormat: 'svg',
      figmaExportScale: 2,
      mcpConnectionMethod: 'none',
      mcpServerUrl: 'http://127.0.0.1:3845',
      mcpEndpoint: '/sse',
      mcpToolsEnvironment: 'auto',
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      enableJavaScript: true,
      waitForNetworkIdle: true,
      pixelMatchThreshold: 0.1,
      includeAntiAliasing: true,
      ignoreColors: false,
      emailNotifications: false,
      slackWebhook: '',
      notifyOnCompletion: true,
      notifyOnError: true
    }
  })

  // Load current settings on component mount
  useEffect(() => {
    loadCurrentSettings()
  }, [])

  const loadCurrentSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/current')
      const result = await response.json()
      
      if (result.success && result.settings) {
        const settings = result.settings
        
        // Map backend settings to form format
        const formData: Partial<SettingsForm> = {
          mcpConnectionMethod: settings.method || 'none',
          mcpServerUrl: settings.mcpServer?.url || 'http://127.0.0.1:3845',
          mcpEndpoint: settings.mcpServer?.endpoint || '/sse',
          mcpToolsEnvironment: settings.mcpTools?.environment || 'auto',
          figmaPersonalAccessToken: settings.figmaApi?.hasToken ? '••••••••' : ''
        }
        
        // Update form with loaded settings
        reset(current => ({ ...current, ...formData }))
      }
    } catch (error) {
      console.error('Failed to load current settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testMCPConnection = async (method: string, serverUrl?: string, endpoint?: string, environment?: string) => {
    try {
      const testConfig = {
        method,
        serverUrl,
        endpoint,
        environment
      }

      const response = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testConfig),
      })

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Connection test failed:', error)
      return { success: false, error: 'Connection test failed' }
    }
  }

  const onSubmit = async (data: SettingsForm) => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // Prepare settings data for backend
      const settingsData = {
        ...data,
        // Map MCP settings to backend format
        method: data.mcpConnectionMethod,
        serverUrl: data.mcpServerUrl,
        endpoint: data.mcpEndpoint,
        environment: data.mcpToolsEnvironment,
        accessToken: data.figmaPersonalAccessToken
      }

      const response = await fetch('/api/settings/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings')
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Settings save error:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'figma', name: 'Figma', icon: DocumentTextIcon },
    { id: 'mcp', name: 'MCP Integration', icon: ServerIcon },
    { id: 'web', name: 'Web Scraping', icon: GlobeAltIcon },
    { id: 'visual', name: 'Visual Comparison', icon: EyeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ]

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Loading settings...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure your comparison tool preferences and integrations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* General Settings */}
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Timeout (ms)
                      </label>
                      <Controller
                        name="defaultTimeout"
                        control={control}
                        rules={{ required: 'Timeout is required', min: 1000 }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="1000"
                            step="1000"
                            className="input-field"
                          />
                        )}
                      />
                      {errors.defaultTimeout && (
                        <p className="mt-1 text-sm text-red-600">{errors.defaultTimeout.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Concurrent Comparisons
                      </label>
                      <Controller
                        name="maxConcurrentComparisons"
                        control={control}
                        rules={{ required: 'Required', min: 1, max: 10 }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="1"
                            max="10"
                            className="input-field"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Retention (days)
                      </label>
                      <Controller
                        name="reportRetentionDays"
                        control={control}
                        rules={{ required: 'Required', min: 1 }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="1"
                            className="input-field"
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center">
                      <Controller
                        name="autoDeleteOldReports"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                        )}
                      />
                      <label className="ml-3 text-sm font-medium text-gray-700">
                        Auto-delete old reports
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Figma Settings */}
              {activeTab === 'figma' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Figma Integration</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Access Token
                      </label>
                      <Controller
                        name="figmaPersonalAccessToken"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="password"
                            placeholder={SETTINGS_PLACEHOLDERS.figmaToken}
                            className="input-field"
                          />
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Get your token from Figma Settings → Account → Personal access tokens
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Export Format
                        </label>
                        <Controller
                          name="defaultFigmaExportFormat"
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="input-field">
                              <option value="svg">SVG (Vector)</option>
                              <option value="png">PNG (Raster)</option>
                            </select>
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Export Scale
                        </label>
                        <Controller
                          name="figmaExportScale"
                          control={control}
                          render={({ field }) => (
                            <select {...field} className="input-field">
                              <option value={1}>1x</option>
                              <option value={2}>2x</option>
                              <option value={3}>3x</option>
                              <option value={4}>4x</option>
                            </select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* MCP Integration Settings */}
              {activeTab === 'mcp' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">MCP Integration</h3>
                  <p className="text-gray-600 mb-6">
                    Configure how the application connects to Figma using Model Context Protocol (MCP) or direct API access.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connection Method
                      </label>
                      <Controller
                        name="mcpConnectionMethod"
                        control={control}
                        render={({ field }) => (
                          <select {...field} className="input-field">
                            <option value="none">No Connection</option>
                            <option value="api">Direct Figma API</option>
                            <option value="mcp-server">MCP Server (Advanced)</option>
                            <option value="mcp-tools">MCP Tools (Expert)</option>
                          </select>
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Choose how to connect to Figma. API is recommended for most users.
                      </p>
                    </div>

                    {/* MCP Server Configuration - Conditional */}
                    <Controller
                      name="mcpConnectionMethod"
                      control={control}
                      render={({ field: methodField }) => (
                        <div className="space-y-4">
                          {(methodField.value === 'mcp-server') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  MCP Server URL
                                </label>
                                <Controller
                                  name="mcpServerUrl"
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="url"
                                      placeholder={SETTINGS_PLACEHOLDERS.mcpServerUrl}
                                      className="input-field"
                                    />
                                  )}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Endpoint Path
                                </label>
                                <Controller
                                  name="mcpEndpoint"
                                  control={control}
                                  render={({ field }) => (
                                    <input
                                      {...field}
                                      type="text"
                                      placeholder="/sse"
                                      className="input-field"
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          )}

                          {(methodField.value === 'mcp-tools') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                MCP Tools Environment
                              </label>
                              <Controller
                                name="mcpToolsEnvironment"
                                control={control}
                                render={({ field }) => (
                                  <select {...field} className="input-field">
                                    <option value="auto">Auto-detect</option>
                                    <option value="global">Global MCP Tools</option>
                                    <option value="local">Local Installation</option>
                                  </select>
                                )}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    />

                    {/* Connection Method Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">🔑 Direct API</h4>
                        <p className="text-sm text-blue-700">
                          Uses your personal Figma access token. Simple and reliable for most use cases.
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">🖥️ MCP Server</h4>
                        <p className="text-sm text-yellow-700">
                          Connects to Figma Desktop App's MCP server. Requires server to be running.
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">🔧 MCP Tools</h4>
                        <p className="text-sm text-purple-700">
                          Uses third-party MCP tools. For advanced users with custom MCP setups.
                        </p>
                      </div>
                    </div>

                    {/* Test Connection Button */}
                    <div className="flex space-x-4">
                      <Controller
                        name="mcpConnectionMethod"
                        control={control}
                        render={({ field }) => (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={async () => {
                              const method = field.value
                              if (method === 'none') {
                                alert('Please select a connection method first')
                                return
                              }
                              
                              const formData = control._formValues
                              const result = await testMCPConnection(
                                method,
                                formData.mcpServerUrl,
                                formData.mcpEndpoint,
                                formData.mcpToolsEnvironment
                              )
                              
                              if (result.success) {
                                alert(`✅ Connection successful!\n${result.message || 'Connection established'}`)
                              } else {
                                alert(`❌ Connection failed!\n${result.error || 'Unknown error'}`)
                              }
                            }}
                          >
                            🔍 Test Connection
                          </button>
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Web Scraping Settings */}
              {activeTab === 'web' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Web Scraping Configuration</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Viewport Width
                        </label>
                        <Controller
                          name="defaultViewport.width"
                          control={control}
                          rules={{ required: 'Required', min: 320 }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min="320"
                              className="input-field"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Viewport Height
                        </label>
                        <Controller
                          name="defaultViewport.height"
                          control={control}
                          rules={{ required: 'Required', min: 240 }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min="240"
                              className="input-field"
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Agent
                      </label>
                      <Controller
                        name="userAgent"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className="input-field"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Controller
                          name="enableJavaScript"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Enable JavaScript
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Controller
                          name="waitForNetworkIdle"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Wait for network idle
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Visual Comparison Settings */}
              {activeTab === 'visual' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Visual Comparison</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pixel Match Threshold (0-1)
                      </label>
                      <Controller
                        name="pixelMatchThreshold"
                        control={control}
                        rules={{ required: 'Required', min: 0, max: 1 }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min="0"
                            max="1"
                            step="0.01"
                            className="input-field"
                          />
                        )}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Lower values = more strict matching
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Controller
                          name="includeAntiAliasing"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Include anti-aliasing in comparison
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Controller
                          name="ignoreColors"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Ignore colors (structure-only comparison)
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Notifications</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slack Webhook URL
                      </label>
                      <Controller
                        name="slackWebhook"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="url"
                            placeholder={SETTINGS_PLACEHOLDERS.webhookUrl}
                            className="input-field"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Controller
                          name="emailNotifications"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Enable email notifications
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Controller
                          name="notifyOnCompletion"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Notify on comparison completion
                        </label>
                      </div>

                      <div className="flex items-center">
                        <Controller
                          name="notifyOnError"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          )}
                        />
                        <label className="ml-3 text-sm font-medium text-gray-700">
                          Notify on errors
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="card"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Security & Privacy</h3>
                  
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Security Notice</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Sensitive data like API tokens are encrypted at rest. Never share your configuration files or tokens.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          // Clear all stored tokens/credentials
                          if (confirm('This will clear all stored API tokens and credentials. Continue?')) {
                            // Implementation would go here
                          }
                        }}
                      >
                        Clear All Stored Credentials
                      </button>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          // Export settings (without sensitive data)
                          const settings = { /* sanitized settings */ }
                          const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'comparison-tool-settings.json'
                          a.click()
                        }}
                      >
                        Export Settings (Safe)
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Save Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  {saveStatus === 'success' && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Settings saved successfully</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">Failed to save settings</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => window.location.reload()}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={!isDirty || isSaving}
                    className="btn-primary flex items-center space-x-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Settings</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 