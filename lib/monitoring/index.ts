/**
 * Main monitoring and logging exports
 */

// Core monitoring
export * from './logger'
export * from './performance-monitor'
export * from './health-monitor'

// Re-export commonly used utilities
export {
  logger,
  securityLogger,
  performanceLogger,
  databaseLogger,
  apiLogger,
  userLogger,
  createRequestLogger,
  useLogger,
  LogLevel
} from './logger'

export {
  performanceMonitor,
  withPerformanceMonitoring,
  usePerformanceMonitor
} from './performance-monitor'

export {
  healthMonitor,
  createHealthEndpoint
} from './health-monitor'

// Types
export type { LogEntry, LoggerConfig } from './logger'
export type { PerformanceMetric, ApiPerformanceData } from './performance-monitor'
export type { HealthCheck, SystemHealth } from './health-monitor'