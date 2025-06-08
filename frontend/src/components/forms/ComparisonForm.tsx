import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../../services/api'
import {
  DocumentTextIcon,
  GlobeAltIcon,
  CogIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { ComparisonRequest, ComparisonResult } from '../../types'
// Define form input placeholders
const FORM_PLACEHOLDERS = {
  figmaUrl: 'https://www.figma.com/design/...',
  webUrl: 'https://example.com',
  cssSelector: '.main-content, #header, [data-testid="component"]',
  loginUrl: 'https://example.com/login',
  username: 'your-username',
  password: 'your-password',
  successIndicator: '.dashboard, .profile-menu, .user-menu'
}

interface ComparisonFormProps {
  onSuccess?: (result: ComparisonResult) => void
  onComparisonStart?: (comparisonId: string) => void
}

export default function ComparisonForm({ onSuccess, onComparisonStart }: ComparisonFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [authType, setAuthType] = useState<'none' | 'credentials' | 'cookies' | 'headers'>('none')
  const queryClient = useQueryClient()

  const { control, handleSubmit, watch, formState: { errors }, reset } = useForm<ComparisonRequest>({
    defaultValues: {
      figmaUrl: '',
      webUrl: '',
      webSelector: '',
      includeVisual: true,
      authentication: {
        type: 'credentials',
        loginUrl: '',
        username: '',
        password: '',
        waitTime: 3000,
        successIndicator: ''
      }
    }
  })

  const comparisonMutation = useMutation({
    mutationFn: async (data: ComparisonRequest) => {
      const payload = {
        figmaUrl: data.figmaUrl,
        webUrl: data.webUrl,
        nodeId: null,
        authentication: authType === 'none' ? null : data.authentication,
        includeVisual: data.includeVisual
      }

      console.log('🚀 Sending comparison request:', payload)

      const result = await apiService.post('/api/compare', payload) as ComparisonResult
      
      console.log('📊 Received comparison result:', result)
      
      // Use the comparison ID from the metadata or generate one
      const comparisonId = result.metadata?.comparisonId || result.comparisonId || `comparison_${Date.now()}`
      
      if (onComparisonStart) {
        onComparisonStart(comparisonId)
      }
      
      // Add the comparisonId to the result for consistency
      return {
        ...result,
        comparisonId
      }
    },
    onSuccess: (result) => {
      console.log('✅ Comparison mutation successful, calling onSuccess:', result)
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      onSuccess?.(result)
    },
    onError: (error) => {
      console.error('❌ Comparison mutation failed:', error)
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000)
  })

  const onSubmit = (data: ComparisonRequest) => {
    comparisonMutation.mutate(data)
  }

  const figmaUrl = watch('figmaUrl')
  const webUrl = watch('webUrl')

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">New Comparison</h2>
          <p className="text-gray-600">Compare your Figma designs with live web implementations</p>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Figma Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Figma Design</h3>
                <p className="text-sm text-gray-500">Paste your Figma file or frame URL</p>
              </div>
            </div>

            <Controller
              name="figmaUrl"
              control={control}
              rules={{
                required: 'Figma URL is required',
                pattern: {
                  value: /^https:\/\/www\.figma\.com\/(file|design)\/[a-zA-Z0-9]+/,
                  message: 'Please enter a valid Figma URL'
                }
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="url"
                    placeholder={FORM_PLACEHOLDERS.figmaUrl}
                    className={`input-field ${errors.figmaUrl ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.figmaUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.figmaUrl.message}</p>
                  )}
                </div>
              )}
            />

            {figmaUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-purple-50 rounded-lg"
              >
                <p className="text-sm text-purple-700">
                  ✓ Valid Figma URL detected
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Web Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <GlobeAltIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Web Implementation</h3>
                <p className="text-sm text-gray-500">Enter the live website URL</p>
              </div>
            </div>

            <Controller
              name="webUrl"
              control={control}
              rules={{
                required: 'Web URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              }}
              render={({ field }) => (
                <div>
                  <input
                    {...field}
                    type="url"
                    placeholder={FORM_PLACEHOLDERS.webUrl}
                    className={`input-field ${errors.webUrl ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.webUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.webUrl.message}</p>
                  )}
                </div>
              )}
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSS Selector (Optional)
              </label>
              <Controller
                name="webSelector"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder={FORM_PLACEHOLDERS.cssSelector}
                    className="input-field"
                  />
                )}
              />
              <p className="mt-1 text-xs text-gray-500">
                Specify a CSS selector to focus on specific elements
              </p>
            </div>

            {webUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 p-3 bg-blue-50 rounded-lg"
              >
                <p className="text-sm text-blue-700">
                  ✓ Valid web URL detected
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Advanced Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card"
        >
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <CogIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Advanced Options</h3>
                <p className="text-sm text-gray-500">Authentication, visual comparison settings</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-6"
              >
                {/* Authentication */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Authentication Required?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'none', label: 'None', desc: 'Public page' },
                      { value: 'credentials', label: 'Login', desc: 'Username/Password' },
                      { value: 'cookies', label: 'Cookies', desc: 'Session cookies' },
                      { value: 'headers', label: 'Headers', desc: 'Custom headers' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAuthType(option.value as any)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          authType === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Authentication Details */}
                {authType === 'credentials' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Login URL
                      </label>
                      <Controller
                        name="authentication.loginUrl"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="url"
                            placeholder={FORM_PLACEHOLDERS.loginUrl}
                            className="input-field"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Success Indicator
                      </label>
                      <Controller
                        name="authentication.successIndicator"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder={FORM_PLACEHOLDERS.successIndicator}
                            className="input-field"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <Controller
                        name="authentication.username"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder={FORM_PLACEHOLDERS.username}
                            className="input-field"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <Controller
                        name="authentication.password"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="password"
                            placeholder={FORM_PLACEHOLDERS.password}
                            className="input-field"
                          />
                        )}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Visual Comparison Options */}
                <div>
                  <label className="flex items-center space-x-3">
                    <Controller
                      name="includeVisual"
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
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Include Visual Comparison
                      </span>
                      <p className="text-xs text-gray-500">
                        Generate pixel-perfect visual diff images
                      </p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            type="button"
            onClick={() => reset()}
            className="btn-secondary flex items-center justify-center space-x-2"
            disabled={comparisonMutation.isPending}
          >
            <XMarkIcon className="w-5 h-5" />
            <span>Reset Form</span>
          </button>

          <button
            type="submit"
            disabled={comparisonMutation.isPending || !figmaUrl || !webUrl}
            className="btn-primary flex items-center justify-center space-x-2 min-w-[200px]"
          >
            {comparisonMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Comparison...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-5 h-5" />
                <span>Start Comparison</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Status Messages */}
        <AnimatePresence>
          {comparisonMutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Comparison Failed</h4>
                <p className="text-sm text-red-600">
                  {comparisonMutation.error?.message || 'An unexpected error occurred'}
                </p>
              </div>
            </motion.div>
          )}

          {comparisonMutation.isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800">Comparison Complete!</h4>
                <p className="text-sm text-green-600">
                  Your comparison has been generated successfully.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
} 