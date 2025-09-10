"use client"

import { Component, ReactNode, ErrorInfo } from 'react'
import { errorLogger } from '@/lib/error-handling'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorId: null 
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date(),
      errorId: this.state.errorId,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      context: {
        reactErrorInfo: errorInfo,
        errorBoundary: true
      }
    }

    try {
      await errorLogger.logError({
        message: `React Error Boundary: ${error.message}`,
        code: 'REACT_ERROR_BOUNDARY',
        statusCode: 500,
        timestamp: new Date(),
        url: errorDetails.url,
        userAgent: errorDetails.userAgent,
        stack: error.stack,
        context: errorDetails.context
      })
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorId: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  handleReportError = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }

    const mailtoLink = `mailto:support@coachflow.app?subject=Error Report - ${this.state.errorId}&body=${encodeURIComponent(
      `Error ID: ${errorDetails.errorId}\n` +
      `Time: ${errorDetails.timestamp}\n` +
      `Page: ${errorDetails.url}\n` +
      `Message: ${errorDetails.message}\n\n` +
      `Please describe what you were doing when this error occurred:\n\n`
    )}`

    if (typeof window !== 'undefined') {
      window.open(mailtoLink)
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <GlassCard className="max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>
              
              {this.props.showDetails && this.state.error && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                  <p className="text-sm font-mono text-gray-700">
                    {this.state.error.message}
                  </p>
                  {this.state.errorId && (
                    <p className="text-xs text-gray-500 mt-2">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReload} 
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
                
                <Button
                  onClick={this.handleReportError}
                  variant="outline"
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-6">
              If this problem persists, please contact our support team with Error ID: {this.state.errorId}
            </p>
          </GlassCard>
        </div>
      )
    }

    return this.props.children
  }
}