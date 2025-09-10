/**
 * Structured logging system for development and production environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  userId?: string
  sessionId?: string
  requestId?: string
  source?: string
  stack?: string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableExternal: boolean
  formatJson: boolean
}

class Logger {
  private static instance: Logger
  private config: LoggerConfig
  private isDevelopment = process.env.NODE_ENV === 'development'

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFile: false, // Enable in production with proper log rotation
      enableExternal: !this.isDevelopment,
      formatJson: !this.isDevelopment,
      ...config
    }
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config)
    }
    return Logger.instance
  }

  // Core logging methods
  debug(message: string, context?: Record<string, unknown>, source?: string) {
    this.log(LogLevel.DEBUG, message, context, source)
  }

  info(message: string, context?: Record<string, unknown>, source?: string) {
    this.log(LogLevel.INFO, message, context, source)
  }

  warn(message: string, context?: Record<string, unknown>, source?: string) {
    this.log(LogLevel.WARN, message, context, source)
  }

  error(message: string, context?: Record<string, unknown>, source?: string, error?: Error) {
    this.log(LogLevel.ERROR, message, { ...context, error: error?.message }, source, error?.stack)
  }

  critical(message: string, context?: Record<string, unknown>, source?: string, error?: Error) {
    this.log(LogLevel.CRITICAL, message, { ...context, error: error?.message }, source, error?.stack)
  }

  // Domain-specific logging methods
  security(event: string, details: Record<string, unknown>) {
    this.log(LogLevel.WARN, `SECURITY: ${event}`, details, 'security')
  }

  audit(action: string, userId: string, details: Record<string, unknown>) {
    this.log(LogLevel.INFO, `AUDIT: ${action}`, { ...details, userId }, 'audit')
  }

  performance(metric: string, value: number, unit: string, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, `PERFORMANCE: ${metric}`, { 
      value, 
      unit, 
      ...context 
    }, 'performance')
  }

  database(operation: string, table: string, duration?: number, context?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, `DATABASE: ${operation} on ${table}`, {
      operation,
      table,
      duration,
      ...context
    }, 'database')
  }

  api(method: string, endpoint: string, statusCode: number, duration: number, userId?: string, context?: Record<string, unknown>) {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.log(level, `API: ${method} ${endpoint}`, {
      method,
      endpoint,
      statusCode,
      duration,
      userId,
      ...context
    }, 'api')
  }

  user(action: string, userId: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, `USER: ${action}`, { ...context, userId }, 'user')
  }

  // System health logging
  health(component: string, status: 'healthy' | 'degraded' | 'unhealthy', details?: Record<string, unknown>) {
    const level = status === 'healthy' ? LogLevel.INFO : status === 'degraded' ? LogLevel.WARN : LogLevel.ERROR
    this.log(level, `HEALTH: ${component} is ${status}`, details, 'health')
  }

  // Main logging implementation
  private async log(
    level: LogLevel, 
    message: string, 
    context?: Record<string, unknown>, 
    source?: string, 
    stack?: string
  ) {
    // Skip if below configured log level
    if (level < this.config.level) {
      return
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: this.sanitizeContext(context),
      source,
      stack,
      // Add session/request context if available
      ...(typeof window === 'undefined' && this.getServerContext())
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(logEntry)
    }

    // File logging (production)
    if (this.config.enableFile) {
      await this.logToFile(logEntry)
    }

    // External service logging (production)
    if (this.config.enableExternal) {
      await this.logToExternalService(logEntry).catch(error => {
        console.error('Failed to send log to external service:', error)
      })
    }
  }

  private logToConsole(logEntry: LogEntry) {
    const logMethod = this.getConsoleMethod(logEntry.level)
    const timestamp = logEntry.timestamp.toISOString()
    
    if (this.config.formatJson) {
      logMethod(JSON.stringify({
        ...logEntry,
        timestamp
      }))
    } else {
      // Human-readable format for development
      const levelName = LogLevel[logEntry.level].padEnd(8)
      const source = logEntry.source ? `[${logEntry.source}]` : ''
      const context = logEntry.context ? JSON.stringify(logEntry.context, null, 2) : ''
      
      logMethod(`${timestamp} ${levelName} ${source} ${logEntry.message}`)
      if (context && logEntry.level >= LogLevel.WARN) {
        logMethod(context)
      }
      if (logEntry.stack && logEntry.level >= LogLevel.ERROR) {
        logMethod(logEntry.stack)
      }
    }
  }

  private async logToFile(logEntry: LogEntry) {
    // In production, implement file logging with rotation
    // Example: Winston, Bunyan, or custom file writer
    // This is a placeholder for production implementation
    
    if (typeof process !== 'undefined' && process.env.LOG_FILE) {
      const fs = await import('fs').catch(() => null)
      if (fs) {
        const logLine = JSON.stringify(logEntry) + '\n'
        fs.appendFileSync(process.env.LOG_FILE, logLine)
      }
    }
  }

  private async logToExternalService(logEntry: LogEntry) {
    // Send to external logging service (DataDog, Splunk, ELK, etc.)
    if (process.env.EXTERNAL_LOGGING_ENDPOINT) {
      try {
        // Example implementation
        // await fetch(process.env.EXTERNAL_LOGGING_ENDPOINT, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
        //   },
        //   body: JSON.stringify({
        //     service: 'coachflow',
        //     environment: process.env.NODE_ENV,
        //     ...logEntry
        //   })
        // })
      } catch (error) {
        // Silently fail external logging to avoid cascading errors
      }
    }
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug
      case LogLevel.INFO:
        return console.info
      case LogLevel.WARN:
        return console.warn
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error
      default:
        return console.log
    }
  }

  private sanitizeContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!context) return undefined

    const sanitized = { ...context }
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization']
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    }

    // Remove circular references and limit depth
    return JSON.parse(JSON.stringify(sanitized, null, 2))
  }

  private getServerContext(): Partial<LogEntry> {
    // Add server-side context like request ID, session ID if available
    // This would be populated by middleware in a real application
    return {}
  }

  // Utility methods
  child(context: Record<string, unknown>): Logger {
    // Create a child logger with additional context
    const childLogger = new Logger(this.config)
    const originalLog = childLogger.log.bind(childLogger)
    
    childLogger.log = (level: LogLevel, message: string, additionalContext?: Record<string, unknown>, source?: string, stack?: string) => {
      return originalLog(level, message, { ...context, ...additionalContext }, source, stack)
    }
    
    return childLogger
  }

  setLevel(level: LogLevel) {
    this.config.level = level
  }

  isLevelEnabled(level: LogLevel): boolean {
    return level >= this.config.level
  }
}

// Export singleton instance and create domain-specific loggers
export const logger = Logger.getInstance()

// Pre-configured domain loggers
export const securityLogger = logger.child({ domain: 'security' })
export const performanceLogger = logger.child({ domain: 'performance' })
export const databaseLogger = logger.child({ domain: 'database' })
export const apiLogger = logger.child({ domain: 'api' })
export const userLogger = logger.child({ domain: 'user' })

// Express/Next.js middleware helper
export function createRequestLogger(requestId?: string, userId?: string) {
  return logger.child({ requestId, userId })
}

// React hook for client-side logging
export function useLogger(component?: string) {
  const componentLogger = component ? logger.child({ component }) : logger
  
  return {
    debug: componentLogger.debug.bind(componentLogger),
    info: componentLogger.info.bind(componentLogger),
    warn: componentLogger.warn.bind(componentLogger),
    error: componentLogger.error.bind(componentLogger),
    critical: componentLogger.critical.bind(componentLogger)
  }
}