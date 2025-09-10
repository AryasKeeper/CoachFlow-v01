import { ErrorInfo, ErrorSeverity, ErrorCategory } from './types'

class ErrorLogger {
  private static instance: ErrorLogger
  private isDevelopment = process.env.NODE_ENV === 'development'

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  async logError(errorInfo: ErrorInfo): Promise<void> {
    // Always log to console in development
    if (this.isDevelopment) {
      this.logToConsole(errorInfo)
    }

    // In production, you would send to external logging service
    // Examples: DataDog, Sentry, LogRocket, CloudWatch, etc.
    try {
      await this.logToExternalService(errorInfo)
    } catch (loggingError) {
      console.error('Failed to log to external service:', loggingError)
      // Fallback to console even in production for critical errors
      if (this.isCritical(errorInfo)) {
        this.logToConsole(errorInfo)
      }
    }
  }

  private logToConsole(errorInfo: ErrorInfo): void {
    const severity = this.determineSeverity(errorInfo)
    const logMethod = this.getLogMethod(severity)
    
    const logEntry = {
      timestamp: errorInfo.timestamp.toISOString(),
      severity,
      message: errorInfo.message,
      code: errorInfo.code,
      statusCode: errorInfo.statusCode,
      userId: errorInfo.userId,
      url: errorInfo.url,
      userAgent: errorInfo.userAgent?.substring(0, 100), // Truncate long user agents
      context: errorInfo.context,
      stack: errorInfo.stack
    }

    logMethod(`[${severity.toUpperCase()}] Application Error:`, JSON.stringify(logEntry, null, 2))
  }

  private async logToExternalService(errorInfo: ErrorInfo): Promise<void> {
    // In a real application, implement your external logging service here
    // For now, we'll simulate with a mock implementation
    
    if (!this.isDevelopment && process.env.EXTERNAL_LOGGING_ENABLED === 'true') {
      // Example implementation for external service
      const payload = {
        service: 'coachflow',
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        ...errorInfo,
        timestamp: errorInfo.timestamp.toISOString()
      }

      // Mock external service call
      // await fetch(process.env.LOGGING_ENDPOINT, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
      //   },
      //   body: JSON.stringify(payload)
      // })

      console.log('[EXTERNAL_SERVICE] Would log:', payload)
    }
  }

  private determineSeverity(errorInfo: ErrorInfo): ErrorSeverity {
    // Determine severity based on status code and context
    if (errorInfo.statusCode) {
      if (errorInfo.statusCode >= 500) return ErrorSeverity.CRITICAL
      if (errorInfo.statusCode >= 400) return ErrorSeverity.HIGH
      if (errorInfo.statusCode >= 300) return ErrorSeverity.MEDIUM
    }

    // Check for critical error patterns
    if (errorInfo.message.toLowerCase().includes('database') ||
        errorInfo.message.toLowerCase().includes('connection') ||
        errorInfo.code === 'INTERNAL_ERROR') {
      return ErrorSeverity.CRITICAL
    }

    if (errorInfo.code === 'UNAUTHORIZED' || 
        errorInfo.code === 'FORBIDDEN') {
      return ErrorSeverity.HIGH
    }

    return ErrorSeverity.MEDIUM
  }

  private getLogMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return console.error
      case ErrorSeverity.HIGH:
        return console.error
      case ErrorSeverity.MEDIUM:
        return console.warn
      case ErrorSeverity.LOW:
        return console.log
      default:
        return console.log
    }
  }

  private isCritical(errorInfo: ErrorInfo): boolean {
    return this.determineSeverity(errorInfo) === ErrorSeverity.CRITICAL
  }

  async logUserAction(action: string, userId?: string, context?: Record<string, unknown>): Promise<void> {
    const logEntry = {
      type: 'user_action',
      action,
      userId,
      timestamp: new Date().toISOString(),
      context
    }

    if (this.isDevelopment) {
      console.log('[USER_ACTION]', JSON.stringify(logEntry, null, 2))
    }

    // In production, send to analytics service
  }

  async logPerformanceMetric(metric: string, value: number, context?: Record<string, unknown>): Promise<void> {
    const logEntry = {
      type: 'performance',
      metric,
      value,
      timestamp: new Date().toISOString(),
      context
    }

    if (this.isDevelopment) {
      console.log('[PERFORMANCE]', JSON.stringify(logEntry, null, 2))
    }

    // In production, send to performance monitoring service
  }
}

export const errorLogger = ErrorLogger.getInstance()