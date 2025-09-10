/**
 * System health monitoring and status tracking
 */

import { performanceMonitor } from './performance-monitor'
import { logger } from './logger'

export interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  responseTime?: number
  lastCheck: Date
  metadata?: Record<string, unknown>
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheck[]
  uptime: number
  timestamp: Date
  version?: string
  environment?: string
}

class HealthMonitor {
  private static instance: HealthMonitor
  private checks: Map<string, HealthCheck> = new Map()
  private startTime = Date.now()
  private checkInterval: NodeJS.Timeout | null = null

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor()
    }
    return HealthMonitor.instance
  }

  constructor() {
    this.startPeriodicChecks()
  }

  // Register a health check
  registerCheck(
    name: string, 
    checkFn: () => Promise<Omit<HealthCheck, 'name' | 'lastCheck'>>,
    intervalMs: number = 30000 // 30 seconds default
  ) {
    const performCheck = async () => {
      const startTime = Date.now()
      try {
        const result = await checkFn()
        const responseTime = Date.now() - startTime

        const healthCheck: HealthCheck = {
          name,
          ...result,
          responseTime,
          lastCheck: new Date()
        }

        this.checks.set(name, healthCheck)
        
        // Log health status changes
        const previousStatus = this.checks.get(name)?.status
        if (previousStatus && previousStatus !== result.status) {
          logger.health(name, result.status, { 
            previousStatus, 
            message: result.message,
            responseTime 
          })
        }

        // Record performance metric
        performanceMonitor.recordMetric(`health_check_${name}`, responseTime, 'ms', {
          status: result.status,
          healthy: result.status === 'healthy'
        })

      } catch (error) {
        const responseTime = Date.now() - startTime
        const healthCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Health check failed',
          responseTime,
          lastCheck: new Date(),
          metadata: { error: String(error) }
        }

        this.checks.set(name, healthCheck)
        logger.error(`Health check failed for ${name}`, { error }, 'health-monitor')
      }
    }

    // Run initial check
    performCheck()

    // Schedule periodic checks
    const interval = setInterval(performCheck, intervalMs)
    
    return () => clearInterval(interval)
  }

  // Get current system health
  getHealth(): SystemHealth {
    const checks = Array.from(this.checks.values())
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length

    let overall: SystemHealth['overall'] = 'healthy'
    if (unhealthyCount > 0) {
      overall = 'unhealthy'
    } else if (degradedCount > 0) {
      overall = 'degraded'
    }

    return {
      overall,
      checks,
      uptime: Date.now() - this.startTime,
      timestamp: new Date(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV
    }
  }

  // Check if system is healthy
  isHealthy(): boolean {
    return this.getHealth().overall === 'healthy'
  }

  // Get health summary for specific service
  getServiceHealth(serviceName: string): HealthCheck | null {
    return this.checks.get(serviceName) || null
  }

  private startPeriodicChecks() {
    // Register built-in health checks
    this.registerDatabaseHealthCheck()
    this.registerMemoryHealthCheck()
    this.registerApiHealthCheck()
    
    // Overall system health logging every 5 minutes
    this.checkInterval = setInterval(() => {
      const health = this.getHealth()
      logger.health('system', health.overall, {
        uptime: health.uptime,
        checkCount: health.checks.length,
        unhealthyServices: health.checks.filter(c => c.status === 'unhealthy').map(c => c.name),
        degradedServices: health.checks.filter(c => c.status === 'degraded').map(c => c.name)
      })
    }, 5 * 60 * 1000)
  }

  private registerDatabaseHealthCheck() {
    this.registerCheck('database', async () => {
      try {
        // Simple database connectivity check
        const startTime = Date.now()
        
        // In a real app, you would ping your database here
        // const supabase = createServerSupabaseClient()
        // await supabase.from('health_check').select('1').limit(1)
        
        const responseTime = Date.now() - startTime
        
        if (responseTime > 1000) {
          return {
            status: 'degraded',
            message: `Database responding slowly (${responseTime}ms)`,
            metadata: { responseTime }
          }
        }

        return {
          status: 'healthy',
          message: 'Database connection healthy',
          metadata: { responseTime }
        }
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
          metadata: { error: String(error) }
        }
      }
    }, 60000) // Check every minute
  }

  private registerMemoryHealthCheck() {
    this.registerCheck('memory', async () => {
      if (typeof process === 'undefined') {
        return {
          status: 'healthy',
          message: 'Memory check not available (client-side)'
        }
      }

      const memoryUsage = process.memoryUsage()
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
      const memoryPercentage = (heapUsedMB / heapTotalMB) * 100

      let status: HealthCheck['status'] = 'healthy'
      let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${Math.round(memoryPercentage)}%)`

      if (heapUsedMB > 500) { // 500MB threshold
        status = 'unhealthy'
        message = `High memory usage: ${heapUsedMB}MB`
      } else if (heapUsedMB > 300) { // 300MB warning
        status = 'degraded'
        message = `Elevated memory usage: ${heapUsedMB}MB`
      }

      return {
        status,
        message,
        metadata: {
          heapUsed: heapUsedMB,
          heapTotal: heapTotalMB,
          percentage: Math.round(memoryPercentage)
        }
      }
    }, 30000) // Check every 30 seconds
  }

  private registerApiHealthCheck() {
    this.registerCheck('api_performance', async () => {
      const summary = performanceMonitor.getPerformanceSummary(5) // Last 5 minutes
      
      let status: HealthCheck['status'] = 'healthy'
      let message = `API performance: ${summary.averageResponseTime}ms avg, ${summary.errorRate}% error rate`

      if (summary.errorRate > 10 || summary.averageResponseTime > 2000) {
        status = 'unhealthy'
        message = `API performance degraded: ${summary.averageResponseTime}ms avg, ${summary.errorRate}% errors`
      } else if (summary.errorRate > 5 || summary.averageResponseTime > 1000) {
        status = 'degraded'
        message = `API performance warning: ${summary.averageResponseTime}ms avg, ${summary.errorRate}% errors`
      }

      return {
        status,
        message,
        metadata: {
          averageResponseTime: summary.averageResponseTime,
          errorRate: summary.errorRate,
          totalRequests: summary.totalMetrics,
          slowRequests: summary.slowRequests
        }
      }
    }, 60000) // Check every minute
  }

  // Cleanup on shutdown
  cleanup() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}

export const healthMonitor = HealthMonitor.getInstance()

// Next.js API route helper for health endpoint
export function createHealthEndpoint() {
  return async (req: any) => {
    const health = healthMonitor.getHealth()
    const statusCode = health.overall === 'healthy' ? 200 : health.overall === 'degraded' ? 200 : 503
    
    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}