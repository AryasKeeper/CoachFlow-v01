/**
 * Production Error Tracking & Alerting System
 * Integrates with Sentry, custom logging, and notification systems
 */

import * as Sentry from '@sentry/nextjs'

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ErrorContext {
  userId?: string
  userRole?: string
  route?: string
  userAgent?: string
  sessionId?: string
  timestamp?: Date
  additionalData?: Record<string, unknown>
}

export interface ErrorAlert {
  id: string
  severity: ErrorSeverity
  message: string
  context: ErrorContext
  stackTrace?: string
  count: number
  firstOccurred: Date
  lastOccurred: Date
}

class ErrorTracker {
  private static instance: ErrorTracker
  private errorCounts: Map<string, number> = new Map()
  private alertThresholds = {
    low: { count: 50, timeWindow: 60 * 60 * 1000 }, // 50 errors/hour
    medium: { count: 25, timeWindow: 60 * 60 * 1000 }, // 25 errors/hour  
    high: { count: 10, timeWindow: 60 * 60 * 1000 }, // 10 errors/hour
    critical: { count: 1, timeWindow: 5 * 60 * 1000 } // 1 error/5min
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker()
    }
    return ErrorTracker.instance
  }

  /**
   * Initialize error tracking with production configuration
   */
  initialize() {
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 0.1,
        beforeSend: (event, hint) => this.enrichErrorEvent(event as Sentry.ErrorEvent) as Sentry.ErrorEvent | null,
        beforeSendTransaction: (transaction) => {
          // Filter out health check transactions to reduce noise
          const transactionName = (transaction as any).transaction || (transaction as any).name
          if (transactionName?.includes('/api/health')) {
            return null
          }
          return transaction
        }
      })
    }
  }

  /**
   * Track application error with automatic severity detection and alerting
   */
  trackError(
    error: Error | string,
    context: ErrorContext = {},
    severity?: ErrorSeverity
  ) {
    const errorMessage = typeof error === 'string' ? error : error.message
    const stackTrace = typeof error === 'string' ? undefined : error.stack
    
    // Auto-detect severity if not provided
    const detectedSeverity = severity || this.detectSeverity(errorMessage, context)
    
    // Create enhanced context
    const enhancedContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
      route: context.route || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      additionalData: {
        ...context.additionalData,
        severity: detectedSeverity
      }
    }

    // Track in Sentry (production)
    if (process.env.NODE_ENV === 'production') {
      Sentry.withScope(scope => {
        scope.setLevel(this.mapSeverityToSentryLevel(detectedSeverity))
        scope.setTag('severity', detectedSeverity)
        scope.setContext('error_context', enhancedContext as Record<string, any>)
        
        if (context.userId) {
          scope.setUser({ id: context.userId, role: context.userRole })
        }

        if (typeof error === 'string') {
          Sentry.captureMessage(error)
        } else {
          Sentry.captureException(error)
        }
      })
    }

    // Local development logging
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${detectedSeverity.toUpperCase()}] ${errorMessage}`, {
        context: enhancedContext,
        stackTrace
      })
    }

    // Check if alert should be triggered
    this.checkAlertThreshold(errorMessage, detectedSeverity, enhancedContext)

    // Store for analytics
    this.storeErrorMetrics(errorMessage, detectedSeverity)
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(
    operation: string,
    duration: number,
    context: ErrorContext = {}
  ) {
    if (duration > 5000) { // 5 second threshold
      this.trackError(
        `Performance issue: ${operation} took ${duration}ms`,
        { ...context, additionalData: { ...context.additionalData, performanceData: { operation, duration } } },
        'medium'
      )
    }

    // Track in Sentry as performance monitoring
    if (process.env.NODE_ENV === 'production') {
      Sentry.addBreadcrumb({
        message: `Performance: ${operation}`,
        category: 'performance',
        level: 'info',
        data: { duration, operation }
      })
    }
  }

  /**
   * Track business logic errors (e.g., coach self-acceptance)
   */
  trackBusinessLogicError(
    operation: string,
    details: Record<string, unknown>,
    context: ErrorContext = {}
  ) {
    this.trackError(
      `Business logic violation: ${operation}`,
      { ...context, additionalData: { ...context.additionalData, businessLogicData: details } },
      'high'
    )
  }

  /**
   * Track security events
   */
  trackSecurityEvent(
    eventType: string,
    details: Record<string, unknown>,
    context: ErrorContext = {}
  ) {
    this.trackError(
      `Security event: ${eventType}`,
      { ...context, additionalData: { ...context.additionalData, securityData: details } },
      'critical'
    )

    // Immediate notification for critical security events
    if (process.env.NODE_ENV === 'production') {
      this.sendImmediateAlert({
        type: 'security',
        message: `Security event: ${eventType}`,
        context,
        details
      })
    }
  }

  /**
   * Track authentication failures
   */
  trackAuthFailure(
    reason: string,
    context: ErrorContext = {}
  ) {
    this.trackError(
      `Authentication failure: ${reason}`,
      context,
      'medium'
    )
  }

  /**
   * Track database errors
   */
  trackDatabaseError(
    query: string,
    error: Error,
    context: ErrorContext = {}
  ) {
    this.trackError(
      error,
      { ...context, additionalData: { ...context.additionalData, databaseQuery: query } },
      'high'
    )
  }

  /**
   * Get error analytics for dashboard
   */
  getErrorAnalytics(timeFrame: '1h' | '24h' | '7d' = '24h') {
    // Implementation would pull from stored metrics
    // For now, return basic structure
    return {
      totalErrors: 0,
      errorsByseverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      topErrors: [],
      errorRate: 0,
      timeFrame
    }
  }

  private detectSeverity(message: string, context: ErrorContext): ErrorSeverity {
    const lowerMessage = message.toLowerCase()
    
    // Critical patterns
    if (
      lowerMessage.includes('security') ||
      lowerMessage.includes('auth') ||
      lowerMessage.includes('payment') ||
      lowerMessage.includes('database connection') ||
      lowerMessage.includes('memory') ||
      context.route?.includes('/admin')
    ) {
      return 'critical'
    }

    // High severity patterns
    if (
      lowerMessage.includes('application') ||
      lowerMessage.includes('booking') ||
      lowerMessage.includes('profile') ||
      lowerMessage.includes('business logic')
    ) {
      return 'high'
    }

    // Medium severity patterns
    if (
      lowerMessage.includes('validation') ||
      lowerMessage.includes('api') ||
      lowerMessage.includes('performance')
    ) {
      return 'medium'
    }

    return 'low'
  }

  private enrichErrorEvent(event: Sentry.Event) {
    // Add custom context to all Sentry events
    event.extra = {
      ...event.extra,
      buildVersion: process.env.npm_package_version,
      deployment: process.env.VERCEL_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown'
    }
    return event
  }

  private mapSeverityToSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
    const mapping: Record<ErrorSeverity, Sentry.SeverityLevel> = {
      low: 'info',
      medium: 'warning', 
      high: 'error',
      critical: 'fatal'
    }
    return mapping[severity]
  }

  private checkAlertThreshold(
    message: string,
    severity: ErrorSeverity,
    context: ErrorContext
  ) {
    const errorKey = `${severity}:${message}`
    const currentCount = this.errorCounts.get(errorKey) || 0
    const newCount = currentCount + 1
    this.errorCounts.set(errorKey, newCount)

    const threshold = this.alertThresholds[severity]
    if (newCount >= threshold.count) {
      this.triggerAlert({
        id: errorKey,
        severity,
        message,
        context,
        count: newCount,
        firstOccurred: new Date(Date.now() - threshold.timeWindow),
        lastOccurred: new Date()
      })
    }
  }

  private triggerAlert(alert: ErrorAlert) {
    console.error(`ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`, alert)
    
    // In production, send to notification system
    if (process.env.NODE_ENV === 'production') {
      // Slack, Discord, email, etc.
      this.sendAlertNotification(alert)
    }
  }

  private async sendAlertNotification(alert: ErrorAlert) {
    // Implementation for production notifications
    // Could integrate with Slack, Discord, PagerDuty, etc.
    
    const webhookUrl = process.env.ALERT_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CoachFlow Alert: ${alert.severity.toUpperCase()}`,
            attachments: [{
              color: alert.severity === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Message', value: alert.message, short: false },
                { title: 'Count', value: alert.count.toString(), short: true },
                { title: 'Severity', value: alert.severity, short: true }
              ]
            }]
          })
        })
      } catch (error) {
        console.error('Failed to send alert notification:', error)
      }
    }
  }

  private async sendImmediateAlert(alertData: {
    type: string
    message: string
    context: ErrorContext
    details: Record<string, unknown>
  }) {
    // Critical security events get immediate notification
    const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨🔒 SECURITY ALERT: ${alertData.message}`,
            username: 'CoachFlow Security',
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Event Type', value: alertData.type, short: true },
                { title: 'User ID', value: alertData.context.userId || 'Unknown', short: true },
                { title: 'Route', value: alertData.context.route || 'Unknown', short: true },
                { title: 'Details', value: JSON.stringify(alertData.details), short: false }
              ]
            }]
          })
        })
      } catch (error) {
        console.error('Failed to send security alert:', error)
      }
    }
  }

  private storeErrorMetrics(message: string, severity: ErrorSeverity) {
    // Store metrics for dashboard analytics
    // Implementation would store in database or analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Track errors in Google Analytics
      (window as any).gtag('event', 'exception', {
        description: message,
        fatal: severity === 'critical',
        custom_map: { severity }
      })
    }
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance()

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  errorTracker.initialize()
}

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.trackError(
      event.reason || 'Unhandled Promise Rejection',
      { route: window.location.pathname },
      'high'
    )
  })

  window.addEventListener('error', (event) => {
    errorTracker.trackError(
      event.error || event.message,
      { route: window.location.pathname },
      'medium'
    )
  })
}

// Next.js API error handler
export function withErrorTracking<T>(
  handler: (req: Request, context?: any) => Promise<T>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      errorTracker.trackError(
        error as Error,
        { 
          route: req.url,
          additionalData: {
            method: req.method
          },
          userAgent: req.headers.get('user-agent') || undefined
        },
        'high'
      )
      throw error
    }
  }
}