import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getWebSocketUrl } from '../utils/environment'

interface UseWebSocketOptions {
  url?: string
  autoConnect?: boolean
}

interface ComparisonProgress {
  id: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  stage: string
  message: string
  timestamp: string
  details?: {
    figmaProgress?: number
    webProgress?: number
    comparisonProgress?: number
    currentStep?: string
    totalSteps?: number
    estimatedTimeRemaining?: number
  }
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url = options.url || getWebSocketUrl(), autoConnect = true } = options
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!autoConnect) return

    // Initialize socket connection
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      retries: 3
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected')
      setIsConnected(true)
      setConnectionError(null)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [url, autoConnect])

  const joinComparison = (comparisonId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-comparison', comparisonId)
    }
  }

  const leaveComparison = (comparisonId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-comparison', comparisonId)
    }
  }

  const onComparisonProgress = (callback: (progress: ComparisonProgress) => void) => {
    if (socketRef.current) {
      socketRef.current.on('comparison-progress', callback)
      return () => {
        socketRef.current?.off('comparison-progress', callback)
      }
    }
    return () => {}
  }

  const onComparisonComplete = (callback: (result: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('comparison-complete', callback)
      return () => {
        socketRef.current?.off('comparison-complete', callback)
      }
    }
    return () => {}
  }

  const onComparisonError = (callback: (error: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('comparison-error', callback)
      return () => {
        socketRef.current?.off('comparison-error', callback)
      }
    }
    return () => {}
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      setIsConnected(false)
    }
  }

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect()
    }
  }

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    joinComparison,
    leaveComparison,
    onComparisonProgress,
    onComparisonComplete,
    onComparisonError,
    disconnect,
    reconnect
  }
}

export type { ComparisonProgress } 