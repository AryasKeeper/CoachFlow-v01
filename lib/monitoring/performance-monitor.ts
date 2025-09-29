/**
 * Performance monitoring and metrics collection for development and production
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'mb' | 'count' | 'percent'
  timestamp: Date
  context?: Record<string, unknown>
  tags?: Record<string, string>
}

export interface ApiPerformanceData {
  route: string
  method: string
  duration: number
  statusCode: number
  responseSize?: number
  userId?: string
  timestamp: Date
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private apiMetrics: ApiPerformanceData[] = []
  private isDevelopment = process.env.NODE_ENV === 'development'

  // Performance thresholds
  private thresholds = {
    apiResponse: 1000, // 1 second
    pageLoad: 3000, // 3 seconds
    databaseQuery: 500, // 500ms
    clientSideRender: 100, // 100ms
    memoryUsage: 50, // 50MB
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Record a performance metric
  recordMetric(name: string, value: number, unit: PerformanceMetric['unit'], context?: Record<string, unknown>, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      context,
      tags
    }

    this.metrics.push(metric)

    // Keep only last 1000 metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log to console in development
    if (this.isDevelopment) {
      const threshold = this.getThreshold(name)
      const isSlowPerformance = threshold && value > threshold

      console.log(
        `[PERFORMANCE${isSlowPerformance ? ' - SLOW' : ''}] ${name}: ${value}${unit}`,
        context || ''
      )

      if (isSlowPerformance) {
        console.warn(`⚠️  Performance threshold exceeded for ${name}. Expected: <${threshold}${unit}, Actual: ${value}${unit}`)
      }
    }

    // In production, send to monitoring service
    this.sendToMonitoringService(metric).catch(error => {
      console.error('Failed to send metric to monitoring service:', error)
    })
  }

  // Record API performance data
  recordApiMetric(data: ApiPerformanceData) {
    this.apiMetrics.push(data)

    // Keep only last 500 API metrics
    if (this.apiMetrics.length > 500) {
      this.apiMetrics = this.apiMetrics.slice(-500)
    }

    // Record as general metric
    this.recordMetric(
      'api_response_time',
      data.duration,
      'ms',
      {
        route: data.route,
        method: data.method,
        statusCode: data.statusCode,
        userId: data.userId
      },
      {
        route: data.route,
        method: data.method,
        status: data.statusCode.toString()
      }
    )
  }

  // Timing utilities
  startTimer(name: string): () => void {
    const startTime = Date.now()
    return () => {
      const duration = Date.now() - startTime
      this.recordMetric(name, duration, 'ms')
      return duration
    }
  }

  // Async timing wrapper
  async timeAsync<T>(name: string, fn: () => Promise<T>, context?: Record<string, unknown>): Promise<T> {
    const startTime = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      this.recordMetric(name, duration, 'ms', { ...context, success: true })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordMetric(name, duration, 'ms', { ...context, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }

  // Memory monitoring
  recordMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage()
      this.recordMetric('memory_heap_used', Math.round(memoryUsage.heapUsed / 1024 / 1024), 'mb')
      this.recordMetric('memory_heap_total', Math.round(memoryUsage.heapTotal / 1024 / 1024), 'mb')
      this.recordMetric('memory_external', Math.round(memoryUsage.external / 1024 / 1024), 'mb')
    }
  }

  // Database query monitoring
  async timeDatabase<T>(queryName: string, fn: () => Promise<T>): Promise<T> {
    return this.timeAsync(`db_query_${queryName}`, fn, { type: 'database_query', queryName })
  }

  // Get performance summary
  getPerformanceSummary(minutes: number = 5): {
    totalMetrics: number
    slowRequests: number
    averageResponseTime: number
    errorRate: number
    memoryUsage?: number
  } {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime)
    const recentApiMetrics = this.apiMetrics.filter(m => m.timestamp >= cutoffTime)

    const apiResponseTimes = recentMetrics
      .filter(m => m.name === 'api_response_time')
      .map(m => m.value)

    const slowRequests = apiResponseTimes.filter(t => t > this.thresholds.apiResponse).length
    const averageResponseTime = apiResponseTimes.length > 0 
      ? apiResponseTimes.reduce((sum, time) => sum + time, 0) / apiResponseTimes.length 
      : 0

    const totalRequests = recentApiMetrics.length
    const errorRequests = recentApiMetrics.filter(m => m.statusCode >= 400).length
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0

    const memoryMetrics = recentMetrics.filter(m => m.name === 'memory_heap_used')
    const memoryUsage = memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : undefined

    return {
      totalMetrics: recentMetrics.length,
      slowRequests,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      memoryUsage
    }
  }

  // Get recent metrics for debugging
  getRecentMetrics(count: number = 50): PerformanceMetric[] {
    return this.metrics.slice(-count)
  }

  // Health check
  isHealthy(): boolean {
    const summary = this.getPerformanceSummary(1) // Last 1 minute
    return summary.errorRate < 5 && summary.averageResponseTime < this.thresholds.apiResponse
  }

  private getThreshold(metricName: string): number | null {
    if (metricName.includes('api_') || metricName.includes('route_')) {
      return this.thresholds.apiResponse
    }
    if (metricName.includes('db_') || metricName.includes('query_')) {
      return this.thresholds.databaseQuery
    }
    if (metricName.includes('page_') || metricName.includes('load_')) {
      return this.thresholds.pageLoad
    }
    if (metricName.includes('memory_')) {
      return this.thresholds.memoryUsage
    }
    return null
  }

  private async sendToMonitoringService(metric: PerformanceMetric): Promise<void> {
    // In production, send to monitoring service like DataDog, New Relic, etc.
    if (!this.isDevelopment && process.env.MONITORING_ENABLED === 'true') {
      // Example implementation
      // await fetch(process.env.MONITORING_ENDPOINT, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.MONITORING_API_KEY}`
      //   },
      //   body: JSON.stringify({
      //     service: 'coachflow',
      //     environment: process.env.NODE_ENV,
      //     metric
      //   })
      // })
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Middleware for Next.js API routes
export function withPerformanceMonitoring<T>(
  handler: (req: any) => Promise<T>,
  routeName: string
) {
  return async (req: any): Promise<T> => {
    const startTime = Date.now()
    let statusCode = 200
    
    try {
      const result = await handler(req)
      return result
    } catch (error) {
      statusCode = error instanceof Error && 'statusCode' in error 
        ? (error as any).statusCode || 500 
        : 500
      throw error
    } finally {
      const duration = Date.now() - startTime
      performanceMonitor.recordApiMetric({
        route: routeName,
        method: req.method || 'UNKNOWN',
        duration,
        statusCode,
        userId: req.user?.id,
        timestamp: new Date()
      })
    }
  }
}

// React hook for client-side performance monitoring
export function usePerformanceMonitor() {
  const recordClientMetric = (name: string, value: number, unit: PerformanceMetric['unit'], context?: Record<string, unknown>) => {
    performanceMonitor.recordMetric(`client_${name}`, value, unit, { ...context, client: true })
  }

  const timeClientOperation = <T>(name: string, fn: () => T): T => {
    const startTime = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - startTime
      recordClientMetric(name, duration, 'ms', { success: true })
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      recordClientMetric(name, duration, 'ms', { success: false })
      throw error
    }
  }

  return {
    recordMetric: recordClientMetric,
    timeOperation: timeClientOperation
  }
}