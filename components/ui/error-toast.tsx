"use client"

import { useEffect } from 'react'
import { useError } from '@/components/providers/error-provider'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'

export function ErrorToast() {
  const { error, clearError, isLoading } = useError()

  useEffect(() => {
    if (error) {
      // Auto-dismiss non-critical errors after 10 seconds
      const timer = setTimeout(() => {
        if (error.code !== 'INTERNAL_ERROR' && error.code !== 'DATABASE_ERROR') {
          clearError()
        }
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  if (!error && !isLoading) {
    return null
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
        <GlassCard className="p-4 max-w-md">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            <span className="text-sm">Processing...</span>
          </div>
        </GlassCard>
      </div>
    )
  }

  if (!error) return null

  const isRetryable = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'].includes(error.code || '')

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
      <GlassCard className="p-4 max-w-md shadow-lg border-l-4 border-l-red-500">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {error.title}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {error.message}
            </p>
            
            <div className="flex items-center space-x-2">
              {isRetryable && (
                <Button
                  onClick={() => window.location.reload()}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
              
              <Button
                onClick={clearError}
                size="sm"
                variant="ghost"
                className="text-xs h-7"
              >
                Dismiss
              </Button>
            </div>
          </div>
          
          <Button
            onClick={clearError}
            size="sm"
            variant="ghost"
            className="flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        {error.code && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Error Code: {error.code}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}