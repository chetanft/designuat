// Environment configuration utilities
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_WS_URL: process.env.VITE_WS_URL,
} as const

export const isDevelopment = ENV.NODE_ENV === 'development'
export const isProduction = ENV.NODE_ENV === 'production'

// API URL detection
export function getApiBaseUrl(): string {
  // Use explicit environment variable if set
  if (ENV.VITE_API_URL) {
    return ENV.VITE_API_URL
  }

  // In development with Vite dev server (port 5173)
  if (isDevelopment && window.location.port === '5173') {
    return 'http://localhost:3006'
  }

  // Use same origin for production or other cases
  return window.location.origin
}

// WebSocket URL detection
export function getWebSocketUrl(): string {
  // Use explicit environment variable if set
  if (ENV.VITE_WS_URL) {
    return ENV.VITE_WS_URL
  }

  // In development with Vite dev server
  if (isDevelopment && window.location.port === '5173') {
    return 'http://localhost:3006'
  }

  // Use same origin for production
  return window.location.origin
}

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_AI_INSIGHTS: true,
  ENABLE_REAL_TIME: true,
  ENABLE_NOTIFICATIONS: false, // Not implemented yet
  ENABLE_AUTH: false, // Not implemented yet
} as const

// Debug utilities
export function logEnvironmentInfo() {
  if (isDevelopment) {
    console.group('🔧 Environment Configuration')
    console.log('NODE_ENV:', ENV.NODE_ENV)
    console.log('API Base URL:', getApiBaseUrl())
    console.log('WebSocket URL:', getWebSocketUrl())
    console.log('Current Origin:', window.location.origin)
    console.log('Current Port:', window.location.port)
    console.log('Features:', FEATURES)
    console.groupEnd()
  }
}

// Call on app initialization
if (isDevelopment) {
  logEnvironmentInfo()
} 